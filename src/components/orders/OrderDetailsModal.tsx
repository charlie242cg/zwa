import { X, Package, User, Phone, MapPin, DollarSign, Calendar, MessageSquare, ShieldCheck, Clock, CheckCircle2, Truck, ExternalLink } from 'lucide-react';
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
    buyer_phone?: string;
    delivery_location?: string;
    expires_at?: string;
    shipping_timeline?: string;
    created_at: string;
    updated_at: string;
    products?: {
        name: string;
        image_url: string;
        price: number;
    };
    buyer?: {
        full_name: string;
        avatar_url?: string;
    };
    seller?: {
        full_name: string;
        store_name?: string;
        avatar_url?: string;
    };
}

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    userRole: 'buyer' | 'seller' | 'affiliate';
}

const OrderDetailsModal = ({ isOpen, onClose, order, userRole }: OrderDetailsModalProps) => {
    const navigate = useNavigate();

    if (!isOpen || !order) return null;

    const isDeal = !!order.expires_at || !!order.notes;

    const getStatusSteps = () => {
        const steps = [
            { key: 'pending', label: 'Commande créée', icon: <Package size={18} />, done: true },
            {
                key: 'paid',
                label: 'Paiement confirmé',
                icon: <DollarSign size={18} />,
                done: ['paid', 'shipped', 'delivered'].includes(order.status)
            },
            {
                key: 'shipped',
                label: 'En cours de livraison',
                icon: <Truck size={18} />,
                done: ['shipped', 'delivered'].includes(order.status)
            },
            {
                key: 'delivered',
                label: 'Commande livrée',
                icon: <CheckCircle2 size={18} />,
                done: order.status === 'delivered'
            },
        ];

        if (order.status === 'cancelled') {
            return [
                { key: 'pending', label: 'Commande créée', icon: <Package size={18} />, done: true },
                { key: 'cancelled', label: 'Commande annulée', icon: <X size={18} />, done: true, cancelled: true },
            ];
        }

        return steps;
    };

    const steps = getStatusSteps();

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'En attente...';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'En attente...';

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const contactPerson = userRole === 'buyer'
        ? {
            name: order.seller?.store_name || order.seller?.full_name || 'Vendeur',
            avatar: order.seller?.avatar_url,
            id: order.seller_id
        }
        : {
            name: order.buyer?.full_name || 'Client',
            avatar: order.buyer?.avatar_url,
            id: order.buyer_id
        };

    // Commission logic based on role
    const commission = Number(order.commission_amount || 0);
    const netAmount = Number(order.amount) - commission;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Visual Accent */}
                <div style={styles.visualAccent} />

                {/* Header */}
                <div style={{
                    ...styles.header,
                    background: isDeal ? 'linear-gradient(135deg, rgba(255,184,0,0.05) 0%, transparent 100%)' : 'transparent',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={styles.title}>Détails de la commande</h3>
                            {isDeal && (
                                <div style={styles.dealBadge}>DEAL CHAT</div>
                            )}
                        </div>
                        <div style={styles.statusBadge}>
                            <span style={{
                                color: order.status === 'paid' ? '#00CC66' :
                                    order.status === 'shipped' ? '#8A2BE2' :
                                        order.status === 'delivered' ? '#00CC66' :
                                            order.status === 'cancelled' ? '#FF3B30' : 'var(--primary)'
                            }}>
                                ● {order.status === 'pending' ? 'Attente Paiement' :
                                    order.status === 'paid' ? 'Payé & Sécurisé' :
                                        order.status === 'shipped' ? 'En livraison' :
                                            order.status === 'delivered' ? 'Livré' : 'Annulé'}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 8px' }}>|</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                                {isDeal ? 'Paiement Personnalisé' : 'Paiement Direct'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeButton}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {/* Order Meta Card */}
                    <div style={styles.metaCard}>
                        <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>ID COMMANDE</span>
                            <span style={styles.orderId}>{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>DATE</span>
                            <span style={styles.metaValue}>{formatDate(order.created_at)}</span>
                        </div>
                    </div>

                    {/* Notes & Specs - MOVED TO TOP FOR DEALS */}
                    {isDeal && order.notes && (
                        <div style={styles.section}>
                            <div style={{ ...styles.sectionHeader, color: '#FFB800' }}>
                                <MessageSquare size={16} />
                                <span>Détails & Instructions Spéciales</span>
                            </div>
                            <div style={{ ...styles.enhancedNotes, background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)' }}>
                                <div style={{ ...styles.notesQuote, color: 'rgba(255,184,0,0.1)' }}>"</div>
                                <div style={styles.notesText}>{order.notes}</div>
                            </div>
                        </div>
                    )}

                    {/* Product Card Premium */}
                    <div style={styles.productSection}>
                        <div style={styles.sectionHeader}>
                            <Package size={16} />
                            <span>Contenu du colis</span>
                        </div>
                        <div className="premium-card" style={styles.premiumProductCard}>
                            <img
                                src={order.products?.image_url || '/placeholder.png'}
                                alt={order.products?.name}
                                style={styles.productImage}
                            />
                            <div style={styles.productInfo}>
                                <div style={styles.productName}>{order.products?.name || 'Produit'}</div>
                                <div style={styles.qtyPrice}>
                                    <span style={styles.qtyIcon}>×{order.quantity}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expiration & Shipping Deadlines - NEW for Deals */}
                        {isDeal && (
                            <div style={styles.deadlineSection}>
                                {order.expires_at && (
                                    <div style={styles.deadlineCard}>
                                        <Clock size={16} color="#FFB800" />
                                        <div>
                                            <div style={styles.deadlineLabel}>Validité de l'offre</div>
                                            <div style={styles.deadlineValue}>
                                                {new Date() > new Date(order.expires_at) ? (
                                                    <span style={{ color: '#FF453A' }}>Expirée</span>
                                                ) : (
                                                    `Jusqu'au ${new Date(order.expires_at).toLocaleDateString()}`
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {order.shipping_timeline && (
                                    <div style={styles.deadlineCard}>
                                        <Truck size={16} color="var(--primary)" />
                                        <div>
                                            <div style={styles.deadlineLabel}>Délai d'expédition</div>
                                            <div style={styles.deadlineValue}>{order.shipping_timeline}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Delivery Info - UPDATED */}
                        {(order.buyer_phone || order.delivery_location) && (
                            <div style={styles.section}>
                                <div style={styles.sectionHeader}>
                                    <MapPin size={16} />
                                    <span>Instructions de livraison</span>
                                </div>
                                <div style={styles.deliveryContainer}>
                                    {order.buyer_phone && (
                                        <div style={styles.deliveryItem} onClick={() => window.location.href = `tel:${order.buyer_phone}`}>
                                            <div style={styles.deliveryLabel}>Appeler le client</div>
                                            <div style={styles.deliveryValue}>
                                                <Phone size={14} style={{ marginRight: 6 }} />
                                                {order.buyer_phone}
                                            </div>
                                        </div>
                                    )}
                                    {order.delivery_location && (
                                        <div style={styles.deliveryItem}>
                                            <div style={styles.deliveryLabel}>Lieu de livraison</div>
                                            <div style={styles.deliveryValue}>{order.delivery_location}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Breakdown - UPDATED FOR PRIVACY */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <DollarSign size={16} />
                                <span>Résumé du paiement</span>
                            </div>
                            <div style={styles.paymentCard}>
                                {/* For Buyer: Simple view, no mention of commission */}
                                {userRole === 'buyer' ? (
                                    <>
                                        <div style={styles.priceRow}>
                                            <span style={styles.priceLabel}>Sous-total</span>
                                            <span style={styles.priceValue}>{order.amount.toLocaleString()} FCFA</span>
                                        </div>
                                        <div style={styles.priceRow}>
                                            <span style={styles.priceLabel}>Frais de livraison</span>
                                            <span style={styles.priceValue}>Gratuit</span>
                                        </div>
                                    </>
                                ) : userRole === 'seller' ? (
                                    /* For Seller: Detailed fee view */
                                    <>
                                        <div style={styles.priceRow}>
                                            <span style={styles.priceLabel}>Prix de vente</span>
                                            <span style={styles.priceValue}>{order.amount.toLocaleString()} FCFA</span>
                                        </div>
                                        <div style={styles.priceRow}>
                                            <span style={styles.priceLabel}>Frais de service Zwa</span>
                                            <span style={{ ...styles.priceValue, color: '#FF3B30' }}>-{commission.toLocaleString()} FCFA</span>
                                        </div>
                                    </>
                                ) : (
                                    /* For Affiliate: Bonus view */
                                    <>
                                        <div style={styles.priceRow}>
                                            <span style={styles.priceLabel}>Montant de la vente</span>
                                            <span style={styles.priceValue}>{order.amount.toLocaleString()} FCFA</span>
                                        </div>
                                        <div style={styles.priceRow}>
                                            <span style={styles.priceLabel}>Votre Bonus Parrainage</span>
                                            <span style={{ ...styles.priceValue, color: 'var(--primary)' }}>+{commission.toLocaleString()} FCFA</span>
                                        </div>
                                    </>
                                )}

                                <div style={styles.totalDivider} />

                                <div style={styles.totalRow}>
                                    <span style={styles.totalLabel}>
                                        {userRole === 'buyer' ? 'Total payé' : userRole === 'seller' ? 'Montant Net' : 'Gain Commission'}
                                    </span>
                                    <span style={styles.totalValue}>
                                        {(userRole === 'seller' ? netAmount : userRole === 'affiliate' ? commission : order.amount).toLocaleString()} FCFA
                                    </span>
                                </div>

                                <div style={styles.securitySeal}>
                                    <ShieldCheck size={14} color="#00CC66" />
                                    <span>Paiement sécurisé par Zwa</span>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Timeline */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <Clock size={16} />
                                <span>Historique de suivi</span>
                            </div>
                            <div style={styles.timelineContainer}>
                                {steps.map((step, index) => (
                                    <div key={step.key} style={styles.timelineItem}>
                                        <div style={styles.timelineLeft}>
                                            <div style={{
                                                ...styles.timelineMarker,
                                                background: step.done
                                                    ? (step.cancelled ? '#FF3B30' : 'var(--primary)')
                                                    : 'rgba(255,255,255,0.05)',
                                                boxShadow: step.done ? `0 0 15px ${step.cancelled ? 'rgba(255,59,48,0.3)' : 'rgba(138,43,226,0.3)'}` : 'none'
                                            }}>
                                                {step.icon}
                                            </div>
                                            {index < steps.length - 1 && (
                                                <div style={{
                                                    ...styles.timelineBar,
                                                    background: step.done && steps[index + 1].done ? 'var(--primary)' : 'rgba(255,255,255,0.05)'
                                                }} />
                                            )}
                                        </div>
                                        <div style={styles.timelineRight}>
                                            <div style={{
                                                ...styles.stepLabel,
                                                color: step.done ? 'white' : 'rgba(255,255,255,0.3)'
                                            }}>
                                                {step.label}
                                            </div>
                                            <div style={styles.stepDate}>
                                                {step.done ? (
                                                    step.key === 'pending' ? formatDate(order.created_at) : formatDate(order.updated_at)
                                                ) : 'Étape suivante'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Vendor/Client Card */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <User size={16} />
                                <span>{userRole === 'buyer' ? 'Boutique' : 'Informations Client'}</span>
                            </div>
                            <div style={styles.partyCard} onClick={() => userRole === 'buyer' && navigate(`/store/${order.seller_id}`)}>
                                <div style={styles.partyAvatar}>
                                    {contactPerson.avatar ? (
                                        <img src={contactPerson.avatar} alt={contactPerson.name} style={styles.avatarImg} />
                                    ) : (
                                        contactPerson.name.charAt(0)
                                    )}
                                </div>
                                <div style={styles.partyInfo}>
                                    <div style={styles.partyName}>{contactPerson.name}</div>
                                    <div style={styles.partyRole}>{userRole === 'buyer' ? 'Vendeur Vérifié Zwa' : 'Client Marketplace'}</div>
                                </div>
                                {userRole === 'buyer' && <ExternalLink size={16} color="rgba(255,255,255,0.4)" />}
                            </div>
                        </div>

                        {/* Notes - ENHANCED (Backup location if not deal) */}
                        {!isDeal && order.notes && (
                            <div style={styles.section}>
                                <div style={styles.sectionHeader}>
                                    <MessageSquare size={16} />
                                    <span>Note sur la commande</span>
                                </div>
                                <div style={styles.enhancedNotes}>
                                    <div style={styles.notesQuote}>"</div>
                                    <div style={styles.notesText}>{order.notes}</div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div >
    );
};

const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease',
    },
    modal: {
        background: '#121212',
        width: '100%',
        maxWidth: '500px',
        height: '90vh',
        borderRadius: '32px',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    visualAccent: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, var(--primary), #FF1493)',
        zIndex: 10,
    },
    header: {
        padding: '32px 24px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: '22px',
        fontWeight: '900',
        color: 'white',
        margin: '0 0 6px 0',
        letterSpacing: '-0.5px',
    },
    statusBadge: {
        display: 'inline-flex',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        background: 'rgba(255,255,255,0.03)',
        padding: '6px 12px',
        borderRadius: '100px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    dealBadge: {
        fontSize: '11px',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        color: '#000',
        padding: '4px 10px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)',
    },
    closeButton: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.5)',
        transition: 'all 0.2s',
    },
    content: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '0 24px 100px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '32px',
    },
    metaCard: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    metaItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    metaLabel: {
        fontSize: '10px',
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '1px',
    },
    orderId: {
        fontSize: '15px',
        fontWeight: '900',
        color: 'white',
        fontFamily: 'monospace',
    },
    metaValue: {
        fontSize: '13px',
        color: 'white',
        fontWeight: '600',
    },
    productSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    section: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        fontWeight: '800',
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    premiumProductCard: {
        display: 'flex',
        gap: '16px',
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(138,43,226,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(138,43,226,0.1)',
        alignItems: 'center',
    },
    productImage: {
        width: '74px',
        height: '74px',
        borderRadius: '16px',
        objectFit: 'cover' as const,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '4px',
        lineHeight: '1.2',
    },
    qtyPrice: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    qtyIcon: {
        background: 'var(--primary)',
        color: 'white',
        fontSize: '12px',
        padding: '2px 8px',
        borderRadius: '6px',
        fontWeight: '900',
    },
    unitPrice: {
        fontSize: '13px',
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px',
    },
    glassCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    iconCircle: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'rgba(138,43,226,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    infoLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        marginBottom: '2px',
    },
    infoValue: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'white',
    },
    paymentCard: {
        padding: '24px',
        background: 'rgba(138,43,226,0.03)',
        borderRadius: '24px',
        border: '1px solid rgba(138,43,226,0.1)',
    },
    priceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
    },
    priceLabel: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: '14px',
        color: 'white',
        fontWeight: '700',
    },
    totalDivider: {
        height: '1px',
        background: 'rgba(255,255,255,0.05)',
        margin: '16px 0',
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '16px',
    },
    totalLabel: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
    },
    totalValue: {
        fontSize: '20px',
        fontWeight: '900',
        color: 'var(--primary)',
    },
    securitySeal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: '600',
        color: 'rgba(0, 204, 102, 0.7)',
        background: 'rgba(0, 204, 102, 0.05)',
        padding: '6px',
        borderRadius: '8px',
    },
    timelineContainer: {
        padding: '8px 4px',
    },
    timelineItem: {
        display: 'flex',
        gap: '20px',
        minHeight: '70px',
    },
    timelineLeft: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
    },
    timelineMarker: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        zIndex: 2,
    },
    timelineBar: {
        width: '2px',
        flex: 1,
        margin: '4px 0',
    },
    timelineRight: {
        paddingTop: '6px',
    },
    stepLabel: {
        fontSize: '15px',
        fontWeight: '800',
        marginBottom: '4px',
    },
    stepDate: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '600',
    },
    partyCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
    },
    partyAvatar: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary), #FF1493)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '900',
        color: 'white',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    partyInfo: {
        flex: 1,
    },
    partyName: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
    },
    partyRole: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.4)',
    },
    notesBox: {
        padding: '16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.6',
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        padding: '24px',
        background: 'linear-gradient(0deg, #121212 70%, transparent 100%)',
        zIndex: 20,
    },
    actionButton: {
        width: '100%',
        padding: '18px',
        borderRadius: '18px',
        border: 'none',
        background: 'var(--primary)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '900',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 10px 30px rgba(138, 43, 226, 0.4)',
        transition: 'transform 0.2s',
    },
    deadlineSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginTop: '-12px',
    },
    deadlineCard: {
        background: 'rgba(255,255,255,0.02)',
        padding: '12px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    deadlineLabel: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
    },
    deadlineValue: {
        fontSize: '12px',
        color: 'white',
        fontWeight: '700',
    },
    deliveryContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    deliveryItem: {
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    deliveryLabel: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        fontWeight: 'bold',
        marginBottom: '6px',
        textTransform: 'uppercase' as const,
    },
    deliveryValue: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
    },
    enhancedNotes: {
        padding: '24px',
        background: 'rgba(138,43,226,0.03)',
        borderRadius: '24px',
        border: '1px solid rgba(138,43,226,0.1)',
        position: 'relative' as const,
        overflow: 'hidden',
    },
    notesQuote: {
        position: 'absolute' as const,
        top: -10,
        left: 10,
        fontSize: '60px',
        color: 'rgba(138,43,226,0.1)',
        fontFamily: 'serif',
        lineHeight: 1,
    },
    notesText: {
        fontSize: '15px',
        color: 'white',
        lineHeight: '1.6',
        fontWeight: '500',
        position: 'relative' as const,
        zIndex: 1,
    },
};

export default OrderDetailsModal;
