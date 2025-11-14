import { useState, useCallback, useRef } from 'react';
import { Toast, ToastAction, ToastState } from '../types/toast';

const TOAST_DEFAULT_DURATION = 5000; // 5 seconds

export const useToast = () => {
  const [state, setState] = useState<ToastState>({ toasts: [] });
  const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: TOAST_DEFAULT_DURATION,
      ...toast,
    };

    setState(prev => ({
      toasts: [...prev.toasts, newToast]
    }));

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && newToast.duration) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, newToast.duration);

      toastTimeouts.current.set(id, timeout);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setState(prev => ({
      toasts: prev.toasts.filter(toast => toast.id !== id)
    }));

    // Clear timeout if exists
    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }
  }, []);

  const clearAllToasts = useCallback(() => {
    setState({ toasts: [] });

    // Clear all timeouts
    toastTimeouts.current.forEach(timeout => clearTimeout(timeout));
    toastTimeouts.current.clear();
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'error', title, message, duration: 8000, ...options }); // Longer duration for errors
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  // Specialized toast methods for recording
  const recordingStarted = useCallback((connectionQuality?: 'excellent' | 'good' | 'poor') => {
    const qualityMessage = connectionQuality ? `Connection quality: ${connectionQuality}` : '';
    const message = `Speech recognition is now active. ${qualityMessage}`;

    return addToast({
      type: 'success',
      title: 'Recording Started',
      message,
      duration: 3000,
      persistent: false,
    });
  }, [addToast]);

  const recordingStopped = useCallback((duration?: number, transcriptCount?: number) => {
    const durationText = duration ? ` Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '';
    const transcriptText = transcriptCount ? ` Processed ${transcriptCount} segments` : '';
    const message = `Speech recognition has been stopped.${durationText}${transcriptText}`;

    return addToast({
      type: 'info',
      title: 'Recording Stopped',
      message,
      duration: 4000,
      persistent: false,
    });
  }, [addToast]);

  const connectionIssue = useCallback((quality: 'poor' | 'unstable') => {
    const message = quality === 'poor'
      ? 'Poor audio quality detected. Please speak clearly and check your microphone.'
      : 'Connection is unstable. Recording may be affected.';

    return addToast({
      type: 'warning',
      title: 'Connection Issue',
      message,
      duration: 6000,
      persistent: false,
    });
  }, [addToast]);

  return {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    recordingStarted,
    recordingStopped,
    connectionIssue,
  };
};