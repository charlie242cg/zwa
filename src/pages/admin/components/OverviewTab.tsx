import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Users, ShoppingBag, AlertCircle, Package, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSkeletonAnimation, SkeletonBar } from '../../../components/common/SkeletonLoader';

const StatCard = ({ icon, label, value, trend, subtitle, alert }: {
    icon: any,
    label: string,
    value: string,
    trend?: string,
    subtitle?: string,
    alert?: boolean
}) => (
    <div style={{
        ...styles.statCard,
        ...(alert ? styles.alertCard : {})
    }} className="premium-card">
        <div style={styles.statHeader}>
            <div style={{
                ...styles.iconBox,
                ...(alert ? styles.alertIconBox : {})
            }}>{icon}</div>
            {trend && <span style={styles.trend}>{trend}</span>}
        </div>
        <div style={styles.statContent}>
            <div style={styles.statLabel}>{label}</div>
            <div style={styles.statValue}>{value}</div>
            {subtitle && <div style={styles.statSubtitle}>{subtitle}</div>}
        </div>
    </div>
);

const SkeletonStatCard = () => (
    <div style={styles.statCard} className="premium-card">
        <div style={styles.statHeader}>
            <SkeletonBar width={48} height={48} borderRadius={12} />
        </div>
        <div style={styles.statContent}>
            <SkeletonBar width="60%" height={14} margin="0 0 8px 0" />
            <SkeletonBar width="80%" height={28} />
        </div>
    </div>
);

