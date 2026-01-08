import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
    isOpen: boolean;
    imageUrl: string;
    title?: string;
    onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, imageUrl, title, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.container} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <div style={styles.title}>
                        <ZoomIn size={20} color="var(--primary)" />
                        {title || 'Aperçu'}
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>
                <div style={styles.imageContainer}>
                    <img src={imageUrl} alt={title} style={styles.image} />
                </div>
                <div style={styles.hint}>
                    Cliquez à l'extérieur pour fermer
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
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
    },
    container: {
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
    },
    closeBtn: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px',
        cursor: 'pointer',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
    },
    imageContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '90vw',
        maxHeight: 'calc(90vh - 80px)',
        overflow: 'hidden',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain' as const,
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    },
    hint: {
        textAlign: 'center' as const,
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.5)',
        fontStyle: 'italic',
    },
};

export default ImageLightbox;
