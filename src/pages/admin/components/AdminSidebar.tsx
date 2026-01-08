import React from 'react';
import {
    LayoutDashboard,
    Tags,
    MapPin,
    Wallet,
    Package,
    AlertCircle,
    Settings,
    ChevronRight,
    LucideIcon
} from 'lucide-react';

interface SidebarItemProps {
    id: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
    onClick: (id: any) => void;
}

const SidebarItem = ({ id, label, icon: Icon, active, onClick }: SidebarItemProps) => (
    <button
        onClick={() => onClick(id)}
        style={{
            ...styles.menuItem,
            backgroundColor: active ? 'rgba(138, 43, 226, 0.1)' : 'transparent',
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            borderLeft: active ? '4px solid var(--primary)' : '4px solid transparent',
        }}
    >
        <Icon size={20} />
        <span style={styles.menuLabel}>{label}</span>
        {active && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
    </button>
);

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
    const menuItems = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'categories', label: 'Catégories', icon: Tags },
        { id: 'cities', label: 'Villes & Zones', icon: MapPin },
        { id: 'withdrawals', label: 'Retraits d\'argent', icon: Wallet },
        { id: 'settings', label: 'Paramètres', icon: Settings },
        { id: 'moderation', label: 'Modération', icon: Package },
        { id: 'disputes', label: 'Litiges', icon: AlertCircle },
    ];

    return (
        <aside style={styles.sidebar}>
            <div style={styles.logoContainer}>
                <div style={styles.logo}>ZWA ADMIN</div>
            </div>

            <nav style={styles.nav}>
                <div style={styles.sectionLabel}>PLATFORME</div>
                {menuItems.slice(0, 3).map(item => (
                    <SidebarItem
                        key={item.id}
                        {...item}
                        active={activeTab === item.id}
                        onClick={setActiveTab}
                    />
                ))}

                <div style={styles.sectionLabel}>FINANCES & OPS</div>
                {menuItems.slice(3, 5).map(item => (
                    <SidebarItem
                        key={item.id}
                        {...item}
                        active={activeTab === item.id}
                        onClick={setActiveTab}
                    />
                ))}

                <div style={styles.sectionLabel}>MODÉRATION</div>
                {menuItems.slice(5).map(item => (
                    <SidebarItem
                        key={item.id}
                        {...item}
                        active={activeTab === item.id}
                        onClick={setActiveTab}
                    />
                ))}
            </nav>
        </aside>
    );
};

const styles = {
    sidebar: {
        width: '260px',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100vh',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
    },
    logoContainer: {
        padding: '30px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    logo: {
        fontSize: '20px',
        fontWeight: '900',
        background: 'linear-gradient(to right, #8A2BE2, #C71585)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '1px',
    },
    nav: {
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    sectionLabel: {
        fontSize: '11px',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.3)',
        padding: '16px 16px 8px 16px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
    },
    menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left' as const,
        transition: 'var(--transition-smooth)',
        fontSize: '14px',
        fontWeight: '600',
    },
    menuLabel: {
        flex: 1,
    }
};

export default AdminSidebar;
