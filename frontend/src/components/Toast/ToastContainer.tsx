import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import { useToast } from '../../hooks/useToast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-[200] space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
          >
            <Toast
              toast={toast}
              onRemove={removeToast}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;