import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { orderService } from '../../services/orderService';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('id');
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails(orderId);
            // On force la mise à jour du statut côté client en tant que sécurité
            updateOrderStatusToPaid(orderId);
        }
    }, [orderId]);

    const updateOrderStatusToPaid = async (id: string) => {
        try {
            console.log('[PaymentSuccess] 🔄 Validation automatique du paiement pour:', id);
            const { error } = await orderService.updateOrderStatus(id, 'paid');
            if (error) {
                console.error('[PaymentSuccess] ❌ Erreur lors de la validation client:', error);
            } else {
                console.log('[PaymentSuccess] ✅ Commande marquée comme payée via client-side redirection');
            }
        } catch (err) {
            console.error('[PaymentSuccess] 💥 Erreur critique validation:', err);
        }
    };

    const fetchOrderDetails = async (id: string) => {
        try {
            const { data, error } = await orderService.getOrderById(id);
            if (!error && data) {
                setOrder(data);
            }
        } catch (err) {
            console.error('[PaymentSuccess] ❌ Error fetching order:', err);
        } finally {
            // Fin du chargement (état géré implicitement par order)
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card} className="premium-card">
                <div style={styles.iconContainer}>
                    <CheckCircle2 size={80} color="#00CC66" />
                </div>

                <h1 style={styles.title}>Paiement Réussi !</h1>
                <p style={styles.subtitle}>
                    Merci pour votre achat sur Zwa Market. Votre commande a été validée avec succès.
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
