import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { orderService, OrderStatus } from '../../services/orderService';
import { reviewService } from '../../services/reviewService';
import ReviewModal from '../../components/reviews/ReviewModal';
import OrderTabs from '../../components/orders/OrderTabs';
import OrderCard from '../../components/orders/OrderCard';
import OrderDetailsModal from '../../components/orders/OrderDetailsModal';
import OrderStatsBar from '../../components/orders/OrderStatsBar';
import { useSkeletonAnimation, SkeletonOrderCard } from '../../components/common/SkeletonLoader';

const OrdersList = () => {
    useSkeletonAnimation(); // Ajoute l'animation CSS
    const { profile, user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
    const [ordersWithReviews, setOrdersWithReviews] = useState<Set<string>>(new Set());

    const userRole = profile?.role === 'seller' ? 'seller' : 'buyer';

    useEffect(() => {
        if (profile?.id && profile?.role) {
            fetchOrders();
        }
    }, [profile?.id, profile?.role]);

    useEffect(() => {
        filterOrders();
    }, [orders, activeTab, searchQuery]);

    const fetchOrders = async () => {
        if (!profile?.id || !profile?.role) {
            setLoading(false);
            return;
        }

        setLoading(true);
        let result;
        if (profile.role === 'seller') {
            result = await orderService.getOrdersBySeller(profile.id);
        } else if (profile.role === 'affiliate') {
            result = await orderService.getOrdersByAffiliate(profile.id);
        } else {
            result = await orderService.getOrdersByBuyer(profile.id);
        }

        if (!result.error && result.data) {
            setOrders(result.data);

            // Check which orders already have reviews
            const reviewChecks = await Promise.all(
                result.data.map(order => reviewService.hasReview(order.id))
            );
            const reviewedOrders = new Set(
                result.data
                    .filter((_, index) => reviewChecks[index].hasReview)
                    .map(order => order.id)
            );
            setOrdersWithReviews(reviewedOrders);
        }
        setLoading(false);
    };

    const filterOrders = () => {
        let filtered = orders;

        // Filter by status
        if (activeTab !== 'all') {
            filtered = filtered.filter(order => order.status === activeTab);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(order =>
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.products?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.profiles?.store_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredOrders(filtered);
    };

    const getTabCounts = () => {
        return {
            all: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            paid: orders.filter(o => o.status === 'paid').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
        };
    };

    const getSellerStats = () => {
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.amount), 0);

        return {
            pending: orders.filter(o => o.status === 'pending').length,
            paid: orders.filter(o => o.status === 'paid').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue,
        };
    };

    const handleAction = async (orderId: string, action: string) => {
        if (action === 'ship') {
            const { otp, error } = await orderService.shipOrder(orderId);
            if (error) {
                alert("Erreur lors de l'expédition: " + error.message);
            } else {
                alert(`✅ Commande marquée comme expédiée !\n\n🔑 Code de validation : ${otp}\n\nL'acheteur devra vous communiquer ce code à la livraison.`);
                fetchOrders();
            }
        } else if (action === 'deliver') {
            const otp = prompt("Entrez le code OTP communiqué par l'acheteur:");
            if (otp) {
                const { error } = await orderService.deliverOrder(orderId, otp);
                if (error) {
                    alert("❌ " + error.message);
                } else {
                    alert("🎉 Livraison validée avec succès !\n\n💰 Les fonds ont été transférés sur votre portefeuille.");
                    fetchOrders();
                }
            }
        } else if (action === 'cancel') {
            if (confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
                // TODO: Implement cancel order
                alert("Fonctionnalité d'annulation à implémenter");
            }
        } else if (action === 'review') {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                setSelectedOrderForReview(order);
                setReviewModalOpen(true);
            }
        }
    };

    const handleViewDetails = (order: any) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    if (loading) {
        return (
            <div style={styles.container}>
                {/* Header */}
                <header style={styles.header}>
                    <h1 style={styles.title}>
                        {profile?.role === 'seller' ? '📊 Mes Ventes' :
                            profile?.role === 'affiliate' ? '🔗 Ventes Parrainées' : '🛍️ Mes Achats'}
                    </h1>
                    <p style={styles.subtitle}>
                        {profile?.role === 'seller' ? 'Gérez vos commandes clients' :
                            profile?.role === 'affiliate' ? 'Suivez vos commissions de parrainage' : 'Historique de vos commandes Zwa'}
                    </p>
                </header>

                {/* Skeletons */}
                <div style={styles.ordersList}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <SkeletonOrderCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <h1 style={styles.title}>
                    {profile?.role === 'seller' ? '📊 Mes Ventes' :
                        profile?.role === 'affiliate' ? '🔗 Ventes Parrainées' : '🛍️ Mes Achats'}
                </h1>
                <p style={styles.subtitle}>
                    {profile?.role === 'seller' ? 'Gérez vos commandes clients' :
                        profile?.role === 'affiliate' ? 'Suivez vos commissions de parrainage' : 'Historique de vos commandes Zwa'}
                </p>
            </header>

            {/* Seller Stats Bar */}
            {userRole === 'seller' && orders.length > 0 && (
                <OrderStatsBar stats={getSellerStats()} />
            )}

            {/* Search Bar */}
            {orders.length > 0 && (
                <div style={styles.searchContainer}>
                    <Search size={20} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Rechercher une commande, produit, client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            )}

            {/* Tabs */}
            {orders.length > 0 && (
                <OrderTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={getTabCounts()}
                />
            )}

            {/* Orders List */}
            {filteredOrders.length > 0 ? (
                <div style={styles.ordersList}>
                    {filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            userRole={userRole}
                            onViewDetails={handleViewDetails}
                            onAction={handleAction}
                        />
                    ))}
                </div>
            ) : searchQuery || activeTab !== 'all' ? (
                <div style={styles.emptyState}>
                    <p style={styles.emptyText}>Aucune commande trouvée</p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setActiveTab('all');
                        }}
                        style={styles.resetButton}
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            ) : (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📦</div>
                    <p style={styles.emptyText}>
                        {userRole === 'seller' ? 'Aucune vente pour le moment' : 'Aucun achat pour le moment'}
                    </p>
                    <p style={styles.emptyHint}>
                        {userRole === 'seller'
                            ? 'Vos commandes apparaîtront ici dès qu\'un client achète vos produits'
                            : 'Commencez vos achats sur Zwa !'}
                    </p>
                </div>
            )}

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                order={selectedOrder}
                userRole={userRole}
            />

            {/* Review Modal */}
            {selectedOrderForReview && (
                <ReviewModal
                    isOpen={reviewModalOpen}
                    onClose={() => {
                        setReviewModalOpen(false);
                        setSelectedOrderForReview(null);
                        fetchOrders();
                    }}
                    order={{
                        id: selectedOrderForReview.id,
                        buyer_id: selectedOrderForReview.buyer_id,
                        seller_id: selectedOrderForReview.seller_id,
                        product_id: selectedOrderForReview.product_id,
                        product: {
                            name: selectedOrderForReview.products?.name || 'Produit',
                            image_url: selectedOrderForReview.products?.image_url || '',
                        },
                        seller: {
                            full_name: selectedOrderForReview.seller?.full_name,
                            store_name: selectedOrderForReview.seller?.store_name,
                        }
                    }}
                />
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '24px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '900',
        color: 'white',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '20px',
    },
    searchInput: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
    },
    ordersList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    emptyState: {
        textAlign: 'center' as const,
        padding: '80px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '20px',
        opacity: 0.3,
    },
    emptyText: {
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '8px',
    },
    emptyHint: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        maxWidth: '300px',
        margin: '0 auto',
        lineHeight: '1.5',
    },
    resetButton: {
        marginTop: '20px',
        padding: '12px 24px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'var(--primary)',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '60px 20px',
        fontSize: '16px',
        color: 'var(--text-secondary)',
    },
};

export default OrdersList;
