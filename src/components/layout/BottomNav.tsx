import { Home, ShoppingBag, User, Briefcase, MessageSquare, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { useQuery } from '@tanstack/react-query';
import '../../styles/variables.css';

const BottomNav = () => {
    const { profile, user } = useAuth();
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['unread-messages-count', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0;
            return chatService.getUnreadCount(user.id);
        },
        enabled: !!user?.id,
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 30000,
    });

    // Visitor navigation - show simplified nav for non-authenticated users
    if (!user) {
        return (
            <nav style={styles.nav}>
                <NavLink to="/" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <Home size={24} />
                    <span style={styles.label}>Accueil</span>
                </NavLink>
                <NavLink to="/auth" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <User size={24} />
                    <span style={styles.label}>Se connecter</span>
                </NavLink>
            </nav>
        );
    }

    // Show navigation immediately, default to buyer if profile not loaded yet
    // This prevents the nav from disappearing during profile fetch
    const role = profile?.role || 'buyer';


    if (role === 'seller') {
        return (
            <nav style={styles.nav}>
                <NavLink to="/seller/dashboard" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <Briefcase size={24} />
                    <span style={styles.label}>Business</span>
                </NavLink>
                <NavLink to="/messages" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <div style={{ position: 'relative' }}>
                        <MessageSquare size={24} />
                        {unreadCount > 0 && (
                            <div style={styles.notificationBadge}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </div>
                    <span style={styles.label}>Messages</span>
                </NavLink>
                <NavLink to="/" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <Home size={24} />
                    <span style={styles.label}>Marché</span>
                </NavLink>
                <NavLink to="/orders" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <ShoppingBag size={24} />
                    <span style={styles.label}>Ventes</span>
                </NavLink>
                <NavLink to="/profile" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <User size={24} />
                    <span style={styles.label}>Profil</span>
                </NavLink>
            </nav>
        );
    }

    if (role === 'affiliate') {
        return (
            <nav style={styles.nav}>
                <NavLink to="/" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <Home size={24} />
                    <span style={styles.label}>Marché</span>
                </NavLink>
                <NavLink to="/affiliate" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <TrendingUp size={24} />
                    <span style={styles.label}>Affiliation</span>
                </NavLink>
                <NavLink to="/messages" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <div style={{ position: 'relative' }}>
                        <MessageSquare size={24} />
                        {unreadCount > 0 && (
                            <div style={styles.notificationBadge}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </div>
                    <span style={styles.label}>Messages</span>
                </NavLink>
                <NavLink to="/profile" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                    <User size={24} />
                    <span style={styles.label}>Profil</span>
                </NavLink>
            </nav>
        );
    }

    return (
        <nav style={styles.nav}>
            <NavLink to="/" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                <Home size={24} />
                <span style={styles.label}>Accueil</span>
            </NavLink>
            <NavLink to="/messages" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                <div style={{ position: 'relative' }}>
                    <MessageSquare size={24} />
                    {unreadCount > 0 && (
                        <div style={styles.notificationBadge}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </div>
                <span style={styles.label}>Messages</span>
            </NavLink>
            <NavLink to="/orders" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                <ShoppingBag size={24} />
                <span style={styles.label}>Achats</span>
            </NavLink>
            <NavLink to="/profile" style={({ isActive }) => ({ ...styles.link, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' })}>
                <User size={24} />
                <span style={styles.label}>Profil</span>
            </NavLink>
        </nav>
    );
};

const styles = {
    nav: {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 1000,
    },
    link: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        textDecoration: 'none',
        transition: 'var(--transition-smooth)',
    },
    label: {
        fontSize: '10px',
        marginTop: '4px',
        fontWeight: 500,
    },
    notificationBadge: {
        position: 'absolute' as const,
        top: -8,
        right: -10,
        background: '#FF4444',
        color: 'white',
        fontSize: '11px',
        fontWeight: '900',
        borderRadius: '12px',
        minWidth: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        border: '2px solid rgba(18, 18, 18, 0.95)',
        boxShadow: '0 2px 8px rgba(255, 68, 68, 0.5)',
    }
};

export default BottomNav;
