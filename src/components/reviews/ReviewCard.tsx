import { Check } from 'lucide-react';
import StarRating from './StarRating';
import { Review } from '../../services/reviewService';

interface ReviewCardProps {
    review: Review;
    type?: 'product' | 'seller'; // Type d'avis à afficher
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, type = 'product' }) => {
    const buyerInitial = review.buyer?.full_name?.charAt(0)?.toUpperCase() || 'A';
    const buyerName = review.buyer?.full_name || 'Acheteur';
    const formattedDate = new Date(review.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // Choix du rating et commentaire selon le type
    const rating = type === 'seller' ? review.seller_rating : review.product_rating;
    const comment = type === 'seller' ? review.seller_comment : review.product_comment;
    const hasReview = rating && rating > 0;

    // Les images sont affichées uniquement pour les avis produit
    const showImages = type === 'product' && review.review_images && review.review_images.length > 0;

    return (
        <div style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.avatar}>{buyerInitial}</div>
                <div style={styles.userInfo}>
                    <div style={styles.userName}>{buyerName}</div>
                    <div style={styles.date}>{formattedDate}</div>
                </div>
                <div style={styles.verifiedBadge}>
                    <Check size={12} />
                    <span>Achat vérifié</span>
                </div>
            </div>

            {/* Rating & Comment */}
            {hasReview && (
                <div style={styles.reviewSection}>
                    <StarRating value={rating || 0} readonly size={16} />
                    {comment && (
                        <p style={styles.comment}>{comment}</p>
                    )}
                </div>
            )}

            {/* Review Images (product only) */}
            {showImages && (
                <div style={styles.imagesGrid}>
                    {review.review_images!.map((img, index) => (
                        <img
                            key={index}
                            src={img}
                            alt={`Photo ${index + 1}`}
                            style={styles.reviewImage}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    card: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '2px',
    },
    date: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
    },
    verifiedBadge: {
        background: 'rgba(0, 204, 102, 0.1)',
        border: '1px solid rgba(0, 204, 102, 0.2)',
        color: '#00CC66',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '10px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    reviewSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    comment: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
        margin: 0,
    },
    imagesGrid: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap' as const,
    },
    reviewImage: {
        width: '80px',
        height: '80px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.1)',
    },
};

export default ReviewCard;
