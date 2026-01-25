import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Share2, Heart, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { affiliateService } from '../../services/affiliateService';
import ReviewCarousel from '../../components/reviews/ReviewCarousel';
import ReviewsModal from '../../components/reviews/ReviewsModal';
import StarRating from '../../components/reviews/StarRating';
import CheckoutModal from '../../components/orders/CheckoutModal';
import { useProductDetail } from '../../hooks/useProductDetail';

// Modern Skeleton Component
const ProductDetailSkeleton = () => {
    return (
        <div style={styles.container}>
            <div style={styles.skeletonImageArea}>
                <div style={styles.skeletonPulse}></div>
            </div>
            <div style={{ padding: '0 20px' }}>
                <div className="skeleton-animate" style={{ ...styles.skeletonBar, width: '60%', height: '32px', marginTop: '20px' }}>
                    <div style={styles.skeletonShine}></div>
                </div>
                <div className="skeleton-animate" style={{ ...styles.skeletonBar, width: '40%', height: '24px', marginTop: '12px' }}>
                    <div style={styles.skeletonShine}></div>
                </div>
                <div className="skeleton-animate" style={{ ...styles.skeletonBar, width: '100%', height: '80px', marginTop: '20px' }}>
                    <div style={styles.skeletonShine}></div>
                </div>
                <div className="skeleton-animate" style={{ ...styles.skeletonBar, width: '100%', height: '60px', marginTop: '12px' }}>
                    <div style={styles.skeletonShine}></div>
                </div>
                <div className="skeleton-animate" style={{ ...styles.skeletonBar, width: '100%', height: '200px', marginTop: '20px' }}>
                    <div style={styles.skeletonShine}></div>
                </div>
            </div>
        </div>
    );
};

const ProductDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, profile } = useAuth();

    // Use the optimized hook
    const {
        product,
        isLoading: loading,
        similarProducts,
        isLoadingSimilar,
        reviews,
        totalReviews,
        isLoadingReviews
    } = useProductDetail(id);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [negotiating, setNegotiating] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Capture Affiliate Ref
    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            console.log('[ProductDetail] 🔗 Affiliate ref detected:', ref);
            // Store in Session and Local for persistence
            sessionStorage.setItem('zwa_affiliate_id', ref);
            localStorage.setItem('zwa_affiliate_id', ref);
        }
    }, [searchParams]);

    // Add skeleton animation CSS
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes skeletonPulse {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
        return () => { try { document.head.removeChild(style); } catch (e) { } };
    }, []);

    useEffect(() => {
        if (id) {
            setActiveImageIndex(0);
        }
        const favs = JSON.parse(localStorage.getItem('zwa_favorites') || '[]');
        if (id) setIsFavorite(favs.includes(id));
    }, [id]);

    useEffect(() => {
        if (product && quantity < product.min_order_quantity) {
            setQuantity(product.min_order_quantity);
        }
    }, [product]);

    // Swipe handling for image carousel
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd || !product?.images_url) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && activeImageIndex < product.images_url.length - 1) {
            setActiveImageIndex(activeImageIndex + 1);
        }
        if (isRightSwipe && activeImageIndex > 0) {
            setActiveImageIndex(activeImageIndex - 1);
        }
    };

    const handleShare = async () => {
        if (!product) return;
        const isAffiliate = profile?.role === 'affiliate';
        const shareUrl = (isAffiliate && user)
            ? `${window.location.origin}/product/${product.id}?ref=${user.id}`
            : window.location.href;

        if (isAffiliate && user) {
            try {
                await affiliateService.registerPromotion(user.id, product.id);
            } catch (e) {
                console.error("Error registering promotion:", e);
            }
        }

        const shareData = {
            title: product.name,
            text: `Découvre ${product.name} sur Zwa ! Négocie directement avec le vendeur.`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                alert("Lien d'affiliation copié et ajouté à vos liens actifs !");
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    const toggleFavorite = () => {
        if (!id) return;
        const favs = JSON.parse(localStorage.getItem('zwa_favorites') || '[]');
        let newFavs;
        if (isFavorite) {
            newFavs = favs.filter((f: string) => f !== id);
        } else {
            newFavs = [...favs, id];
        }
        localStorage.setItem('zwa_favorites', JSON.stringify(newFavs));
        setIsFavorite(!isFavorite);
    };

    const startNegotiation = async () => {
        if (!product || negotiating) return;

        // Check if user is authenticated
        if (!user) {
            // Redirect to login with returnUrl
            const returnUrl = `/product/${product.id}`;
            navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
            return;
        }

        setNegotiating(true);

        const affiliateId = sessionStorage.getItem('zwa_affiliate_id') || localStorage.getItem('zwa_affiliate_id');

        const { data: conv, error } = await chatService.createConversation(
            user.id,
            product.seller_id,
            product.id,
            affiliateId || undefined
        );

        if (!error && conv) {
            navigate(`/chat/${conv.id}`);
        } else {
            console.error("Error starting negotiation:", error);
            alert("Une erreur est survenue lors de l'ouverture de la négociation.");
        }
        setNegotiating(false);
    };

    const handleBuyNow = async () => {
        if (!product || isPaymentLoading) return;

        // Check if user is authenticated
        if (!user) {
            // Redirect to login with returnUrl
            const returnUrl = `/product/${product.id}`;
            navigate(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`);
            return;
        }

        // Check stock availability (null = unlimited, >=0 = tracked)
        if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
            if (product.stock_quantity === 0) {
                alert("Désolé, ce produit est en rupture de stock.");
                return;
            }
            if (quantity > product.stock_quantity) {
                alert(`Stock insuffisant. Seulement ${product.stock_quantity} unité(s) disponible(s).`);
                return;
            }
        }

        setIsCheckoutModalOpen(true);
    };

    const handleConfirmCheckout = async (checkoutData: { phone: string; location: string }) => {
        if (!product || !user) return;
        setIsCheckoutModalOpen(false);
        setIsPaymentLoading(true);
        console.log('[ProductDetail] 💳 Processing checkout with data:', checkoutData);

        try {
            const affiliateId = sessionStorage.getItem('zwa_affiliate_id') || localStorage.getItem('zwa_affiliate_id');

            // Create order with product price and selected quantity
            const amount = product.price * quantity;

            const { data: order, error: orderError } = await orderService.createOrder({
                buyerId: user.id,
                sellerId: product.seller_id,
                productId: product.id,
                affiliateId: affiliateId || undefined,
                amount,
                quantity,
                buyerPhone: checkoutData.phone,
                deliveryLocation: checkoutData.location,
                notes: 'Achat direct depuis la fiche produit'
            });

            if (orderError || !order) {
                console.error('[ProductDetail] ❌ Order creation failed:', orderError);
                alert("Erreur lors de la création de la commande : " + orderError?.message);
                setIsPaymentLoading(false);
                return;
            }

            console.log('[ProductDetail] ✅ Order created:', order.id);

            // Call Edge Function to create Yabetoo intent
            const { checkout_url, error: paymentError } = await paymentService.createYabetooCheckout(order.id);

            if (paymentError || !checkout_url) {
                console.error('[ProductDetail] ❌ Yabetoo checkout failed:', paymentError);
                alert("Erreur lors de l'initialisation du paiement : " + (paymentError?.message || 'Inconnue'));
                setIsPaymentLoading(false);
            } else {
                console.log('[ProductDetail] 🚀 Redirecting to Yabetoo:', checkout_url);
                // Redirect user to Yabetoo payment page
                window.location.href = checkout_url;
            }
        } catch (err) {
            console.error('[ProductDetail] 💥 Error during buy flow:', err);
            alert("Une erreur inattendue est survenue.");
            setIsPaymentLoading(false);
        }
    };

    if (loading) return <ProductDetailSkeleton />;
    if (!product) return <div style={styles.centered}>Produit introuvable</div>;

    const isOwner = user?.id === product.seller_id;

    return (
        <div style={styles.container}>
            {/* Top Bar */}
            <div style={styles.topBar}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </button>
                <div style={styles.topActions}>
                    <button onClick={toggleFavorite} style={{ ...styles.backButton, color: isFavorite ? '#FF3B30' : 'white' }}>
                        <Heart size={22} fill={isFavorite ? '#FF3B30' : 'none'} />
                    </button>
                    <button onClick={handleShare} style={styles.backButton}>
                        <Share2 size={24} color="white" />
                    </button>
                </div>
            </div>

            {/* Image Section / Gallery */}
            <div
                style={styles.imageSection}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <img
                    src={(() => {
                        const url = product.images_url?.[activeImageIndex] || product.image_url;
                        return url.includes('supabase.co/storage')
                            ? `${url}?width=800&quality=80`
                            : url;
                    })()}
                    alt={product.name}
                    style={styles.mainImage}
                    draggable={false}
                />

                {/* Image Dots/Thumbnails */}
                {product.images_url && product.images_url.length > 1 && (
                    <div style={styles.galleryDots}>
                        {product.images_url.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveImageIndex(i)}
                                style={{
                                    ...styles.dot,
                                    background: i === activeImageIndex ? 'var(--primary)' : 'rgba(255,255,255,0.3)'
                                }}
                            />
                        ))}
                    </div>
                )}

                <div style={styles.badgesContainer}>
                    {product.profiles?.is_verified_seller && (
                        <div style={styles.imageBadge}>
                            <ShieldCheck size={14} />
                            <span>Vendeur Vérifié</span>
                        </div>
                    )}
                    {product.is_affiliate_enabled && (
                        <div style={styles.affiliateBadge}>
                            <TrendingUp size={14} />
                            <span>Affiliation {product.default_commission}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Content */}
            <div style={styles.content}>
                <div style={styles.priceRow}>
                    <div style={styles.priceContainer}>
                        {product.original_price && product.original_price > product.price && (
                            <div style={styles.promoPriceGroup}>
                                <span style={styles.originalPriceDetail}>{product.original_price.toLocaleString()} FCFA</span>
                                <div style={styles.discountBadge}>
                                    -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                                </div>
                            </div>
                        )}
                        <div style={styles.currentPriceGroup}>
                            <span style={styles.price}>{product.price.toLocaleString()}</span>
                            <span style={styles.currency}>FCFA</span>
                        </div>
                    </div>
                    <div style={styles.moqBadge}>Min: {product.min_order_quantity} pcs</div>
                </div>

                <h1 style={styles.title}>{product.name}</h1>

                <div
                    style={styles.sellerCard}
                    onClick={() => navigate(`/store/${product.seller_id}`)}
                >
                    <div style={styles.sellerAvatarContainer}>
                        <div style={styles.sellerAvatar}>
                            {product.profiles?.avatar_url ? (
                                <img src={product.profiles.avatar_url} alt="" style={styles.avatarImage} />
                            ) : (
                                product.profiles?.store_name?.charAt(0) || product.profiles?.full_name?.charAt(0) || 'V'
                            )}
                        </div>
                        {product.profiles?.is_verified_seller && (
                            <div style={styles.verifiedBadge}>
                                <ShieldCheck size={16} color="white" fill="#00CC66" />
                            </div>
                        )}
                    </div>
                    <div style={styles.sellerInfo}>
                        <div style={styles.sellerName}>
                            {product.profiles?.store_name || product.profiles?.full_name || 'Boutique'}
                        </div>
                        <div style={styles.sellerStats}>
                            {product.profiles?.is_verified_seller && (
                                <><ShieldCheck size={12} color="#00CC66" /> Vérifié • </>
                            )}
                            {product.profiles?.total_sales_count || 0} ventes
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/store/${product.seller_id}`);
                        }}
                        style={styles.visitButton}
                    >
                        Voir la Boutique
                    </button>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Description</h3>
                    <p style={styles.description}>{product.description || "Aucune description fournie par le vendeur."}</p>
                </div>

                {/* Reviews Section */}
                {totalReviews > 0 && (
                    <div style={styles.section}>
                        <div style={styles.reviewsHeader}>
                            <h3 style={styles.sectionTitle}>Avis clients</h3>
                            <div style={styles.ratingsSummary}>
                                <StarRating value={product.average_rating || 0} readonly size={18} />
                                <span style={styles.ratingSummaryText}>
                                    {product.average_rating?.toFixed(1) || '0.0'}/5 · {totalReviews} avis
                                </span>
                            </div>
                        </div>

                        {isLoadingReviews ? (
                            <div style={styles.reviewsSkeleton}>
                                {[1, 2].map(i => (
                                    <div key={i} style={styles.reviewSkeletonCard}>
                                        <div style={{ ...styles.skeletonBar, width: '40px', height: '40px', borderRadius: '50%' }}>
                                            <div style={styles.skeletonShine}></div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ ...styles.skeletonBar, width: '60%', height: '16px', marginBottom: '8px' }}>
                                                <div style={styles.skeletonShine}></div>
                                            </div>
                                            <div style={{ ...styles.skeletonBar, width: '100%', height: '40px' }}>
                                                <div style={styles.skeletonShine}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ReviewCarousel
                                reviews={reviews}
                                type="product"
                                totalCount={totalReviews}
                                onViewAll={() => setShowReviewsModal(true)}
                            />
                        )}
                    </div>
                )}

                {/* Reviews Modal */}
                <ReviewsModal
                    isOpen={showReviewsModal}
                    onClose={() => setShowReviewsModal(false)}
                    productId={id}
                    type="product"
                    totalCount={totalReviews}
                />

                {/* Inline Action Buttons - Contextual based on Role */}
                {!isOwner && (
                    <div style={styles.inlineActions}>
                        {profile?.role === 'affiliate' ? (
                            <>
                                {profile?.is_vip_influencer ? (
                                    <>
                                        <button
                                            style={styles.negotiateButton}
                                            onClick={() => {
                                                alert("Négociation de commission : Cette fonctionnalité ouvrira un chat spécial avec le vendeur pour discuter de votre taux personnalisé.");
                                                startNegotiation();
                                            }}
                                        >
                                            🚀 Négocier ma Commission (VIP)
                                        </button>
                                        <button style={styles.chatButtonInline} onClick={handleShare}>
                                            <Share2 size={20} />
                                            <span>Promouvoir ce produit</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        style={styles.negotiateButton}
                                        onClick={() => {
                                            handleShare();
                                            alert("Lien d'affiliation généré et prêt à être partagé !");
                                        }}
                                    >
                                        📢 Promouvoir & Gagner {product.default_commission}%
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Quantity Selector - Modern Design */}
                                <div style={styles.quantitySection}>
                                    <div style={styles.quantityHeader}>
                                        <div style={styles.quantityLabel}>Quantité</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={styles.minOrderBadge}>Min: {product.min_order_quantity}</div>
                                            {product.stock_quantity !== null && product.stock_quantity !== undefined && (
                                                <div style={{
                                                    ...styles.minOrderBadge,
                                                    background: product.stock_quantity === 0
                                                        ? 'rgba(255, 59, 48, 0.15)'
                                                        : product.stock_quantity <= product.min_order_quantity * 2
                                                            ? 'rgba(255, 149, 0, 0.15)'
                                                            : 'rgba(0, 204, 102, 0.15)',
                                                    color: product.stock_quantity === 0
                                                        ? '#FF3B30'
                                                        : product.stock_quantity <= product.min_order_quantity * 2
                                                            ? '#FF9500'
                                                            : '#00CC66',
                                                }}>
                                                    {product.stock_quantity === 0 ? '🚫 Rupture de stock' : `📦 Stock: ${product.stock_quantity}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={styles.quantitySelector}>
                                        <button
                                            style={{
                                                ...styles.quantityButton,
                                                opacity: (quantity <= product.min_order_quantity || product.stock_quantity === 0) ? 0.5 : 1,
                                                cursor: (quantity <= product.min_order_quantity || product.stock_quantity === 0) ? 'not-allowed' : 'pointer'
                                            }}
                                            onClick={() => setQuantity(Math.max(product.min_order_quantity, quantity - 1))}
                                            disabled={quantity <= product.min_order_quantity || product.stock_quantity === 0}
                                        >
                                            −
                                        </button>
                                        <div style={styles.quantityValueContainer}>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || product.min_order_quantity;
                                                    const maxQty = product.stock_quantity > 0 ? product.stock_quantity : Infinity;
                                                    setQuantity(Math.min(maxQty, Math.max(product.min_order_quantity, val)));
                                                }}
                                                onBlur={() => {
                                                    // Ensure min/max quantity on blur
                                                    if (quantity < product.min_order_quantity) {
                                                        setQuantity(product.min_order_quantity);
                                                    }
                                                    if (product.stock_quantity > 0 && quantity > product.stock_quantity) {
                                                        setQuantity(product.stock_quantity);
                                                    }
                                                }}
                                                min={product.min_order_quantity}
                                                style={styles.quantityInput}
                                                disabled={product.stock_quantity === 0}
                                            />
                                            <div style={styles.quantityUnit}>pcs</div>
                                        </div>
                                        <button
                                            style={{
                                                ...styles.quantityButton,
                                                opacity: (product.stock_quantity !== null && product.stock_quantity !== undefined && quantity >= product.stock_quantity) ? 0.5 : 1,
                                                cursor: (product.stock_quantity !== null && product.stock_quantity !== undefined && quantity >= product.stock_quantity) ? 'not-allowed' : 'pointer'
                                            }}
                                            onClick={() => {
                                                const maxQty = product.stock_quantity !== null && product.stock_quantity !== undefined ? product.stock_quantity : Infinity;
                                                if (quantity < maxQty) setQuantity(quantity + 1);
                                            }}
                                            disabled={product.stock_quantity !== null && product.stock_quantity !== undefined && quantity >= product.stock_quantity}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p style={styles.quantityHint}>Cliquez sur le chiffre pour saisir une quantité</p>
                                    <div style={styles.priceBreakdown}>
                                        <div style={styles.totalPriceRow}>
                                            <span style={styles.priceLabel}>{quantity} × {product.price.toLocaleString()} FCFA</span>
                                        </div>
                                        <div style={styles.totalPrice}>
                                            {(product.price * quantity).toLocaleString()} FCFA
                                        </div>
                                    </div>
                                </div>

                                <button
                                    style={{
                                        ...styles.buyNowButton,
                                        opacity: (isPaymentLoading || product.stock_quantity === 0) ? 0.7 : 1,
                                        cursor: (isPaymentLoading || product.stock_quantity === 0) ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={handleBuyNow}
                                    disabled={isPaymentLoading || product.stock_quantity === 0}
                                >
                                    {isPaymentLoading ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="spinner"></div> Connexion sécurisée...
                                        </div>
                                    ) : (
                                        '💳 Acheter Maintenant'
                                    )}
                                </button>
                                <button
                                    style={{
                                        ...styles.negotiateButton,
                                        opacity: product.stock_quantity === 0 ? 0.7 : 1,
                                        cursor: product.stock_quantity === 0 ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={startNegotiation}
                                    disabled={negotiating || product.stock_quantity === 0}
                                >
                                    {negotiating ? 'Ouverture...' : product.stock_quantity === 0 ? 'Rupture de stock' : '💬 Négocier le Prix'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Similar Products Section */}
                <div style={styles.similarSection}>
                    <div style={styles.similarHeader}>
                        <h3 style={styles.similarTitle}>
                            <TrendingUp size={20} />
                            Produits Recommandés
                        </h3>
                    </div>

                    {isLoadingSimilar ? (
                        <div style={styles.similarGrid}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={styles.productCardSkeleton}>
                                    <div style={styles.skeletonProductImage}>
                                        <div style={styles.skeletonShine}></div>
                                    </div>
                                    <div style={{ ...styles.skeletonBar, width: '80%', height: '16px', margin: '12px auto 8px' }}>
                                        <div style={styles.skeletonShine}></div>
                                    </div>
                                    <div style={{ ...styles.skeletonBar, width: '50%', height: '14px', margin: '0 auto' }}>
                                        <div style={styles.skeletonShine}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={styles.similarGrid}>
                            {similarProducts.map(prod => (
                                <div
                                    key={prod.id}
                                    style={styles.productCard}
                                    onClick={() => navigate(`/product/${prod.id}`)}
                                >
                                    <div style={styles.productImage}>
                                        {prod.image_url ? (
                                            <img src={prod.image_url} alt={prod.name} style={styles.productImg} />
                                        ) : (
                                            <div style={styles.productPlaceholder}>📦</div>
                                        )}
                                    </div>
                                    <div style={styles.productInfo}>
                                        <div style={styles.productName}>{prod.name}</div>
                                        <div style={styles.productPrice}>{prod.price.toLocaleString()} FCFA</div>
                                        {prod.min_order_quantity > 1 && (
                                            <div style={styles.productMoq}>Min: {prod.min_order_quantity} pcs</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checkout Modal */}
                <CheckoutModal
                    isOpen={isCheckoutModalOpen}
                    onClose={() => setIsCheckoutModalOpen(false)}
                    onConfirm={handleConfirmCheckout}
                    productName={product.name}
                    totalAmount={product.price * quantity}
                />
            </div>
        </div>
    );
};

const styles = {
    container: {
        background: 'var(--background)',
        minHeight: '100vh',
        width: '100%',
        paddingBottom: '40px',
        overflowX: 'hidden' as const,
    },
    topBar: {
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%)',
    },
    topActions: {
        display: 'flex',
        gap: '12px',
    },
    backButton: {
        background: 'rgba(0,0,0,0.4)',
        border: 'none',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    imageSection: {
        width: '100%',
        aspectRatio: '1/1',
        maxHeight: '70vh',
        position: 'relative' as const,
        background: '#1a1a1a',
    },
    mainImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain' as const,
        backgroundColor: '#000',
    },
    affiliateBadge: {
        background: 'var(--primary)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.4)',
    },
    imageBadge: {
        background: '#00CC66',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        boxShadow: '0 4px 15px rgba(0, 204, 102, 0.4)',
    },
    badgesContainer: {
        position: 'absolute' as const,
        bottom: '16px',
        left: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        zIndex: 5,
    },
    galleryDots: {
        position: 'absolute' as const,
        bottom: '16px',
        right: '16px',
        display: 'flex',
        gap: '6px',
        background: 'rgba(0,0,0,0.3)',
        padding: '6px 10px',
        borderRadius: '20px',
    },
    dot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    content: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    priceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
    },
    priceContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
    },
    currentPriceGroup: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px',
    },
    price: {
        fontSize: '32px',
        fontWeight: '900',
        color: 'white',
    },
    currency: {
        fontSize: '16px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    promoPriceGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '4px',
    },
    originalPriceDetail: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        textDecoration: 'line-through',
    },
    discountBadge: {
        background: '#FF3B30',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '6px',
    },
    moqBadge: {
        background: 'rgba(255,255,255,0.05)',
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: '24px',
        fontWeight: '800',
        color: 'white',
        marginBottom: '24px',
        lineHeight: '1.3',
    },
    sellerCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.03)',
        padding: '12px',
        borderRadius: '16px',
        marginBottom: '32px',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
    },
    sellerAvatarContainer: {
        position: 'relative' as const,
    },
    sellerAvatar: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    verifiedBadge: {
        position: 'absolute' as const,
        bottom: -2,
        right: -2,
        background: 'white',
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sellerInfo: {
        flex: 1,
    },
    sellerName: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '2px',
    },
    sellerStats: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    visitButton: {
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        padding: '8px 12px',
        borderRadius: '10px',
        cursor: 'pointer',
    },
    section: {
        marginBottom: '32px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '12px',
    },
    description: {
        fontSize: '15px',
        color: 'rgba(255,255,255,0.8)',
        lineHeight: '1.6',
    },
    reviewsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    ratingsSummary: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,204,0,0.1)',
        padding: '6px 12px',
        borderRadius: '12px',
    },
    ratingSummaryText: {
        fontSize: '13px',
        color: '#FFD700',
        fontWeight: '600',
    },
    inlineActions: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        marginBottom: '40px',
    },
    quantitySection: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    quantityHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    quantityLabel: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
    },
    minOrderBadge: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        background: 'rgba(255,255,255,0.05)',
        padding: '4px 8px',
        borderRadius: '6px',
    },
    quantitySelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    quantityButton: {
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: 'var(--card-bg)', // Using card background for buttons for better contrast
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        fontSize: '24px',
        fontWeight: '300',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    quantityValueContainer: {
        flex: 1,
        height: '48px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
        border: '1px solid rgba(255,255,255,0.05)',
    },
    quantityInput: {
        width: '100%',
        height: '100%',
        background: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        fontWeight: '700',
        textAlign: 'center' as const,
        outline: 'none',
        paddingRight: '20px', // Make space for unit
    },
    quantityUnit: {
        position: 'absolute' as const,
        right: '16px',
        fontSize: '14px',
        color: 'rgba(255,255,255,0.4)',
        pointerEvents: 'none' as const,
    },
    quantityHint: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center' as const,
        margin: '0 0 16px 0',
    },
    priceBreakdown: {
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    totalPriceRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    totalPrice: {
        fontSize: '24px',
        fontWeight: '800',
        color: 'var(--primary)',
    },
    buyNowButton: {
        width: '100%',
        background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
        color: 'white',
        border: 'none',
        padding: '16px',
        borderRadius: '16px',
        fontSize: '18px',
        fontWeight: '800',
        cursor: 'pointer',
        marginBottom: '12px',
        boxShadow: '0 8px 25px rgba(138, 43, 226, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    },
    negotiateButton: {
        width: '100%',
        background: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '16px',
        borderRadius: '16px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    chatButtonInline: {
        width: '100%',
        background: 'rgba(0, 204, 102, 0.15)',
        color: '#00CC66',
        border: 'none',
        padding: '16px',
        borderRadius: '16px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '12px',
    },
    similarSection: {
        marginTop: '40px',
    },
    similarHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
    },
    similarTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    similarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
    },
    productCard: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
    },
    productImage: {
        width: '100%',
        aspectRatio: '1/1',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    productImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    productPlaceholder: {
        fontSize: '32px',
    },
    productInfo: {
        padding: '12px',
    },
    productName: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '6px',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    productPrice: {
        fontSize: '15px',
        fontWeight: '800',
        color: 'var(--primary)',
        marginBottom: '4px',
    },
    productMoq: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
    },
    // Skeleton Styles
    skeletonImageArea: {
        width: '100%',
        aspectRatio: '1/1',
        background: 'rgba(255,255,255,0.05)',
        position: 'relative' as const,
        overflow: 'hidden',
    },
    skeletonBar: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        position: 'relative' as const,
        overflow: 'hidden',
    },
    skeletonPulse: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        animation: 'skeletonPulse 1.5s infinite',
    },
    skeletonShine: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        animation: 'skeletonPulse 1.5s infinite',
    },
    productCardSkeleton: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        overflow: 'hidden',
        paddingBottom: '12px',
    },
    skeletonProductImage: {
        width: '100%',
        aspectRatio: '1/1',
        background: 'rgba(255,255,255,0.05)',
        position: 'relative' as const,
        overflow: 'hidden',
    },
    centered: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-secondary)',
    },
    reviewsSkeleton: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    reviewSkeletonCard: {
        display: 'flex',
        gap: '12px',
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
    }
};

export default ProductDetail;
