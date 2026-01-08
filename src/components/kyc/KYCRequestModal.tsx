import React, { useState } from 'react';
import { X, Upload, FileCheck, AlertCircle } from 'lucide-react';
import { kycService } from '../../services/kycService';

interface KYCRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    sellerId: string;
    existingRequest?: any;
    onSuccess: () => void;
}

const KYCRequestModal: React.FC<KYCRequestModalProps> = ({ isOpen, onClose, sellerId, existingRequest, onSuccess }) => {
    const [idCardFile, setIdCardFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [whatsapp, setWhatsapp] = useState(existingRequest?.whatsapp_number || '');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'id_card' | 'selfie') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La photo ne doit pas dépasser 5MB');
            return;
        }

        // Vérifier le type
        if (!file.type.startsWith('image/')) {
            setError('Veuillez uploader une image (JPG, PNG)');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'id_card') {
                setIdCardPreview(reader.result as string);
                setIdCardFile(file);
            } else {
                setSelfiePreview(reader.result as string);
                setSelfieFile(file);
            }
        };
        reader.readAsDataURL(file);
        setError('');
    };

    const handleSubmit = async () => {
        // Validation
        if (!idCardFile && !existingRequest) {
            setError('Veuillez ajouter une photo de votre carte d\'identité');
            return;
        }
        if (!selfieFile && !existingRequest) {
            setError('Veuillez ajouter un selfie avec votre pièce d\'identité');
            return;
        }
        if (!whatsapp.trim()) {
            setError('Veuillez entrer votre numéro WhatsApp');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let idCardUrl = existingRequest?.id_card_url;
            let selfieUrl = existingRequest?.selfie_with_id_url;

            // Upload nouvelle photo ID si changée
            if (idCardFile) {
                const { url, error: uploadError } = await kycService.uploadKYCDocument(idCardFile, sellerId, 'id_card');
                if (uploadError) {
                    setError('Erreur lors de l\'upload de la carte d\'identité');
                    setLoading(false);
                    return;
                }
                idCardUrl = url;
            }

            // Upload nouveau selfie si changé
            if (selfieFile) {
                const { url, error: uploadError } = await kycService.uploadKYCDocument(selfieFile, sellerId, 'selfie');
                if (uploadError) {
                    setError('Erreur lors de l\'upload du selfie');
                    setLoading(false);
                    return;
                }
                selfieUrl = url;
            }

            // Soumettre ou re-soumettre la demande
            let result;
            if (existingRequest && existingRequest.status === 'rejected') {
                result = await kycService.resubmitKYCRequest(existingRequest.id, {
                    id_card_url: idCardUrl!,
                    selfie_with_id_url: selfieUrl!,
                    whatsapp_number: whatsapp.trim(),
                    notes: notes.trim() || undefined
                });
            } else {
                result = await kycService.submitKYCRequest({
                    seller_id: sellerId,
                    id_card_url: idCardUrl!,
                    selfie_with_id_url: selfieUrl!,
                    whatsapp_number: whatsapp.trim(),
                    notes: notes.trim() || undefined
                });
            }

            if (result.error) {
                setError('Erreur lors de la soumission: ' + result.error.message);
                setLoading(false);
                return;
            }

            alert('✅ Demande KYC soumise avec succès !\n\nVous recevrez une notification une fois validée par notre équipe.');
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
            <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="premium-card">
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <FileCheck size={24} color="var(--primary)" />
                        <h2 style={styles.title}>
                            {existingRequest?.status === 'rejected' ? 'Re-soumettre' : 'Demander'} la vérification KYC
                        </h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.content}>
                    <div style={styles.infoBox}>
                        <AlertCircle size={16} color="#FFB800" />
                        <p style={styles.infoText}>
                            La vérification KYC est <strong>requise pour retirer vos gains</strong>.
                            Nous avons besoin de vérifier votre identité pour la sécurité de tous.
                        </p>
                    </div>

                    {existingRequest?.status === 'rejected' && (
                        <div style={styles.rejectionBox}>
                            <strong>Raison du rejet :</strong>
                            <p>{existingRequest.admin_notes}</p>
                            <p style={styles.rejectionHint}>Veuillez corriger et re-soumettre.</p>
                        </div>
                    )}

                    {error && (
                        <div style={styles.errorBox}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Upload Carte d'identité */}
                    <div style={styles.uploadSection}>
                        <label style={styles.label}>
                            1. Photo de votre carte d'identité (recto/verso)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'id_card')}
                            style={{ display: 'none' }}
                            id="id-card-upload"
                        />
                        <label htmlFor="id-card-upload" style={styles.uploadBtn}>
                            <Upload size={20} />
                            {idCardPreview || existingRequest?.id_card_url ? 'Changer la photo' : 'Choisir une photo'}
                        </label>
                        {(idCardPreview || existingRequest?.id_card_url) && (
                            <img
                                src={idCardPreview || existingRequest?.id_card_url}
                                style={styles.preview}
                                alt="Carte d'identité"
                            />
                        )}
                    </div>

                    {/* Upload Selfie */}
                    <div style={styles.uploadSection}>
                        <label style={styles.label}>
                            2. Selfie de vous tenant votre pièce d'identité
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'selfie')}
                            style={{ display: 'none' }}
                            id="selfie-upload"
                        />
                        <label htmlFor="selfie-upload" style={styles.uploadBtn}>
                            <Upload size={20} />
                            {selfiePreview || existingRequest?.selfie_with_id_url ? 'Changer la photo' : 'Choisir une photo'}
                        </label>
                        {(selfiePreview || existingRequest?.selfie_with_id_url) && (
                            <img
                                src={selfiePreview || existingRequest?.selfie_with_id_url}
                                style={styles.preview}
                                alt="Selfie"
                            />
                        )}
                    </div>

                    {/* WhatsApp */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>3. Numéro WhatsApp</label>
                        <input
                            type="tel"
                            placeholder="+243 81 234 5678"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    {/* Notes */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Notes (optionnel)</label>
                        <textarea
                            placeholder="Informations complémentaires..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            style={styles.textarea}
                            rows={3}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            ...styles.submitBtn,
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '⏳ Envoi en cours...' : '✅ Soumettre ma demande'}
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
    },
    modal: {
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        borderRadius: '16px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        margin: 0,
    },
    closeBtn: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
    },
    infoBox: {
        display: 'flex',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        border: '1px solid rgba(255, 184, 0, 0.2)',
        borderRadius: '12px',
        alignItems: 'flex-start',
    },
    infoText: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        margin: 0,
        lineHeight: '1.5',
    },
    rejectionBox: {
        padding: '16px',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        border: '1px solid rgba(255, 69, 58, 0.2)',
        borderRadius: '12px',
        fontSize: '14px',
    },
    rejectionHint: {
        marginTop: '8px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
    },
    errorBox: {
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        border: '1px solid rgba(255, 69, 58, 0.2)',
        borderRadius: '8px',
        color: '#FF453A',
        fontSize: '14px',
        alignItems: 'center',
    },
    uploadSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '700',
        color: 'white',
    },
    uploadBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '700',
        color: 'white',
        transition: 'all 0.2s',
    },
    preview: {
        width: '100%',
        maxHeight: '200px',
        objectFit: 'cover' as const,
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    input: {
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        fontSize: '14px',
        color: 'white',
        outline: 'none',
    },
    textarea: {
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        fontSize: '14px',
        color: 'white',
        outline: 'none',
        resize: 'vertical' as const,
        fontFamily: 'inherit',
    },
    submitBtn: {
        padding: '16px',
        backgroundColor: 'var(--primary)',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
        cursor: 'pointer',
        marginTop: '8px',
    },
};

export default KYCRequestModal;
