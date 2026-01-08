import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, MapPin, FileText, Store, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useSkeletonAnimation, SkeletonBar } from '../../components/common/SkeletonLoader';

const EditStore = () => {
    useSkeletonAnimation();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
    const [phoneError, setPhoneError] = useState<string>('');
    const [storeData, setStoreData] = useState({
        store_name: '',
        store_bio: '',
        store_location: '',
        phone_number: '',
        avatar_url: '',
        store_banner_url: '',
    });

    // Add spinner animation CSS
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        return () => {
            try {
                document.head.removeChild(style);
            } catch (e) {}
        };
    }, []);

    useEffect(() => {
        if (profile) {
            setStoreData({
                store_name: profile.store_name || profile.full_name || '',
                store_bio: profile.store_bio || '',
                store_location: profile.store_location || '',
                phone_number: profile.phone_number || '',
                avatar_url: profile.avatar_url || '',
                store_banner_url: profile.store_banner_url || '',
            });
            setInitialLoading(false);
        }
    }, [profile]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation de fichier
        if (!file.type.startsWith('image/')) {
            alert("❌ Veuillez sélectionner une image valide");
            e.target.value = '';
            return;
        }

        // Limite de taille : 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert("❌ L'image ne doit pas dépasser 5MB");
            e.target.value = '';
            return;
        }

        setUploading('avatar');
        console.log('[EditStore] 📤 Uploading avatar:', file.name, file.size, 'bytes');

        try {
            const url = await uploadToCloudinary(file);
            setStoreData(prev => ({ ...prev, avatar_url: url }));
            console.log('[EditStore] ✅ Avatar uploaded successfully:', url);
            alert("✅ Avatar uploadé avec succès !");
            e.target.value = ''; // Reset input
        } catch (error) {
            console.error('[EditStore] ❌ Avatar upload failed:', error);
            alert(`❌ Erreur lors de l'upload de l'avatar: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            e.target.value = '';
        } finally {
            setUploading(null);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation de fichier
        if (!file.type.startsWith('image/')) {
            alert("❌ Veuillez sélectionner une image valide");
            e.target.value = '';
            return;
        }

        // Limite de taille : 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert("❌ L'image ne doit pas dépasser 5MB");
            e.target.value = '';
            return;
        }

        setUploading('banner');
        console.log('[EditStore] 📤 Uploading banner:', file.name, file.size, 'bytes');

        try {
            const url = await uploadToCloudinary(file);
            setStoreData(prev => ({ ...prev, store_banner_url: url }));
            console.log('[EditStore] ✅ Banner uploaded successfully:', url);
            alert("✅ Bannière uploadée avec succès !");
            e.target.value = ''; // Reset input
        } catch (error) {
            console.error('[EditStore] ❌ Banner upload failed:', error);
            alert(`❌ Erreur lors de l'upload de la bannière: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            e.target.value = '';
        } finally {
            setUploading(null);
        }
    };

    const validatePhoneNumber = (phone: string): boolean => {
        if (!phone) return true; // Champ optionnel

        // Regex pour format Congo: +242 suivi de 06 ou 05, puis 7 chiffres
        // Accepte: +242 06 123 1244, +24206123144, 06-961-12-33, etc.
        const congoPhoneRegex = /^(\+242\s?)?0[56][\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;

        return congoPhoneRegex.test(phone.trim());
    };

    const handlePhoneChange = (value: string) => {
        setStoreData({ ...storeData, phone_number: value });

        if (value && !validatePhoneNumber(value)) {
            setPhoneError('Format invalide. Ex: +242 06 123 1244 ou 06-961-12-33');
        } else {
            setPhoneError('');
        }
    };

    const handleSave = async () => {
        if (!user) return;

        // Validation du numéro avant sauvegarde
        if (storeData.phone_number && !validatePhoneNumber(storeData.phone_number)) {
            alert("❌ Le numéro de téléphone n'est pas valide. Format attendu: +242 06 123 1244");
            return;
        }

        setLoading(true);
        console.log('[EditStore] 💾 Saving store info:', storeData);

        // Générer le slug si manquant
        const slug = profile?.store_slug || storeData.store_name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const { error } = await supabase
            .from('profiles')
            .update({
                store_name: storeData.store_name || null,
                store_bio: storeData.store_bio || null,
                store_location: storeData.store_location || null,
                phone_number: storeData.phone_number || null,
                avatar_url: storeData.avatar_url || null,
                store_banner_url: storeData.store_banner_url || null,
                store_slug: slug || null
            })
            .eq('id', user.id);

        if (error) {
            console.error('[EditStore] ❌ Error saving:', error);
            alert("Erreur lors de la sauvegarde : " + error.message);
        } else {
            console.log('[EditStore] ✅ Store info saved successfully');
            alert("✅ Informations de la boutique sauvegardées !");
            navigate(`/store/${user.id}`);
        }

        setLoading(false);
    };

    if (initialLoading) {
        return (
            <div style={styles.container}>
                {/* Header Skeleton */}
                <div style={styles.header}>
                    <SkeletonBar width={24} height={24} borderRadius={4} />
                    <SkeletonBar width={200} height={24} />
                    <div style={{ width: '24px' }}></div>
                </div>

                <div style={styles.form}>
                    {/* Fields Skeleton */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} style={styles.field}>
                            <SkeletonBar width={150} height={18} margin="0 0 10px 0" />
                            <SkeletonBar width="100%" height={48} borderRadius={12} />
                            <SkeletonBar width="70%" height={12} margin="6px 0 0 0" />
                        </div>
                    ))}

                    {/* Button Skeleton */}
                    <SkeletonBar width="100%" height={52} borderRadius={16} style={{ marginTop: '32px' }} />
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backButton}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={styles.title}>Modifier ma Boutique</h1>
                <div style={{ width: '24px' }}></div>
            </div>

            <div style={styles.form}>
                {/* Nom de la boutique */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        <Store size={18} color="var(--primary)" />
                        Nom de la boutique
                    </label>
                    <input
                        type="text"
                        value={storeData.store_name}
                        onChange={(e) => setStoreData({ ...storeData, store_name: e.target.value })}
                        placeholder="Divine Mode Brazza"
                        style={styles.input}
                    />
                    <div style={styles.hint}>Le nom qui apparaîtra sur votre boutique publique</div>
                </div>

                {/* Bio */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        <FileText size={18} color="var(--primary)" />
                        Bio
                    </label>
                    <textarea
                        value={storeData.store_bio}
                        onChange={(e) => setStoreData({ ...storeData, store_bio: e.target.value })}
                        placeholder="Vêtements de luxe made in Brazzaville depuis 2024..."
                        style={styles.textarea}
                        rows={4}
                    />
                    <div style={styles.hint}>Présentez votre boutique en quelques mots</div>
                </div>

                {/* Localisation */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        <MapPin size={18} color="var(--primary)" />
                        Localisation
                    </label>
                    <input
                        type="text"
                        value={storeData.store_location}
                        onChange={(e) => setStoreData({ ...storeData, store_location: e.target.value })}
                        placeholder="Brazzaville, Congo"
                        style={styles.input}
                    />
                    <div style={styles.hint}>Ville ou pays</div>
                </div>

                {/* Contact */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        <Phone size={18} color="var(--primary)" />
                        Contact
                    </label>
                    <input
                        type="text"
                        value={storeData.phone_number}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="+242 06 123 1244 ou 06-961-12-33"
                        style={{
                            ...styles.input,
                            borderColor: phoneError ? '#ff4444' : 'rgba(255,255,255,0.1)',
                        }}
                    />
                    {phoneError && (
                        <div style={styles.error}>{phoneError}</div>
                    )}
                    <div style={styles.hint}>Format: +242 06 ou 05 suivi de 7 chiffres</div>
                </div>

                {/* Avatar Upload */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        <Upload size={18} color="var(--primary)" />
                        Photo de profil
                    </label>

                    {storeData.avatar_url && (
                        <div style={styles.preview}>
                            <img src={storeData.avatar_url} alt="Avatar" style={styles.previewImage} />
                            <div style={styles.imageUrl}>{storeData.avatar_url.substring(0, 50)}...</div>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={styles.fileInput}
                        disabled={uploading === 'avatar'}
                    />

                    {uploading === 'avatar' && (
                        <div style={styles.uploadingBox}>
                            <div style={styles.spinner}></div>
                            <span>Upload en cours...</span>
                        </div>
                    )}

                    <div style={styles.hint}>Image carrée recommandée (min 200x200px, max 5MB)</div>
                </div>

                {/* Banner Upload */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        <Upload size={18} color="var(--primary)" />
                        Photo de couverture
                    </label>

                    {storeData.store_banner_url && (
                        <div style={styles.bannerPreview}>
                            <img src={storeData.store_banner_url} alt="Bannière" style={styles.bannerImage} />
                            <div style={styles.imageUrl}>{storeData.store_banner_url.substring(0, 50)}...</div>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        style={styles.fileInput}
                        disabled={uploading === 'banner'}
                    />

                    {uploading === 'banner' && (
                        <div style={styles.uploadingBox}>
                            <div style={styles.spinner}></div>
                            <span>Upload en cours...</span>
                        </div>
                    )}

                    <div style={styles.hint}>Format large recommandé (1200x400px, max 5MB)</div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={loading || uploading !== null}
                    style={{
                        ...styles.saveButton,
                        opacity: (loading || uploading !== null) ? 0.5 : 1,
                    }}
                >
                    {loading ? 'Sauvegarde...' : uploading ? 'Upload en cours...' : '✅ Sauvegarder'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        background: 'var(--background)',
        minHeight: '100vh',
        paddingBottom: '40px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    backButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    form: {
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
    },
    field: {
        marginBottom: '28px',
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '10px',
    },
    input: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '15px',
        color: 'white',
        outline: 'none',
        boxSizing: 'border-box' as const,
    },
    textarea: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '15px',
        color: 'white',
        outline: 'none',
        fontFamily: 'inherit',
        resize: 'vertical' as const,
        boxSizing: 'border-box' as const,
    },
    hint: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '6px',
    },
    preview: {
        marginTop: '12px',
        display: 'flex',
        justifyContent: 'center',
    },
    previewImage: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover' as const,
        border: '3px solid var(--primary)',
    },
    bannerPreview: {
        marginTop: '12px',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '150px',
        objectFit: 'cover' as const,
    },
    saveButton: {
        width: '100%',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 8px 25px rgba(138, 43, 226, 0.4)',
        marginTop: '32px',
    },
    note: {
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
    },
    fileInput: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '14px 16px',
        fontSize: '15px',
        color: 'white',
        outline: 'none',
        boxSizing: 'border-box' as const,
        cursor: 'pointer',
    },
    uploading: {
        marginTop: '8px',
        fontSize: '13px',
        color: 'var(--primary)',
        fontWeight: '600',
    },
    error: {
        marginTop: '6px',
        fontSize: '12px',
        color: '#ff4444',
        fontWeight: '600',
    },
    imageUrl: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginTop: '8px',
        wordBreak: 'break-all' as const,
        opacity: 0.7,
    },
    uploadingBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: 'rgba(138, 43, 226, 0.1)',
        borderRadius: '12px',
        marginTop: '12px',
        border: '1px solid rgba(138, 43, 226, 0.3)',
        color: 'var(--primary)',
        fontSize: '14px',
        fontWeight: '600',
    },
    spinner: {
        width: '20px',
        height: '20px',
        border: '3px solid rgba(138, 43, 226, 0.3)',
        borderTop: '3px solid var(--primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
};

export default EditStore;
