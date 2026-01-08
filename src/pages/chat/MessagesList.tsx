import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ShoppingBag, ArrowRight } from 'lucide-react';
import { chatService, Conversation } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { formatTimestamp } from '../../utils/timeFormat';
import { useSkeletonAnimation, SkeletonConversationList } from '../../components/common/SkeletonLoader';

const MessagesList = () => {
    useSkeletonAnimation(); // Ajoute l'animation CSS
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchConversations();
    }, [user]);

    const fetchConversations = async () => {
        setLoading(true);
        const { data, error } = await chatService.getConversations(user!.id);
        if (!error && data) {
            console.log('🔍 [ACHETEUR] Conversations reçues:', data);
            console.log('🔍 [ACHETEUR] User ID:', user!.id);
            data.forEach((conv, idx) => {
                console.log(`📋 Conversation ${idx + 1}:`, {
                    id: conv.id,
                    isBuyer: user!.id === conv.buyer_id,
                    last_message_for_buyer: conv.last_message_for_buyer,
                    last_message_for_seller: conv.last_message_for_seller,
                    last_sender_id: conv.last_sender_id,
                    product: conv.products?.name
                });
            });
            setConversations(data);
        }
        setLoading(false);
    };

    const handleOpenConversation = async (convId: string) => {
        // Marquer comme lu avant d'ouvrir
        await chatService.markAsRead(convId, user!.id);
        navigate(`/chat/${convId}`);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Messages 💬</h1>
                <p style={styles.subtitle}>
                    {profile?.role === 'affiliate' ? 'Suivez vos demandes de partenariats et échanges.' : 'Vos discussions de négociation.'}
                </p>
            </header>

            {loading ? (
                <SkeletonConversationList count={5} gap={12} />
            ) : conversations.length > 0 ? (
                <div style={styles.list}>
                    {conversations.map((conv) => {
                        const isBuyer = user?.id === conv.buyer_id;
                        const hasUnread = (conv.unread_count || 0) > 0;

                        // Déterminer le nom à afficher selon le rôle
                        const displayName = isBuyer
                            ? (conv.seller?.store_name || conv.seller?.full_name || 'Boutique')
                            : (conv.buyer?.full_name || 'Client');

                        // Déterminer l'avatar à afficher
                        const otherParty = isBuyer ? conv.seller : conv.buyer;
                        const avatarUrl = otherParty?.avatar_url;
                        const avatarInitial = displayName.charAt(0).toUpperCase();

                        // Récupérer aperçu selon le rôle
                        const messagePreview = isBuyer
                            ? conv.last_message_for_buyer
                            : conv.last_message_for_seller;

                        const mediaType = isBuyer
                            ? conv.last_media_type_for_buyer
                            : conv.last_media_type_for_seller;

                        const lastMessageTime = isBuyer
                            ? (conv.last_message_for_buyer_at || conv.last_message_at)
                            : (conv.last_message_for_seller_at || conv.last_message_at);

                        // Formater aperçu avec icône média si nécessaire
                        const getPreviewText = () => {
                            if (mediaType === 'image') return '📷 Photo';
                            if (mediaType === 'video') return '🎥 Vidéo';
                            if (messagePreview) return messagePreview;
                            return null;
                        };

                        const previewText = getPreviewText();

                        // DEBUG: Log pour chaque conversation
                        console.log(`💬 Rendu conversation ${conv.id}:`, {
                            isBuyer,
                            messagePreview,
                            mediaType,
                            previewText,
                            otherParty: otherParty?.full_name
                        });


                        return (
                            <div
                                key={conv.id}
                                style={styles.convItem}
                                className="premium-card"
                                onClick={() => handleOpenConversation(conv.id)}
                            >
                                {/* Badge en haut à droite de la card */}
                                {hasUnread && (
                                    <div style={styles.unreadBadgeTop}>
                                        {conv.unread_count! > 9 ? '9+' : conv.unread_count}
                                    </div>
                                )}

                                <div style={styles.avatar}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={displayName} style={styles.avatarImage} />
                                    ) : (
                                        avatarInitial
                                    )}
                                </div>

                                <div style={styles.convInfo}>
                                    <div style={styles.topRow}>
                                        <div style={styles.partyName}>
                                            {displayName}
                                        </div>
                                        {conv.last_message_at && (
                                            <div style={styles.timestamp}>
                                                {formatTimestamp(conv.last_message_at)}
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.productRef}>
                                        <ShoppingBag size={12} />
                                        <span>{conv.products?.name}</span>
                                    </div>

                                    {/* Afficher l'aperçu du dernier message selon le rôle */}
                                    {previewText && (
                                        <div style={{
                                            ...styles.lastMessage,
                                            fontWeight: hasUnread ? '700' : '400',
                                            color: hasUnread ? 'white' : 'var(--text-secondary)'
                                        }}>
                                            {previewText}
                                        </div>
                                    )}
                                </div>

                                <div style={styles.rightSection}>
                                    {hasUnread && <div style={styles.unreadDot} />}
                                    <ArrowRight size={18} color="var(--text-secondary)" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>
                        <MessageSquare size={40} color="var(--text-secondary)" />
                    </div>
                    <h3 style={styles.emptyTitle}>Aucune discussion</h3>
                    <p style={styles.emptySub}>
                        {profile?.role === 'affiliate'
                            ? "Vous n'avez pas encore de discussions. Les échanges apparaissent ici après avoir contacté un vendeur."
                            : 'Les discussions apparaissent ici après avoir cliqué sur "Négocier" sur un produit.'}
                    </p>
                    <button onClick={() => navigate(profile?.role === 'affiliate' ? '/affiliate' : '/')} style={styles.exploreBtn}>
                        {profile?.role === 'affiliate' ? 'Voir les missions' : 'Explorer le marché'}
                    </button>
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
    list: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    convItem: {
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        position: 'relative' as const,
    },
    unreadBadgeTop: {
        position: 'absolute' as const,
        top: 12,
        right: 12,
        background: '#FF4444',
        color: 'white',
        fontSize: '11px',
        fontWeight: '900',
        borderRadius: '12px',
        minWidth: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6px',
        border: '2px solid var(--background)',
        boxShadow: '0 2px 8px rgba(255, 68, 68, 0.4)',
        zIndex: 10,
    },
    avatar: {
        width: '48px',
        height: '48px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--primary)',
        border: '1px solid rgba(138, 43, 226, 0.2)',
        flexShrink: 0,
        overflow: 'hidden' as const,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    convInfo: {
        flex: 1,
        minWidth: 0,
    },
    topRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
        gap: '8px',
    },
    partyName: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    timestamp: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
        flexShrink: 0,
    },
    productRef: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px',
    },
    lastMessage: {
        fontSize: '13px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        lineHeight: '1.4',
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    unreadDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--primary)',
        flexShrink: 0,
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '16px',
    },
    emptyIcon: {
        width: '80px',
        height: '80px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
    },
    emptyTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
    },
    emptySub: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        maxWidth: '240px',
        lineHeight: '1.5',
    },
    exploreBtn: {
        marginTop: '20px',
        background: 'none',
        border: '1px solid var(--primary)',
        color: 'var(--primary)',
        padding: '10px 24px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '40px',
        color: 'var(--text-secondary)',
    }
};

export default MessagesList;
