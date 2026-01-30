import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { orderService } from '../../services/orderService';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('id');
    const [order, setOrder] = useState<any>(null);

    const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');

    useEffect(() => {
        if (orderId) {
            validatePayment(orderId);
        }
    }, [orderId]);

    const validatePayment = async (id: string, retries = 3) => {
        try {
            console.log(`[PaymentSuccess] 🔄 Validation du paiement pour ${id} (essais restants: ${retries})`);

            // 1. Fetch current order status first
            const { data: currentOrder } = await orderService.getOrderById(id);

            if (currentOrder && currentOrder.status === 'paid') {
                console.log('[PaymentSuccess] ✅ Commande déjà marquée comme payée !');
                setOrder(currentOrder);
                setStatus('success');
                return;
            }

            // 2. Force update if not yet paid
            const { data, error } = await orderService.updateOrderStatus(id, 'paid');

            if (error) {
                console.error('[PaymentSuccess] ❌ Erreur validation:', error);
                if (retries > 0) {
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s
                    return validatePayment(id, retries - 1);
                }
                throw error;
            }

            console.log('[PaymentSuccess] ✅ Validation réussie !');
            // Re-fetch to get updated data (e.g. updated_at)
            const { data: updatedOrder } = await orderService.getOrderById(id);
            setOrder(updatedOrder || data);
            setStatus('success');

        } catch (err) {
            console.error('[PaymentSuccess] 💥 Échec validation finale:', err);
            // Even if validation fails client-side, we likely had a success from gateway
            // Check one last time if webhook handled it
            const { data: checkOrder } = await orderService.getOrderById(id);
            if (checkOrder && checkOrder.status === 'paid') {
                setOrder(checkOrder);
                setStatus('success');
            } else {
                setStatus('error'); // Show contact support message
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card} className="premium-card">
                <div style={styles.iconContainer}>
                    <CheckCircle2 size={80} color="#00CC66" />
                </div>

                <h1 style={styles.title}>
                    {status === 'validating' ? 'Validation en cours...' :
                        status === 'success' ? 'Paiement Réussi !' :
                            'Paiement en attente'}
                </h1>
                <p style={styles.subtitle}>
                    {status === 'validating' ? 'Nous confirmons votre transaction auprès de la banque...' :
                        status === 'success' ? 'Merci pour votre achat sur Zwa Market. Votre commande a été validée avec succès.' :
                            'Votre paiement a bien été initié. Si la commande ne se valide pas automatiquement dans quelques instants, veuillez contacter le support.'}
                </p>

                {order && (
                    <div style={styles.orderBrief}>
                        <div style={styles.orderLabel}>Commande #{order.id.slice(0, 8)}</div>
                        <div style={styles.productRow}>
                            <Package size={20} color="var(--text-secondary)" />
                            <span style={styles.productName}>{order.products?.name || 'Produit'}</span>
                        </div>
                        <div style={styles.amount}>
                            {Number(order.amount).toLocaleString()} FCFA
                        </div>
                    </div>
                )}

                <div style={styles.actions}>
                    <button
                        onClick={() => navigate('/orders')}
                        style={styles.primaryButton}
                    >
                        <ShoppingBag size={20} />
                        Voir mes achats
                    </button>

                    <Link to="/" style={styles.secondaryLink}>
                        Continuer mes achats <ArrowRight size={16} />
                    </Link>
                </div>

                <div style={styles.infoBox}>
                    <p style={styles.infoText}>
                        Le vendeur va maintenant préparer votre colis. Vous recevrez une notification dès qu'il sera expédié.
                    </p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'var(--bg-main)',
    },
    card: {
        maxWidth: '450px',
        width: '100%',
        padding: '40px 30px',
        borderRadius: '32px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: '24px',
        animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    title: {
        fontSize: '28px',
        fontWeight: '900',
        color: 'white',
        marginBottom: '12px',
    },
    subtitle: {
        fontSize: '15px',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
        marginBottom: '32px',
    },
    orderBrief: {
        width: '100%',
        padding: '20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '32px',
        textAlign: 'left' as const,
    },
    orderLabel: {
        fontSize: '12px',
        fontWeight: '700',
        color: 'var(--primary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        marginBottom: '12px',
    },
    productRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
    },
    productName: {
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
    },
    amount: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        marginTop: '8px',
    },
    actions: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
        alignItems: 'center',
    },
    primaryButton: {
        width: '100%',
        padding: '16px',
        borderRadius: '16px',
        border: 'none',
        background: 'var(--primary)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        transition: 'all 0.2s ease',
    },
    secondaryLink: {
        color: 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: '600',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    infoBox: {
        marginTop: '40px',
        padding: '16px',
        background: 'rgba(0, 204, 102, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 204, 102, 0.1)',
    },
    infoText: {
        fontSize: '13px',
        color: '#00CC66',
        lineHeight: '1.4',
        margin: 0,
    },
};

export default PaymentSuccess;
