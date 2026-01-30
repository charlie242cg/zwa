import { Package, Clock, Store, MessageSquare, Star, AlertCircle, User, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
    id: string;
    product_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    quantity: number;
    status: string;
    created_at: string;
    products?: {
        name: string;
        image_url: string;
    };
    profiles?: {
        full_name: string;
        store_name: string;
        avatar_url?: string;
    };
    delivery_otp_hash?: string;
    shipped_at?: string;
    yabetoo_payment_url?: string;
    expires_at?: string;
    notes?: string;
}

interface OrderCardProps {
    order: Order;
    userRole: 'buyer' | 'seller' | 'affiliate';
    onViewDetails: (order: Order) => void;
    onAction?: (orderId: string, action: string) => void;
}

const OrderCard = ({ order, userRole, onViewDetails, onAction }: OrderCardProps) => {
    const navigate = useNavigate();

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'En attente', color: '#FFA500', bg: 'rgba(255, 165, 0, 0.1)', icon: <Clock size={16} /> };
            case 'paid':
                return { label: 'Payé', color: '#00CC66', bg: 'rgba(0, 204, 102, 0.1)', icon: <Package size={16} /> };
            case 'shipped':
                return { label: 'Expédié', color: '#4A90E2', bg: 'rgba(74, 144, 226, 0.1)', icon: <Package size={16} /> };
            case 'delivered':
                return { label: 'Livré', color: '#00CC66', bg: 'rgba(0, 204, 102, 0.1)', icon: <Package size={16} /> };
            case 'cancelled':
                return { label: 'Annulé', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.1)', icon: <AlertCircle size={16} /> };
            default:
                return { label: status, color: '#888', bg: 'rgba(136, 136, 136, 0.1)', icon: <Package size={16} /> };
        }
    };

    const statusConfig = getStatusConfig(order.status);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        const isSameDay = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isSameDay) return "Aujourd'hui";

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();

        if (isYesterday) return 'Hier';

        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const renderActions = () => {
        if (userRole === 'seller') {
            switch (order.status) {
                case 'paid':
                    return (
                        <div style={styles.actions}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction?.(order.id, 'ship'); }}
                                style={styles.actionButtonPrimary}
                            >
                                📦 Expédier
                            </button>
                            {/* ❌ Pas d'annulation après paiement pour le vendeur */}
                            {/* Le vendeur doit contacter le support s'il veut annuler */}
                        </div>
                    );
                case 'shipped':
                    return (
                        <div style={styles.actions}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction?.(order.id, 'deliver'); }}
                                style={styles.actionButtonPrimary}
                            >
                                ✅ Marquer comme livré
                            </button>
                        </div>
                    );
                case 'delivered':
                    return (
                        <div style={styles.actions}>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/chat/${order.buyer_id}`); }}
                                style={styles.actionButtonSecondary}
                            >
                                <MessageSquare size={16} /> Contacter
                            </button>
                        </div>
                    );
                default:
                    return null;
            }
        } else if (userRole === 'buyer') {
            // Buyer actions
            switch (order.status) {
                case 'pending':
                    return (
                        <div style={styles.actions}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Prevent multiple clicks if already processing (handled by parent usually, but safer here too)
                                    onAction?.(order.id, 'pay');
                                }}
                                style={styles.actionButtonPrimary}
                            >
                                <CreditCard size={16} /> Payer
                            </button>
                        </div>
                    );
                case 'delivered':
                    return (
                        <div style={styles.actions}>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAction?.(order.id, 'review'); }}
                                style={styles.actionButtonPrimary}
                            >
                                <Star size={16} /> Laisser un avis
                            </button>
                        </div>
                    );
                case 'shipped':
                    return (
                        <div style={styles.actions}>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/chat/${order.seller_id}`); }}
                                style={styles.actionButtonSecondary}
                            >
                                <MessageSquare size={16} /> Contacter
                            </button>
                        </div>
                    );
                case 'paid':
                    // ❌ Plus d'annulation possible après paiement
                    // Le client doit contacter le support pour toute demande
                    return null;
                default:
                    return null;
            }
        } else {
            // Affiliate or other roles - NO ACTIONS
            return null;
        }
    };

    return (
        <div
            onClick={() => onViewDetails(order)}
            style={styles.card}
            className="premium-card"
        >
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.orderInfo}>
                    <span style={styles.orderId}>#{order.id.slice(0, 8)}</span>
                    <span style={styles.date}>{formatDate(order.created_at)}</span>
                </div>
                <div style={{ ...styles.statusBadge, background: statusConfig.bg, color: statusConfig.color }}>
                    {statusConfig.icon}
                    <span>{statusConfig.label}</span>
                </div>
            </div>

            {/* Product */}
            <div style={styles.product}>
                <img
                    src={order.products?.image_url || '/placeholder.png'}
                    alt={order.products?.name}
                    style={styles.productImage}
                />
                <div style={styles.productInfo}>
                    <div style={styles.productName}>{order.products?.name || 'Produit'}</div>
                    <div style={styles.productDetails}>
                        {order.quantity} unité(s) • {order.amount.toLocaleString()} FCFA
                    </div>
                </div>
            </div>

            {/* Store/Buyer Info */}
            <div style={styles.storeInfo}>
                <div style={styles.avatarContainer}>
                    {order.profiles?.avatar_url ? (
                        <img src={order.profiles.avatar_url} alt="Profile" style={styles.avatarImg} />
                    ) : (
                        userRole === 'buyer' ? (
                            <Store size={14} color="var(--primary)" />
                        ) : (
                            <User size={14} color="var(--primary)" />
                        )
                    )}
                </div>
                <span style={styles.storeName}>
                    {userRole === 'buyer'
                        ? (order.profiles?.store_name || order.profiles?.full_name || 'Boutique')
                        : (order.profiles?.full_name || 'Client')}
                </span>
            </div>

            {/* OTP Section for Buyer when Shipped */}
            {userRole === 'buyer' && order.status === 'shipped' && order.delivery_otp_hash && (
                <div style={styles.otpContainer}>
                    <div style={styles.otpLabel}>Code de Sécurité (À donner au livreur) :</div>
                    <div style={styles.otpBox}>
                        {order.delivery_otp_hash}
                    </div>
                </div>
            )}

            {/* Actions */}
            {renderActions()}
        </div>
    );
};

