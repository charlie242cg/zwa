import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, X, ChevronDown, Shield, Flame, TrendingUp, Package, Search, Tag } from 'lucide-react';
import ProductCard from '../../components/products/ProductCard';
import { productService, Product } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types/category';
import { useSkeletonAnimation, SkeletonProductGrid } from '../../components/common/SkeletonLoader';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

const Home = () => {
    useSkeletonAnimation(); // Ajoute l'animation CSS
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [badges, setBadges] = useState({
        verifiedOnly: false,
        newOnly: false,
        affiliateOnly: false,
        moqOne: false,
        promoOnly: false,
    });
    const [isSortOpen, setIsSortOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [productsResult, categoriesResult] = await Promise.all([
            productService.getProducts(),
            categoryService.getActiveCategories()
        ]);

        if (!productsResult.error && productsResult.data) {
            setProducts(productsResult.data);
        }
        if (!categoriesResult.error && categoriesResult.data) {
            setCategories(categoriesResult.data);
        }
        setLoading(false);
    };

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleBadgeToggle = (badge: keyof typeof badges) => {
        setBadges(prev => ({ ...prev, [badge]: !prev[badge] }));
    };

    // Combined filtering and sorting logic
    const filteredProducts = useMemo(() => {
        let results = products;

        // Search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.profiles?.full_name?.toLowerCase().includes(query)
            );
        }

        // Categories filter (multi-selection)
        if (selectedCategories.length > 0) {
            results = results.filter(p =>
                p.category_id && selectedCategories.includes(p.category_id)
            );
        }

        // Verified sellers only
        if (badges.verifiedOnly) {
            results = results.filter(p => p.profiles?.is_verified_seller);
        }

        // New products only (< 7 days)
        if (badges.newOnly) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            results = results.filter(p =>
                new Date(p.created_at) > sevenDaysAgo
            );
        }

        // Affiliation enabled only
        if (badges.affiliateOnly) {
            results = results.filter(p => p.is_affiliate_enabled);
        }

        // MOQ = 1 only
        if (badges.moqOne) {
            results = results.filter(p => p.min_order_quantity === 1);
        }

        // Promo products only (products with original_price)
        if (badges.promoOnly) {
            results = results.filter(p => p.original_price && p.original_price > p.price);
        }

        // Apply sorting
        switch (sortBy) {
            case 'price_asc':
                results.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                results.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                results.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                break;
            default: // relevance
                break;
        }

        return results;
    }, [products, searchQuery, selectedCategories, badges, sortBy]);

    const sortOptions = [
        { value: 'relevance' as SortOption, label: 'Pertinence' },
        { value: 'price_asc' as SortOption, label: 'Prix croissant' },
        { value: 'price_desc' as SortOption, label: 'Prix décroissant' },
        { value: 'newest' as SortOption, label: 'Nouveautés' },
    ];

    const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Trier';
    const hasActiveFilters = searchQuery || selectedCategories.length > 0 || Object.values(badges).some(v => v);

    return (
        <div style={styles.outerContainer}>
            <div style={styles.innerContainer}>
                {/* Search Bar Section */}
                <div style={styles.searchSection}>
                    <div style={styles.searchBar}>
                        <Search size={20} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Rechercher produits, vendeurs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={styles.clearButton}
                                aria-label="Effacer la recherche"
                            >
                                <X size={18} color="var(--text-secondary)" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories Filter */}
                <div style={styles.filterSection}>
                    <div style={styles.categoriesList}>
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => handleCategoryToggle(cat.id)}
                                style={{
                                    ...styles.categoryChip,
                                    background: selectedCategories.includes(cat.id)
                                        ? 'var(--primary)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: selectedCategories.includes(cat.id)
                                        ? '1px solid var(--primary)'
                                        : '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                {cat.icon && `${cat.icon} `}{cat.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Special Badges Filter */}
                <div style={styles.filterSection}>
                    <div style={styles.badgesList}>
                        <div
                            onClick={() => handleBadgeToggle('verifiedOnly')}
                            style={{
                                ...styles.badgeChip,
                                background: badges.verifiedOnly
                                    ? 'rgba(138, 43, 226, 0.2)'
                                    : 'rgba(255,255,255,0.05)',
                                border: badges.verifiedOnly
                                    ? '1px solid var(--primary)'
                                    : '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Shield size={14} />
                            <span>Vérifiés</span>
                        </div>

                        <div
                            onClick={() => handleBadgeToggle('newOnly')}
                            style={{
                                ...styles.badgeChip,
                                background: badges.newOnly
                                    ? 'rgba(255, 107, 0, 0.2)'
                                    : 'rgba(255,255,255,0.05)',
                                border: badges.newOnly
                                    ? '1px solid #FF6B00'
                                    : '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Flame size={14} />
                            <span>Nouveautés</span>
                        </div>

                        <div
                            onClick={() => handleBadgeToggle('affiliateOnly')}
                            style={{
                                ...styles.badgeChip,
                                background: badges.affiliateOnly
                                    ? 'rgba(0, 204, 102, 0.2)'
                                    : 'rgba(255,255,255,0.05)',
                                border: badges.affiliateOnly
                                    ? '1px solid #00CC66'
                                    : '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <TrendingUp size={14} />
                            <span>Affiliation</span>
                        </div>

                        <div
                            onClick={() => handleBadgeToggle('moqOne')}
                            style={{
                                ...styles.badgeChip,
                                background: badges.moqOne
                                    ? 'rgba(0, 122, 255, 0.2)'
                                    : 'rgba(255,255,255,0.05)',
                                border: badges.moqOne
                                    ? '1px solid #007AFF'
                                    : '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Package size={14} />
                            <span>Achat unitaire</span>
                        </div>

                        <div
                            onClick={() => handleBadgeToggle('promoOnly')}
                            style={{
                                ...styles.badgeChip,
                                background: badges.promoOnly
                                    ? 'rgba(255, 59, 92, 0.2)'
                                    : 'rgba(255,255,255,0.05)',
                                border: badges.promoOnly
                                    ? '1px solid #FF3B5C'
                                    : '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Tag size={14} />
                            <span>Promotions</span>
                        </div>
                    </div>
                </div>

                {/* Hero Banner - Only show when no active filters */}
                {!hasActiveFilters && (
                    <div className="premium-card" style={styles.hero}>
                        <div style={styles.heroContent}>
                            <h2 style={styles.heroTitle}>Arrivage Spécial Gros 🚢</h2>
                            <p style={styles.heroSub}>Négociez en direct avec les fournisseurs certifiés.</p>
                        </div>
                    </div>
                )}

                {/* Results Header with Sort */}
                {hasActiveFilters && (
                    <div style={styles.resultsHeader}>
                        <div style={styles.resultsInfo}>
                            <h3 style={styles.resultsTitle}>
                                {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}
                            </h3>
                            {searchQuery && (
                                <p style={styles.resultsQuery}>pour "{searchQuery}"</p>
                            )}
                        </div>
                        <div style={styles.sortContainer}>
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                style={styles.sortTrigger}
                            >
                                <span>{currentSortLabel}</span>
                                <ChevronDown
                                    size={16}
                                    style={{
                                        transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                    }}
                                />
                            </button>
                            {isSortOpen && (
                                <div style={styles.sortDropdown}>
                                    {sortOptions.map(option => (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                setSortBy(option.value);
                                                setIsSortOpen(false);
                                            }}
                                            style={{
                                                ...styles.sortOption,
                                                background: sortBy === option.value
                                                    ? 'rgba(138, 43, 226, 0.1)'
                                                    : 'transparent',
                                                color: sortBy === option.value
                                                    ? 'var(--primary)'
                                                    : 'white',
                                            }}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Products Section Header - Only show when no active filters */}
                {!hasActiveFilters && (
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>Produits Populaires</h3>
                    </div>
                )}

                {/* Products Grid */}
                {loading ? (
                    <SkeletonProductGrid count={6} columns={2} gap={16} />
                ) : filteredProducts.length > 0 ? (
                    <div style={styles.grid}>
                        {filteredProducts.map(product => (
                            <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <ProductCard
                                    image={product.image_url}
                                    name={product.name}
                                    price={product.price.toLocaleString()}
                                    originalPrice={product.original_price?.toLocaleString()}
                                    seller={product.profiles?.full_name || 'Vendeur'}
                                    isVerified={product.profiles?.is_verified_seller || false}
                                    moq={product.min_order_quantity}
                                />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div style={styles.emptyStateContainer}>
                        <div style={styles.emptyStateCard}>
                            <ShoppingBag size={40} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
                            <h4 style={styles.emptyTitle}>
                                {hasActiveFilters ? 'Aucun résultat trouvé' : 'Aucun produit disponible'}
                            </h4>
                            <p style={styles.emptySub}>
                                {hasActiveFilters
                                    ? 'Essayez avec d\'autres filtres ou mots-clés.'
                                    : 'Les produits s\'afficheront ici dès qu\'ils seront en vente.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    outerContainer: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--background)',
    },
    innerContainer: {
        width: '100%',
        maxWidth: '1200px',
        padding: '16px',
        boxSizing: 'border-box' as const,
    },
    searchSection: {
        marginBottom: '12px',
        width: '100%',
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.05)',
        padding: '12px 16px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: 'white',
        flex: 1,
        outline: 'none',
        fontSize: '15px',
    },
    clearButton: {
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
    },
    filterSection: {
        width: '100%',
        overflowX: 'auto' as const,
        marginBottom: '12px',
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
    },
    categoriesList: {
        display: 'flex',
        gap: '8px',
        paddingBottom: '4px',
    },
    categoryChip: {
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        whiteSpace: 'nowrap' as const,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'white',
    },
    badgesList: {
        display: 'flex',
        gap: '8px',
        paddingBottom: '4px',
    },
    badgeChip: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        whiteSpace: 'nowrap' as const,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'white',
    },
    hero: {
        padding: '24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.5) 0%, rgba(138, 43, 226, 0.1) 100%)',
        border: '1px solid rgba(138, 43, 226, 0.2)',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    heroContent: {
        width: '100%',
    },
    heroTitle: {
        fontSize: '20px',
        fontWeight: '900',
        marginBottom: '8px',
        color: 'white',
    },
    heroSub: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.4',
        maxWidth: '400px',
    },
    resultsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        gap: '16px',
    },
    resultsInfo: {
        flex: 1,
    },
    resultsTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
        marginBottom: '4px',
    },
    resultsQuery: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    sortContainer: {
        position: 'relative' as const,
    },
    sortTrigger: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    sortDropdown: {
        position: 'absolute' as const,
        top: 'calc(100% + 8px)',
        right: 0,
        minWidth: '180px',
        background: 'rgba(30, 30, 30, 0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '8px',
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    sortOption: {
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        width: '100%',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px',
        width: '100%',
    },
    centered: {
        textAlign: 'center' as const,
        padding: '40px',
        color: 'var(--text-secondary)',
        width: '100%',
    },
    emptyStateContainer: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 0',
    },
    emptyStateCard: {
        width: '100%',
        maxWidth: '500px',
        padding: '40px 20px',
        textAlign: 'center' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '24px',
        border: '1px dashed rgba(255,255,255,0.1)',
    },
    emptyTitle: {
        fontSize: '18px',
        fontWeight: '700',
        marginBottom: '10px',
        color: 'white',
    },
    emptySub: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
        maxWidth: '280px',
    }
};

export default Home;