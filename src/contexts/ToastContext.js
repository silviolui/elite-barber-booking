import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Funções de conveniência
  const showSuccess = useCallback((message, title = 'Sucesso!', options = {}) => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((message, title = 'Erro!', options = {}) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 7000, // Erros ficam mais tempo na tela
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Atenção!', options = {}) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Informação', options = {}) => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] max-w-md w-full">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
