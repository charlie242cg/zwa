import React, { useEffect, useState } from 'react';
import { Plus, Package, TrendingUp, DollarSign, Edit3, Star, FileCheck, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { productService, Product } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';
import StarRating from '../../components/reviews/StarRating';
import { useSkeletonAnimation, SkeletonBar, SkeletonAvatar } from '../../components/common/SkeletonLoader';
import KYCRequestModal from '../../components/kyc/KYCRequestModal';
import { kycService } from '../../services/kycService';

const SellerDashboard = () => {
    useSkeletonAnimation(); // Add skeleton animation CSS
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        orderCount: 0,
        activityPercent: 0,
        totalCommissions: 0,
        averageRating: 0,
        totalReviews: 0,
        totalSalesCount: 0
    });

    // KYC States
    const [kycRequest, setKycRequest] = useState<any>(null);
    const [kycModalOpen, setKycModalOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (user) {
            fetchSellerProducts();
            fetchKYCStatus();
        }
    }, [user]);

    const fetchKYCStatus = async () => {
        if (!user?.id) return;

        // Récupérer le profil
        const { data: profileData } = await supabase
            .from('profiles')
            .select('is_verified_seller, kyc_verified, store_name, phone_number, avatar_url')
            .eq('id', user.id)
            .single();

        setProfile(profileData);

        // Récupérer la demande KYC
        const { data: kycData } = await kycService.getSellerKYCRequest(user.id);
        setKycRequest(kycData);
    };

    const fetchSellerProducts = async () => {
        setLoading(true);
        // 1. Fetch products
        const { data: productsData, error: productError } = await productService.getProducts();
        if (!productError && productsData) {
            const myProducts = productsData.filter(p => p.seller_id === user?.id);
            setProducts(myProducts);
        }

        // 2. Fetch stats from delivered orders
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('amount, status, commission_amount')
            .eq('seller_id', user?.id)
            .eq('status', 'delivered');

        // 3. Fetch seller profile stats (ratings, reviews, sales count)
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('average_rating, total_reviews, total_sales_count')
            .eq('id', user?.id)
            .single();

        if (!ordersError && ordersData) {
            const total = ordersData.reduce((sum: number, o: any) => sum + Number(o.amount), 0);
            const commissions = ordersData.reduce((sum: number, o: any) => sum + Number(o.commission_amount || 0), 0);
            setStats({
                totalSales: total,
                orderCount: ordersData.length,
                activityPercent: ordersData.length > 0 ? 100 : 0,
                totalCommissions: commissions,
                averageRating: profileData?.average_rating || 0,
                totalReviews: profileData?.total_reviews || 0,
                totalSalesCount: profileData?.total_sales_count || 0
            });
        }
        setLoading(false);
    };

    const updateCommission = async (productId: string, value: string) => {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 100) return;

        const { error } = await productService.updateProduct(productId, {
            default_commission: rate
        });

        if (error) {
            alert("Erreur lors de la mise à jour de la commission");
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <header style={styles.header}>
                    <SkeletonBar width="60%" height={32} margin="0 0 8px 0" />
                    <SkeletonBar width="80%" height={16} margin="0 0 16px 0" />
                    <SkeletonBar width="100%" height={40} borderRadius={12} />
                </header>

                {/* Stats Cards Skeleton */}
                <div style={styles.statsGrid}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={styles.statCard} className="premium-card">
                            <SkeletonBar width={20} height={20} borderRadius="50%" margin="0 0 8px 0" />
                            <SkeletonBar width="60%" height={24} margin="0 0 8px 0" />
                            <SkeletonBar width="80%" height={12} />
                        </div>
                    ))}
                </div>

                {/* Rating Card Skeleton */}
                <div style={styles.ratingCard} className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <SkeletonBar width={24} height={24} borderRadius="50%" />
                        <div>
                            <SkeletonBar width={100} height={28} margin="0 0 4px 0" />
                            <SkeletonBar width={60} height={12} />
                        </div>
                    </div>
                    <SkeletonBar width={120} height={20} />
                </div>

                {/* Products Section Skeleton */}
                <div style={styles.sectionHeader}>
                    <SkeletonBar width={150} height={24} />
                    <SkeletonBar width={100} height={40} borderRadius={12} />
                </div>

                <div style={styles.productList}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={styles.productItem} className="premium-card">
                            <SkeletonBar width={60} height={60} borderRadius={12} />
                            <div style={styles.productInfo}>
                                <SkeletonBar width="80%" height={16} margin="0 0 4px 0" />
                                <SkeletonBar width="50%" height={14} margin="0 0 8px 0" />
                                <SkeletonBar width="90%" height={24} />
                            </div>
                            <SkeletonBar width={36} height={36} borderRadius={10} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Mon Business 💼</h1>
                <p style={styles.subtitle}>Gérez vos stocks et vos ventes en direct.</p>
                <button
                    onClick={() => navigate(`/store/${user?.id}`)}
                    style={styles.viewStoreButton}
                >
                    👁️ Voir ma boutique publique
                </button>
            </header>

            {/* Stats Cards */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard} className="premium-card">
                    <DollarSign size={20} color="var(--primary)" />
                    <div style={styles.statValue}>{stats.totalSales.toLocaleString()}</div>
                    <div style={styles.statLabel}>Ventes (FCFA)</div>
                </div>
                <div style={styles.statCard} className="premium-card">
                    <TrendingUp size={20} color="#00CC66" />
                    <div style={styles.statValue}>{stats.totalSalesCount}</div>
                    <div style={styles.statLabel}>Total Ventes</div>
                </div>
                <div style={styles.statCard} className="premium-card">
                    <div style={{ color: '#FFCC00', fontWeight: 'bold', fontSize: '12px' }}>%</div>
                    <div style={styles.statValue}>{stats.totalCommissions.toLocaleString()}</div>
                    <div style={styles.statLabel}>Commissions</div>
                </div>
                <div style={styles.statCard} className="premium-card">
                    <Package size={20} color="var(--primary)" />
                    <div style={styles.statValue}>{products.length}</div>
                    <div style={styles.statLabel}>Produits</div>
                </div>
            </div>

            {/* Rating Card - Full Width */}
            <div style={styles.ratingCard} className="premium-card">
                <div style={styles.ratingHeader}>
                    <Star size={24} color="#FFCC00" fill="#FFCC00" />
                    <div style={styles.ratingInfo}>
                        <div style={styles.ratingValue}>
                            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}/5
                        </div>
                        <div style={styles.ratingSubtext}>
                            {stats.totalReviews} {stats.totalReviews > 1 ? 'avis' : 'avis'}
                        </div>
                    </div>
                </div>
                <div style={styles.ratingStars}>
                    <StarRating value={stats.averageRating} readonly size={20} />
                </div>
            </div>

            {/* KYC Status Card */}
            <div style={styles.kycCard} className="premium-card">
                <div style={styles.kycHeader}>
                    <div style={styles.kycTitle}>
                        <FileCheck size={20} color="var(--primary)" />
                        <span>Vérification</span>
                    </div>
                    <div style={styles.kycBadges}>
                        {profile?.is_verified_seller && (
                            <div style={styles.badgeVerified}>
                                <Shield size={14} /> Vérifié
                            </div>
                        )}
                        {profile?.kyc_verified && (
                            <div style={styles.badgeKYC}>
                                <FileCheck size={14} /> KYC OK
                            </div>
                        )}
                    </div>
                </div>

                {!profile?.kyc_verified && (
                    <>
                        {!kycRequest && (
                            <div style={styles.kycContent}>
                                <p style={styles.kycText}>
                                    Pour retirer vos gains, vous devez vérifier votre identité.
                                </p>
                                <button onClick={() => setKycModalOpen(true)} style={styles.kycButton}>
                                    📄 Demander vérification KYC
                                </button>
                            </div>
                        )}

                        {kycRequest?.status === 'pending' && (
                            <div style={styles.kycContent}>
                                <div style={styles.kycPending}>
                                    ⏳ Votre demande KYC est en cours de validation...
                                </div>
                                <p style={styles.kycSmallText}>
                                    Vous recevrez une notification une fois validée.
                                </p>
                            </div>
                        )}

                        {kycRequest?.status === 'rejected' && (
                            <div style={styles.kycContent}>
                                <div style={styles.kycRejected}>
                                    ❌ Demande rejetée: {kycRequest.admin_notes}
                                </div>
                                <button onClick={() => setKycModalOpen(true)} style={styles.kycButton}>
                                    🔄 Re-soumettre
                                </button>
                            </div>
                        )}
                    </>
                )}

                {profile?.kyc_verified && (
                    <div style={styles.kycContent}>
                        <div style={styles.kycApproved}>
                            ✅ KYC vérifié - Vous pouvez retirer vos fonds
                        </div>
                    </div>
                )}
            </div>

            {/* Modal KYC */}
            <KYCRequestModal
                isOpen={kycModalOpen}
                onClose={() => setKycModalOpen(false)}
                sellerId={user?.id || ''}
                existingRequest={kycRequest?.status === 'rejected' ? kycRequest : undefined}
                onSuccess={() => {
                    setKycModalOpen(false);
                    fetchKYCStatus();
                }}
            />

            <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Mes Produits</h3>
                <Link to="/seller/add-product" style={styles.addButton}>
                    <Plus size={20} />
                    <span>Ajouter</span>
                </Link>
            </div>

            {products.length > 0 ? (
                <div style={styles.productList}>
                    {products.map(product => (
                        <div key={product.id} style={styles.productItem} className="premium-card">
                            <img src={product.image_url} alt={product.name} style={styles.productThumb} />
                            <div style={styles.productInfo}>
                                <div style={styles.productName}>{product.name}</div>
                                <div style={styles.productPrice}>{product.price.toLocaleString()} FCFA</div>
                                <div style={styles.affiliationRow}>
                                    <div style={{
                                        ...styles.affiliateBadge,
                                        opacity: product.is_affiliate_enabled ? 1 : 0.5,
                                        background: product.is_affiliate_enabled ? 'rgba(138, 43, 226, 0.1)' : 'rgba(255,255,255,0.05)'
                                    }}>
                                        <TrendingUp size={12} color={product.is_affiliate_enabled ? 'var(--primary)' : 'var(--text-secondary)'} />
                                        <span style={{ color: product.is_affiliate_enabled ? 'white' : 'var(--text-secondary)' }}>Affiliation:</span>
                                    </div>
                                    <input
                                        type="number"
                                        disabled={!product.is_affiliate_enabled}
                                        defaultValue={product.default_commission || 0}
                                        onBlur={(e) => updateCommission(product.id, e.target.value)}
                                        style={{
                                            ...styles.commissionInput,
                                            opacity: product.is_affiliate_enabled ? 1 : 0.3
                                        }}
                                    />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', opacity: product.is_affiliate_enabled ? 1 : 0.3 }}>%</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/seller/edit-product/${product.id}`)}
                                style={styles.editBtn}
                            >
                                <Edit3 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={styles.emptyState}>
                    <Package size={48} color="rgba(255,255,255,0.1)" />
                    <p style={styles.emptyText}>Vous n'avez pas encore de produits en vente.</p>
                    <Link to="/seller/add-product" style={styles.emptyLink}>Ajouter mon premier produit</Link>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '24px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '32px',
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
    },
    viewStoreButton: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--primary)',
        padding: '10px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        marginTop: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'center',
        width: '100%',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px',
    },
    statCard: {
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    statValue: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
    },
    statLabel: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
    },
    addButton: {
        background: 'var(--primary)',
        color: 'white',
        textDecoration: 'none',
        padding: '8px 16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '700',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
    },
    productList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    productItem: {
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    productThumb: {
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
        background: '#1a1a1a',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: '15px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '4px',
    },
    productPrice: {
        fontSize: '13px',
        color: 'var(--primary)',
        fontWeight: '700',
    },
    affiliationRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px',
    },
    affiliateBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        background: 'rgba(255,255,255,0.05)',
        padding: '2px 8px',
        borderRadius: '8px',
    },
    commissionInput: {
        width: '40px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px',
        textAlign: 'center' as const,
    },
    editBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
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
    emptyLink: {
        color: 'var(--primary)',
        fontSize: '14px',
        fontWeight: '700',
        textDecoration: 'none',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '40px',
        color: 'var(--text-secondary)',
    },
    ratingCard: {
        padding: '20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
    },
    ratingHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    ratingInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    ratingValue: {
        fontSize: '24px',
        fontWeight: '800',
        color: 'white',
    },
    ratingSubtext: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    ratingStars: {
        display: 'flex',
        gap: '4px',
    },
    kycCard: {
        padding: '20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '32px',
    },
    kycHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    kycTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
    },
    kycBadges: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap' as const,
    },
    badgeVerified: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: 'rgba(0, 204, 102, 0.1)',
        color: '#00CC66',
    },
    badgeKYC: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        color: '#FFD700',
    },
    kycContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    kycText: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        margin: 0,
        lineHeight: '1.5',
    },
    kycButton: {
        padding: '12px 16px',
        backgroundColor: 'var(--primary)',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
    },
    kycPending: {
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        border: '1px solid rgba(255, 184, 0, 0.2)',
        borderRadius: '12px',
        fontSize: '14px',
        color: '#FFB800',
        fontWeight: '600',
    },
    kycSmallText: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        margin: 0,
    },
    kycRejected: {
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        border: '1px solid rgba(255, 69, 58, 0.2)',
        borderRadius: '12px',
        fontSize: '13px',
        color: '#FF453A',
        lineHeight: '1.5',
    },
    kycApproved: {
        padding: '12px 16px',
        backgroundColor: 'rgba(0, 204, 102, 0.1)',
        border: '1px solid rgba(0, 204, 102, 0.2)',
        borderRadius: '12px',
        fontSize: '14px',
        color: '#00CC66',
        fontWeight: '600',
    },
};

export default SellerDashboard;
