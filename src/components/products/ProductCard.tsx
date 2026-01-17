import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ProductCardProps {
    image: string;
    name: string;
    price: string;
    originalPrice?: string; // For promotion detection
    seller: string;
    isVerified: boolean;
    moq: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ image, name, price, originalPrice, seller, isVerified, moq }) => {
    const [imgError, setImgError] = useState(false);

    // Calculate discount percentage
    const discountPercent = originalPrice && parseFloat(originalPrice) > parseFloat(price)
        ? Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)
        : 0;

    // Optimized image URL for low data (Supabase transformation)
    const optimizedImage = image.includes('supabase.co/storage')
        ? `${image}?width=400&quality=70`
        : image;

    return (
        <div className="premium-card" style={styles.card}>
            <div style={styles.imageContainer}>
                <img
                    src={imgError ? 'https://via.placeholder.com/400x400?text=Produit' : optimizedImage}
                    alt={name}
                    style={styles.image}
                    loading="lazy"
                    onError={() => setImgError(true)}
                />
                {discountPercent > 0 && (
                    <div style={styles.promoBadge}>
                        🔥 -{discountPercent}%
                    </div>
                )}
                {isVerified && (
                    <div style={styles.badge}>
                        <ShieldCheck size={14} color="#00CC66" />
                        <span>Vérifié</span>
                    </div>
                )}
            </div>
            <div style={styles.info}>
                <h3 style={styles.name}>{name}</h3>
                <p style={styles.seller}>{seller}</p>
                <div style={styles.footer}>
                    <div style={styles.priceContainer}>
                        {originalPrice && parseFloat(originalPrice) > parseFloat(price) && (
                            <span style={styles.originalPrice}>{originalPrice}</span>
                        )}
                        <span style={styles.price}>{price}</span>
                        <span style={styles.currency}>FCFA</span>
                    </div>
                    <span style={styles.moq}>Min. {moq}</span>
                </div>
            </div>
        </div>
    );
};

const styles = {
    card: {
        padding: '0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'var(--transition-smooth)',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: '1/1',
        position: 'relative' as const,
        background: '#1a1a1a',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        transition: 'transform 0.5s ease',
    },
    promoBadge: {
        position: 'absolute' as const,
        top: '8px',
        right: '8px',
        background: 'rgba(255, 59, 48, 0.9)',
        // backdropFilter removed - causes crashes,
        padding: '5px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        color: 'white',
        fontWeight: '800',
        border: '1px solid rgba(255, 59, 48, 0.5)',
        boxShadow: '0 2px 8px rgba(255, 59, 48, 0.4)',
    },
    badge: {
        position: 'absolute' as const,
        top: '8px',
        left: '8px',
        background: 'rgba(18, 18, 18, 0.7)',
        // backdropFilter removed - causes crashes,
        padding: '4px 8px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        color: '#00CC66',
        fontWeight: '700',
        border: '1px solid rgba(0, 204, 102, 0.3)',
    },
    info: {
        padding: '12px',
        display: 'flex',
        flexDirection: 'column' as const,
        flex: 1,
    },
    name: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '4px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
        height: '34px',
        lineHeight: '1.2',
    },
    seller: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginBottom: 'auto',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '8px',
    },
    priceContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px',
        flexWrap: 'wrap' as const,
    },
    originalPrice: {
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        textDecoration: 'line-through',
        opacity: 0.6,
    },
    price: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'var(--primary)',
    },
    currency: {
        fontSize: '10px',
        fontWeight: '700',
        color: 'var(--primary)',
        opacity: 0.8,
    },
    moq: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
    }
};

export default ProductCard;
