import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Wallet, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useSkeletonAnimation, SkeletonProfile } from '../../components/common/SkeletonLoader';

const ProfilePage = () => {
    useSkeletonAnimation(); // Ajoute l'animation CSS
    const { user, logout } = useAuth();
    const { data: profile, isLoading: profileLoading, error: profileError, refetch: retryFetchProfile } = useProfile(user?.id);
    const navigate = useNavigate();

    const loading = profileLoading || !user;

    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };


    const handleDebug = () => {
        console.log("--- DEBUG AUTH ---");
        console.log("User Object:", user);
        console.log("Profile State:", profile);
        console.log("User ID:", user?.id);
        alert(`ID Utilisateur: ${user?.id}\nProfil chargé: ${profile ? 'OUI' : 'NON'}\nRôle: ${profile?.role || 'Inconnu'}`);
    };

    if (loading) return <SkeletonProfile showWallet={profile?.role !== 'buyer'} />;
    if (!user) return null;

    // If there's a profile error, show error UI with retry option
    if (profileError) {
        return (
            <div style={styles.centered}>
                <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ color: '#FF4444', marginBottom: '16px' }}>Erreur de chargement</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                        {profileError?.message || "Impossible de charger le profil"}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => retryFetchProfile()}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'var(--primary)',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(138, 43, 226, 0.4)'
                            }}
                        >
                            🔄 Réessayer
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            🚪 Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <button onClick={handleDebug} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '10px' }}>Debug</button>
                </div>
                <div style={styles.avatar}>
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.full_name || 'Avatar'}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <span>{profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                </div>
                <h1 style={styles.name}>{profile?.full_name || 'Utilisateur Zwa'}</h1>
                <div style={styles.roleBadge}>
                    <Shield size={12} />
                    <span>
                        {profile?.role === 'seller' ? 'Vendeur' :
                            profile?.role === 'affiliate' ? 'Affilié' :
                                profile?.role === 'admin' ? 'Administrateur' :
                                    profile?.role === 'buyer' ? 'Acheteur' : `Inconnu (${profile?.role || 'null'})`}
                    </span>
                </div>
                {!profile && (
                    <p style={{ color: '#FF4444', fontSize: '11px', marginTop: '10px' }}>
                        ⚠️ Profil non synchronisé. Veuillez contacter le support.
                    </p>
                )}
            </header>

            {/* Wallet Section - Only for sellers and affiliates */}
            {profile?.role !== 'buyer' && (
                <div style={styles.section}>
                    <div style={styles.walletCard} className="premium-card">
                        <div style={styles.walletInfo}>
                            <div style={styles.walletLabel}>Solde Wallet</div>
                            <div style={styles.walletAmount}>
                                {profile?.wallet_balance?.toLocaleString() || '0'} <span style={{ fontSize: '14px' }}>FCFA</span>
                            </div>
                        </div>
                        <button style={styles.topUpBtn}>Retirer</button>
                    </div>
                </div>
            )}

            <div style={styles.menuList}>
                <div
                    style={styles.menuItem}
                    className="premium-card"
                    onClick={() => navigate('/profile/settings')}
                >
                    <div style={styles.menuIcon}><Settings size={20} /></div>
                    <div style={styles.menuLabel}>Paramètres du compte</div>
                    <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                </div>

                {/* Store Settings - Only for sellers */}
                {profile?.role === 'seller' && (
                    <div
                        style={styles.menuItem}
                        className="premium-card"
                        onClick={() => navigate('/seller/edit-store')}
                    >
                        <div style={{ ...styles.menuIcon, background: 'rgba(138, 43, 226, 0.1)' }}>
                            <Settings size={20} color="var(--primary)" />
                        </div>
                        <div style={styles.menuLabel}>Ma Boutique Business</div>
                        <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                    </div>
                )}

                {/* Transactions - For everyone (buyers see purchases, sellers see sales, affiliates see commissions) */}
                <div
                    style={styles.menuItem}
                    className="premium-card"
                    onClick={() => navigate('/profile/transactions')}
                >
                    <div style={styles.menuIcon}><Wallet size={20} /></div>
                    <div style={styles.menuLabel}>
                        {profile?.role === 'buyer' ? 'Historique des achats' : 'Historique des transactions'}
                    </div>
                    <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                </div>

                <div
                    style={{ ...styles.menuItem, marginTop: '20px', color: '#FF4444' }}
                    className="premium-card"
                    onClick={handleLogout}
                >
                    <div style={{ ...styles.menuIcon, background: 'rgba(255, 68, 68, 0.1)' }}>
                        <LogOut size={20} color="#FF4444" />
                    </div>
                    <div style={{ ...styles.menuLabel, fontWeight: '700' }}>Se déconnecter</div>
                </div>
            </div>

            <div style={styles.footer}>
                <p>Zwa App v1.0.2</p>
                <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.5 }}>ID: {user.id.substring(0, 8)}...</p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '40px 20px',
        maxWidth: '500px',
        margin: '0 auto',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        marginBottom: '40px',
    },
    avatar: {
        width: '80px',
        height: '80px',
        background: 'var(--primary)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        fontWeight: '900',
        color: 'white',
        marginBottom: '16px',
        boxShadow: '0 10px 30px rgba(138, 43, 226, 0.4)',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    name: {
        fontSize: '24px',
        fontWeight: '800',
        color: 'white',
        marginBottom: '8px',
    },
    roleBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255,255,255,0.05)',
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: '700',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
    },
    section: {
        marginBottom: '32px',
    },
    walletCard: {
        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(138, 43, 226, 0.05) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.3)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    walletLabel: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
    },
    walletAmount: {
        fontSize: '24px',
        fontWeight: '900',
        color: 'white',
    },
    topUpBtn: {
        background: 'white',
        color: 'black',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '800',
        cursor: 'pointer',
    },
    menuList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    menuItem: {
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
    },
    menuIcon: {
        width: '40px',
        height: '40px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: '15px',
        fontWeight: '600',
    },
    footer: {
        marginTop: '60px',
        textAlign: 'center' as const,
        fontSize: '12px',
        color: 'var(--text-secondary)',
        opacity: 0.8,
    },
    centered: {
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        background: '#121212',
        color: 'var(--primary)',
        gap: '20px',
    }
};

export default ProfilePage;