const OverviewTab = () => {
    useSkeletonAnimation();
    const [stats, setStats] = useState({
        totalGMV: 0,
        totalCommissions: 0,
        totalOrders: 0,
        totalSellers: 0,
        totalAffiliates: 0,
        totalBuyers: 0,
        totalProducts: 0,
        pendingWithdrawals: 0,
        pendingWithdrawalAmount: 0,
        verifiedSellers: 0,
        activeOrders: 0,
        completedToday: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // GMV & Commissions from delivered orders
            const { data: orderStats } = await supabase
                .from('orders')
                .select('amount, commission_amount, status, created_at')
                .eq('status', 'delivered');

            // Active orders
            const { count: activeOrderCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'processing', 'shipped']);

            // Today's completed orders
            const today = new Date().toISOString().split('T')[0];
            const { count: todayCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'delivered')
                .gte('created_at', today);

            // User counts
            const { count: sellerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller');
            const { count: verifiedSellerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller').eq('kyc_verified', true);
            const { count: affiliateCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'affiliate');
            const { count: buyerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer');

            // Product count
            const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

            // Pending withdrawals
            const { data: pendingWithdrawals, count: pendingCount } = await supabase
                .from('transactions')
                .select('amount', { count: 'exact' })
                .eq('type', 'withdrawal')
                .eq('status', 'pending');

            const gmv = orderStats?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;
            const commissions = orderStats?.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0) || 0;
            const pendingAmount = pendingWithdrawals?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            setStats({
                totalGMV: gmv,
                totalCommissions: commissions,
                totalOrders: orderStats?.length || 0,
                totalSellers: sellerCount || 0,
                totalAffiliates: affiliateCount || 0,
                totalBuyers: buyerCount || 0,
                totalProducts: productCount || 0,
                pendingWithdrawals: pendingCount || 0,
                pendingWithdrawalAmount: pendingAmount,
                verifiedSellers: verifiedSellerCount || 0,
                activeOrders: activeOrderCount || 0,
                completedToday: todayCount || 0,
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.grid}>
                    {[1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />)}
                </div>
                <div style={styles.userSection}>
                    <SkeletonBar width={200} height={22} margin="0 0 20px 0" />
                    <div style={styles.userGrid}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={styles.userCard} className="premium-card">
                                <SkeletonBar width={40} height={40} borderRadius={12} />
                                <div style={{ flex: 1 }}>
                                    <SkeletonBar width="60%" height={12} margin="0 0 4px 0" />
                                    <SkeletonBar width="40%" height={18} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Alerts Section */}
            {stats.pendingWithdrawals > 0 && (
                <div style={styles.alertBanner}>
                    <AlertCircle size={20} color="#FFD700" />
                    <span>
                        <strong>{stats.pendingWithdrawals}</strong> retrait{stats.pendingWithdrawals > 1 ? 's' : ''} en attente de validation
                        ({stats.pendingWithdrawalAmount.toLocaleString()} FCFA)
                    </span>
                </div>
            )}

            {/* Main KPIs */}
            <div style={styles.grid}>
                <StatCard
                    icon={<TrendingUp size={24} color="#00CC66" />}
                    label="Volume d'affaires (GMV)"
                    value={`${stats.totalGMV.toLocaleString()} FCFA`}
                    subtitle={`${stats.totalOrders} commandes livrées`}
                />
                <StatCard
                    icon={<Wallet size={24} color="var(--primary)" />}
                    label="Revenus Commissions"
                    value={`${stats.totalCommissions.toLocaleString()} FCFA`}
                    subtitle="Net Zwa"
                />
                <StatCard
                    icon={<DollarSign size={24} color="#FFD700" />}
                    label="Retraits en attente"
                    value={stats.pendingWithdrawals.toString()}
                    subtitle={`${stats.pendingWithdrawalAmount.toLocaleString()} FCFA`}
                    alert={stats.pendingWithdrawals > 0}
                />
                <StatCard
                    icon={<ShoppingBag size={24} color="#FF6B6B" />}
                    label="Commandes actives"
                    value={stats.activeOrders.toString()}
                    subtitle={`${stats.completedToday} livrées aujourd'hui`}
                />
            </div>

            {/* Secondary Metrics */}
            <div style={styles.secondaryGrid}>
                <div style={styles.metricCard} className="premium-card">
                    <Package size={20} color="var(--primary)" />
                    <div style={styles.metricData}>
                        <div style={styles.metricValue}>{stats.totalProducts}</div>
                        <div style={styles.metricLabel}>Produits</div>
                    </div>
                </div>
                <div style={styles.metricCard} className="premium-card">
                    <CheckCircle size={20} color="#00CC66" />
                    <div style={styles.metricData}>
                        <div style={styles.metricValue}>{stats.verifiedSellers}</div>
                        <div style={styles.metricLabel}>Vendeurs vérifiés</div>
                    </div>
                </div>
                <div style={styles.metricCard} className="premium-card">
                    <Clock size={20} color="#FFD700" />
                    <div style={styles.metricData}>
                        <div style={styles.metricValue}>{stats.totalSellers - stats.verifiedSellers}</div>
                        <div style={styles.metricLabel}>KYC en attente</div>
                    </div>
                </div>
            </div>

            {/* Community Stats */}
            <div style={styles.userSection}>
                <h3 style={styles.sectionTitle}>Communauté Zwa</h3>
                <div style={styles.userGrid}>
                    <div style={styles.userCard} className="premium-card">
                        <Users size={20} color="var(--primary)" />
                        <div style={styles.userData}>
                            <div style={styles.userLabel}>Vendeurs</div>
                            <div style={styles.userValue}>{stats.totalSellers}</div>
                        </div>
                    </div>
                    <div style={styles.userCard} className="premium-card">
                        <Users size={20} color="#00CC66" />
                        <div style={styles.userData}>
                            <div style={styles.userLabel}>Affiliés</div>
                            <div style={styles.userValue}>{stats.totalAffiliates}</div>
                        </div>
                    </div>
                    <div style={styles.userCard} className="premium-card">
                        <Users size={20} color="#FFD700" />
                        <div style={styles.userData}>
                            <div style={styles.userLabel}>Acheteurs</div>
                            <div style={styles.userValue}>{stats.totalBuyers}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '30px',
    },
    alertBanner: {
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(138, 43, 226, 0.05) 100%)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'white',
        fontSize: '14px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
    },
    statCard: {
        padding: '24px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    alertCard: {
        border: '1px solid rgba(255, 215, 0, 0.2)',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(138, 43, 226, 0.02) 100%)',
    },
    statHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertIconBox: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    trend: {
        fontSize: '12px',
        color: '#00CC66',
        fontWeight: '600',
        padding: '4px 8px',
        borderRadius: '20px',
        backgroundColor: 'rgba(0, 204, 102, 0.1)',
    },
    statContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    statLabel: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        fontWeight: '500',
    },
    statValue: {
        fontSize: '28px',
        fontWeight: '900',
        color: 'white',
    },
    statSubtitle: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '4px',
    },
    secondaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
    },
    metricCard: {
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    metricData: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
    },
    metricValue: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
    },
    metricLabel: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    userSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '800',
    },
    userGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
    },
    userCard: {
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    userData: {
        display: 'flex',
        flexDirection: 'column' as const,
    },
    userLabel: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    userValue: {
        fontSize: '18px',
        fontWeight: '800',
    },
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        color: 'var(--text-secondary)',
    }
};

export default OverviewTab;
