import React, { useState } from 'react';
import { Phone, MapPin, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { phone: string; location: string }) => void;
    productName: string;
    totalAmount: number;
}

const CheckoutModal = ({ isOpen, onClose, onConfirm, productName, totalAmount }: CheckoutModalProps) => {
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (phone.length < 8) {
            setError('Veuillez entrer un numéro de téléphone valide.');
            return;
        }
        if (location.length < 3) {
            setError('Veuillez préciser votre quartier ou ville.');
            return;
        }

        onConfirm({ phone, location });
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} className="premium-card">
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <ShieldCheck size={20} color="var(--primary)" />
                        <h2 style={styles.title}>Checkout Sécurisé</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.summary}>
                    <div style={styles.summaryLabel}>Produit : <span style={styles.summaryVal}>{productName}</span></div>
                    <div style={styles.summaryLabel}>Total à payer : <span style={styles.summaryPrice}>{totalAmount.toLocaleString()} FCFA</span></div>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <p style={styles.instruction}>
                        Ces informations permettront au vendeur de vous contacter sur **WhatsApp** ou par **Téléphone** pour fixer le RDV de livraison.
                    </p>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Votre Numéro (WhatsApp de préférence)</label>
                        <div style={styles.inputWrapper}>
                            <Phone size={18} style={styles.inputIcon} />
                            <input
                                type="tel"
                                placeholder="ex: 06 432 10 98"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={styles.input}
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Lieu de livraison (Quartier / Ville)</label>
                        <div style={styles.inputWrapper}>
                            <MapPin size={18} style={styles.inputIcon} />
                            <input
                                type="text"
                                placeholder="ex: Poto-Poto, Brazzaville"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

                    {error && <div style={styles.error}>{error}</div>}

                    <div style={styles.infoBox}>
                        🛡️ Votre argent est bloqué par Zwa jusqu'à ce que vous confirmiez avoir reçu le colis.
                    </div>

                    <button type="submit" style={styles.submitBtn}>
                        <span>Continuer vers le paiement</span>
                        <ArrowRight size={20} />
                    </button>
                </form>
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
        // backdropFilter removed - causes crashes,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
    },
    modal: {
        width: '100%',
        maxWidth: '450px',
        background: '#1a1a1a',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        padding: '5px',
    },
    summary: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    summaryLabel: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginBottom: '4px',
    },
    summaryVal: {
        color: 'white',
        fontWeight: '600',
    },
    summaryPrice: {
        color: 'var(--primary)',
        fontWeight: '800',
        fontSize: '16px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    instruction: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
        margin: '0 0 8px 0',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    inputWrapper: {
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute' as const,
        left: '12px',
        color: 'var(--text-secondary)',
    },
    input: {
        width: '100%',
        padding: '14px 14px 14px 40px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s ease',
        ':focus': {
            border: '1px solid var(--primary)',
            background: 'rgba(255,255,255,0.08)',
        }
    } as any,
    submitBtn: {
        marginTop: '10px',
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
        gap: '12px',
        transition: 'transform 0.2s ease, filter 0.2s ease',
        ':hover': {
            filter: 'brightness(1.1)',
        },
        ':active': {
            transform: 'scale(0.98)',
        }
    } as any,
    error: {
        color: '#FF3B30',
        fontSize: '13px',
        textAlign: 'center' as const,
        fontWeight: '500',
    },
    infoBox: {
        background: 'rgba(0, 204, 102, 0.05)',
        border: '1px solid rgba(0, 204, 102, 0.1)',
        borderRadius: '12px',
        padding: '12px',
        fontSize: '12px',
        color: '#00CC66',
        textAlign: 'center' as const,
        lineHeight: '1.4',
    }
};

export default CheckoutModal;
