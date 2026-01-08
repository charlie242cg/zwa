import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';

const AuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('buyer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [returnUrl, setReturnUrl] = useState<string | null>(null);

    useEffect(() => {
        // Get returnUrl from query parameters
        const url = searchParams.get('returnUrl');
        if (url) {
            setReturnUrl(url);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                console.log('[AuthPage] 🔐 Attempting login...');
                const { data: authData, error } = await authService.signIn(email, password);

                if (error) {
                    console.error('[AuthPage] ❌ Login error:', error.message);
                    throw error;
                }

                console.log('[AuthPage] ✅ Login successful, user:', authData.user?.email);
                // AuthContext will automatically detect the session change
                // and handle profile loading + navigation

                // If there's a returnUrl, redirect to it after successful login
                if (returnUrl) {
                    console.log('[AuthPage] 🔄 Redirecting to:', returnUrl);
                    setTimeout(() => navigate(returnUrl), 500); // Small delay to ensure auth state is updated
                }
                // Otherwise, AuthContext will handle default navigation

            } else {
                console.log('[AuthPage] 📝 Attempting signup...');
                const { error } = await authService.signUp(email, password, role, fullName);

                if (error) {
                    console.error('[AuthPage] ❌ Signup error:', error.message);
                    throw error;
                }

                console.log('[AuthPage] ✅ Signup successful, please check email for confirmation');
                setIsLogin(true); // Switch to login after signup
            }
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={styles.container}>
            <div className="premium-card" style={styles.card}>
                <h2 style={styles.title}>{isLogin ? 'Connexion' : 'Créer un compte'}</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Nom Complet</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={styles.input}
                                placeholder="Jean Dupont"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Je suis un :</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={styles.input}
                            >
                                <option value="buyer">Acheteur</option>
                                <option value="seller">Vendeur</option>
                                <option value="affiliate">Affilié</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
                    </button>
                </form>

                <p style={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        padding: '20px',
        background: 'var(--background)',
        boxSizing: 'border-box' as const,
        position: 'fixed' as const,
        top: 0,
        left: 0,
    },
    card: {
        width: '100%',
        maxWidth: '420px',
        padding: '30px',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
    },
    title: {
        textAlign: 'center' as const,
        marginBottom: '32px',
        color: 'var(--primary)',
        fontSize: '28px',
        fontWeight: 'bold',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
    },
    label: {
        fontSize: '15px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
    },
    input: {
        padding: '16px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'white',
        outline: 'none',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    button: {
        padding: '16px',
        borderRadius: '14px',
        border: 'none',
        background: 'var(--primary)',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '18px',
        cursor: 'pointer',
        marginTop: '16px',
        boxShadow: '0 8px 25px rgba(138, 43, 226, 0.5)',
    },
    toggle: {
        marginTop: '30px',
        textAlign: 'center' as const,
        fontSize: '15px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: '500',
    },
    error: {
        background: 'rgba(255, 68, 68, 0.15)',
        color: '#ff6666',
        padding: '14px',
        borderRadius: '12px',
        marginBottom: '24px',
        fontSize: '14px',
        textAlign: 'center' as const,
        border: '1px solid rgba(255, 68, 68, 0.3)',
    }
};

export default AuthPage;
