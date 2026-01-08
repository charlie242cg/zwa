import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Camera, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { uploadToCloudinary } from '../../lib/cloudinary';

const AccountSettings = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const [formData, setFormData] = useState({
        email: user?.email || '',
        full_name: profile?.full_name || '',
        phone_number: profile?.phone_number || '',
        avatar_url: profile?.avatar_url || ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                email: user?.email || '',
                full_name: profile.full_name || '',
                phone_number: profile.phone_number || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile, user]);

    const validatePhoneNumber = (phone: string): boolean => {
        if (!phone) return true; // Optionnel

        const congoPhoneRegex = /^(\+242\s?)?0[56][\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
        return congoPhoneRegex.test(phone.trim());
    };

    const validatePhoneUniqueness = async (phone: string, role: string): Promise<boolean> => {
        if (!phone) return true;

        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone_number', phone)
            .eq('role', role)
            .neq('id', user?.id);

        if (error) {
            console.error('[AccountSettings] ❌ Error checking phone uniqueness:', error);
            return false;
        }

        return !data || data.length === 0;
    };

    const handlePhoneChange = (value: string) => {
        setFormData({ ...formData, phone_number: value });

        if (value && !validatePhoneNumber(value)) {
            setPhoneError('Format invalide. Ex: +242 06 123 1244');
        } else {
            setPhoneError('');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setFormData({ ...formData, avatar_url: url });
            console.log('[AccountSettings] ✅ Avatar uploaded:', url);
        } catch (error) {
            console.error('[AccountSettings] ❌ Avatar upload failed:', error);
            alert("Erreur lors de l'upload de la photo");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !profile) return;

        // Validation numéro format
        if (formData.phone_number && !validatePhoneNumber(formData.phone_number)) {
            alert("❌ Le numéro de téléphone n'est pas valide.\nFormat attendu: +242 06 123 1244");
            return;
        }

        // Validation numéro unicité par rôle
        if (formData.phone_number) {
            const isUnique = await validatePhoneUniqueness(formData.phone_number, profile.role);
            if (!isUnique) {
                alert(`❌ Ce numéro est déjà utilisé par un autre compte ${profile.role}.\n\nLe même numéro peut être utilisé sur différents types de comptes (buyer, seller, affiliate), mais pas 2 fois sur le même type.`);
                return;
            }
        }

        setLoading(true);
        console.log('[AccountSettings] 💾 Saving profile:', formData);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: formData.full_name || null,
                phone_number: formData.phone_number || null,
                avatar_url: formData.avatar_url || null
            })
            .eq('id', user.id);

        if (error) {
            console.error('[AccountSettings] ❌ Error saving:', error);
            alert("Erreur lors de la sauvegarde : " + error.message);
        } else {
            console.log('[AccountSettings] ✅ Profile saved successfully');
            alert("✅ Informations sauvegardées avec succès !");
            navigate('/profile');
        }

        setLoading(false);
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <button onClick={() => navigate('/profile')} style={styles.backButton}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={styles.title}>Paramètres du Compte</h1>
                <div style={{ width: '24px' }}></div>
            </div>

            <div style={styles.form}>
                {/* Section Identifiants */}
                <div style={styles.sectionTitle}>🔐 Identifiants de Connexion</div>

                <div style={styles.field}>
                    <label style={styles.label}>
                        <Mail size={18} color="var(--primary)" />
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        disabled
                        style={{ ...styles.input, opacity: 0.6, cursor: 'not-allowed' }}
                    />
                    <div style={styles.hint}>Email utilisé pour se connecter (non modifiable)</div>
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>
                        <Lock size={18} color="var(--primary)" />
                        Mot de passe
                    </label>
                    <button
                        onClick={() => alert('Fonctionnalité de changement de mot de passe en développement')}
                        style={styles.changePasswordBtn}
                    >
                        Modifier le mot de passe
                    </button>
                </div>

                {/* Section Informations Personnelles */}
                <div style={{ ...styles.sectionTitle, marginTop: '32px' }}>👤 Informations Personnelles</div>

                <div style={styles.field}>
                    <label style={styles.label}>
                        <User size={18} color="var(--primary)" />
                        Nom complet
                    </label>
                    <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        style={styles.input}
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>
                        <Camera size={18} color="var(--primary)" />
                        Photo de profil
                    </label>
                    <div style={styles.avatarSection}>
                        <div style={styles.avatarPreview}>
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" style={styles.avatarImage} />
                            ) : (
                                <span style={styles.avatarPlaceholder}>
                                    {formData.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            style={styles.fileInput}
                            disabled={uploading}
                            id="avatar-upload"
                        />
                        <label htmlFor="avatar-upload" style={styles.uploadLabel}>
                            {uploading ? 'Upload en cours...' : '📷 Changer la photo'}
                        </label>
                    </div>
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>
                        <Phone size={18} color="var(--primary)" />
                        Numéro de téléphone
                    </label>
                    <input
                        type="text"
                        value={formData.phone_number}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="+242 06 123 1244"
                        style={{
                            ...styles.input,
                            borderColor: phoneError ? '#ff4444' : 'rgba(255,255,255,0.1)'
                        }}
                    />
                    {phoneError && (
                        <div style={styles.error}>{phoneError}</div>
                    )}
                    <div style={styles.hint}>
                        Utilisé pour prévenir les comptes inactifs.<br />
                        ℹ️ Le même numéro peut être utilisé sur différents types de comptes.
                    </div>
                </div>

                {/* Bouton Sauvegarder */}
                <button
                    onClick={handleSave}
                    disabled={loading || uploading}
                    style={{
                        ...styles.saveButton,
                        opacity: loading || uploading ? 0.5 : 1
                    }}
                >
                    {loading ? 'Sauvegarde...' : '💾 Sauvegarder'}
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
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '20px',
    },
    field: {
        marginBottom: '24px',
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
    hint: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '6px',
        lineHeight: '1.4',
    },
    error: {
        marginTop: '6px',
        fontSize: '12px',
        color: '#ff4444',
        fontWeight: '600',
    },
    changePasswordBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        color: 'var(--primary)',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
    },
    avatarSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '12px',
    },
    avatarPreview: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'var(--primary)',
        border: '3px solid rgba(138, 43, 226, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    avatarPlaceholder: {
        fontSize: '32px',
        fontWeight: '900',
        color: 'white',
    },
    fileInput: {
        display: 'none',
    },
    uploadLabel: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '10px 20px',
        fontSize: '13px',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer',
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
};

export default AccountSettings;
