import React from 'react';
import './SkeletonLoader.css';

// ========== COMPOSANT DE BASE ==========

interface SkeletonBarProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    margin?: string;
    style?: React.CSSProperties;
    className?: string; // Ajout de className pour plus de flexibilité
}

export const SkeletonBar: React.FC<SkeletonBarProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '12px',
    margin,
    style = {},
    className = ''
}) => {
    return (
        <div
            className={`skeleton-bar ${className}`}
            style={{
                borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                margin,
                ...style
            }}
        >
            <div className="skeleton-shimmer"></div>
        </div>
    );
};

// ========== COMPOSANTS SPÉCIALISÉS ==========

// Avatar circulaire
interface SkeletonAvatarProps {
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 40, style, className }) => {
    return <SkeletonBar width={size} height={size} borderRadius="50%" style={style} className={className} />;
};

// Texte (plusieurs lignes)
interface SkeletonTextProps {
    lines?: number;
    gap?: number;
    lastLineWidth?: string;
    style?: React.CSSProperties;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 3,
    gap = 8,
    lastLineWidth = '70%',
    style
}) => {
    return (
        <div className="skeleton-text-container" style={{ gap: `${gap}px`, ...style }}>
            {[...Array(lines)].map((_, i) => (
                <SkeletonBar
                    key={i}
                    height={14}
                    width={i === lines - 1 ? lastLineWidth : '100%'}
                />
            ))}
        </div>
    );
};

// Carte Produit
export const SkeletonProductCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-product-card" style={style}>
            <SkeletonBar height={160} borderRadius={0} />
            <div className="skeleton-product-card-content">
                <SkeletonBar width="80%" height={16} margin="0 0 8px 0" />
                <SkeletonBar width="50%" height={20} />
            </div>
        </div>
    );
};

// Review/Commentaire
export const SkeletonReview: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-review" style={style}>
            <SkeletonAvatar size={40} />
            <div className="skeleton-review-content">
                <SkeletonBar width="60%" height={16} margin="0 0 8px 0" />
                <SkeletonBar width="100%" height={40} />
            </div>
        </div>
    );
};

// Grille de Produits
interface SkeletonProductGridProps {
    count?: number;
    columns?: number;
    gap?: number;
}

