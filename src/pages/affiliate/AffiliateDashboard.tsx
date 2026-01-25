import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Package, Link as LinkIcon, Search, Clock, Pause, Play, Archive, Clipboard, ShoppingBag, Loader2, Star, ChevronRight, X } from 'lucide-react';
import { productService } from '../../services/productService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import { SkeletonAffiliateStats, SkeletonMissionList, SkeletonAffiliateLinkItem } from '../../components/common/SkeletonLoader';
import { useAffiliateStats } from '../../hooks/useAffiliateStats';
import { useAffiliateLinks } from '../../hooks/useAffiliateLinks';
import { useProducts } from '../../hooks/useProducts';
import WithdrawalRequestModal from '../../components/finance/WithdrawalRequestModal';

const AffiliateDashboard = () => {
    const { user, profile } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'wallet' | 'missions' | 'links' | 'sales'>('wallet');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'commission' | 'price' | 'price_desc' | 'recent'>('recent');

    // VIP Request State
    const [vipModalOpen, setVipModalOpen] = useState(false);
    const [socialLinks, setSocialLinks] = useState('');
    const [vipLoading, setVipLoading] = useState(false);

    // Withdrawal State
    const [withdrawalOpen, setWithdrawalOpen] = useState(false);

    // TanStack Query Hooks
    const { data: affiliateData, isLoading: statsLoading, refetch: refetchStats } = useAffiliateStats(user?.id);
    const { links, isLoading: linksLoading, pause, resume, archive, register } = useAffiliateLinks(user?.id);
    const { data: productsData, isLoading: missionsLoading } = useProducts({ promoOnly: true }, undefined);

    const stats = affiliateData || {
        totalEarned: 0,
        pendingEarnings: 0,
        salesCount: 0,
        pendingSalesCount: 0,
        salesByProduct: []
    };

    const products = (productsData?.pages.flatMap(page => page.products) || []).filter(p => p.is_affiliate_enabled);
    const salesByProduct = stats.salesByProduct;
    const loading = statsLoading || linksLoading || missionsLoading;

    // ... existing helpers ...
    const copyLink = async (productId: string) => {
        if (!user) return;
        const url = `${window.location.origin}/product/${productId}?ref=${user.id}`;

        try {
            await navigator.clipboard.writeText(url);
            const { error } = await register({ affiliateId: user.id, productId });

            if (error) {
                showToast(error.message, 'error');
                return;
            }

            showToast("Lien copié et enregistré dans vos liens actifs !", 'success');
        } catch (err) {
            console.error("Failed to copy/register:", err);
            showToast("Erreur lors de la copie du lien", 'error');
        }
    };

    const handlePauseLink = async (linkId: string) => {
        const { error } = await pause(linkId);
        if (!error) showToast("Lien mis en pause", 'info');
        else showToast("Erreur lors de la pause", 'error');
    };

    const handleResumeLink = async (linkId: string) => {
        const { error } = await resume(linkId);
        if (!error) showToast("Lien réactivé", 'success');
        else showToast("Erreur lors de la réactivation", 'error');
    };

    const handleArchiveLink = async (linkId: string) => {
        if (!window.confirm("Voulez-vous vraiment archiver ce lien ? Les commissions déjà gagnées resteront dans votre solde.")) return;
        const { error } = await archive(linkId);
        if (!error) showToast("Lien archivé", 'info');
        else showToast("Erreur lors de l'archivage", 'error');
    };

    const handleRequestVip = async () => {
        if (!socialLinks.trim()) {
            showToast("Veuillez indiquer vos réseaux sociaux.", 'error');
            return;
        }
        setVipLoading(true);
        // Assuming affiliateService is imported, need to import it if not present
        // But wait, affiliateService is not imported in original file. I need to add import.
        // Actually I will cheat and do it via supabase direct or add the import.
        // Let's add the import in a separate tool call if possible, or assume I will fix imports.
        // The original code imports `useAffiliateStats` etc. but not `affiliateService`.
        // I'll add the logic here invoking the service method I just added.
        try {
            // Dynamic import to avoid breaking lines if I can't see top
            const { affiliateService } = await import('../../services/affiliateService');
            const { error } = await affiliateService.requestVipStatus(user!.id, socialLinks);
            if (error) throw error;
            showToast("Demande VIP envoyée ! 🌟", 'success');
            setVipModalOpen(false);
            // reload profile ideally, but toast is enough
        } catch (err: any) {
            showToast("Erreur: " + err.message, 'error');
        } finally {
            setVipLoading(false);
        }
    };

    const normalizeText = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredProducts = products
        .filter(p => {
            const search = normalizeText(searchTerm);
            const name = p.name ? normalizeText(p.name) : '';
            const desc = p.description ? normalizeText(p.description) : '';
            return name.includes(search) || desc.includes(search);
        })
        .sort((a, b) => {
            const valA = Number(a.default_commission || 0);
            const valB = Number(b.default_commission || 0);
            const priceA = Number(a.price || 0);
            const priceB = Number(b.price || 0);

            if (sortBy === 'commission') return valB - valA;
            if (sortBy === 'price') return priceA - priceB;
            if (sortBy === 'price_desc') return priceB - priceA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const filteredLinks = links.filter(link => {
        // Exclude archived from view
        if (link.status === 'archived') return false;
        const search = normalizeText(searchTerm);
        const name = link.products?.name ? normalizeText(link.products.name) : '';
        return name.includes(search);
    });

    useEffect(() => {
        setSearchTerm('');
    }, [activeTab]);

    return (
        <div style={styles.container}>
            {ToastComponent}

            <header style={styles.header}>
                <h1 style={styles.title}>Affiliation 🚀</h1>
                <p style={styles.subtitle}>Partagez des produits et gagnez des commissions.</p>
                {/* VIP Banner */}
                {!profile?.is_vip_influencer && profile?.vip_request_status !== 'pending' && (
                    <div style={styles.vipBanner} onClick={() => setVipModalOpen(true)}>
                        <div style={styles.vipIcon}><Star size={20} fill="#FFD700" color="#FFD700" /></div>
                        <div style={{ flex: 1 }}>
                            <div style={styles.vipTitle}>Devenir Ambassadeur VIP</div>
                            <div style={styles.vipText}>Accédez à des taux négociés et des bonus exclusifs.</div>
                        </div>
                        <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                    </div>
                )}
                {profile?.vip_request_status === 'pending' && (
                    <div style={{ ...styles.vipBanner, background: 'rgba(255, 215, 0, 0.1)', cursor: 'default' }}>
                        <Clock size={20} color="#FFD700" />
                        <div style={{ marginLeft: '12px' }}>
                            <div style={{ color: '#FFD700', fontWeight: 'bold' }}>Demande VIP en cours</div>
                            <div style={styles.vipText}>Notre équipe examine votre profil.</div>
                        </div>
                    </div>
                )}
            </header>

            {/* Tabs (unchanged) */}
            <div style={styles.tabs}>
                <button
                    onClick={() => setActiveTab('wallet')}
                    style={{ ...styles.tab, borderBottom: activeTab === 'wallet' ? '2px solid var(--primary)' : 'none', color: activeTab === 'wallet' ? 'var(--primary)' : 'var(--text-secondary)' }}
                >
                    Portefeuille
                </button>
                <button
                    onClick={() => setActiveTab('missions')}
                    style={{ ...styles.tab, borderBottom: activeTab === 'missions' ? '2px solid var(--primary)' : 'none', color: activeTab === 'missions' ? 'var(--primary)' : 'var(--text-secondary)' }}
                >
                    Missions
                </button>
                <button
                    onClick={() => setActiveTab('links')}
                    style={{ ...styles.tab, borderBottom: activeTab === 'links' ? '2px solid var(--primary)' : 'none', color: activeTab === 'links' ? 'var(--primary)' : 'var(--text-secondary)' }}
                >
                    Mes Liens
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    style={{ ...styles.tab, borderBottom: activeTab === 'sales' ? '2px solid var(--primary)' : 'none', color: activeTab === 'sales' ? 'var(--primary)' : 'var(--text-secondary)' }}
                >
                    Mes Ventes
                </button>
            </div>

            {/* ... Content of Tabs (mostly unchanged, just rendering logic) ... */}
            {activeTab === 'wallet' && (
                <div style={styles.tabContent}>
                    {/* Header with Withdraw Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Mon Portefeuille 💰</h2>
                        <button
                            onClick={() => setWithdrawalOpen(true)}
                            // Allow withdrawal even if not VIP, but maybe KYC required? 
                            // PRD says "Retrait: Conditionné par KYC".
                            // Unlike SellerDashboard, AffiliateDashboard uses "profile?.is_vip_influencer" or similar.
                            // I should check kyc_verified from profile.
                            disabled={!profile?.kyc_verified}
                            style={{
                                background: profile?.kyc_verified ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: profile?.kyc_verified ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: profile?.kyc_verified ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            title={!profile?.kyc_verified ? "KYC requis pour retirer" : "Retirer mes gains"}
                        >
                            <DollarSign size={16} />
                            Retirer mes gains
                        </button>
                    </div>

                    {/* Stats Cards */}
                    {loading ? (
                        <SkeletonAffiliateStats />
                    ) : (
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard} className="premium-card">
                                <DollarSign size={20} color="var(--primary)" />
                                <div style={styles.statValue}>{profile?.wallet_balance?.toLocaleString() || 0}</div>
                                <div style={styles.statLabel}>Solde (FCFA)</div>
                            </div>
                            <div style={styles.statCard} className="premium-card">
                                <TrendingUp size={20} color="#00CC66" />
                                <div style={styles.statValue}>{stats.totalEarned.toLocaleString()}</div>
                                <div style={styles.statLabel}>Total Gagné</div>
                            </div>
                            <div style={styles.statCard} className="premium-card">
                                <Clock size={20} color="#FFCC00" />
                                <div style={styles.statValue}>{stats.pendingEarnings.toLocaleString()}</div>
                                <div style={styles.statLabel}>En Attente</div>
                            </div>
                            <div style={styles.statCard} className="premium-card">
                                <Package size={20} color="#00AAFF" />
                                <div style={styles.statValue}>{stats.salesCount}</div>
                                <div style={styles.statLabel}>Ventes Livrées</div>
                            </div>
                        </div>
                    )}

                    <div style={styles.infoBox}>
                        <TrendingUp size={18} />
                        <div>
                            <p style={{ margin: 0, marginBottom: '4px' }}>
                                Les commissions sont versées automatiquement dès que l'acheteur confirme la livraison.
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                Ventes en attente : {stats.pendingSalesCount} commande(s) payée(s) non encore livrée(s)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'missions' && (
                <div style={styles.tabContent}>
                    {/* Search and Sort */}
                    <div style={styles.filtersRow}>
                        <div style={styles.searchBar}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher une mission..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>
                        <select
                            style={styles.sortSelect}
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                        >
                            <option value="recent">Nouveautés</option>
                            <option value="commission">Commission %</option>
                            <option value="price">Prix croissant</option>
                            <option value="price_desc">Prix décroissant</option>
                        </select>
                    </div>

                    {loading ? (
                        <SkeletonMissionList count={6} />
                    ) : filteredProducts.length > 0 ? (
                        <div style={styles.missionList}>
                            {filteredProducts.map(product => (
                                <div key={product.id} style={styles.missionItem} className="premium-card">
                                    <img src={product.image_url} alt={product.name} style={styles.productThumb} />
                                    <div style={styles.productInfo}>
                                        <div style={styles.productName}>{product.name}</div>
                                        <div style={styles.productPrice}>{product.price.toLocaleString()} FCFA</div>
                                        <div style={styles.commissionBadge}>
                                            Commission: <strong>{product.default_commission}%</strong>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyLink(product.id)}
                                        style={styles.copyBtn}
                                        title="Copier le lien affilié"
                                    >
                                        <LinkIcon size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={styles.centered}>Aucune mission trouvée pour cette recherche.</div>
                    )}
                </div>
            )}

            {activeTab === 'links' && (
                /* Mes Liens Tab Content (links) */
                <div style={styles.tabContent}>
                    <h2 style={styles.sectionTitle}>Mes Liens Actifs 🔗</h2>
                    <p style={styles.subtitle}>Gérez les produits que vous promouvez actuellement.</p>

                    {/* Search Bar for Links */}
                    <div style={styles.filtersRow}>
                        <div style={styles.searchBar}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher dans mes liens..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <>
                            {[1, 2, 3, 4, 5].map(i => <SkeletonAffiliateLinkItem key={i} />)}
                        </>
                    ) : filteredLinks.length > 0 ? (
                        <div style={styles.missionList}>
                            {filteredLinks.map(link => (
                                <div key={link.id} style={styles.missionItem} className="premium-card">
                                    <img src={link.products?.image_url} alt={link.products?.name} style={styles.productThumb} />
                                    <div style={styles.productInfo}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={styles.productName}>{link.products?.name}</div>
                                            {link.status === 'paused' && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    background: 'rgba(255, 204, 0, 0.1)',
                                                    color: '#FFCC00',
                                                    borderRadius: '6px',
                                                    fontWeight: '600'
                                                }}>
                                                    EN PAUSE
                                                </span>
                                            )}
                                        </div>
                                        <div style={styles.productPrice}>{link.products?.price.toLocaleString()} FCFA</div>
                                        <div style={styles.commissionBadge}>
                                            Commission: <strong>{link.products?.default_commission}%</strong>
                                        </div>
                                        {!link.products?.is_affiliate_enabled && (
                                            <div style={{ fontSize: '11px', color: '#FF4444', marginTop: '4px' }}>
                                                ⚠️ Affiliation désactivée par le vendeur
                                            </div>
                                        )}
                                    </div>
                                    <div style={styles.linkActions}>
                                        <button
                                            onClick={() => copyLink(link.product_id)}
                                            style={{
                                                ...styles.copyBtn,
                                                opacity: link.status === 'paused' ? 0.5 : 1,
                                                cursor: link.status === 'paused' ? 'not-allowed' : 'pointer'
                                            }}
                                            title={link.status === 'paused' ? "Réactivez le lien pour le copier" : "Copier le lien"}
                                            disabled={link.status === 'paused'}
                                        >
                                            <Clipboard size={18} />
                                        </button>
                                        {link.status === 'active' ? (
                                            <button
                                                onClick={() => handlePauseLink(link.id)}
                                                style={{ ...styles.copyBtn, background: 'rgba(255, 204, 0, 0.1)', color: '#FFCC00' }}
                                                title="Mettre en pause"
                                            >
                                                <Pause size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleResumeLink(link.id)}
                                                style={{ ...styles.copyBtn, background: 'rgba(0, 204, 102, 0.1)', color: '#00CC66' }}
                                                title="Reprendre"
                                            >
                                                <Play size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleArchiveLink(link.id)}
                                            style={{ ...styles.copyBtn, background: 'rgba(255, 68, 68, 0.1)', color: '#FF4444' }}
                                            title="Archiver"
                                        >
                                            <Archive size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ ...styles.centered, padding: '60px 20px' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Vous n'avez pas encore de liens actifs.</p>
                            <button
                                onClick={() => setActiveTab('missions')}
                                style={styles.actionButton}
                            >
                                Explorer les missions
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'sales' && (
                /* Mes Ventes Tab Content (sales) */
                <div style={styles.tabContent}>
                    <h2 style={styles.sectionTitle}>Mes Ventes 📊</h2>
                    <p style={styles.subtitle}>Vos produits qui génèrent des commissions.</p>

                    {loading ? (
                        <>
                            {[1, 2, 3, 4].map(i => <SkeletonAffiliateLinkItem key={i} />)}
                        </>
                    ) : salesByProduct.length > 0 ? (
                        <>
                            {/* Summary Stats */}
                            <div style={styles.salesSummary}>
                                <div style={styles.salesSummaryItem}>
                                    <ShoppingBag size={16} color="var(--primary)" />
                                    <span style={styles.salesSummaryValue}>{salesByProduct.length}</span>
                                    <span style={styles.salesSummaryLabel}>produits</span>
                                </div>
                                <div style={styles.salesSummaryItem}>
                                    <Package size={16} color="#00CC66" />
                                    <span style={styles.salesSummaryValue}>
                                        {salesByProduct.reduce((sum, p) => sum + p.sales_count, 0)}
                                    </span>
                                    <span style={styles.salesSummaryLabel}>ventes</span>
                                </div>
                                <div style={styles.salesSummaryItem}>
                                    <DollarSign size={16} color="#FFCC00" />
                                    <span style={styles.salesSummaryValue}>
                                        {salesByProduct.reduce((sum, p) => sum + p.total_earned, 0).toLocaleString()}
                                    </span>
                                    <span style={styles.salesSummaryLabel}>FCFA gagnés</span>
                                </div>
                            </div>

                            {/* Sales List */}
                            <div style={styles.missionList}>
                                {salesByProduct.map(sale => (
                                    <div key={sale.product_id} style={styles.salesItem} className="premium-card">
                                        <img src={sale.product_image} alt={sale.product_name} style={styles.productThumb} />
                                        <div style={styles.productInfo}>
                                            <div style={styles.productName}>{sale.product_name}</div>
                                            <div style={styles.salesInfo}>
                                                <span style={{ color: '#00CC66', fontWeight: '600' }}>
                                                    {sale.sales_count} vente{sale.sales_count > 1 ? 's' : ''}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)' }}> • </span>
                                                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
                                                    {sale.total_earned.toLocaleString()} FCFA
                                                </span>
                                            </div>
                                            <div style={styles.lastSale}>
                                                Dernière vente: {new Date(sale.last_sale).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ ...styles.centered, padding: '60px 20px' }}>
                            <Package size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                                Aucune vente pour l'instant
                            </p>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '13px' }}>
                                Partagez vos liens affiliés pour commencer à gagner !
                            </p>
                            <button
                                onClick={() => setActiveTab('missions')}
                                style={styles.actionButton}
                            >
                                Découvrir les missions
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* VIP Request Modal */}
            {vipModalOpen && (
                <div style={styles.overlay} onClick={() => setVipModalOpen(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Devenir Ambassadeur VIP 💎</h2>
                        <p style={styles.modalText}>
                            Les Ambassadeurs VIP ont accès à des collaborations exclusives, des taux de commission plus élevés et une communication directe avec les vendeurs.
                        </p>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Vos réseaux sociaux (TikTok, Instagram, Facebook)</label>
                            <textarea
                                style={styles.textarea}
                                placeholder="Collez ici les liens vers vos profils ou vos meilleures vidéos..."
                                value={socialLinks}
                                onChange={e => setSocialLinks(e.target.value)}
                                rows={4}
                            />
                            <div style={styles.hint}>Nous les examinerons pour valider votre audience.</div>
                        </div>

                        <div style={styles.modalActions}>
                            <button onClick={() => setVipModalOpen(false)} style={styles.cancelBtn}>
                                Annuler
                            </button>
                            <button
                                onClick={handleRequestVip}
                                disabled={vipLoading}
                                style={{ ...styles.submitBtn, opacity: vipLoading ? 0.7 : 1 }}
                            >
                                {vipLoading ? 'Envoi...' : 'Envoyer ma demande'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <WithdrawalRequestModal
                isOpen={withdrawalOpen}
                onClose={() => setWithdrawalOpen(false)}
                userId={user?.id || ''}
                balance={profile?.wallet_balance || 0}
                userRole="affiliate"
                onSuccess={() => {
                    refetchStats();
                }}
            />
        </div>
    );
};

const styles = {
    container: {
        padding: '24px 20px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '32px',
    },
    title: {
        fontSize: '28px',
        fontWeight: '900',
        color: 'white',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        marginTop: '8px',
        marginBottom: '4px',
    },
    linkActions: {
        display: 'flex',
        gap: '8px',
    },
    actionButton: {
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    tabs: {
        display: 'flex',
        gap: '24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '24px',
    },
    tab: {
        background: 'none',
        border: 'none',
        padding: '12px 0',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    tabContent: {
        animation: 'fadeIn 0.3s ease',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px',
    },
    statCard: {
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '20px',
    },
    statValue: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
    },
    statLabel: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
    },
    infoBox: {
        display: 'flex',
        gap: '12px',
        padding: '16px',
        background: 'rgba(138, 43, 226, 0.05)',
        borderRadius: '16px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
    },
    filtersRow: {
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
    },
    searchBar: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255,255,255,0.05)',
        padding: '0 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: 'white',
        padding: '12px 0',
        fontSize: '14px',
        outline: 'none',
        width: '100%',
    },
    sortSelect: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        borderRadius: '12px',
        padding: '0 12px',
        fontSize: '14px',
    },
    missionList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    missionItem: {
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
    },
    productThumb: {
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        objectFit: 'cover' as const,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: '15px',
        fontWeight: '600',
        color: 'white',
        marginBottom: '4px',
    },
    productPrice: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
    },
    commissionBadge: {
        marginTop: '4px',
        fontSize: '12px',
        color: 'var(--primary)',
    },
    copyBtn: {
        background: 'var(--primary)',
        border: 'none',
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '40px',
        color: 'var(--text-secondary)',
    },
    salesSummary: {
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
    },
    salesSummaryItem: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '6px',
    },
    salesSummaryValue: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
    },
    salesSummaryLabel: {
        fontSize: '11px',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
    },
    salesItem: {
        padding: '16px',
        display: 'flex',
        gap: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
    },
    salesInfo: {
        fontSize: '14px',
        marginTop: '6px',
        marginBottom: '4px',
    },
    lastSale: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    vipBanner: {
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)',
    },
    vipIcon: {
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vipTitle: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
        marginBottom: '4px',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    vipText: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: '1.4',
    },
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
        zIndex: 1000,
        padding: '20px',
    },
    modal: {
        background: '#1a1a1a',
        borderRadius: '24px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        marginBottom: '12px',
    },
    modalText: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
        marginBottom: '20px',
    },
    formGroup: {
        marginBottom: '24px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '8px',
    },
    textarea: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
        resize: 'vertical' as const,
    },
    hint: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.4)',
        marginTop: '6px',
    },
    modalActions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    submitBtn: {
        background: 'var(--primary)',
        border: 'none',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
    }
};

export default AffiliateDashboard;
