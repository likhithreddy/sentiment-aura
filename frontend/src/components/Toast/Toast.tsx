import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '../../types/toast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!toast.duration || toast.persistent) return;

    const interval = 50; // Update progress every 50ms
    const step = (interval / toast.duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          const newProgress = prev - step;
          if (newProgress <= 0) {
            onRemove(toast.id);
            return 0;
          }
          return newProgress;
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration, toast.id, toast.persistent, onRemove, isPaused]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50/95',
          border: 'border-green-200',
          text: 'text-green-900',
          icon: 'text-green-600',
          progress: 'bg-green-500',
        };
      case 'error':
        return {
          bg: 'bg-red-50/95',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: 'text-red-600',
          progress: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50/95',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          icon: 'text-yellow-600',
          progress: 'bg-yellow-500',
        };
      case 'info':
        return {
          bg: 'bg-blue-50/95',
          border: 'border-blue-200',
          text: 'text-blue-900',
          icon: 'text-blue-600',
          progress: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-gray-50/95',
          border: 'border-gray-200',
          text: 'text-gray-900',
          icon: 'text-gray-600',
          progress: 'bg-gray-500',
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ x: -400, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: -400, opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
      className={`
        relative max-w-sm w-full rounded-lg shadow-lg backdrop-blur-md
        ${colors.bg} ${colors.border} ${colors.text}
        border overflow-hidden
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold">{toast.title}</h4>
            {toast.message && (
              <p className="text-sm opacity-80 mt-1">{toast.message}</p>
            )}
          </div>

          <button
            onClick={() => onRemove(toast.id)}
            className={`flex-shrink-0 p-1 rounded-md ${colors.icon} opacity-60 hover:opacity-100 transition-opacity`}
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {toast.duration && !toast.persistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <motion.div
            className={`h-full ${colors.progress}`}
            style={{ width: `${progress}%` }}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Toast;