export const SkeletonProductGrid: React.FC<SkeletonProductGridProps> = ({
    count = 6,
    columns = 2,
    gap = 16
}) => {
    return (
        <div
            className="skeleton-product-grid"
            style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`
            }}
        >
            {[...Array(count)].map((_, i) => (
                <SkeletonProductCard key={i} />
            ))}
        </div>
    );
};

// Carte Commande
export const SkeletonOrderCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-order-card" style={style}>
            <div className="skeleton-order-header">
                <SkeletonBar width={60} height={60} borderRadius={12} />
                <div className="skeleton-order-info">
                    <SkeletonBar width="70%" height={16} margin="0 0 8px 0" />
                    <SkeletonBar width="50%" height={14} />
                </div>
            </div>
            <div className="skeleton-order-footer">
                <SkeletonBar width={80} height={24} />
                <SkeletonBar width={100} height={32} borderRadius={8} />
            </div>
        </div>
    );
};

// ========== COMPOSANTS CHAT ==========

// Item de Conversation (pour MessagesList)
export const SkeletonConversationItem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-conversation-item" style={style}>
            {/* Avatar */}
            <SkeletonAvatar size={48} />

            {/* Contenu */}
            <div className="skeleton-conversation-content">
                {/* Ligne 1: Nom + Timestamp */}
                <div className="skeleton-conversation-header">
                    <SkeletonBar width="50%" height={16} />
                    <SkeletonBar width={40} height={11} />
                </div>

                {/* Ligne 2: Produit */}
                <SkeletonBar width="60%" height={12} margin="0 0 4px 0" />

                {/* Ligne 3: Dernier message */}
                <SkeletonBar width="80%" height={13} />
            </div>

            {/* Flèche */}
            <SkeletonBar width={18} height={18} borderRadius="4px" />
        </div>
    );
};

// Liste de Conversations
interface SkeletonConversationListProps {
    count?: number;
    gap?: number;
}

export const SkeletonConversationList: React.FC<SkeletonConversationListProps> = ({
    count = 5,
    gap = 12
}) => {
    return (
        <div className="skeleton-conversation-list" style={{ gap: `${gap}px` }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonConversationItem key={i} />
            ))}
        </div>
    );
};

// ========== COMPOSANTS TRANSACTIONS ==========

// Item de Transaction (pour TransactionHistory)
export const SkeletonTransactionItem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-transaction-item" style={style}>
            {/* Header: Type + Date | Montant */}
            <div className="skeleton-transaction-header">
                {/* Left: Type + Date */}
                <div className="skeleton-transaction-type">
                    <SkeletonBar width={24} height={24} borderRadius="50%" />
                    <div>
                        <SkeletonBar width={100} height={16} margin="0 0 4px 0" />
                        <SkeletonBar width={140} height={12} />
                    </div>
                </div>

                {/* Right: Montant */}
                <SkeletonBar width={90} height={24} />
            </div>

            {/* Description */}
            <SkeletonBar width="85%" height={14} margin="0 0 8px 0" />

            {/* Product Image (optionnel) */}
            <div className="skeleton-transaction-product">
                <SkeletonBar width={48} height={48} borderRadius={8} />
                <SkeletonBar width="50%" height={12} />
            </div>

            {/* Footer: Solde + Bouton */}
            <div className="skeleton-transaction-footer">
                <SkeletonBar width={120} height={12} />
                <SkeletonBar width={100} height={32} borderRadius={8} />
            </div>
        </div>
    );
};

// Liste de Transactions
interface SkeletonTransactionListProps {
    count?: number;
    gap?: number;
}

export const SkeletonTransactionList: React.FC<SkeletonTransactionListProps> = ({
    count = 4,
    gap = 16
}) => {
    return (
        <div className="skeleton-transaction-list" style={{ gap: `${gap}px` }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonTransactionItem key={i} />
            ))}
        </div>
    );
};

// Message de Chat (pour ChatRoom)
interface SkeletonChatMessageProps {
    isOwn?: boolean;
    style?: React.CSSProperties;
}

export const SkeletonChatMessage: React.FC<SkeletonChatMessageProps> = ({ isOwn = false, style }) => {
    return (
        <div className={`skeleton-chat-message ${isOwn ? 'skeleton-chat-message-own' : 'skeleton-chat-message-other'}`} style={style}>
            <div className="skeleton-chat-message-bubble">
                <SkeletonBar width="200px" height={14} margin="0 0 4px 0" />
                <SkeletonBar width="120px" height={9} />
            </div>
        </div>
    );
};

// Liste de Messages de Chat
interface SkeletonChatMessagesProps {
    count?: number;
    gap?: number;
}

export const SkeletonChatMessages: React.FC<SkeletonChatMessagesProps> = ({
    count = 8,
    gap = 12
}) => {
    return (
        <div className="skeleton-chat-messages" style={{ gap: `${gap}px` }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonChatMessage key={i} isOwn={i % 3 === 0} />
            ))}
        </div>
    );
};

// Header de Chat (pour ChatRoom)
export const SkeletonChatHeader: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-chat-header" style={style}>
            <div className="skeleton-chat-header-info">
                {/* Bouton retour */}
                <SkeletonBar width={24} height={24} borderRadius="4px" />

                {/* Avatar */}
                <SkeletonAvatar size={40} />

                {/* Info */}
                <div>
                    <SkeletonBar width={120} height={15} margin="0 0 4px 0" />
                    <SkeletonBar width={80} height={10} />
                </div>
            </div>

            {/* Bouton action (optionnel) */}
            <SkeletonBar width={80} height={32} borderRadius="12px" />
        </div>
    );
};

// ========== COMPOSANTS AFFILIATION ==========

// Stats Cards pour Affiliate Dashboard
export const SkeletonAffiliateStats: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-affiliate-stats" style={style}>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-affiliate-stat-card">
                    <SkeletonBar width={20} height={20} borderRadius="50%" margin="0 0 8px 0" />
                    <SkeletonBar width="80%" height={18} margin="0 0 8px 0" />
                    <SkeletonBar width="40%" height={10} />
                </div>
            ))}
        </div>
    );
};

// Mission Item (Produit affilié)
export const SkeletonMissionItem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-list-item" style={style}>
            {/* Product Image */}
            <SkeletonBar width={60} height={60} borderRadius={12} />

            {/* Product Info */}
            <div className="skeleton-list-item-content">
                <SkeletonBar width="70%" height={15} margin="0 0 4px 0" />
                <SkeletonBar width="40%" height={13} margin="0 0 4px 0" />
                <SkeletonBar width="50%" height={12} />
            </div>

            {/* Copy Button */}
            <SkeletonBar width={36} height={36} borderRadius={10} />
        </div>
    );
};

// Liste de Missions
interface SkeletonMissionListProps {
    count?: number;
    gap?: number;
}

export const SkeletonMissionList: React.FC<SkeletonMissionListProps> = ({
    count = 5,
    gap = 12
}) => {
    return (
        <div className="skeleton-list" style={{ gap: `${gap}px` }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonMissionItem key={i} />
            ))}
        </div>
    );
};

// Affiliate Link Item (avec actions pause/archive)
export const SkeletonAffiliateLinkItem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div className="skeleton-list-item" style={style}>
            {/* Product Image */}
            <SkeletonBar width={60} height={60} borderRadius={12} />

            {/* Product Info */}
            <div className="skeleton-list-item-content">
                <SkeletonBar width="70%" height={15} margin="0 0 4px 0" />
                <SkeletonBar width="40%" height={13} margin="0 0 4px 0" />
                <SkeletonBar width="50%" height={12} />
            </div>

            {/* Action Buttons */}
            <div className="skeleton-list-item-actions">
                <SkeletonBar width={36} height={36} borderRadius={10} />
                <SkeletonBar width={36} height={36} borderRadius={10} />
            </div>
        </div>
    );
};

// ========== COMPOSANTS PROFIL ==========

// Skeleton pour la page de profil
export const SkeletonProfile: React.FC<{ showWallet?: boolean; style?: React.CSSProperties }> = ({
    showWallet = true,
    style
}) => {
    return (
        <div className="skeleton-profile-container" style={style}>
            {/* Header */}
            <div className="skeleton-profile-header">
                {/* Avatar */}
                <SkeletonAvatar size={80} style={{ marginBottom: '16px' }} />

                {/* Nom */}
                <SkeletonBar width={150} height={24} margin="0 0 8px 0" />

                {/* Badge de rôle */}
                <SkeletonBar width={100} height={24} borderRadius="12px" />
            </div>

            {/* Wallet (conditionnel) */}
            {showWallet && (
                <div className="skeleton-profile-wallet-section">
                    <div className="skeleton-profile-wallet-card">
                        <div>
                            <SkeletonBar width={80} height={12} margin="0 0 8px 0" />
                            <SkeletonBar width={120} height={24} />
                        </div>
                        <SkeletonBar width={70} height={32} borderRadius="10px" />
                    </div>
                </div>
            )}

            {/* Menu items */}
            <div className="skeleton-profile-menu">
                <div className="skeleton-profile-menu-item">
                    <SkeletonBar width={40} height={40} borderRadius="12px" />
                    <SkeletonBar width="60%" height={15} />
                    <SkeletonBar width={18} height={18} borderRadius="4px" style={{ marginLeft: 'auto' }} />
                </div>

                {showWallet && (
                    <div className="skeleton-profile-menu-item">
                        <SkeletonBar width={40} height={40} borderRadius="12px" />
                        <SkeletonBar width="60%" height={15} />
                        <SkeletonBar width={18} height={18} borderRadius="4px" style={{ marginLeft: 'auto' }} />
                    </div>
                )}

                {/* Déconnexion */}
                <div className="skeleton-profile-logout">
                    <SkeletonBar width={40} height={40} borderRadius="12px" />
                    <SkeletonBar width="50%" height={15} />
                </div>
            </div>
        </div>
    );
};
