import { Star } from 'lucide-react';

interface StarRatingProps {
    value: number; // 0-5
    onChange?: (value: number) => void; // If provided, stars are clickable
    size?: number;
    readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    size = 24,
    readonly = false
}) => {
    const isInteractive = !readonly && onChange;

    const handleClick = (rating: number) => {
        if (isInteractive && onChange) {
            onChange(rating);
        }
    };

    return (
        <div style={styles.container}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= value;
                const isHalf = star === Math.ceil(value) && value % 1 !== 0;

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleClick(star)}
                        disabled={!isInteractive}
                        style={{
                            ...styles.starButton,
                            cursor: isInteractive ? 'pointer' : 'default',
                        }}
                    >
                        <Star
                            size={size}
                            fill={isFilled || isHalf ? '#FFCC00' : 'none'}
                            color={isFilled || isHalf ? '#FFCC00' : 'rgba(255,255,255,0.3)'}
                            strokeWidth={2}
                        />
                    </button>
                );
            })}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    starButton: {
        background: 'none',
        border: 'none',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s ease',
    }
};

export default StarRating;
