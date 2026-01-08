import { X, Package, User, Phone, MapPin, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
    id: string;
    product_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    quantity: number;
    status: string;
    commission_amount?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    products?: {
        name: string;
        image_url: string;
        price: number;
    };
    profiles?: {
        full_name: string;
        store_name?: string;
        phone?: string;
    };
}

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    userRole: 'buyer' | 'seller';
}

const OrderDetailsModal = ({ isOpen, onClose, order, userRole }: OrderDetailsModalProps) => {
    const navigate = useNavigate();

    if (!isOpen || !order) return null;

    const getStatusSteps = () => {
        const steps = [
            { key: 'pending', label: 'Commande créée', done: true },
            { key: 'paid', label: 'Paiement confirmé', done: ['paid', 'shipped', 'delivered'].includes(order.status) },
            { key: 'shipped', label: 'Expédié', done: ['shipped', 'delivered'].includes(order.status) },
            { key: 'delivered', label: 'Livré', done: order.status === 'delivered' },
        ];

        if (order.status === 'cancelled') {
            return [
                { key: 'pending', label: 'Commande créée', done: true },
                { key: 'cancelled', label: 'Commande annulée', done: true, cancelled: true },
            ];
        }

        return steps;
    };

    const steps = getStatusSteps();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const contactPerson = userRole === 'buyer'
        ? { name: order.profiles?.store_name || order.profiles?.full_name || 'Vendeur', id: order.seller_id }
        : { name: order.profiles?.full_name || 'Client', id: order.buyer_id };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <h3 style={styles.title}>Détails de la commande</h3>
                    <button onClick={onClose} style={styles.closeButton}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {/* Order ID */}
                    <div style={styles.section}>
                        <div style={styles.sectionLabel}>Numéro de commande</div>
                        <div style={styles.orderId}>#{order.id}</div>
                    </div>

                    {/* Product */}
                    <div style={styles.section}>
                        <div style={styles.sectionLabel}>Produit</div>
                        <div style={styles.productCard}>
                            <img
                                src={order.products?.image_url || '/placeholder.png'}
                                alt={order.products?.name}
                                style={styles.productImage}
                            />
                            <div style={styles.productInfo}>
                                <div style={styles.productName}>{order.products?.name || 'Produit'}</div>
                                <div style={styles.productPrice}>{order.products?.price?.toLocaleString()} FCFA × {order.quantity}</div>
                            </div>
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div style={styles.section}>
                        <div style={styles.sectionLabel}>Détail du montant</div>
                        <div style={styles.priceBreakdown}>
                            <div style={styles.priceRow}>
                                <span>Sous-total</span>
                                <span>{order.amount.toLocaleString()} FCFA</span>
                            </div>
                            <div style={styles.priceRow}>
                                <span>Livraison</span>
                                <span>0 FCFA</span>
                            </div>
                            {order.commission_amount && order.commission_amount > 0 && (
                                <div style={styles.priceRow}>
                                    <span>Commission</span>
                                    <span style={{ color: 'var(--primary)' }}>{order.commission_amount.toLocaleString()} FCFA</span>
                                </div>
                            )}
                            <div style={styles.divider} />
                            <div style={{ ...styles.priceRow, ...styles.priceTotal }}>
                                <span>Total</span>
                                <span>{(order.amount + (order.commission_amount || 0)).toLocaleString()} FCFA</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={styles.section}>
                        <div style={styles.sectionLabel}>Suivi de la commande</div>
                        <div style={styles.timeline}>
                            {steps.map((step, index) => (
                                <div key={step.key} style={styles.timelineItem}>
                                    <div style={styles.timelineIconWrapper}>
                                        <div style={{
                                            ...styles.timelineIcon,
                                            background: step.done
                                                ? (step.cancelled ? '#FF3B30' : 'var(--primary)')
                                                : 'rgba(255,255,255,0.1)',
                                        }}>
                                            {step.done && (step.cancelled ? '❌' : '✓')}
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div style={{
                                                ...styles.timelineLine,
                                                background: step.done ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                            }} />
                                        )}
                                    </div>
                                    <div style={styles.timelineContent}>
                                        <div style={styles.timelineLabel}>{step.label}</div>
                                        {step.done && (
                                            <div style={styles.timelineDate}>
                                                {step.key === 'pending' ? formatDate(order.created_at) : formatDate(order.updated_at)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div style={styles.section}>
                        <div style={styles.sectionLabel}>
                            {userRole === 'buyer' ? 'Vendeur' : 'Client'}
                        </div>
                        <div style={styles.contactCard}>
                            <div style={styles.contactInfo}>
                                <User size={18} color="var(--primary)" />
                                <span>{contactPerson.name}</span>
                            </div>
                            {order.profiles?.phone && (
                                <div style={styles.contactInfo}>
                                    <Phone size={18} color="var(--primary)" />
                                    <span>{order.profiles.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div style={styles.section}>
                            <div style={styles.sectionLabel}>Notes</div>
                            <div style={styles.notesCard}>{order.notes}</div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={styles.footer}>
                    <button
                        onClick={() => navigate(`/chat/${contactPerson.id}`)}
                        style={styles.contactButton}
                    >
                        <MessageSquare size={20} />
                        <span>Contacter {userRole === 'buyer' ? 'le vendeur' : 'le client'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
    },
    modal: {
        background: 'var(--background)',
        width: '100%',
        maxHeight: '90vh',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column' as const,
        animation: 'slideUp 0.3s ease',
        overflow: 'hidden',
    },
    header: {
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    closeButton: {
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
    },
    content: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
    },
    section: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    sectionLabel: {
        fontSize: '12px',
        fontWeight: '700',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    orderId: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'var(--primary)',
        fontFamily: 'monospace',
    },
    productCard: {
        display: 'flex',
        gap: '12px',
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    productImage: {
        width: '80px',
        height: '80px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
        background: 'rgba(255,255,255,0.05)',
    },
    productInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px',
        justifyContent: 'center',
    },
    productName: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        lineHeight: '1.3',
    },
    productPrice: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    priceBreakdown: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    priceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    priceTotal: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
    },
    divider: {
        height: '1px',
        background: 'rgba(255,255,255,0.1)',
        margin: '4px 0',
    },
    timeline: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0',
    },
    timelineItem: {
        display: 'flex',
        gap: '16px',
    },
    timelineIconWrapper: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        position: 'relative' as const,
    },
    timelineIcon: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px',
        fontWeight: '800',
        flexShrink: 0,
    },
    timelineLine: {
        width: '2px',
        flex: 1,
        minHeight: '30px',
    },
    timelineContent: {
        flex: 1,
        paddingBottom: '16px',
    },
    timelineLabel: {
        fontSize: '15px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '4px',
    },
    timelineDate: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    contactCard: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    contactInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        color: 'white',
    },
    notesCard: {
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
    },
    footer: {
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'var(--background)',
    },
    contactButton: {
        width: '100%',
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        background: 'var(--primary)',
        color: 'white',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
};

export default OrderDetailsModal;
