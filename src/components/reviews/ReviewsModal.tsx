import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { Review, reviewService } from '../../services/reviewService';

interface ReviewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId?: string;
    sellerId?: string;
    type: 'product' | 'seller';
    totalCount: number;
}

type SortOption = 'recent' | 'highest' | 'lowest';

const ReviewsModal = ({ isOpen, onClose, productId, sellerId, type, totalCount }: ReviewsModalProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const pageSize = 10;

    useEffect(() => {
        if (isOpen) {
            loadReviews(1, true);
        }
    }, [isOpen, sortBy]);

    const loadReviews = async (pageNum: number, reset: boolean = false) => {
        setLoading(true);
        const offset = (pageNum - 1) * pageSize;

        let data: Review[] = [];
        let count = 0;

        if (type === 'product' && productId) {
            const result = await reviewService.getProductReviews(productId, pageSize, offset);
            data = result.data || [];
            const countResult = await reviewService.getProductReviewCount(productId);
            count = countResult.count || 0;
        } else if (type === 'seller' && sellerId) {
            const result = await reviewService.getSellerReviews(sellerId, pageSize, offset);
            data = result.data || [];
            const countResult = await reviewService.getSellerReviewCount(sellerId);
            count = countResult.count || 0;
        }

        // Sort reviews
        const sortedData = sortReviews(data, sortBy);

        if (reset) {
            setReviews(sortedData);
        } else {
            setReviews((prev) => [...prev, ...sortedData]);
        }

        setHasMore(reviews.length + sortedData.length < count);
        setPage(pageNum);
        setLoading(false);
    };

    const sortReviews = (data: Review[], sort: SortOption): Review[] => {
        const sorted = [...data];
        switch (sort) {
            case 'highest':
                return sorted.sort((a, b) => {
                    const ratingA = type === 'product' ? (a.product_rating || 0) : (a.seller_rating || 0);
                    const ratingB = type === 'product' ? (b.product_rating || 0) : (b.seller_rating || 0);
                    return ratingB - ratingA;
                });
            case 'lowest':
                return sorted.sort((a, b) => {
                    const ratingA = type === 'product' ? (a.product_rating || 0) : (a.seller_rating || 0);
                    const ratingB = type === 'product' ? (b.product_rating || 0) : (b.seller_rating || 0);
                    return ratingA - ratingB;
                });
            case 'recent':
            default:
                return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
    };

    const handleLoadMore = () => {
        loadReviews(page + 1, false);
    };

    const handleSortChange = (newSort: SortOption) => {
        setSortBy(newSort);
        setPage(1);
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <h3 style={styles.title}>Tous les avis ({totalCount})</h3>
                    <button onClick={onClose} style={styles.closeButton}>
                        <X size={24} />
                    </button>
                </div>

                {/* Sort Filter */}
                <div style={styles.filterContainer}>
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value as SortOption)}
                        style={styles.sortSelect}
                    >
                        <option value="recent">Plus récents</option>
                        <option value="highest">Meilleures notes</option>
                        <option value="lowest">Notes basses</option>
                    </select>
                </div>

                {/* Reviews List */}
                <div style={styles.reviewsList}>
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} type={type} />
                    ))}

                    {loading && (
                        <div style={styles.loadingContainer}>
                            <div className="loading-spinner"></div>
                            <p style={styles.loadingText}>Chargement...</p>
                        </div>
                    )}

                    {!loading && reviews.length === 0 && (
                        <div style={styles.emptyState}>
                            <p style={styles.emptyText}>Aucun avis trouvé</p>
                        </div>
                    )}

                    {/* Load More Button */}
                    {!loading && hasMore && reviews.length > 0 && (
                        <button onClick={handleLoadMore} style={styles.loadMoreButton}>
                            <ChevronDown size={20} />
                            <span>Charger plus d'avis</span>
                        </button>
                    )}

                    {!loading && !hasMore && reviews.length > 0 && (
                        <div style={styles.endMessage}>
                            <p style={styles.endText}>Vous avez vu tous les avis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        padding: 0,
        animation: 'fadeIn 0.2s ease',
    },
    modal: {
        background: 'var(--background)',
        width: '100%',
        maxHeight: '85vh',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column' as const,
        animation: 'slideUp 0.3s ease',
        overflow: 'hidden',
    },
    header: {
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky' as const,
        top: 0,
        background: 'var(--background)',
        zIndex: 10,
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    closeButton: {
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
        transition: 'all 0.2s ease',
    },
    filterContainer: {
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'var(--background)',
        position: 'sticky' as const,
        top: '73px',
        zIndex: 9,
    },
    sortSelect: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        outline: 'none',
    },
    reviewsList: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '12px',
        padding: '20px',
    },
    loadingText: {
        color: 'var(--text-secondary)',
        fontSize: '14px',
        margin: 0,
    },
    loadMoreButton: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: 'var(--primary)',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '8px',
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center' as const,
    },
    emptyText: {
        color: 'var(--text-secondary)',
        fontSize: '14px',
        margin: 0,
    },
    endMessage: {
        padding: '20px',
        textAlign: 'center' as const,
    },
    endText: {
        color: 'var(--text-secondary)',
        fontSize: '13px',
        margin: 0,
        fontStyle: 'italic' as const,
    },
};

export default ReviewsModal;
