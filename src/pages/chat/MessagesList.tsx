import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ShoppingBag, ArrowRight } from 'lucide-react';
import { chatService, Conversation } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { useConversations } from '../../hooks/useConversations';
import { formatTimestamp } from '../../utils/timeFormat';
import { useSkeletonAnimation, SkeletonConversationList } from '../../components/common/SkeletonLoader';

const MessagesList = () => {
    useSkeletonAnimation(); // Ajoute l'animation CSS
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const { data: conversations = [], isLoading: loading } = useConversations(user?.id);

    const handleOpenConversation = (convId: string) => {
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
                    {conversations.map((conv: Conversation) => {
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
        padding: '32px 20px 100px',
        maxWidth: '700px',
        margin: '0 auto',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '40px',
        textAlign: 'center' as const,
    },
    title: {
        fontSize: '32px',
        fontWeight: '900',
        color: 'white',
        marginBottom: '10px',
        letterSpacing: '-1px',
    },
    subtitle: {
        fontSize: '15px',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },
    list: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    convItem: {
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
        position: 'relative' as const,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
    },
    unreadBadgeTop: {
        position: 'absolute' as const,
        top: 14,
        right: 14,
        background: 'linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%)',
        color: 'white',
        fontSize: '10px',
        fontWeight: '900',
        borderRadius: '10px',
        minWidth: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        border: '2px solid #121212',
        boxShadow: '0 4px 12px rgba(255, 65, 108, 0.4)',
        zIndex: 10,
    },
    avatar: {
        width: '56px',
        height: '56px',
        background: 'linear-gradient(135deg, rgba(138,43,226,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        fontWeight: '800',
        color: 'var(--primary)',
        border: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
        overflow: 'hidden' as const,
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
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
        marginBottom: '6px',
        gap: '8px',
    },
    partyName: {
        fontSize: '17px',
        fontWeight: '800',
        color: 'white',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        letterSpacing: '-0.3px',
    },
    timestamp: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '600',
        flexShrink: 0,
    },
    productRef: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.05)',
        padding: '2px 8px',
        borderRadius: '6px',
        marginBottom: '8px',
        fontWeight: '700',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    lastMessage: {
        fontSize: '14px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        lineHeight: '1.4',
        color: 'rgba(255,255,255,0.6)',
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    unreadDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'var(--primary)',
        flexShrink: 0,
        boxShadow: '0 0 12px var(--primary)',
    },
    emptyState: {
        padding: '80px 20px',
        textAlign: 'center' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '20px',
    },
    emptyIcon: {
        width: '100px',
        height: '100px',
        background: 'rgba(138,43,226,0.05)',
        borderRadius: '35%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
        transform: 'rotate(-10deg)',
    },
    emptyTitle: {
        fontSize: '22px',
        fontWeight: '900',
        color: 'white',
    },
    emptySub: {
        fontSize: '15px',
        color: 'rgba(255,255,255,0.4)',
        maxWidth: '280px',
        lineHeight: '1.6',
    },
    exploreBtn: {
        marginTop: '24px',
        background: 'var(--primary)',
        border: 'none',
        color: 'white',
        padding: '14px 32px',
        borderRadius: '16px',
        fontSize: '15px',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 10px 20px rgba(138, 43, 226, 0.3)',
        transition: 'transform 0.2s',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '40px',
        color: 'var(--text-secondary)',
    }
};

export default MessagesList;
