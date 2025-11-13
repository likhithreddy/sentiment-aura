import { useState, useRef, useCallback } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { ClientOptions } from '@deepgram/sdk';
import { TranscriptSegment, ConnectionState } from '../types';
import { useToast } from './useToast';

interface UseDeepgramOptions {
  onTranscript?: (transcript: TranscriptSegment) => void;
  onError?: (error: Error) => void;
}

export const useDeepgram = (options: UseDeepgramOptions = {}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isRecording: false,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const { success, error: toastError, warning, info } = useToast();
  const deepgramRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Helper function to convert Float32Array to Int16Array for Deepgram compatibility
  const convertFloat32ToInt16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Convert float32 [-1, 1] to int16 [-32768, 32767]
      const clampedValue = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = clampedValue * 32767;
    }
    return int16Array;
  };

  // Helper function to apply audio gain to boost signal levels
  const applyAudioGain = (float32Array: Float32Array, gain: number): Float32Array => {
    const gainAppliedArray = new Float32Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Apply gain and clamp to prevent clipping
      const amplifiedValue = float32Array[i] * gain;
      gainAppliedArray[i] = Math.max(-1, Math.min(1, amplifiedValue));
    }
    return gainAppliedArray;
  };

  const startRecording = useCallback(async () => {
    try {
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('Deepgram API key is not configured. Please check your .env file.');
      }

      // Clear any previous errors and set connecting state
      setConnectionState(prev => ({
        ...prev,
        error: null,
        isConnecting: true,
      }));

      console.log('Starting Deepgram connection with API key...');
      info('Connecting', 'Establishing connection to speech recognition service...');

      // Initialize Deepgram client with proper configuration
      console.log('Initializing Deepgram client with API key...');
      const deepgram = createClient(apiKey);

      // Create live transcription connection with optimized parameters for better speech detection
      const connection = deepgram.listen.live({
        model: 'nova-2',
        language: 'en-US',
        interim_results: true,
        utterance_end_ms: 2000, // Increased to allow longer speech segments
        smart_format: true,
        endpointing: 500, // Increased for less aggressive endpointing
        encoding: 'linear16',
        sample_rate: 16000,
        punctuate: true,
        profanity_filter: false,
        vad_events: true, // Enable voice activity detection events
        numbers: true, // Better number recognition
        replace: true, // Profanity replacement enabled
        keywords: ['hello', 'test', 'speech', 'audio'], // Add test keywords for debugging
        // Enhanced sensitivity settings
        no_delay: true, // Faster processing
        channels: 1, // Mono audio
      });

      deepgramRef.current = connection;

      // Handle connection events
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log('✅ Deepgram connection established successfully');
        success('Connection Ready', 'Speech recognition service is connected and ready');
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
        try {
          console.log('📝 Deepgram transcript received:', {
            type: data.type,
            duration: data.duration,
            is_final: data.is_final,
            hasChannel: !!data.channel,
            hasAlternatives: !!data.channel?.alternatives,
            alternativesCount: data.channel?.alternatives?.length || 0,
            fullData: data
          });

          // Debug: Log the actual channel and alternatives structure
          if (data.channel) {
            console.log('🔍 Channel structure:', {
              channelKeys: Object.keys(data.channel),
              alternatives: data.channel.alternatives
            });

            if (data.channel.alternatives && data.channel.alternatives.length > 0) {
              console.log('🎯 Alternative 0 structure:', data.channel.alternatives[0]);
            }
          }

          // Correct data extraction - data.channel.alternatives[0].transcript
          const transcript = data.channel?.alternatives?.[0]?.transcript || '';
          const isFinal = data.is_final || false;
          const confidence = data.channel?.alternatives?.[0]?.confidence || 0;

          console.log('✅ Processed transcript:', {
            transcript: `"${transcript}"`,
            isFinal,
            confidence,
            transcriptLength: transcript.length
          });

          if (transcript?.trim()) {
            const segment: TranscriptSegment = {
              text: transcript,
              is_final: isFinal,
              timestamp: Date.now(),
            };

            console.log('🎯 Calling onTranscript with segment:', segment);
            options.onTranscript?.(segment);
          } else {
            console.log('⚠️ Empty transcript received, skipping');
          }
        } catch (error) {
          console.error('❌ Error processing transcript:', error);
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error: any) => {
        console.error('❌ Deepgram connection error:', error);
        const errorMessage = error?.message || error || 'Unknown Deepgram error';
        toastError('Connection Error', `Speech recognition service failed: ${errorMessage}`);
        setConnectionState(prev => ({
          ...prev,
          error: `Deepgram error: ${errorMessage}`,
          isConnected: false,
          isConnecting: false,
        }));
        options.onError?.(new Error(`Deepgram connection failed: ${errorMessage}`));
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log('🔌 Deepgram connection closed');
        info('Connection Closed', 'Speech recognition connection has ended');
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
        }));
      });

      // Additional event handlers for better debugging
      connection.on(LiveTranscriptionEvents.Metadata, (data: any) => {
        console.log('📊 Deepgram metadata received:', data);
      });

      connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
        console.log('🎤 Speech detected');
      });

      // Request microphone access with optimal settings
      console.log('Requesting microphone access...');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        streamRef.current = stream;
      } catch (micError) {
        if (micError instanceof Error) {
          if (micError.name === 'NotAllowedError') {
            toastError('Microphone Access Denied', 'Please allow microphone access in your browser settings to use this feature.');
            throw new Error('Microphone access denied. Please allow microphone access to use this feature.');
          } else if (micError.name === 'NotFoundError') {
            toastError('No Microphone Found', 'Please connect a microphone and try again.');
            throw new Error('No microphone found. Please connect a microphone and try again.');
          } else {
            toastError('Microphone Error', `Failed to access microphone: ${micError.message}`);
            throw new Error(`Microphone error: ${micError.message}`);
          }
        }
        throw micError;
      }

      // Create Web Audio API context for PCM audio processing
      console.log('🎙️ Initializing Web Audio API for PCM audio capture...');
      const audioContext = new AudioContext({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      // Create audio source from microphone stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create script processor for real-time audio processing
      const bufferSize = 4096; // 256ms of audio at 16kHz
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      scriptProcessorRef.current = processor;

      let audioLevelSum = 0;
      let audioLevelCount = 0;
      let lastAudioLevelLog = 0;

      processor.onaudioprocess = (event) => {
        if (!deepgramRef.current) return;

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // Float32Array

        // Apply audio gain to boost signal levels (5x gain multiplier)
        const GAIN_MULTIPLIER = 5.0;
        const amplifiedData = applyAudioGain(inputData, GAIN_MULTIPLIER);

        // Calculate audio level for monitoring (using amplified data)
        let sum = 0;
        for (let i = 0; i < amplifiedData.length; i++) {
          sum += Math.abs(amplifiedData[i]);
        }
        const level = sum / amplifiedData.length;
        audioLevelSum += level;
        audioLevelCount++;

        // Log audio level every 2 seconds
        const now = Date.now();
        if (now - lastAudioLevelLog > 2000) {
          const avgLevel = audioLevelCount > 0 ? audioLevelSum / audioLevelCount : 0;
          console.log(`🎚️ Average audio level (amplified): ${avgLevel.toFixed(4)} (gain: ${GAIN_MULTIPLIER}x)`);
          audioLevelSum = 0;
          audioLevelCount = 0;
          lastAudioLevelLog = now;
        }

        // Convert amplified Float32Array to Int16Array for Deepgram compatibility
        const pcmData = convertFloat32ToInt16(amplifiedData);

        // Send PCM audio data to Deepgram
        try {
          deepgramRef.current.send(pcmData.buffer);
        } catch (error) {
          console.error('Error sending PCM data to Deepgram:', error);
        }
      };

      // Connect the audio processing pipeline
      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('🚀 Web Audio API pipeline active and sending PCM audio to Deepgram...');
      info('Listening', 'Speech recognition is now active and listening for your input.');

      setConnectionState(prev => ({
        ...prev,
        isRecording: true,
      }));

    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      toastError('Recording Failed', errorMessage);
      setConnectionState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false,
      }));
      options.onError?.(error instanceof Error ? error : new Error('Recording failed'));
    }
  }, [options, info, success, toastError]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping Deepgram transcription...');
    info('Stopped', 'Speech recognition has been stopped.');

    // Disconnect Web Audio API components
    if (scriptProcessorRef.current && sourceRef.current && audioContextRef.current) {
      console.log('🔇 Disconnecting audio processing pipeline');
      try {
        sourceRef.current.disconnect(scriptProcessorRef.current);
        scriptProcessorRef.current.disconnect(audioContextRef.current.destination);
      } catch (error) {
        console.error('Error disconnecting audio nodes:', error);
      }
    }

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      console.log('🔊 Closing AudioContext');
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.error('Error closing AudioContext:', error);
      }
    }

    // Stop microphone stream
    if (streamRef.current) {
      console.log('🎤 Stopping microphone stream');
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close Deepgram connection properly using SDK v4 method
    if (deepgramRef.current) {
      console.log('🔌 Closing Deepgram connection');
      try {
        deepgramRef.current.requestClose();
      } catch (error) {
        console.error('Error closing Deepgram connection:', error);
      }
      deepgramRef.current = null;
    }

    // Clear all references
    scriptProcessorRef.current = null;
    sourceRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;

    setConnectionState({
      isRecording: false,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, [info]);

  return {
    ...connectionState,
    startRecording,
    stopRecording,
  };
};