import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { Review } from '../../services/reviewService';

interface ReviewCarouselProps {
    reviews: Review[];
    type?: 'product' | 'seller';
    onViewAll?: () => void;
    totalCount: number;
}

const ReviewCarousel = ({ reviews, type = 'product', onViewAll, totalCount }: ReviewCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 75) {
            // Swipe left
            handleNext();
        }

        if (touchStart - touchEnd < -75) {
            // Swipe right
            handlePrev();
        }
    };

    if (reviews.length === 0) {
        return (
            <div style={styles.emptyState}>
                <p style={styles.emptyText}>Aucun avis pour le moment</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div
                ref={containerRef}
                style={styles.carouselWrapper}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Navigation Arrows - Desktop */}
                {reviews.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            style={{ ...styles.navButton, ...styles.navButtonLeft }}
                            aria-label="Avis précédent"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNext}
                            style={{ ...styles.navButton, ...styles.navButtonRight }}
                            aria-label="Avis suivant"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                {/* Review Card */}
                <div style={styles.cardWrapper}>
                    <ReviewCard review={reviews[currentIndex]} type={type} />
                </div>
            </div>

            {/* Dots Indicator */}
            {reviews.length > 1 && (
                <div style={styles.dotsContainer}>
                    {reviews.map((_, index) => (
                        <div
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            style={{
                                ...styles.dot,
                                background: index === currentIndex ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                width: index === currentIndex ? '24px' : '8px',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* View All Button */}
            {totalCount > reviews.length && onViewAll && (
                <button onClick={onViewAll} style={styles.viewAllButton}>
                    Voir tous les avis ({totalCount})
                </button>
            )}
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    carouselWrapper: {
        position: 'relative' as const,
        width: '100%',
        overflow: 'hidden',
        borderRadius: '16px',
    },
    cardWrapper: {
        width: '100%',
        transition: 'transform 0.3s ease-out',
    },
    navButton: {
        position: 'absolute' as const,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        background: 'rgba(0,0,0,0.6)',
        border: 'none',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
        opacity: 0.7,
    },
    navButtonLeft: {
        left: '12px',
    },
    navButtonRight: {
        right: '12px',
    },
    dotsContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        padding: '8px 0',
    },
    dot: {
        height: '8px',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    viewAllButton: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--primary)',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    emptyState: {
        padding: '40px 20px',
        textAlign: 'center' as const,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    emptyText: {
        color: 'var(--text-secondary)',
        fontSize: '14px',
        margin: 0,
    },
};

export default ReviewCarousel;
