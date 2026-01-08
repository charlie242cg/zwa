import { useEffect } from 'react';

// Hook pour ajouter l'animation CSS (à appeler une seule fois par page)
export const useSkeletonAnimation = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'skeleton-animation';

        // Ne pas ajouter si déjà présent
        if (document.getElementById('skeleton-animation')) return;

        style.innerHTML = `
            @keyframes skeletonPulse {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);

        // On ne supprime pas le style au démontage car plusieurs squelettes
        // peuvent l'utiliser en même temps.
    }, []);
};

// ========== COMPOSANT DE BASE ==========

interface SkeletonBarProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    margin?: string;
    style?: React.CSSProperties;
}

export const SkeletonBar: React.FC<SkeletonBarProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '12px',
    margin,
    style = {}
}) => {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
            position: 'relative',
            overflow: 'hidden',
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            margin,
            ...style
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeletonPulse 1.5s ease-in-out infinite',
            }}></div>
        </div>
    );
};

// ========== COMPOSANTS SPÉCIALISÉS ==========

// Avatar circulaire
interface SkeletonAvatarProps {
    size?: number;
    style?: React.CSSProperties;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 40, style }) => {
    return <SkeletonBar width={size} height={size} borderRadius="50%" style={style} />;
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, ...style }}>
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
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            ...style
        }}>
            <SkeletonBar height={160} borderRadius={0} />
            <div style={{ padding: '12px' }}>
                <SkeletonBar width="80%" height={16} margin="0 0 8px 0" />
                <SkeletonBar width="50%" height={20} />
            </div>
        </div>
    );
};

// Review/Commentaire
export const SkeletonReview: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            ...style
        }}>
            <SkeletonAvatar size={40} />
            <div style={{ flex: 1 }}>
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
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`
        }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonProductCard key={i} />
            ))}
        </div>
    );
};

// Carte Commande
export const SkeletonOrderCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            ...style
        }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <SkeletonBar width={60} height={60} borderRadius={12} />
                <div style={{ flex: 1 }}>
                    <SkeletonBar width="70%" height={16} margin="0 0 8px 0" />
                    <SkeletonBar width="50%" height={14} />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
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
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            ...style
        }}>
            {/* Avatar */}
            <SkeletonAvatar size={48} />

            {/* Contenu */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Ligne 1: Nom + Timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
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
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            ...style
        }}>
            {/* Header: Type + Date | Montant */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                {/* Left: Type + Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <SkeletonBar width={48} height={48} borderRadius={8} />
                <SkeletonBar width="50%" height={12} />
            </div>

            {/* Footer: Solde + Bouton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, padding: '0 20px' }}>
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
        <div style={{
            display: 'flex',
            width: '100%',
            justifyContent: isOwn ? 'flex-end' : 'flex-start',
            ...style
        }}>
            <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: '16px',
                background: isOwn ? 'rgba(138, 43, 226, 0.2)' : 'rgba(255,255,255,0.05)',
                borderBottomRightRadius: isOwn ? '4px' : '16px',
                borderBottomLeftRadius: isOwn ? '16px' : '4px',
            }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, padding: '16px' }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonChatMessage key={i} isOwn={i % 3 === 0} />
            ))}
        </div>
    );
};

// Header de Chat (pour ChatRoom)
export const SkeletonChatHeader: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div style={{
            padding: '12px 16px',
            background: 'rgba(18, 18, 18, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            ...style
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '24px',
            ...style
        }}>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '20px',
                }}>
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
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            ...style
        }}>
            {/* Product Image */}
            <SkeletonBar width={60} height={60} borderRadius={12} />

            {/* Product Info */}
            <div style={{ flex: 1 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
            {[...Array(count)].map((_, i) => (
                <SkeletonMissionItem key={i} />
            ))}
        </div>
    );
};

// Affiliate Link Item (avec actions pause/archive)
export const SkeletonAffiliateLinkItem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            ...style
        }}>
            {/* Product Image */}
            <SkeletonBar width={60} height={60} borderRadius={12} />

            {/* Product Info */}
            <div style={{ flex: 1 }}>
                <SkeletonBar width="70%" height={15} margin="0 0 4px 0" />
                <SkeletonBar width="40%" height={13} margin="0 0 4px 0" />
                <SkeletonBar width="50%" height={12} />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
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
        <div style={{
            padding: '40px 20px',
            maxWidth: '500px',
            margin: '0 auto',
            minHeight: '100vh',
            ...style
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                marginBottom: '40px',
            }}>
                {/* Avatar */}
                <SkeletonAvatar size={80} style={{ marginBottom: '16px' }} />

                {/* Nom */}
                <SkeletonBar width={150} height={24} margin="0 0 8px 0" />

                {/* Badge de rôle */}
                <SkeletonBar width={100} height={24} borderRadius="12px" />
            </div>

            {/* Wallet (conditionnel) */}
            {showWallet && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div>
                            <SkeletonBar width={80} height={12} margin="0 0 8px 0" />
                            <SkeletonBar width={120} height={24} />
                        </div>
                        <SkeletonBar width={70} height={32} borderRadius="10px" />
                    </div>
                </div>
            )}

            {/* Menu items */}
            <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '12px',
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                }}>
                    <SkeletonBar width={40} height={40} borderRadius="12px" />
                    <SkeletonBar width="60%" height={15} />
                    <SkeletonBar width={18} height={18} borderRadius="4px" style={{ marginLeft: 'auto' }} />
                </div>

                {showWallet && (
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                    }}>
                        <SkeletonBar width={40} height={40} borderRadius="12px" />
                        <SkeletonBar width="60%" height={15} />
                        <SkeletonBar width={18} height={18} borderRadius="4px" style={{ marginLeft: 'auto' }} />
                    </div>
                )}

                {/* Déconnexion */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginTop: '8px',
                }}>
                    <SkeletonBar width={40} height={40} borderRadius="12px" />
                    <SkeletonBar width="50%" height={15} />
                </div>
            </div>
        </div>
    );
};