const styles = {
    card: {
        padding: '16px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    orderId: {
        fontSize: '12px',
        fontWeight: '800',
        color: 'var(--primary)',
        textTransform: 'uppercase' as const,
    },
    date: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
    },
    statusBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '700',
    },
    product: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },
    productImage: {
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
        background: 'rgba(255,255,255,0.05)',
    },
    productInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    productName: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'white',
        lineHeight: '1.3',
    },
    productDetails: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
    },
    storeInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
    },
    storeName: {
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    avatarContainer: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    actions: {
        display: 'flex',
        gap: '8px',
        marginTop: '4px',
    },
    actionButtonPrimary: {
        flex: 1,
        padding: '10px 16px',
        borderRadius: '10px',
        border: 'none',
        background: 'var(--primary)',
        color: 'white',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
    },
    actionButtonSecondary: {
        flex: 1,
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.05)',
        color: 'white',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
    },
    otpContainer: {
        padding: '16px',
        background: 'rgba(138, 43, 226, 0.1)',
        borderRadius: '12px',
        border: '1px dashed var(--primary)',
        marginTop: '8px',
        textAlign: 'center' as const,
    },
    otpLabel: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginBottom: '4px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    otpBox: {
        fontSize: '24px',
        fontWeight: '900',
        color: 'var(--primary)',
        letterSpacing: '4px',
        fontFamily: 'monospace',
    },
};

export default OrderCard;
