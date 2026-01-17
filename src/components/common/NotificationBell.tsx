import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, Wallet, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { notificationService, Notification } from '../../services/notificationService';

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use React Query for persistence and caching
    const { data: initialNotifications = [] } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data } = await notificationService.getNotifications(user.id);
            return data || [];
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const { data: initialUnreadCount = 0 } = useQuery({
        queryKey: ['notifications-unread', user?.id],
        queryFn: async () => {
            if (!user?.id) return 0;
            const { count } = await notificationService.getUnreadCount(user.id);
            return count || 0;
        },
        enabled: !!user?.id,
        // Short stale time for unread count as it changes often
        staleTime: 1000 * 30,
    });

    // Local state to handle real-time updates on TOP of the cached data
    const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([]);
    const [realtimeUnreadOffset, setRealtimeUnreadOffset] = useState(0);

    // Combine cached + realtime
    // Note: In a real production app, we might just invalidating query on event, 
    // but for instant UI update, local state + cache is good.
    const notifications = React.useMemo(() => {
        return [...realtimeNotifications, ...initialNotifications].slice(0, 20);
    }, [realtimeNotifications, initialNotifications]);

    const unreadCount = initialUnreadCount + realtimeUnreadOffset;

    useEffect(() => {
        if (!user) return;

        // Subscribe to real-time
        const subscription = notificationService.subscribe(user.id, (newNotif) => {
            setRealtimeNotifications(prev => [newNotif, ...prev]);
            setRealtimeUnreadOffset(prev => prev + 1);
        });

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            subscription.unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            // Optional: Mark all as read when opening? 
            // Or let user click individual ones. For MVP, just open.
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.is_read) {
            await notificationService.markAsRead(notif.id);
            // Optimistic update
            setRealtimeUnreadOffset(prev => Math.max(-initialUnreadCount, prev - 1));
            setRealtimeNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            // Invalidate to be sure
            // queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }

        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const markAllRead = async () => {
        if (!user) return;
        await notificationService.markAllAsRead(user.id);

        // Reset realtime offset to negative of initial to make total 0
        setRealtimeUnreadOffset(-initialUnreadCount);
        // Mark all realtime as read
        setRealtimeNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        // Note: We should probably refetch here to sync up perfectly
    };

    if (!user) return null;

    return (
        <div style={styles.container}>
            <button onClick={handleToggle} style={styles.bellButton}>
                <Bell size={24} color={isOpen ? 'var(--primary)' : 'white'} />
                {unreadCount > 0 && (
                    <div style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</div>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown} ref={dropdownRef}>
                    <div style={styles.header}>
                        <h3 style={styles.title}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} style={styles.markReadBtn}>Tout marquer lu</button>
                        )}
                    </div>

                    <div style={styles.list}>
                        {notifications.length === 0 ? (
                            <div style={styles.empty}>Aucune notification</div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        ...styles.item,
                                        background: notif.is_read ? 'transparent' : 'rgba(138, 43, 226, 0.1)'
                                    }}
                                >
                                    <div style={styles.iconContainer}>
                                        {notif.type === 'order_status' && <Package size={16} color="var(--primary)" />}
                                        {notif.type === 'wallet' && <Wallet size={16} color="#00CC66" />}
                                        {notif.type === 'system' && <Info size={16} color="#FFD700" />}
                                    </div>
                                    <div style={styles.content}>
                                        <div style={styles.itemTitle}>{notif.title}</div>
                                        <div style={styles.itemMessage}>{notif.message}</div>
                                        <div style={styles.time}>
                                            {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {!notif.is_read && <div style={styles.unreadDot} />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: 'relative' as const,
    },
    bellButton: {
        background: 'none',
        border: 'none',
        padding: '8px',
        cursor: 'pointer',
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute' as const,
        top: '4px',
        right: '4px',
        background: '#FF3B30',
        color: 'white',
        fontSize: '10px',
        fontWeight: 'bold',
        minWidth: '16px',
        height: '16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        border: '2px solid #121212',
    },
    dropdown: {
        position: 'absolute' as const,
        top: '100%',
        right: 0,
        width: '320px',
        maxHeight: '400px',
        background: '#1a1a1a',
        borderRadius: '16px',
        marginTop: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column' as const,
    },
    header: {
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        margin: 0,
    },
    markReadBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--primary)',
        fontSize: '12px',
        cursor: 'pointer',
        padding: 0,
    },
    list: {
        overflowY: 'auto' as const,
        flex: 1,
    },
    item: {
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        position: 'relative' as const,
        ':hover': {
            background: 'rgba(255,255,255,0.03)'
        }
    } as any,
    iconContainer: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    content: {
        flex: 1,
    },
    itemTitle: {
        fontSize: '13px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '2px',
    },
    itemMessage: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
        marginBottom: '4px',
    },
    time: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.3)',
    },
    unreadDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--primary)',
        position: 'absolute' as const,
        top: '16px',
        right: '12px',
    },
    empty: {
        padding: '40px 20px',
        textAlign: 'center' as const,
        color: 'rgba(255,255,255,0.3)',
        fontSize: '14px',
    },
};

export default NotificationBell;
