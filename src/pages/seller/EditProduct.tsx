import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, AlertCircle, Save, TrendingUp } from 'lucide-react';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { productService } from '../../services/productService';

const EditProduct = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        original_price: '', // For promotion detection
        min_order_quantity: '1',
        stock_quantity: '', // Stock disponible (vide = illimité)
        is_affiliate_enabled: true,
        default_commission: '10',
        category_id: '',
        city_id: '',
    });

    const [categories, setCategories] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    const [newImages, setNewImages] = useState<(File | null)[]>([null, null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchProductData();
        fetchCategoriesAndCities();
    }, [id]);

    const fetchCategoriesAndCities = async () => {
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        if (categoriesData) setCategories(categoriesData);

        const { data: citiesData } = await supabase
            .from('cities')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        if (citiesData) setCities(citiesData);
    };

    const fetchProductData = async () => {
        setLoading(true);
        const { data, error } = await productService.getProductById(id!);
        if (error || !data) {
            setError("Produit introuvable.");
        } else {
            // Check ownership
            if (data.seller_id !== user?.id) {
                setError("Vous n'êtes pas autorisé à modifier ce produit.");
            } else {
                setFormData({
                    name: data.name,
                    description: data.description || '',
                    price: data.price.toString(),
                    original_price: data.original_price?.toString() || '',
                    min_order_quantity: data.min_order_quantity.toString(),
                    stock_quantity: data.stock_quantity?.toString() || '',
                    is_affiliate_enabled: data.is_affiliate_enabled ?? true,
                    default_commission: (data.default_commission || 10).toString(),
                    category_id: data.category_id || '',
                    city_id: data.city_id || '',
                });

                // Initialize previews with existing images if they exist
                const initialPreviews = [...(data.images_url || [data.image_url])];
                while (initialPreviews.length < 3) initialPreviews.push(null as any);
                setPreviews(initialPreviews.slice(0, 3));
            }
        }
        setLoading(false);
    };

    const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const upNewImages = [...newImages];
            upNewImages[index] = file;
            setNewImages(upNewImages);

            const upPreviews = [...previews];
            upPreviews[index] = URL.createObjectURL(file);
            setPreviews(upPreviews);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !id) return;

        setUpdating(true);
        setError(null);

        try {
            // 1. Prepare image URLs
            const finalImageUrls: string[] = [];

            for (let i = 0; i < 3; i++) {
                if (newImages[i]) {
                    // Upload new file
                    const url = await uploadToCloudinary(newImages[i]!);
                    finalImageUrls.push(url);
                } else if (previews[i] && previews[i]?.startsWith('http')) {
                    // Keep existing absolute URL
                    finalImageUrls.push(previews[i]!);
                }
            }

            if (finalImageUrls.length === 0) {
                throw new Error("Veuillez conserver au moins une image.");
            }

            // 2. Update Supabase
            const { error: dbError } = await supabase
                .from('products')
                .update({
                    name: formData.name,
                    description: formData.description,
                    price: parseInt(formData.price),
                    original_price: formData.original_price ? parseInt(formData.original_price) : null,
                    min_order_quantity: parseInt(formData.min_order_quantity),
                    stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
                    is_affiliate_enabled: formData.is_affiliate_enabled,
                    default_commission: formData.is_affiliate_enabled ? parseFloat(formData.default_commission) : 0,
                    image_url: finalImageUrls[0],
                    images_url: finalImageUrls,
                    category_id: formData.category_id || null,
                    city_id: formData.city_id || null,
                })
                .eq('id', id);

            if (dbError) throw dbError;

            navigate('/seller/dashboard');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue lors de la mise à jour.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div style={styles.centered}>Chargement...</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </button>
                <h1 style={styles.title}>Modifier Produit</h1>
            </header>

            {error && !loading && (
                <div style={styles.errorBox}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {!error && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Image Upload Area */}
                    <div style={styles.imageUploadGroup}>
                        <label style={styles.imageLabel}>Images du produit (Max 3)</label>
                        <div style={styles.imagesGrid}>
                            {[0, 1, 2].map((index) => (
                                <div
                                    key={index}
                                    style={{
                                        ...styles.uploadBox,
                                        backgroundImage: previews[index] ? `url(${previews[index]})` : 'none',
                                        border: previews[index] ? 'none' : '2px dashed rgba(255,255,255,0.1)',
                                        flex: index === 0 ? '1 1 100%' : '1 1 48%',
                                        height: index === 0 ? '180px' : '100px',
                                    }}
                                    onClick={() => document.getElementById(`edit-image-input-${index}`)?.click()}
                                >
                                    <div style={styles.uploadOverlay}>
                                        <Camera size={index === 0 ? 24 : 18} color="white" />
                                        <span style={{ fontSize: index === 0 ? '14px' : '11px' }}>Changer</span>
                                    </div>
                                    <input
                                        id={`edit-image-input-${index}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(index, e)}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Nom du produit</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={styles.row}>
                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.label}>Prix (FCFA)</label>
                            <input
                                type="number"
                                style={styles.input}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.label}>Prix avant rabais</label>
                            <input
                                type="number"
                                placeholder="Optionnel"
                                style={styles.input}
                                value={formData.original_price}
                                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={styles.row}>
                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.label}>Min. (MOQ)</label>
                            <input
                                type="number"
                                style={styles.input}
                                value={formData.min_order_quantity}
                                onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ ...styles.inputGroup, flex: 1 }}>
                            <label style={styles.label}>Stock disponible</label>
                            <input
                                type="number"
                                placeholder="Illimité"
                                style={styles.input}
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                min="0"
                            />
                        </div>
                    </div>

                    {formData.original_price && parseFloat(formData.original_price) > parseFloat(formData.price || '0') && (
                        <div style={styles.promoPreview}>
                            🔥 {Math.round(((parseFloat(formData.original_price) - parseFloat(formData.price || '0')) / parseFloat(formData.original_price)) * 100)}% de rabais
                        </div>
                    )}

                    {/* Affiliation Section */}
                    <div style={styles.affiliateCard} className="premium-card">
                        <div style={styles.affiliateHeader}>
                            <div style={styles.affiliateTitle}>
                                <TrendingUp size={18} color="var(--primary)" />
                                <span>Affiliation Viral</span>
                            </div>
                            <label style={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_affiliate_enabled}
                                    onChange={(e) => setFormData({ ...formData, is_affiliate_enabled: e.target.checked })}
                                />
                                <span style={styles.slider}></span>
                            </label>
                        </div>

                        {formData.is_affiliate_enabled && (
                            <div style={styles.affiliateContent}>
                                <div style={styles.commissionInputGroup}>
                                    <label style={styles.label}>Taux de commission (%)</label>
                                    <div style={styles.inputWrapper}>
                                        <input
                                            type="number"
                                            style={styles.input}
                                            value={formData.default_commission}
                                            onChange={(e) => setFormData({ ...formData, default_commission: e.target.value })}
                                            min="0"
                                            max="100"
                                        />
                                        <span style={styles.percentSymbol}>%</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Selection */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Catégorie *</label>
                        <select
                            style={styles.input}
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            required
                        >
                            <option value="">-- Sélectionner une catégorie --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon && `${cat.icon} `}{cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* City Selection */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Ville / Localisation *</label>
                        <select
                            style={styles.input}
                            value={formData.city_id}
                            onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                            required
                        >
                            <option value="">-- Sélectionner une ville --</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea
                            style={styles.textarea}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={updating}
                        style={{
                            ...styles.submitButton,
                            opacity: updating ? 0.7 : 1
                        }}
                    >
                        <Save size={20} />
                        <span>{updating ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                    </button>
                </form>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '24px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        paddingBottom: '100px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px',
    },
    backButton: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    title: {
        fontSize: '24px',
        fontWeight: '800',
        color: 'white',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
    },
    imageUploadGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    imageLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    imagesGrid: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '12px',
    },
    uploadBox: {
        borderRadius: '20px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative' as const,
        transition: 'all 0.3s ease',
    },
    uploadOverlay: {
        position: 'absolute' as const,
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        color: 'white',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        ':hover': { opacity: 1 },
    } as any,
    affiliateCard: {
        background: 'rgba(138, 43, 226, 0.05)',
        border: '1px solid rgba(138, 43, 226, 0.1)',
        padding: '20px',
        borderRadius: '24px',
    },
    affiliateHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    affiliateTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
    },
    affiliateContent: {
        animation: 'fadeIn 0.3s ease-out',
    },
    switch: {
        position: 'relative' as const,
        display: 'inline-block',
        width: '46px',
        height: '24px',
    },
    slider: {
        position: 'absolute' as const,
        cursor: 'pointer',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.1)',
        transition: '.4s',
        borderRadius: '34px',
        '::before': {
            position: 'absolute',
            content: '""',
            height: '18px',
            width: '18px',
            left: '3px',
            bottom: '3px',
            backgroundColor: 'white',
            transition: '.4s',
            borderRadius: '50%',
        }
    },
    commissionInputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    inputWrapper: {
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
    },
    percentSymbol: {
        position: 'absolute' as const,
        right: '16px',
        color: 'var(--text-secondary)',
        fontWeight: '700',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    input: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '14px 16px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
    },
    row: {
        display: 'flex',
        gap: '16px',
    },
    textarea: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '14px 16px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        minHeight: '120px',
        resize: 'vertical' as const,
        fontFamily: 'inherit',
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
        marginBottom: '20px',
    },
    submitButton: {
        marginTop: '12px',
        padding: '16px',
        borderRadius: '16px',
        border: 'none',
        background: 'var(--primary)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 8px 25px rgba(138, 43, 226, 0.3)',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '40px',
        color: 'var(--text-secondary)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promoPreview: {
        background: 'rgba(255, 59, 48, 0.1)',
        border: '1px solid rgba(255, 59, 48, 0.3)',
        color: '#FF3B30',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '700',
        textAlign: 'center' as const,
        marginTop: '8px',
    }
};

export default EditProduct;
