import { Clock, Package, CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';

interface OrderStatsBarProps {
    stats: {
        pending: number;
        paid: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        totalRevenue: number;
    };
}

const OrderStatsBar = ({ stats }: OrderStatsBarProps) => {
    const statsItems = [
        {
            label: 'En attente',
            value: stats.pending,
            icon: <Clock size={20} />,
            color: '#FFA500',
            bg: 'rgba(255, 165, 0, 0.1)',
        },
        {
            label: 'Payées',
            value: stats.paid,
            icon: <Package size={20} />,
            color: '#00CC66',
            bg: 'rgba(0, 204, 102, 0.1)',
        },
        {
            label: 'Expédiées',
            value: stats.shipped,
            icon: <TrendingUp size={20} />,
            color: '#4A90E2',
            bg: 'rgba(74, 144, 226, 0.1)',
        },
        {
            label: 'Livrées',
            value: stats.delivered,
            icon: <CheckCircle size={20} />,
            color: '#00CC66',
            bg: 'rgba(0, 204, 102, 0.1)',
        },
    ];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>📊 Aperçu des Ventes</h3>
                <div style={styles.revenueCard}>
                    <DollarSign size={18} color="var(--primary)" />
                    <div style={styles.revenueText}>
                        <div style={styles.revenueLabel}>CA du mois</div>
                        <div style={styles.revenueValue}>{stats.totalRevenue.toLocaleString()} FCFA</div>
                    </div>
                </div>
            </div>

            <div style={styles.statsGrid}>
                {statsItems.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.statCard,
                            borderLeft: `3px solid ${item.color}`,
                        }}
                    >
                        <div style={{...styles.statIcon, color: item.color, background: item.bg}}>
                            {item.icon}
                        </div>
                        <div style={styles.statInfo}>
                            <div style={styles.statValue}>{item.value}</div>
                            <div style={styles.statLabel}>{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {stats.cancelled > 0 && (
                <div style={styles.cancelledNotice}>
                    <XCircle size={16} color="#FF3B30" />
                    <span>{stats.cancelled} commande(s) annulée(s)</span>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '24px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap' as const,
        gap: '12px',
    },
    title: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    revenueCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'rgba(138, 43, 226, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(138, 43, 226, 0.2)',
    },
    revenueText: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
    },
    revenueLabel: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
    },
    revenueValue: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'var(--primary)',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
    },
    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    statIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
    },
    statValue: {
        fontSize: '22px',
        fontWeight: '800',
        color: 'white',
        lineHeight: '1',
    },
    statLabel: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
    },
    cancelledNotice: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(255, 59, 48, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 59, 48, 0.2)',
        fontSize: '13px',
        color: '#FF3B30',
        fontWeight: '600',
    },
};

export default OrderStatsBar;
