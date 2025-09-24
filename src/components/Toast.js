import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          textColor: 'text-green-700',
          progressColor: 'bg-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: XCircle,
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          progressColor: 'bg-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700',
          progressColor: 'bg-yellow-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700',
          progressColor: 'bg-blue-500'
        };
    }
  };

  const styles = getToastStyles();
  const IconComponent = styles.icon;

  return (
    <div className={`
      ${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 mb-3 
      transform transition-all duration-300 ease-in-out
      animate-slide-in-right max-w-md w-full
    `}>
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <IconComponent size={20} className={styles.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
              {toast.title}
            </p>
          )}
          <p className={`text-sm ${styles.textColor} break-words`}>
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={() => onClose(toast.id)}
          className={`flex-shrink-0 ${styles.iconColor} hover:opacity-70 transition-opacity`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`${styles.progressColor} h-1 rounded-full animate-progress-bar`}
          style={{
            animationDuration: `${toast.duration || 5000}ms`
          }}
        ></div>
      </div>
    </div>
  );
};

export default Toast;
