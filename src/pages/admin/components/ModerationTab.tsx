import React, { useEffect, useState } from 'react';
import { Shield, Eye, Trash2, Search, Filter, Store, Package, FileCheck, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { kycService } from '../../../services/kycService';
import { useAuth } from '../../../hooks/useAuth';
import ImageLightbox from '../../../components/common/ImageLightbox';

const ModerationTab = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'sellers' | 'products' | 'kyc'>('sellers');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // KYC states
    const [kycRequests, setKycRequests] = useState<any[]>([]);
    const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, [view, kycFilter]);

    const fetchData = async () => {
        setLoading(true);
        if (view === 'sellers') {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'seller')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Erreur chargement vendeurs:', error);
            }
            if (data) setData(data);
        } else if (view === 'products') {
            const { data, error } = await supabase
                .from('products')
                .select('*, profiles!products_seller_id_fkey(full_name, store_name)')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Erreur chargement produits:', error);
            }
            if (data) setData(data);
        } else if (view === 'kyc') {
            const { data, error } = await kycService.getAllKYCRequests(
                kycFilter === 'all' ? undefined : kycFilter
            );
            if (error) {
                console.error('Erreur chargement demandes KYC:', error);
            }
            if (data) setKycRequests(data);
        }
        setLoading(false);
    };

    const toggleVerification = async (id: string, current: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_verified_seller: !current })
            .eq('id', id);
        if (!error) fetchData();
    };

    const toggleKYC = async (id: string, current: boolean) => {
        const action = !current ? 'vérifier' : 'retirer la vérification';
        if (!window.confirm(`Voulez-vous ${action} le KYC de ce vendeur ?

${!current ? '✅ Le vendeur pourra effectuer des retraits' : '⚠️ Le vendeur ne pourra plus effectuer de retraits'}

Continuer ?`)) return;

        const { error } = await supabase
            .from('profiles')
            .update({ kyc_verified: !current })
            .eq('id', id);

        if (!error) {
            fetchData();
            alert(`✅ KYC ${!current ? 'validé' : 'révoqué'} avec succès`);
        } else {
            alert('❌ Erreur: ' + error.message);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!window.confirm('Supprimer définitivement ce produit ?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) fetchData();
    };

    const approveKYC = async (request: any) => {
        const notes = window.prompt('Notes de validation (optionnel):');
        if (notes === null) return; // Annulé

        const { error } = await kycService.approveKYCRequest(
            request.id,
            request.seller_id,
            user?.id || '',
            notes || undefined
        );

        if (error) {
            alert('❌ Erreur: ' + error.message);
        } else {
            alert('✅ KYC approuvé ! Le vendeur peut maintenant retirer ses fonds.');
            fetchData();
        }
    };

    const rejectKYC = async (request: any) => {
        const reason = window.prompt('Raison du rejet (sera envoyée au vendeur):');
        if (!reason || !reason.trim()) {
            alert('⚠️ Vous devez fournir une raison de rejet.');
            return;
        }

        const { error } = await kycService.rejectKYCRequest(
            request.id,
            user?.id || '',
            reason.trim()
        );

        if (error) {
            alert('❌ Erreur: ' + error.message);
        } else {
            alert('❌ Demande KYC rejetée. Le vendeur sera notifié.');
            fetchData();
        }
    };

    const filteredData = data.filter(item => {
        const name = item.full_name || item.store_name || item.name || '';
        return name.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.tabs}>
                    <button
                        onClick={() => setView('sellers')}
                        style={{ ...styles.tabBtn, backgroundColor: view === 'sellers' ? 'var(--primary)' : 'transparent' }}
                    >
                        <Store size={18} /> Vendeurs
                    </button>
                    <button
                        onClick={() => setView('products')}
                        style={{ ...styles.tabBtn, backgroundColor: view === 'products' ? 'var(--primary)' : 'transparent' }}
                    >
                        <Package size={18} /> Produits
                    </button>
                    <button
                        onClick={() => setView('kyc')}
                        style={{ ...styles.tabBtn, backgroundColor: view === 'kyc' ? 'var(--primary)' : 'transparent' }}
                    >
                        <FileCheck size={18} /> Demandes KYC
                    </button>
                </div>

                {view === 'kyc' ? (
                    <div style={styles.kycFilters}>
                        <button
                            onClick={() => setKycFilter('all')}
                            style={{ ...styles.filterBtn, backgroundColor: kycFilter === 'all' ? 'var(--primary)' : 'transparent' }}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setKycFilter('pending')}
                            style={{ ...styles.filterBtn, backgroundColor: kycFilter === 'pending' ? '#FFB800' : 'transparent' }}
                        >
                            En attente
                        </button>
                        <button
                            onClick={() => setKycFilter('approved')}
                            style={{ ...styles.filterBtn, backgroundColor: kycFilter === 'approved' ? '#00CC66' : 'transparent' }}
                        >
                            Approuvés
                        </button>
                        <button
                            onClick={() => setKycFilter('rejected')}
                            style={{ ...styles.filterBtn, backgroundColor: kycFilter === 'rejected' ? '#FF453A' : 'transparent' }}
                        >
                            Rejetés
                        </button>
                    </div>
                ) : (
                    <div style={styles.searchBar}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                )}
            </div>

            {loading ? <div style={styles.loading}>Chargement...</div> : view === 'kyc' ? (
                <div style={styles.kycGrid}>
                    {kycRequests.length === 0 ? (
                        <div style={styles.emptyState}>
                            <FileCheck size={48} color="rgba(255,255,255,0.2)" />
                            <p>Aucune demande KYC pour le moment.</p>
                        </div>
                    ) : (
                        kycRequests.map((request) => (
                            <div key={request.id} style={styles.kycRequestCard} className="premium-card">
                                <div style={styles.kycHeader}>
                                    <div style={styles.kycSellerInfo}>
                                        <div style={styles.kycSellerName}>
                                            {request.profiles?.store_name || request.profiles?.full_name}
                                        </div>
                                        <div style={styles.kycSellerMeta}>
                                            {request.profiles?.phone_number} • WhatsApp: {request.whatsapp_number}
                                        </div>
                                    </div>
                                    <div style={{
                                        ...styles.kycStatusBadge,
                                        backgroundColor: request.status === 'pending' ? 'rgba(255, 184, 0, 0.1)' :
                                            request.status === 'approved' ? 'rgba(0, 204, 102, 0.1)' :
                                                'rgba(255, 69, 58, 0.1)',
                                        color: request.status === 'pending' ? '#FFB800' :
                                            request.status === 'approved' ? '#00CC66' :
                                                '#FF453A'
                                    }}>
                                        {request.status === 'pending' ? '⏳ En attente' :
                                            request.status === 'approved' ? '✅ Approuvé' :
                                                '❌ Rejeté'}
                                    </div>
                                </div>

                                <div style={styles.kycDocuments}>
                                    <div style={styles.kycDoc}>
                                        <div style={styles.kycDocLabel}>Carte d'identité</div>
                                        <img
                                            src={request.id_card_url}
                                            style={styles.kycDocImg}
                                            alt="ID Card"
                                            onClick={() => setLightboxImage({ url: request.id_card_url, title: 'Carte d\'identité' })}
                                        />
                                    </div>
                                    <div style={styles.kycDoc}>
                                        <div style={styles.kycDocLabel}>Selfie avec pièce</div>
                                        <img
                                            src={request.selfie_with_id_url}
                                            style={styles.kycDocImg}
                                            alt="Selfie"
                                            onClick={() => setLightboxImage({ url: request.selfie_with_id_url, title: 'Selfie avec pièce' })}
                                        />
                                    </div>
                                </div>

                                {request.notes && (
                                    <div style={styles.kycNotes}>
                                        <strong>Notes vendeur:</strong> {request.notes}
                                    </div>
                                )}

                                {request.admin_notes && (
                                    <div style={styles.kycAdminNotes}>
                                        <strong>Notes admin:</strong> {request.admin_notes}
                                    </div>
                                )}

                                {request.status === 'pending' && (
                                    <div style={styles.kycActions}>
                                        <button
                                            onClick={() => rejectKYC(request)}
                                            style={styles.kycRejectBtn}
                                        >
                                            <XCircle size={18} /> Rejeter
                                        </button>
                                        <button
                                            onClick={() => approveKYC(request)}
                                            style={styles.kycApproveBtn}
                                        >
                                            <CheckCircle size={18} /> Approuver KYC
                                        </button>
                                    </div>
                                )}

                                <div style={styles.kycFooter}>
                                    Soumis le {new Date(request.created_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div style={styles.grid}>
                    {filteredData.map((item) => (
                        <div key={item.id} style={styles.card} className="premium-card">
                            {view === 'sellers' ? (
                                <div style={styles.sellerCard}>
                                    <div style={styles.avatar}>
                                        {item.avatar_url ? <img src={item.avatar_url} style={styles.img} alt="" /> : (item.store_name || item.full_name || '?').charAt(0)}
                                    </div>
                                    <div style={styles.info}>
                                        <div style={styles.name}>{item.store_name || item.full_name}</div>
                                        <div style={styles.meta}>{item.phone_number || 'Pas de numéro'}</div>
                                        <div style={styles.badges}>
                                            {item.is_verified_seller && (
                                                <span style={styles.badge}>
                                                    <Shield size={12} /> Vérifié
                                                </span>
                                            )}
                                            {item.kyc_verified && (
                                                <span style={{ ...styles.badge, ...styles.kycBadge }}>
                                                    <FileCheck size={12} /> KYC OK
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={styles.actions}>
                                        <button
                                            onClick={() => toggleVerification(item.id, item.is_verified_seller)}
                                            style={{ ...styles.verifyBtn, color: item.is_verified_seller ? '#00CC66' : 'var(--text-secondary)' }}
                                            title="Badge vérifié (visible aux acheteurs)"
                                        >
                                            <Shield size={20} fill={item.is_verified_seller ? '#00CC66' : 'none'} />
                                        </button>
                                        <button
                                            onClick={() => toggleKYC(item.id, item.kyc_verified)}
                                            style={{ ...styles.verifyBtn, color: item.kyc_verified ? '#FFD700' : 'var(--text-secondary)' }}
                                            title="Vérification KYC (requis pour retraits)"
                                        >
                                            <FileCheck size={20} fill={item.kyc_verified ? '#FFD700' : 'none'} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={styles.productCard}>
                                    <img src={item.image_url || '/placeholder-product.png'} style={styles.prodImg} alt="" />
                                    <div style={styles.prodInfo}>
                                        <div style={styles.prodName}>{item.name || 'Produit sans nom'}</div>
                                        <div style={styles.prodSeller}>Par {item.profiles?.store_name || item.profiles?.full_name || 'Vendeur inconnu'}</div>
                                        <div style={styles.prodPrice}>{(item.price || 0).toLocaleString()} FCFA</div>
                                    </div>
                                    <div style={styles.prodActions}>
                                        <button onClick={() => deleteProduct(item.id)} style={styles.deleteBtn}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox pour voir les documents en grand */}
            <ImageLightbox
                isOpen={!!lightboxImage}
                imageUrl={lightboxImage?.url || ''}
                title={lightboxImage?.title}
                onClose={() => setLightboxImage(null)}
            />
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: '20px',
    },
    tabs: {
        display: 'flex',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '10px',
        gap: '4px',
    },
    tabBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '8px 16px',
        borderRadius: '10px',
        width: '300px',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '14px',
        width: '100%',
        outline: 'none',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
    },
    card: {
        padding: '16px',
    },
    sellerCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        overflow: 'hidden',
    },
    img: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    info: {
        flex: 1,
    },
    name: {
        fontWeight: '700',
        fontSize: '15px',
    },
    meta: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    badges: {
        display: 'flex',
        gap: '6px',
        marginTop: '6px',
        flexWrap: 'wrap' as const,
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: 'rgba(0, 204, 102, 0.1)',
        color: '#00CC66',
    },
    kycBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        color: '#FFD700',
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    verifyBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
    },
    productCard: {
        display: 'flex',
        gap: '12px',
    },
    prodImg: {
        width: '80px',
        height: '80px',
        borderRadius: '10px',
        objectFit: 'cover' as const,
    },
    prodInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
    },
    prodName: {
        fontWeight: '700',
        fontSize: '14px',
        marginBottom: '4px',
    },
    prodSeller: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
    },
    prodPrice: {
        fontSize: '14px',
        fontWeight: '900',
        color: 'var(--primary)',
        marginTop: '4px',
    },
    prodActions: {
        display: 'flex',
        alignItems: 'center',
    },
    deleteBtn: {
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        color: '#FF453A',
        cursor: 'pointer',
    },
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        color: 'var(--text-secondary)',
    },
    // Styles KYC
    kycFilters: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap' as const,
    },
    filterBtn: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    kycGrid: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center' as const,
        color: 'var(--text-secondary)',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '16px',
    },
    kycRequestCard: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    kycHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
    },
    kycSellerInfo: {
        flex: 1,
    },
    kycSellerName: {
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '4px',
    },
    kycSellerMeta: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
    },
    kycStatusBadge: {
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '700',
        whiteSpace: 'nowrap' as const,
    },
    kycDocuments: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
    },
    kycDoc: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    kycDocLabel: {
        fontSize: '12px',
        fontWeight: '700',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
    },
    kycDocImg: {
        width: '100%',
        height: '200px',
        objectFit: 'cover' as const,
        borderRadius: '12px',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'transform 0.2s, border-color 0.2s',
    },
    kycNotes: {
        padding: '12px 16px',
        backgroundColor: 'rgba(138, 43, 226, 0.1)',
        border: '1px solid rgba(138, 43, 226, 0.2)',
        borderRadius: '12px',
        fontSize: '13px',
        lineHeight: '1.5',
    },
    kycAdminNotes: {
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        border: '1px solid rgba(255, 184, 0, 0.2)',
        borderRadius: '12px',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#FFB800',
    },
    kycActions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
    },
    kycRejectBtn: {
        padding: '12px 20px',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        color: '#FF453A',
        transition: 'all 0.2s',
    },
    kycApproveBtn: {
        padding: '12px 20px',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#00CC66',
        color: 'white',
        transition: 'all 0.2s',
    },
    kycFooter: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic' as const,
        textAlign: 'right' as const,
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    },
};

export default ModerationTab;
