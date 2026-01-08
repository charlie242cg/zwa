import { useState } from 'react';
import { X, Camera, Star, Send, AlertCircle } from 'lucide-react';
import StarRating from './StarRating';
import { reviewService } from '../../services/reviewService';
import { uploadToCloudinary } from '../../lib/cloudinary';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: {
        id: string;
        buyer_id: string;
        seller_id: string;
        product_id: string;
        product?: {
            name: string;
            image_url: string;
        };
        seller?: {
            full_name?: string;
            store_name?: string;
        };
    };
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, order }) => {
    const [productRating, setProductRating] = useState(0);
    const [sellerRating, setSellerRating] = useState(0);
    const [productComment, setProductComment] = useState('');
    const [sellerComment, setSellerComment] = useState('');
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remainingSlots = 3 - reviewImages.length;
        const filesToAdd = files.slice(0, remainingSlots);

        setReviewImages([...reviewImages, ...filesToAdd]);

        // Create previews
        filesToAdd.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setReviewImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Validation
        if (productRating === 0 && sellerRating === 0) {
            setError("Veuillez noter au moins le produit ou le vendeur.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Upload images if any
            let imageUrls: string[] = [];
            if (reviewImages.length > 0) {
                imageUrls = await Promise.all(
                    reviewImages.map(img => uploadToCloudinary(img))
                );
            }

            // Create review
            const { error: reviewError } = await reviewService.createReview({
                orderId: order.id,
                buyerId: order.buyer_id,
                sellerId: order.seller_id,
                productId: order.product_id,
                productRating: productRating > 0 ? productRating : undefined,
                sellerRating: sellerRating > 0 ? sellerRating : undefined,
                productComment: productComment.trim() || undefined,
                sellerComment: sellerComment.trim() || undefined,
                reviewImages: imageUrls.length > 0 ? imageUrls : undefined,
            });

            if (reviewError) throw reviewError;

            // Success!
            alert("✅ Merci pour votre avis ! Il aidera d'autres acheteurs.");
            onClose();
        } catch (err: any) {
            console.error('Review submission error:', err);
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    const sellerName = order.seller?.store_name || order.seller?.full_name || 'Vendeur';

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>Évaluer votre achat</h2>
                    <button onClick={onClose} style={styles.closeButton}>
                        <X size={24} color="white" />
                    </button>
                </div>

                {/* Product Info */}
                <div style={styles.productInfo}>
                    <img
                        src={order.product?.image_url}
                        alt={order.product?.name}
                        style={styles.productImage}
                    />
                    <div>
                        <div style={styles.productName}>{order.product?.name}</div>
                        <div style={styles.sellerName}>Vendu par {sellerName}</div>
                    </div>
                </div>

                <div style={styles.content}>
                    {/* Product Rating */}
                    <div style={styles.section}>
                        <label style={styles.label}>
                            <Star size={16} color="var(--primary)" />
                            Comment notez-vous le produit ?
                        </label>
                        <StarRating value={productRating} onChange={setProductRating} size={32} />
                        <textarea
                            placeholder="Qualité, conformité à la description... (optionnel)"
                            style={styles.textarea}
                            value={productComment}
                            onChange={(e) => setProductComment(e.target.value)}
                            maxLength={500}
                        />
                    </div>

                    {/* Seller Rating */}
                    <div style={styles.section}>
                        <label style={styles.label}>
                            <Star size={16} color="var(--primary)" />
                            Comment notez-vous le vendeur ?
                        </label>
                        <StarRating value={sellerRating} onChange={setSellerRating} size={32} />
                        <textarea
                            placeholder="Service, délai de livraison, communication... (optionnel)"
                            style={styles.textarea}
                            value={sellerComment}
                            onChange={(e) => setSellerComment(e.target.value)}
                            maxLength={500}
                        />
                    </div>

                    {/* Image Upload */}
                    <div style={styles.section}>
                        <label style={styles.label}>
                            <Camera size={16} color="var(--primary)" />
                            Ajouter des photos ({reviewImages.length}/3)
                        </label>
                        <div style={styles.imageGrid}>
                            {imagePreviews.map((preview, index) => (
                                <div key={index} style={styles.imagePreviewContainer}>
                                    <img src={preview} alt="" style={styles.imagePreview} />
                                    <button
                                        onClick={() => removeImage(index)}
                                        style={styles.removeImageButton}
                                        type="button"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {reviewImages.length < 3 && (
                                <label style={styles.uploadBox}>
                                    <Camera size={24} color="var(--text-secondary)" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                        multiple
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div style={styles.actions}>
                        <button onClick={onClose} style={styles.skipButton} disabled={submitting}>
                            Plus tard
                        </button>
                        <button
                            onClick={handleSubmit}
                            style={styles.submitButton}
                            disabled={submitting || (productRating === 0 && sellerRating === 0)}
                        >
                            <Send size={18} />
                            {submitting ? 'Envoi...' : 'Publier mon avis'}
                        </button>
                    </div>
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
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
    },
    modal: {
        background: 'var(--card-bg)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    closeButton: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    productInfo: {
        display: 'flex',
        gap: '12px',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    productImage: {
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
        background: '#1a1a1a',
    },
    productName: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '4px',
    },
    sellerName: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    content: {
        padding: '20px',
        overflowY: 'auto' as const,
        flex: 1,
    },
    section: {
        marginBottom: '24px',
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '12px',
    },
    textarea: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px',
        color: 'white',
        fontSize: '14px',
        minHeight: '80px',
        resize: 'vertical' as const,
        fontFamily: 'inherit',
        marginTop: '12px',
        outline: 'none',
    },
    imageGrid: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap' as const,
    },
    imagePreviewContainer: {
        position: 'relative' as const,
        width: '80px',
        height: '80px',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        objectFit: 'cover' as const,
    },
    removeImageButton: {
        position: 'absolute' as const,
        top: '-6px',
        right: '-6px',
        background: '#FF3B30',
        border: 'none',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
    },
    uploadBox: {
        width: '80px',
        height: '80px',
        border: '2px dashed rgba(255,255,255,0.2)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.02)',
    },
    errorBox: {
        background: 'rgba(255, 59, 48, 0.1)',
        padding: '12px 16px',
        borderRadius: '12px',
        color: '#FF3B30',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
    },
    actions: {
        display: 'flex',
        gap: '12px',
    },
    skipButton: {
        flex: 1,
        padding: '14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    submitButton: {
        flex: 2,
        padding: '14px',
        background: 'var(--primary)',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
    },
};

export default ReviewModal;
