import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, Wallet, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notificationService, Notification } from '../../services/notificationService';

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch initial notifications
        const init = async () => {
            const { data } = await notificationService.getNotifications(user.id);
            if (data) setNotifications(data);

            const { count } = await notificationService.getUnreadCount(user.id);
            if (count !== undefined) setUnreadCount(count);
        };
        init();

        // Subscribe to real-time
        const subscription = notificationService.subscribe(user.id, (newNotif) => {
            setNotifications(prev => [newNotif, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);

            // Play a subtle sound if possible (optional)
            // if (Notification.permission === 'granted') { new window.Notification("Zwa Market", { body: newNotif.message }); }
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
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        }

        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const markAllRead = async () => {
        if (!user) return;
        await notificationService.markAllAsRead(user.id);
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
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
