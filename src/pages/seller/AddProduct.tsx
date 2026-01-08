import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types/category';

const AddProduct = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        original_price: '', // For promotion detection
        min_order_quantity: '1',
        is_affiliate_enabled: true,
        default_commission: '10',
        category_id: '',
        city_id: '',
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    const [images, setImages] = useState<(File | null)[]>([null, null, null]);
    const [previews, setPreviews] = useState<(string | null)[]>([null, null, null]);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch categories and cities on mount
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await categoryService.getActiveCategories();
            if (data) setCategories(data);
        };
        const fetchCities = async () => {
            const { data } = await supabase
                .from('cities')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            if (data) setCities(data);
        };
        fetchCategories();
        fetchCities();
    }, []);


    const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newImages = [...images];
            newImages[index] = file;
            setImages(newImages);

            const newPreviews = [...previews];
            newPreviews[index] = URL.createObjectURL(file);
            setPreviews(newPreviews);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const activeImages = images.filter(img => img !== null) as File[];

        if (!user || activeImages.length === 0) {
            setError("Veuillez remplir tous les champs et ajouter au moins une image.");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // 1. Upload all images to Cloudinary
            const imageUrls = await Promise.all(activeImages.map(img => uploadToCloudinary(img)));

            // 2. Save to Supabase
            const { error: dbError } = await supabase
                .from('products')
                .insert([{
                    seller_id: user.id,
                    name: formData.name,
                    description: formData.description,
                    price: parseInt(formData.price),
                    original_price: formData.original_price ? parseInt(formData.original_price) : null,
                    min_order_quantity: parseInt(formData.min_order_quantity),
                    is_affiliate_enabled: formData.is_affiliate_enabled,
                    default_commission: formData.is_affiliate_enabled ? parseFloat(formData.default_commission) : 0,
                    image_url: imageUrls[0], // First image is the main one
                    images_url: imageUrls, // Array of all images
                    category_id: formData.category_id || null, // Link to category
                    city_id: formData.city_id || null, // Link to city
                }]);

            if (dbError) throw dbError;

            setSuccess(true);
            setTimeout(() => navigate('/seller/dashboard'), 1500);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue lors de la création du produit.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </button>
                <h1 style={styles.title}>Nouveau Produit</h1>
            </header>

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
                                    flex: index === 0 ? '1 1 100%' : '1 1 48%', // First image larger
                                    height: index === 0 ? '180px' : '100px',
                                }}
                                onClick={() => document.getElementById(`image-input-${index}`)?.click()}
                            >
                                {!previews[index] && (
                                    <div style={styles.uploadPlaceholder}>
                                        <Camera size={index === 0 ? 32 : 24} color="var(--text-secondary)" />
                                        <span style={{ fontSize: index === 0 ? '14px' : '10px' }}>
                                            {index === 0 ? 'Photo principale' : 'Photo extra'}
                                        </span>
                                    </div>
                                )}
                                <input
                                    id={`image-input-${index}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(index, e)}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input Fields */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Nom du produit</label>
                    <input
                        type="text"
                        placeholder="Ex: Sac à main en cuir"
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
                            placeholder="0"
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
                        <label style={styles.label}>Qté Min. (MOQ)</label>
                        <input
                            type="number"
                            placeholder="1"
                            style={styles.input}
                            value={formData.min_order_quantity}
                            onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ ...styles.inputGroup, flex: 1 }}>
                        {formData.original_price && parseFloat(formData.original_price) > parseFloat(formData.price || '0') && (
                            <div style={styles.promoPreview}>
                                🔥 {Math.round(((parseFloat(formData.original_price) - parseFloat(formData.price || '0')) / parseFloat(formData.original_price)) * 100)}% de rabais
                            </div>
                        )}
                    </div>
                </div>

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
                            <p style={styles.affiliateDesc}>
                                Augmentez vos ventes en proposant une commission aux affiliés qui partagent votre produit.
                            </p>
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
                        placeholder="Détails sur la qualité, provenance, etc."
                        style={styles.textarea}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                {error && (
                    <div style={styles.errorBox}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading || success}
                    style={{
                        ...styles.submitButton,
                        background: success ? '#00CC66' : 'var(--primary)',
                        opacity: uploading ? 0.7 : 1
                    }}
                >
                    {uploading ? 'Envoi en cours...' : success ? (
                        <div style={styles.btnContent}><Check size={20} /><span>Produit ajouté !</span></div>
                    ) : 'Publier le produit'}
                </button>
            </form>
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
        background: 'rgba(255,255,255,0.02)',
        transition: 'all 0.3s ease',
    },
    uploadPlaceholder: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '4px',
        color: 'var(--text-secondary)',
        textAlign: 'center' as const,
    },
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
    affiliateDesc: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
        marginBottom: '16px',
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
    },
    submitButton: {
        marginTop: '12px',
        padding: '16px',
        borderRadius: '16px',
        border: 'none',
        color: 'white',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 25px rgba(138, 43, 226, 0.3)',
    },
    btnContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
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

export default AddProduct;
