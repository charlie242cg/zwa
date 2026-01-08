import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, ShieldCheck, Heart, Calendar, Phone, DollarSign, TrendingUp } from 'lucide-react';
import { storeService, StoreProfile } from '../../services/storeService';
import { useAuth } from '../../hooks/useAuth';
import { reviewService, Review } from '../../services/reviewService';
import ReviewCarousel from '../../components/reviews/ReviewCarousel';
import ReviewsModal from '../../components/reviews/ReviewsModal';
import StarRating from '../../components/reviews/StarRating';
import { supabase } from '../../lib/supabase';
import { useSkeletonAnimation, SkeletonBar, SkeletonAvatar, SkeletonProductGrid } from '../../components/common/SkeletonLoader';

const StorePage = () => {
    useSkeletonAnimation();
    const { sellerId } = useParams<{ sellerId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [store, setStore] = useState<StoreProfile | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'bestsellers'>('all');
    const [isFollowing, setIsFollowing] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [financialStats, setFinancialStats] = useState({
        totalRevenue: 0,
        totalCommissions: 0,
        grandTotal: 0
    });

    console.log('[StorePage] 🏪 Component rendered. Seller ID:', sellerId);

    useEffect(() => {
        if (sellerId) {
            fetchStoreData(sellerId);
        }
    }, [sellerId, filter]);

    const fetchStoreData = async (id: string) => {
        setLoading(true);
        console.log('[StorePage] 🔄 Fetching store data for:', id);

        // Fetch store profile
        const { data: storeData, error: storeError } = await storeService.getStoreById(id);
        if (storeError || !storeData) {
            console.error('[StorePage] ❌ Store not found:', storeError);
            alert("Boutique introuvable");
            navigate(-1);
            return;
        }

        setStore(storeData);
        console.log('[StorePage] ✅ Store loaded:', storeData.store_name || storeData.full_name);

        // Fetch products
        const { data: productsData, error: productsError } = await storeService.getStoreProducts(id, filter);
        if (!productsError && productsData) {
            setProducts(productsData);
            console.log('[StorePage] ✅ Products loaded:', productsData.length);
        }

        // Check if following
        if (user) {
            const following = await storeService.isFollowing(user.id, id);
            setIsFollowing(following);
        }

        // Fetch reviews
        setReviewsLoading(true);
        const { data: reviewsData } = await reviewService.getSellerReviews(id, 3);
        if (reviewsData) {
            setReviews(reviewsData);
        }
        setReviewsLoading(false);

        // Fetch financial stats from delivered orders
        const { data: ordersData } = await supabase
            .from('orders')
            .select('amount, commission_amount')
            .eq('seller_id', id)
            .eq('status', 'delivered');

        if (ordersData) {
            const totalRevenue = ordersData.reduce((sum: number, order: any) => sum + Number(order.amount), 0);
            const totalCommissions = ordersData.reduce((sum: number, order: any) => sum + Number(order.commission_amount || 0), 0);
            setFinancialStats({
                totalRevenue,
                totalCommissions,
                grandTotal: totalRevenue + totalCommissions
            });
        }

        setLoading(false);
    };

    const handleFollow = async () => {
        if (!user || !sellerId) {
            alert("Vous devez être connecté pour suivre une boutique");
            return;
        }

        if (isFollowing) {
            await storeService.unfollowStore(user.id, sellerId);
            setIsFollowing(false);
        } else {
            await storeService.followStore(user.id, sellerId);
            setIsFollowing(true);
        }
    };


    const handleShare = async () => {
        const storeUrl = `${window.location.origin}/store/${sellerId}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: store?.store_name || store?.full_name || 'Ma Boutique Zwa',
                    text: `Découvre ma boutique sur Zwa !`,
                    url: storeUrl,
                });
            } else {
                await navigator.clipboard.writeText(storeUrl);
                alert("✅ Lien de votre boutique copié !");
            }
        } catch (err) {
            console.error('[StorePage] ❌ Error sharing:', err);
        }
    };

    const handleEditStore = () => {
        navigate('/seller/edit-store');
    };

    const getMemberSince = (createdAt: string) => {
        const date = new Date(createdAt);
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${month} ${year}`;
    };

    if (loading) {
        return (
            <div style={styles.container}>
                {/* Header Skeleton */}
                <div style={{
                    ...styles.header,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)'
                }}>
                    <SkeletonBar width={40} height={40} borderRadius="50%" style={{ position: 'absolute', top: '20px', left: '20px' }} />
                </div>

                {/* Profile Section Skeleton */}
                <div style={styles.profileSection}>
                    <SkeletonAvatar size={80} />
                    <div style={styles.storeInfo}>
                        <SkeletonBar width="70%" height={24} margin="0 0 8px 0" />
                        <SkeletonBar width="50%" height={14} margin="0 0 12px 0" />
                        <SkeletonBar width="100%" height={40} borderRadius={12} />
                    </div>
                </div>

                {/* Stats Row Skeleton */}
                <div style={styles.statsRow}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={styles.statItem}>
                            <SkeletonBar width={40} height={20} margin="0 0 4px 0" />
                            <SkeletonBar width={60} height={12} />
                        </div>
                    ))}
                </div>

                {/* About Section Skeleton */}
                <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                    <SkeletonBar width={100} height={20} margin="0 0 12px 0" />
                    <SkeletonBar width="100%" height={14} margin="0 0 6px 0" />
                    <SkeletonBar width="90%" height={14} margin="0 0 6px 0" />
                    <SkeletonBar width="70%" height={14} />
                </div>

                {/* Products Section Skeleton */}
                <div style={{ padding: '0 20px' }}>
                    <SkeletonBar width={120} height={20} margin="0 0 16px 0" />
                    <SkeletonProductGrid count={4} columns={2} gap={16} />
                </div>
            </div>
        );
    }

    if (!store) {
        return (
            <div style={styles.container}>
                <div style={styles.centered}>Boutique introuvable</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Compact Header with Banner */}
            <div style={{
                ...styles.header,
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3) 0%, transparent 100%), ${store.store_banner_url
                        ? `url(${store.store_banner_url})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }`
            }}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </button>
            </div>

            {/* Profile Section - Horizontal Layout */}
            <div style={styles.profileSection}>
                {/* Avatar - Left */}
                <div style={styles.avatarContainer}>
                    <div style={styles.avatar}>
                        {store.avatar_url ? (
                            <img src={store.avatar_url} alt="" style={styles.avatarImage} />
                        ) : (
                            <span style={styles.avatarText}>
                                {(store.store_name || store.full_name)?.charAt(0) || 'V'}
                            </span>
                        )}
                    </div>
                    {store.is_verified_seller && (
                        <div style={styles.verifiedBadge}>
                            <ShieldCheck size={20} color="white" fill="#00CC66" />
                        </div>
                    )}
                </div>

                {/* Store Info - Right */}
                <div style={styles.storeInfo}>
                    <div style={styles.nameRow}>
                        <h1 style={styles.storeName}>{store.store_name || store.full_name || 'Boutique'}</h1>
                        {store.is_verified_seller && (
                            <ShieldCheck size={18} color="#00CC66" style={{ marginLeft: '6px', flexShrink: 0 }} />
                        )}
                    </div>

                    {/* Bio */}
                    {store.store_bio && (
                        <p style={styles.bio}>{store.store_bio}</p>
                    )}

                    {/* Location */}
                    {store.store_location && (
                        <div style={styles.location}>
                            <MapPin size={14} color="var(--text-secondary)" />
                            <span>{store.store_location}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Compact Stats Row */}
            <div style={styles.statsRow}>
                <div style={styles.statItem}>
                    <StarRating value={store.average_rating || 0} readonly size={14} />
                    <div style={styles.ratingText}>
                        {store.average_rating?.toFixed(1) || '0.0'}/5
                    </div>
                    {store.total_reviews > 0 && (
                        <div style={styles.reviewCount}>
                            {store.total_reviews} avis
                        </div>
                    )}
                </div>
                <div style={styles.statDivider}></div>
                <div style={styles.statItem}>
                    <div style={styles.statValue}>{store.total_sales_count}</div>
                    <div style={styles.statLabel}>
                        <Package size={12} color="var(--text-secondary)" />
                        Ventes
                    </div>
                </div>
                <div style={styles.statDivider}></div>
                <div style={styles.statItem}>
                    <div style={styles.statValue}>{getMemberSince(store.created_at)}</div>
                    <div style={styles.statLabel}>
                        <Calendar size={12} color="var(--text-secondary)" />
                        Membre
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.actionsContainer}>
                {user?.id === sellerId ? (
                    <div style={styles.actionButtons}>
                        <button onClick={handleEditStore} style={styles.editButton}>
                            ✏️ Modifier
                        </button>
                        <button onClick={handleShare} style={styles.shareButton}>
                            🔗 Partager
                        </button>
                    </div>
                ) : (
                    <div style={styles.visitorActions}>
                        {store.phone_number && (
                            <a href={`tel:${store.phone_number}`} style={styles.phoneButton}>
                                <Phone size={18} />
                                Appeler
                            </a>
                        )}
                        <button
                            onClick={handleFollow}
                            style={{
                                ...styles.followButton,
                                background: isFollowing ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: isFollowing ? 'white' : 'var(--primary)',
                            }}
                        >
                            <Heart size={18} fill={isFollowing ? 'white' : 'none'} />
                            {isFollowing ? 'Suivi' : 'Suivre'}
                        </button>
                    </div>
                )}
            </div>

            {/* Financial Stats Section */}
            {user?.id === sellerId && financialStats.grandTotal > 0 && (
                <div style={styles.financialSection}>
                    <h3 style={styles.sectionTitle}>💰 Chiffre d'affaires</h3>
                    <div style={styles.financialGrid}>
                        <div style={styles.financialCard}>
                            <DollarSign size={20} color="var(--primary)" />
                            <div style={styles.financialValue}>
                                {financialStats.totalRevenue.toLocaleString()} FCFA
                            </div>
                            <div style={styles.financialLabel}>Ventes totales</div>
                        </div>
                        <div style={styles.financialCard}>
                            <TrendingUp size={20} color="#00CC66" />
                            <div style={styles.financialValue}>
                                {financialStats.totalCommissions.toLocaleString()} FCFA
                            </div>
                            <div style={styles.financialLabel}>Commissions</div>
                        </div>
                        <div style={styles.financialCardHighlight}>
                            <div style={styles.financialValueLarge}>
                                {financialStats.grandTotal.toLocaleString()} FCFA
                            </div>
                            <div style={styles.financialLabelWhite}>Chiffre d'affaires total</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews Section - Only seller reviews */}
            {store.total_reviews > 0 && (
                <div style={styles.reviewsSection}>
                    <div style={styles.reviewsHeader}>
                        <h3 style={styles.sectionTitle}>📝 Avis sur le service ({store.total_reviews})</h3>
                    </div>

                    {reviewsLoading ? (
                        <div style={styles.reviewsLoading}>Chargement des avis...</div>
                    ) : (
                        <ReviewCarousel
                            reviews={reviews}
                            type="seller"
                            totalCount={store.total_reviews}
                            onViewAll={() => setShowReviewsModal(true)}
                        />
                    )}
                </div>
            )}

            {/* Reviews Modal */}
            <ReviewsModal
                isOpen={showReviewsModal}
                onClose={() => setShowReviewsModal(false)}
                sellerId={sellerId}
                type="seller"
                totalCount={store.total_reviews}
            />

            {/* Filters */}
            <div style={styles.filtersContainer}>
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        ...styles.filterChip,
                        ...(filter === 'all' ? styles.filterChipActive : {})
                    }}
                >
                    Tout
                </button>
                <button
                    onClick={() => setFilter('bestsellers')}
                    style={{
                        ...styles.filterChip,
                        ...(filter === 'bestsellers' ? styles.filterChipActive : {})
                    }}
                >
                    Meilleures ventes
                </button>
            </div>

            {/* Products Grid */}
            <div style={styles.productsSection}>
                {products.length > 0 ? (
                    <div style={styles.productsGrid}>
                        {products.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => navigate(`/product/${product.id}`)}
                                style={styles.productCard}
                                className="premium-card"
                            >
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    style={styles.productImage}
                                />
                                <div style={styles.productInfo}>
                                    <div style={styles.productName}>{product.name}</div>
                                    <div style={styles.productPrice}>
                                        {product.price.toLocaleString()} FCFA
                                    </div>
                                    {product.min_order_quantity > 1 && (
                                        <div style={styles.productMoq}>
                                            Min: {product.min_order_quantity} pcs
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <Package size={48} color="rgba(255,255,255,0.1)" />
                        <p style={styles.emptyText}>
                            {filter === 'all'
                                ? 'Aucun produit disponible pour le moment.'
                                : 'Aucune vente enregistrée.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        background: 'var(--background)',
        minHeight: '100vh',
        paddingBottom: '80px',
    },
    header: {
        width: '100%',
        height: '180px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'flex-start',
        padding: '16px 20px',
    },
    backButton: {
        background: 'rgba(0,0,0,0.4)',
        border: 'none',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
    },
    profileSection: {
        padding: '16px 20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        marginTop: '0',
    },
    avatarContainer: {
        position: 'relative' as const,
        flexShrink: 0,
    },
    avatar: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--primary)',
        border: '3px solid var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white',
        overflow: 'hidden',
    },
    verifiedBadge: {
        position: 'absolute' as const,
        bottom: '0px',
        right: '0px',
        width: '24px',
        height: '24px',
        background: '#00CC66',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '3px solid #121212',
        boxShadow: '0 2px 8px rgba(0, 204, 102, 0.4)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    avatarText: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white',
    },
    storeInfo: {
        flex: 1,
        minWidth: 0,
    },
    nameRow: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px',
    },
    storeName: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    bio: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
        marginBottom: '6px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
    },
    location: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    statsRow: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        margin: '0 20px 16px',
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '4px',
    },
    ratingText: {
        fontSize: '13px',
        fontWeight: '700',
        color: 'white',
        marginTop: '4px',
    },
    reviewCount: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
    },
    statValue: {
        fontSize: '15px',
        fontWeight: '800',
        color: 'white',
    },
    statLabel: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    statDivider: {
        width: '1px',
        height: '30px',
        background: 'rgba(255,255,255,0.1)',
    },
    actionsContainer: {
        padding: '0 20px 20px',
    },
    actionButtons: {
        display: 'flex',
        gap: '12px',
    },
    editButton: {
        flex: 1,
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
    },
    shareButton: {
        flex: 1,
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.05)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    visitorActions: {
        display: 'flex',
        gap: '12px',
    },
    phoneButton: {
        flex: 1,
        background: 'var(--primary)',
        color: 'white',
        textDecoration: 'none',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
    },
    followButton: {
        flex: 1,
        border: '1px solid var(--primary)',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    reviewsSection: {
        margin: '0 20px 24px',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    reviewsHeader: {
        marginBottom: '16px',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        margin: 0,
    },
    reviewsLoading: {
        textAlign: 'center' as const,
        padding: '20px',
        color: 'var(--text-secondary)',
        fontSize: '14px',
    },
    filtersContainer: {
        display: 'flex',
        gap: '8px',
        padding: '0 20px 20px',
        overflowX: 'auto' as const,
    },
    filterChip: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--text-secondary)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
    },
    filterChipActive: {
        background: 'var(--primary)',
        color: 'white',
        border: '1px solid var(--primary)',
    },
    productsSection: {
        padding: '0 20px',
    },
    productsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
    },
    productCard: {
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    productImage: {
        width: '100%',
        aspectRatio: '1/1',
        objectFit: 'cover' as const,
        background: '#1a1a1a',
    },
    productInfo: {
        padding: '12px',
    },
    productName: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    productPrice: {
        fontSize: '15px',
        fontWeight: '800',
        color: 'var(--primary)',
        marginBottom: '4px',
    },
    productMoq: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center' as const,
        background: 'rgba(255,255,255,0.01)',
        borderRadius: '24px',
        border: '1px dashed rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '16px',
    },
    emptyText: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '40px 20px',
        color: 'var(--text-secondary)',
    },
    financialSection: {
        margin: '0 20px 24px',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    financialGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px',
        marginTop: '16px',
    },
    financialCard: {
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    financialValue: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
    },
    financialLabel: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    financialCardHighlight: {
        padding: '20px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #764ba2 100%)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        alignItems: 'center',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
    },
    financialValueLarge: {
        fontSize: '28px',
        fontWeight: '900',
        color: 'white',
    },
    financialLabelWhite: {
        fontSize: '13px',
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    }
};

export default StorePage;
