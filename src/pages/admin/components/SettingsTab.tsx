import React, { useEffect, useState } from 'react';
import { Save, Percent, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SkeletonBar } from '../../../components/common/SkeletonLoader';

interface PlatformSettings {
    commission_rate: number;
    aggregator_rate: number;
    withdrawal_min: number;
    withdrawal_max: number;
}

const SettingsTab = () => {
    const [settings, setSettings] = useState<PlatformSettings>({
        commission_rate: 5,
        aggregator_rate: 2,
        withdrawal_min: 5000,
        withdrawal_max: 1000000,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('global_settings')
                .select('*')
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                // Si pas de settings, on garde les valeurs par défaut
            } else if (data) {
                setSettings({
                    commission_rate: data.commission_rate || 5,
                    aggregator_rate: data.aggregator_rate || 2,
                    withdrawal_min: data.withdrawal_min || 5000,
                    withdrawal_max: data.withdrawal_max || 1000000,
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // Vérifier d'abord si des settings existent
            const { data: existing } = await supabase
                .from('global_settings')
                .select('id')
                .single();

            let error;
            if (existing) {
                // Update
                const result = await supabase
                    .from('global_settings')
                    .update(settings)
                    .eq('id', existing.id);
                error = result.error;
            } else {
                // Insert
                const result = await supabase
                    .from('global_settings')
                    .insert([settings]);
                error = result.error;
            }

            if (error) {
                setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
                console.error('Error saving settings:', error);
            } else {
                setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès !' });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.section}>
                    <SkeletonBar width={200} height={22} margin="0 0 20px 0" />
                    <div style={styles.grid}>
                        {[1, 2].map((i) => (
                            <div key={i} style={styles.card} className="premium-card">
                                <SkeletonBar width={150} height={18} margin="0 0 12px 0" />
                                <SkeletonBar width="100%" height={48} borderRadius={12} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Message de succès/erreur */}
            {message && (
                <div style={{
                    ...styles.message,
                    ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
                }}>
                    <AlertCircle size={20} />
                    <span>{message.text}</span>
                </div>
            )}

            {/* Commission Rates */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Taux de Commission</h3>
                <p style={styles.sectionDescription}>
                    Configurez les taux de commission prélevés sur chaque transaction
                </p>

                <div style={styles.grid}>
                    <div style={styles.card} className="premium-card">
                        <label style={styles.label}>
                            <Percent size={18} color="var(--primary)" />
                            Commission Plateforme (%)
                        </label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="number"
                                value={settings.commission_rate}
                                onChange={(e) => setSettings({ ...settings, commission_rate: parseFloat(e.target.value) || 0 })}
                                style={styles.input}
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <span style={styles.inputSuffix}>%</span>
                        </div>
                        <p style={styles.helper}>Pourcentage prélevé par Zwa sur chaque vente</p>
                    </div>

                    <div style={styles.card} className="premium-card">
                        <label style={styles.label}>
                            <TrendingUp size={18} color="#FFD700" />
                            Taux Agrégateur (%)
                        </label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="number"
                                value={settings.aggregator_rate}
                                onChange={(e) => setSettings({ ...settings, aggregator_rate: parseFloat(e.target.value) || 0 })}
                                style={styles.input}
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <span style={styles.inputSuffix}>%</span>
                        </div>
                        <p style={styles.helper}>Frais de service des opérateurs Mobile Money</p>
                    </div>
                </div>
            </div>

            {/* Withdrawal Limits */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Limites de Retrait</h3>
                <p style={styles.sectionDescription}>
                    Définissez les montants minimum et maximum pour les retraits Mobile Money
                </p>

                <div style={styles.grid}>
                    <div style={styles.card} className="premium-card">
                        <label style={styles.label}>
                            <DollarSign size={18} color="#00CC66" />
                            Montant Minimum
                        </label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="number"
                                value={settings.withdrawal_min}
                                onChange={(e) => setSettings({ ...settings, withdrawal_min: parseFloat(e.target.value) || 0 })}
                                style={styles.input}
                                min="0"
                                step="1000"
                            />
                            <span style={styles.inputSuffix}>FCFA</span>
                        </div>
                        <p style={styles.helper}>Retrait minimum autorisé par transaction</p>
                    </div>

                    <div style={styles.card} className="premium-card">
                        <label style={styles.label}>
                            <DollarSign size={18} color="#FF6B6B" />
                            Montant Maximum
                        </label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="number"
                                value={settings.withdrawal_max}
                                onChange={(e) => setSettings({ ...settings, withdrawal_max: parseFloat(e.target.value) || 0 })}
                                style={styles.input}
                                min="0"
                                step="10000"
                            />
                            <span style={styles.inputSuffix}>FCFA</span>
                        </div>
                        <p style={styles.helper}>Retrait maximum autorisé par transaction</p>
                    </div>
                </div>
            </div>

            {/* Example Calculation */}
            <div style={styles.exampleSection} className="premium-card">
                <h4 style={styles.exampleTitle}>Exemple de Répartition (Vente à 10,000 FCFA)</h4>
                <div style={styles.exampleGrid}>
                    <div style={styles.exampleItem}>
                        <span style={styles.exampleLabel}>Montant Client</span>
                        <span style={styles.exampleValue}>10,000 FCFA</span>
                    </div>
                    <div style={styles.exampleItem}>
                        <span style={styles.exampleLabel}>Frais Agrégateur ({settings.aggregator_rate}%)</span>
                        <span style={styles.exampleValue}>-{(10000 * settings.aggregator_rate / 100).toFixed(0)} FCFA</span>
                    </div>
                    <div style={styles.exampleItem}>
                        <span style={styles.exampleLabel}>Commission Zwa ({settings.commission_rate}%)</span>
                        <span style={styles.exampleValue}>-{(10000 * settings.commission_rate / 100).toFixed(0)} FCFA</span>
                    </div>
                    <div style={{ ...styles.exampleItem, ...styles.exampleTotal }}>
                        <span style={styles.exampleLabel}>Part Vendeur</span>
                        <span style={styles.exampleValue}>
                            {(10000 - (10000 * settings.aggregator_rate / 100) - (10000 * settings.commission_rate / 100)).toFixed(0)} FCFA
                        </span>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    ...styles.saveButton,
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                }}
                className="premium-button"
            >
                <Save size={20} />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les Paramètres'}
            </button>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '32px',
        maxWidth: '900px',
    },
    message: {
        padding: '16px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '600',
    },
    successMessage: {
        background: 'rgba(0, 204, 102, 0.1)',
        border: '1px solid rgba(0, 204, 102, 0.3)',
        color: '#00CC66',
    },
    errorMessage: {
        background: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        color: '#FF6B6B',
    },
    section: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
    },
    sectionDescription: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '8px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
    },
    card: {
        padding: '24px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '700',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    inputWrapper: {
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        padding: '14px 60px 14px 16px',
        fontSize: '18px',
        fontWeight: '700',
        color: 'white',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        outline: 'none',
        transition: 'all 0.2s',
    },
    inputSuffix: {
        position: 'absolute' as const,
        right: '16px',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    helper: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '4px',
    },
    exampleSection: {
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.05) 0%, rgba(255, 215, 0, 0.02) 100%)',
    },
    exampleTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '16px',
    },
    exampleGrid: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    exampleItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
    },
    exampleLabel: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
    },
    exampleValue: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'white',
    },
    exampleTotal: {
        background: 'rgba(138, 43, 226, 0.1)',
        border: '1px solid rgba(138, 43, 226, 0.2)',
        marginTop: '8px',
    },
    saveButton: {
        padding: '16px 32px',
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        background: 'linear-gradient(135deg, var(--primary) 0%, #6B21A8 100%)',
        border: 'none',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        transition: 'all 0.2s',
        alignSelf: 'flex-start',
    },
};

export default SettingsTab;
