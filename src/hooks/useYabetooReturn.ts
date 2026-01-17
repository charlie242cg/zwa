import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook to handle return from Yabetoo payment gateway
 * Detects payment cancellation/success and prevents redundant operations
 */
export const useYabetooReturn = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const processedRef = useRef(false);

    useEffect(() => {
        // Only process once per mount
        if (processedRef.current) return;

        const params = new URLSearchParams(location.search);
        const paymentStatus = params.get('payment_status');
        const orderId = params.get('order_id');

        // Detect Yabetoo return
        if (paymentStatus || orderId) {
            console.log('[YabetooReturn] 🔙 Detected return from Yabetoo', {
                status: paymentStatus,
                orderId,
            });

            processedRef.current = true;

            // Handle different payment statuses
            if (paymentStatus === 'cancelled') {
                console.log('[YabetooReturn] ❌ Payment cancelled by user');
                // Clean URL without triggering navigation
                const cleanPath = location.pathname;
                window.history.replaceState({}, '', cleanPath);

                // Optional: Show a toast notification
                // toast.info('Paiement annulé');
            } else if (paymentStatus === 'success') {
                console.log('[YabetooReturn] ✅ Payment successful');
                // Navigate to success page
                navigate('/payment-success', { replace: true });
            } else if (paymentStatus === 'failed') {
                console.log('[YabetooReturn] ⚠️ Payment failed');
                const cleanPath = location.pathname;
                window.history.replaceState({}, '', cleanPath);

                // Optional: Show error notification
                // toast.error('Le paiement a échoué');
            }
        }
    }, [location.search, location.pathname, navigate]);

    return {
        isYabetooReturn: processedRef.current,
    };
};
