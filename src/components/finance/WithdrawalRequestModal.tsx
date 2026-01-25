import React, { useState } from 'react';
import { X, Wallet, AlertCircle } from 'lucide-react';
import { transactionService } from '../../services/transactionService';

interface WithdrawalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    balance: number;
    userRole: 'seller' | 'affiliate';
    onSuccess: () => void;
}

const WithdrawalRequestModal: React.FC<WithdrawalRequestModalProps> = ({ isOpen, onClose, userId, balance, userRole, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [method, setMethod] = useState<'MTN' | 'AIRTEL'>('MTN');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            setError('Montant invalide');
            return;
        }
        if (val > balance) {
            setError('Solde insuffisant');
            return;
        }
        if (val < 5000) { // Min withdrawal
            setError('Le retrait minimum est de 5,000 FCFA');
            return;
        }
        if (!phoneNumber.trim()) {
            setError('Numéro de téléphone requis');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Initiate withdrawal via transaction service
            const { error: txError } = await transactionService.createWithdrawal({
                userId,
                amount: val,
                method: method,
                phoneNumber: phoneNumber
            });

            if (txError) throw txError;

            alert('✅ Demande de retrait envoyée ! Elle sera traitée sous 24h.');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError('Erreur: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Retirer mes gains 💸</h2>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>

                <div style={styles.content}>
                    <div style={styles.balanceInfo}>
                        <Wallet size={20} color="var(--primary)" />
                        <span>Solde disponible : <strong>{balance.toLocaleString()} FCFA</strong></span>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Montant à retirer (Min 5,000 FCFA)</label>
                        <input
                            type="number"
                            style={styles.input}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Mode de paiement</label>
                        <div style={styles.radioGroup}>
                            <button
                                style={{ ...styles.radioBtn, borderColor: method === 'MTN' ? '#FFCC00' : 'rgba(255,255,255,0.1)', background: method === 'MTN' ? 'rgba(255, 204, 0, 0.1)' : 'transparent' }}
                                onClick={() => setMethod('MTN')}
                            >
                                <span style={{ color: '#FFCC00' }}>MTN Mobile Money</span>
                            </button>
                            <button
                                style={{ ...styles.radioBtn, borderColor: method === 'AIRTEL' ? '#FF4444' : 'rgba(255,255,255,0.1)', background: method === 'AIRTEL' ? 'rgba(255, 68, 68, 0.1)' : 'transparent' }}
                                onClick={() => setMethod('AIRTEL')}
                            >
                                <span style={{ color: '#FF4444' }}>Airtel Money</span>
                            </button>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Numéro de téléphone</label>
                        <input
                            type="tel"
                            style={styles.input}
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            placeholder="06 123 4567"
                        />
                    </div>

                    {error && (
                        <div style={styles.error}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Traitement...' : 'Confirmer le retrait'}
                    </button>
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
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
    },
    modal: {
        background: '#1a1a1a',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    title: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    closeBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: '20px',
    },
    balanceInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(138, 43, 226, 0.1)',
        padding: '12px 16px',
        borderRadius: '12px',
        color: 'white',
        marginBottom: '24px',
        fontSize: '14px',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '700',
        color: 'var(--text-secondary)',
        marginBottom: '8px',
    },
    input: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '16px',
        fontWeight: '600',
        color: 'white',
        outline: 'none',
        boxSizing: 'border-box' as const,
    },
    radioGroup: {
        display: 'flex',
        gap: '12px',
    },
    radioBtn: {
        flex: 1,
        padding: '12px',
        borderRadius: '12px',
        border: '2px solid',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '14px',
        textAlign: 'center' as const,
    },
    error: {
        color: '#FF4444',
        fontSize: '13px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 68, 68, 0.1)',
        padding: '10px',
        borderRadius: '8px',
    },
    submitBtn: {
        width: '100%',
        background: 'var(--primary)',
        border: 'none',
        padding: '16px',
        borderRadius: '14px',
        color: 'white',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
    }
};

export default WithdrawalRequestModal;
