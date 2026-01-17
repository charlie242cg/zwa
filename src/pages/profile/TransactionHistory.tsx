import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { transactionService, Transaction } from '../../services/transactionService';
import { useTransactions } from '../../hooks/useTransactions';
import { invoiceService } from '../../services/invoiceService';
import { useSkeletonAnimation, SkeletonTransactionList } from '../../components/common/SkeletonLoader';

type FilterType = 'all' | 'purchase' | 'sale' | 'commission' | 'withdrawal';

const TransactionHistory = () => {
    useSkeletonAnimation();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [filter, setFilter] = useState<FilterType>('all');

    const {
        data: transactions = [],
        isLoading: loading,
        error: queryError,
        refetch
    } = useTransactions(user?.id, filter);

    const error = queryError ? (queryError as any).message || 'Erreur de chargement' : null;

    // useEffect removed - data fetching is handled by the hook automatically

    const handleDownloadInvoice = (transaction: Transaction) => {
        if (!user || !profile) return;

        try {
            const userProfile = {
                full_name: profile.full_name,
                email: user.email || '',
                id: user.id
            };

            console.log('[TransactionHistory] 📄 Generating PDF for transaction:', transaction.id, 'Type:', transaction.type);

            switch (transaction.type) {
                case 'purchase':
                    invoiceService.generatePurchaseInvoice(transaction, userProfile);
                    break;
                case 'sale':
                    invoiceService.generateSaleReceipt(transaction, userProfile);
                    break;
                case 'commission':
                    invoiceService.generateCommissionReceipt(transaction, userProfile);
                    break;
                case 'withdrawal':
                    invoiceService.generateWithdrawalReceipt(transaction, userProfile);
                    break;
            }

            console.log('[TransactionHistory] ✅ PDF generated successfully');
        } catch (error) {
            console.error('[TransactionHistory] ❌ Error generating PDF:', error);
            alert(`❌ Erreur lors de la génération du reçu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    };

    const handleExportCSV = () => {
        invoiceService.exportToCSV(transactions, `historique-${profile?.role || 'user'}`);
    };

    const getFilterOptions = (): { value: FilterType; label: string; icon: string }[] => {
        const baseFilters = [
            { value: 'all' as FilterType, label: 'Tout', icon: '📋' }
        ];

        if (profile?.role === 'buyer') {
            return [
                ...baseFilters,
                { value: 'purchase' as FilterType, label: 'Achats', icon: '🛒' }
            ];
        }

        if (profile?.role === 'seller') {
            return [
                ...baseFilters,
                { value: 'sale' as FilterType, label: 'Ventes', icon: '💵' },
                { value: 'withdrawal' as FilterType, label: 'Retraits', icon: '💸' }
            ];
        }

        if (profile?.role === 'affiliate') {
            return [
                ...baseFilters,
                { value: 'commission' as FilterType, label: 'Commissions', icon: '💰' },
                { value: 'withdrawal' as FilterType, label: 'Retraits', icon: '💸' }
            ];
        }

        return baseFilters;
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            purchase: '🛒',
            sale: '💵',
            commission: '💰',
            withdrawal: '💸'
        };
        return icons[type] || '📄';
    };

    const getTypeLabel = (type: string) => {
        return invoiceService.getTypeLabel(type);
    };

    const formatAmount = (amount: number, type: string) => {
        const isNegative = amount < 0;
        const absAmount = Math.abs(amount);

        // Pour les achats (purchase), afficher en blanc sans signe -
        // C'est plus user-friendly pour les clients
        if (type === 'purchase') {
            return (
                <span style={{ color: 'white', fontWeight: '700' }}>
                    {absAmount.toLocaleString()} FCFA
                </span>
            );
        }

        // Pour les autres types (ventes, commissions, retraits)
        const color = isNegative ? '#ff4444' : '#00CC66';
        const sign = isNegative ? '-' : '+';

        return (
            <span style={{ color, fontWeight: '700' }}>
                {sign}{absAmount.toLocaleString()} FCFA
            </span>
        );
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <button onClick={() => navigate('/profile')} style={styles.backButton}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={styles.title}>Historique des Transactions</h1>
                <div style={{ width: '24px' }}></div>
            </div>

            {/* Filters */}
            <div style={styles.filtersContainer}>
                <div style={styles.filterLabel}>
                    <Filter size={16} />
                    Filtrer par type:
                </div>
                <div style={styles.filters}>
                    {getFilterOptions().map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            style={{
                                ...styles.filterButton,
                                background: filter === option.value ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                borderColor: filter === option.value ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                            }}
                        >
                            {option.icon} {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Export Button */}
            {transactions.length > 0 && (
                <div style={styles.exportContainer}>
                    <button onClick={handleExportCSV} style={styles.exportButton}>
                        <Download size={16} />
                        Exporter en CSV
                    </button>
                </div>
            )}

            {/* Transactions List */}
            <div style={styles.content}>
                {loading ? (
                    <SkeletonTransactionList count={5} />
                ) : error ? (
                    <div style={styles.errorContainer}>
                        <div style={styles.errorIcon}>⚠️</div>
                        <h3 style={styles.errorTitle}>Erreur de chargement</h3>
                        <p style={styles.errorText}>{error}</p>
                        <button onClick={() => refetch()} style={styles.retryButton}>
                            🔄 Réessayer
                        </button>
                        <div style={styles.debugInfo}>
                            <p style={{ fontSize: '11px', marginTop: '16px', opacity: 0.5 }}>
                                ID Utilisateur: {user?.id.substring(0, 8)}...
                            </p>
                            <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.5 }}>
                                Filtre: {filter}
                            </p>
                        </div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div style={styles.empty}>
                        <FileText size={48} color="var(--text-secondary)" />
                        <p style={styles.emptyText}>Aucune transaction trouvée</p>
                    </div>
                ) : (
                    <div style={styles.list}>
                        {transactions.map((transaction) => (
                            <div key={transaction.id} style={styles.card}>
                                {/* Transaction Header */}
                                <div style={styles.cardHeader}>
                                    <div style={styles.cardLeft}>
                                        <span style={styles.typeIcon}>{getTypeIcon(transaction.type)}</span>
                                        <div>
                                            <div style={styles.typeLabel}>{getTypeLabel(transaction.type)}</div>
                                            <div style={styles.date}>
                                                {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={styles.amount}>
                                        {formatAmount(transaction.amount, transaction.type)}
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                {transaction.description && (
                                    <div style={styles.description}>{transaction.description}</div>
                                )}

                                {/* Product Details (for purchase/sale) */}
                                {(transaction.type === 'purchase' || transaction.type === 'sale') && transaction.product_name && (
                                    <div style={styles.productInfo}>
                                        {transaction.product_image && (
                                            <img
                                                src={transaction.product_image}
                                                alt={transaction.product_name}
                                                style={styles.productImage}
                                            />
                                        )}
                                        <div>
                                            <div style={styles.productName}>{transaction.product_name}</div>
                                            {transaction.quantity && transaction.unit_price && (
                                                <div style={styles.productDetails}>
                                                    {transaction.quantity}x {transaction.unit_price.toLocaleString()} FCFA
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Commission Details */}
                                {transaction.type === 'commission' && transaction.commission_rate && (
                                    <div style={styles.commissionInfo}>
                                        Taux: {transaction.commission_rate}%
                                    </div>
                                )}

                                {/* Withdrawal Details */}
                                {transaction.type === 'withdrawal' && (
                                    <div style={styles.withdrawalInfo}>
                                        <div>Méthode: {transaction.withdrawal_method}</div>
                                        <div>Numéro: {transaction.withdrawal_number}</div>
                                        {transaction.withdrawal_fee && transaction.withdrawal_fee > 0 && (
                                            <div>Frais: {transaction.withdrawal_fee.toLocaleString()} FCFA</div>
                                        )}
                                    </div>
                                )}

                                {/* Balance After */}
                                <div style={styles.balanceAfter}>
                                    Solde après: {transaction.balance_after.toLocaleString()} FCFA
                                </div>

                                {/* Download Invoice Button */}
                                <button
                                    onClick={() => handleDownloadInvoice(transaction)}
                                    style={styles.downloadButton}
                                >
                                    <Download size={14} />
                                    Télécharger le reçu
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        background: 'var(--background)',
        minHeight: '100vh',
        paddingBottom: '40px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    backButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
        margin: 0,
    },
    filtersContainer: {
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    filterLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        marginBottom: '12px',
    },
    filters: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap' as const,
    },
    filterButton: {
        padding: '8px 16px',
        border: '1px solid',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    exportContainer: {
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    exportButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        color: 'white',
        cursor: 'pointer',
    },
    content: {
        padding: '20px',
    },
    loading: {
        textAlign: 'center' as const,
        padding: '40px',
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
    },
    emptyText: {
        marginTop: '16px',
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    list: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    card: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '16px',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
    },
    cardLeft: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
    },
    typeIcon: {
        fontSize: '24px',
    },
    typeLabel: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'white',
    },
    date: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '2px',
    },
    amount: {
        fontSize: '16px',
        fontWeight: '800',
    },
    description: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginBottom: '12px',
        lineHeight: '1.4',
    },
    productInfo: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        padding: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        marginBottom: '12px',
    },
    productImage: {
        width: '50px',
        height: '50px',
        borderRadius: '8px',
        objectFit: 'cover' as const,
    },
    productName: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'white',
    },
    productDetails: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '4px',
    },
    commissionInfo: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        marginBottom: '12px',
    },
    withdrawalInfo: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
    },
    balanceAfter: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginBottom: '12px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    downloadButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        padding: '10px',
        background: 'rgba(138, 43, 226, 0.1)',
        border: '1px solid rgba(138, 43, 226, 0.3)',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--primary)',
        cursor: 'pointer',
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center' as const,
    },
    errorIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    errorTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#FF4444',
        marginBottom: '12px',
    },
    errorText: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px',
        lineHeight: '1.6',
    },
    retryButton: {
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        background: 'var(--primary)',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(138, 43, 226, 0.4)',
    },
    debugInfo: {
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
    },
};

export default TransactionHistory;
