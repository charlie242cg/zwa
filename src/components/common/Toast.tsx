import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    onClose
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} color="#00CC66" />;
            case 'error':
                return <XCircle size={20} color="#FF4444" />;
            case 'warning':
                return <AlertCircle size={20} color="#FFCC00" />;
            case 'info':
                return <Info size={20} color="#00AAFF" />;
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return 'rgba(0, 204, 102, 0.1)';
            case 'error':
                return 'rgba(255, 68, 68, 0.1)';
            case 'warning':
                return 'rgba(255, 204, 0, 0.1)';
            case 'info':
                return 'rgba(0, 170, 255, 0.1)';
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success':
                return 'rgba(0, 204, 102, 0.3)';
            case 'error':
                return 'rgba(255, 68, 68, 0.3)';
            case 'warning':
                return 'rgba(255, 204, 0, 0.3)';
            case 'info':
                return 'rgba(0, 170, 255, 0.3)';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: '300px',
            maxWidth: '90%',
            background: getBackgroundColor(),
            border: `1px solid ${getBorderColor()}`,
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'toastSlideIn 0.3s ease',
        }}>
            {getIcon()}
            <span style={{
                flex: 1,
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
            }}>
                {message}
            </span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '0',
                    width: '20px',
                    height: '20px',
                }}
            >
                ×
            </button>

            <style>{`
                @keyframes toastSlideIn {
                    from {
                        transform: translateX(-50%) translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

// Hook pour gérer les toasts
export const useToast = () => {
    const [toast, setToast] = React.useState<{
        message: string;
        type: ToastType;
    } | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    const ToastComponent = toast ? (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
        />
    ) : null;

    return { showToast, ToastComponent };
};
