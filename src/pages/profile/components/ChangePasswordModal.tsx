import { useState } from 'react';
import { X, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { authService } from '../../../services/authService';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

const ChangePasswordModal = ({ isOpen, onClose, email }: ChangePasswordModalProps) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (newPassword.length < 6) {
            setError('Le nouveau mot de passe doit faire au moins 6 caractères');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Les nouveaux mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);

        try {
            // 1. Vérifier le mot de passe actuel en tentant une reconnexion
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: currentPassword,
            });

            if (signInError) {
                setError(`Échec de vérification: ${signInError.message === 'Invalid login credentials' ? 'Mot de passe actuel incorrect' : signInError.message}`);
                setLoading(false);
                return;
            }

            // 2. Mettre à jour avec le nouveau mot de passe
            const { error: updateError } = await authService.updatePassword(newPassword);

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }, 1500);

        } catch (err: any) {
            console.error('[ChangePasswordModal] ❌ Error:', err);
            setError(err.message || 'Une erreur est survenue lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Modifier le mot de passe</h2>
                    <button onClick={onClose} style={styles.closeBtn} disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div style={styles.successContent}>
                        <CheckCircle2 size={64} color="#4ade80" />
                        <p style={styles.successText}>Mot de passe mis à jour avec succès !</p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} style={styles.form}>
                        {error && (
                            <div style={styles.errorBanner}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div style={styles.field}>
                            <label style={styles.label}>Mot de passe actuel</label>
                            <div style={styles.inputWrapper}>
                                <Lock size={18} style={styles.inputIcon} />
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    style={styles.eyeBtn}
                                >
                                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Nouveau mot de passe</label>
                            <div style={styles.inputWrapper}>
                                <Lock size={18} style={styles.inputIcon} />
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 6 caractères"
                                    required
                                    style={styles.input}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    style={styles.eyeBtn}
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Confirmer le nouveau mot de passe</label>
                            <div style={styles.inputWrapper}>
                                <Lock size={18} style={styles.inputIcon} />
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Répétez le mot de passe"
                                    required
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...styles.submitBtn,
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spinner" />
                                    <span>Mise à jour...</span>
                                </>
                            ) : 'Mettre à jour'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
    },
    modal: {
        background: '#1a1a1a',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    header: {
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: '18px',
        fontWeight: '700',
        color: 'white',
        margin: 0,
    },
    closeBtn: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: 'none',
        color: 'white',
        width: '32px',
        height: '32px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    form: {
        padding: '24px',
    },
    errorBanner: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '12px',
        padding: '12px',
        color: '#f87171',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
    },
    field: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '8px',
    },
    inputWrapper: {
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute' as const,
        left: '14px',
        color: 'rgba(255, 255, 255, 0.3)',
    },
    input: {
        width: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '14px 45px 14px 42px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s ease',
    },
    eyeBtn: {
        position: 'absolute' as const,
        right: '14px',
        background: 'none',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    },
    submitBtn: {
        width: '100%',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: '0 10px 15px -3px rgba(138, 43, 226, 0.3)',
        marginTop: '10px',
    },
    successContent: {
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        textAlign: 'center' as const,
        gap: '20px',
    },
    successText: {
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        margin: 0,
    },
};

export default ChangePasswordModal;
