import { OrderStatus } from '../../services/orderService';

interface OrderTabsProps {
    activeTab: OrderStatus | 'all';
    onTabChange: (tab: OrderStatus | 'all') => void;
    counts: Record<string, number>;
}

const OrderTabs = ({ activeTab, onTabChange, counts }: OrderTabsProps) => {
    const tabs = [
        { key: 'all' as const, label: 'Tous', emoji: '📦' },
        { key: 'pending' as const, label: 'En attente', emoji: '⏳' },
        { key: 'paid' as const, label: 'Payé', emoji: '💳' },
        { key: 'shipped' as const, label: 'Expédié', emoji: '🚚' },
        { key: 'delivered' as const, label: 'Livré', emoji: '✅' },
        { key: 'cancelled' as const, label: 'Annulé', emoji: '❌' },
    ];

    return (
        <div style={styles.container}>
            <div style={styles.tabsWrapper}>
                {tabs.map(tab => {
                    const count = counts[tab.key] || 0;
                    const isActive = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            style={{
                                ...styles.tab,
                                ...(isActive ? styles.tabActive : {}),
                            }}
                        >
                            <span style={styles.tabEmoji}>{tab.emoji}</span>
                            <span style={styles.tabLabel}>{tab.label}</span>
                            {count > 0 && (
                                <span style={{
                                    ...styles.badge,
                                    ...(isActive ? styles.badgeActive : {}),
                                }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        overflowX: 'auto' as const,
        WebkitOverflowScrolling: 'touch' as const,
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
        padding: '0 20px',
        marginBottom: '20px',
    },
    tabsWrapper: {
        display: 'flex',
        gap: '8px',
        minWidth: 'min-content',
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap' as const,
        outline: 'none',
    },
    tabActive: {
        background: 'var(--primary)',
        color: 'white',
        border: '1px solid var(--primary)',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
    },
    tabEmoji: {
        fontSize: '16px',
    },
    tabLabel: {
        fontSize: '13px',
        fontWeight: '700',
    },
    badge: {
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        fontSize: '11px',
        fontWeight: '800',
        padding: '2px 6px',
        borderRadius: '10px',
        minWidth: '20px',
        textAlign: 'center' as const,
    },
    badgeActive: {
        background: 'rgba(255,255,255,0.3)',
    },
};

export default OrderTabs;
