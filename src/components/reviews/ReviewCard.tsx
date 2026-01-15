import { useState } from 'react';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StarRating from './StarRating';
import { Review } from '../../services/reviewService';

interface ReviewCardProps {
    review: Review;
    type?: 'product' | 'seller'; // Type d'avis à afficher
}

// Image Lightbox Modal Component
const ImageLightbox: React.FC<{
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}> = ({ images, currentIndex, onClose, onPrev, onNext }) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > 50 && currentIndex < images.length - 1) onNext();
        if (distance < -50 && currentIndex > 0) onPrev();
    };

    return (
        <div style={lightboxStyles.overlay} onClick={onClose}>
            <button style={lightboxStyles.closeButton} onClick={onClose}>
                <X size={24} />
            </button>

            {/* Navigation buttons outside image container */}
            {currentIndex > 0 && (
                <button
                    style={{ ...lightboxStyles.navButton, left: '16px' }}
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                >
                    <ChevronLeft size={28} />
                </button>
            )}

            {currentIndex < images.length - 1 && (
                <button
                    style={{ ...lightboxStyles.navButton, right: '16px' }}
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                >
                    <ChevronRight size={28} />
                </button>
            )}

            <div
                style={lightboxStyles.imageContainer}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={images[currentIndex]}
                    alt={`Photo ${currentIndex + 1}`}
                    style={lightboxStyles.image}
                    draggable={false}
                />
            </div>

            {images.length > 1 && (
                <div style={lightboxStyles.counter}>
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};

const lightboxStyles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute' as const,
        top: '16px',
        right: '16px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        zIndex: 10,
    },
    imageContainer: {
        position: 'relative' as const,
        maxWidth: '70vw',
        maxHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '80vh',
        objectFit: 'contain' as const,
        borderRadius: '8px',
    },
    navButton: {
        position: 'fixed' as const,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        border: 'none',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        zIndex: 10000,
    },
    counter: {
        position: 'absolute' as const,
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
    },
};

const ReviewCard: React.FC<ReviewCardProps> = ({ review, type = 'product' }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

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

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

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
                            onClick={() => openLightbox(index)}
                        />
                    ))}
                </div>
            )}

            {/* Image Lightbox */}
            {lightboxOpen && review.review_images && (
                <ImageLightbox
                    images={review.review_images}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                    onPrev={() => setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                    onNext={() => setLightboxIndex(Math.min(review.review_images!.length - 1, lightboxIndex + 1))}
                />
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
