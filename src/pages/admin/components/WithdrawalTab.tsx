import React, { useEffect, useState } from 'react';
import { Check, X, Phone, Clock, MoreVertical, Wallet, Filter, CheckCircle, XCircle } from 'lucide-react';
import { transactionService, Transaction } from '../../../services/transactionService';
import { useSkeletonAnimation, SkeletonBar } from '../../../components/common/SkeletonLoader';

type FilterStatus = 'all' | 'pending' | 'completed' | 'rejected';

const SkeletonWithdrawalCard = () => (
    <div style={styles.card} className="premium-card">
        <div style={styles.userInfo}>
            <SkeletonBar width={40} height={40} borderRadius={10} />
            <div style={{ flex: 1 }}>
                <SkeletonBar width="60%" height={16} margin="0 0 6px 0" />
                <SkeletonBar width="40%" height={12} />
            </div>
        </div>
        <div style={styles.amountInfo}>
            <SkeletonBar width="70%" height={20} margin="0 0 6px 0" />
            <SkeletonBar width="90%" height={14} />
        </div>
        <div style={styles.footer}>
            <SkeletonBar width={120} height={12} />
            <div style={{ display: 'flex', gap: '8px' }}>
                <SkeletonBar width={80} height={32} borderRadius={8} />
                <SkeletonBar width={110} height={32} borderRadius={8} />
            </div>
        </div>
    </div>
);

const WithdrawalTab = () => {
    useSkeletonAnimation();
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('pending');

    useEffect(() => {
        fetchWithdrawals();
    }, [filter]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        const { data, error } = await transactionService.getAllTransactions({
            type: 'withdrawal',
            ...(filter !== 'all' && { status: filter })
        });
        if (data) setWithdrawals(data);
        setLoading(false);
    };

    const handleAction = async (id: string, status: 'completed' | 'rejected') => {
        const confirmMsg = status === 'completed' ? 'Confirmer l\'envoi des fonds ?' : 'Rejeter cette demande ?';
        if (!window.confirm(confirmMsg)) return;

        const { error } = await transactionService.updateTransactionStatus(id, status);
        if (!error) {
            alert(status === 'completed' ? 'Retrait validé !' : 'Retrait rejeté.');
            fetchWithdrawals();
        } else {
            alert('Erreur: ' + error.message);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle size={14} color="#00CC66" />;
            case 'rejected': return <XCircle size={14} color="#FF6B6B" />;
            default: return <Clock size={14} color="#FFD700" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Validé';
            case 'rejected': return 'Rejeté';
            default: return 'En attente';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#00CC66';
            case 'rejected': return '#FF6B6B';
            default: return '#FFD700';
        }
    };

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

    return (
        <div style={styles.container}>
            {/* Header with filters */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Demandes de Retrait 💸</h2>
                    {filter === 'pending' && <div style={styles.badge}>{pendingCount} en attente</div>}
                </div>
            </div>

            {/* Filters */}
            <div style={styles.filterBar}>
                <button
                    onClick={() => setFilter('pending')}
                    style={{
                        ...styles.filterBtn,
                        ...(filter === 'pending' ? styles.filterBtnActive : {})
                    }}
                >
                    <Clock size={16} />
                    En attente
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    style={{
                        ...styles.filterBtn,
                        ...(filter === 'completed' ? styles.filterBtnActive : {})
                    }}
                >
                    <CheckCircle size={16} />
                    Validés
                </button>
                <button
                    onClick={() => setFilter('rejected')}
                    style={{
                        ...styles.filterBtn,
                        ...(filter === 'rejected' ? styles.filterBtnActive : {})
                    }}
                >
                    <XCircle size={16} />
                    Rejetés
                </button>
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        ...styles.filterBtn,
                        ...(filter === 'all' ? styles.filterBtnActive : {})
                    }}
                >
                    <Filter size={16} />
                    Tous
                </button>
            </div>

            {loading ? (
                <div style={styles.list}>
                    {[1, 2, 3, 4].map((i) => <SkeletonWithdrawalCard key={i} />)}
                </div>
            ) : withdrawals.length === 0 ? (
                <div style={styles.emptyCard} className="premium-card">
                    <Wallet size={40} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
                    <p>Aucun retrait trouvé pour ce filtre.</p>
                </div>
            ) : (
                <div style={styles.list}>
                    {withdrawals.map((w) => (
                        <div key={w.id} style={styles.card} className="premium-card">
                            <div style={styles.cardHeader}>
                                <div style={styles.userInfo}>
                                    <div style={styles.avatar}>
                                        {w.profiles?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div style={styles.userName}>{w.profiles?.full_name}</div>
                                        <div style={styles.userRole}>{w.profiles?.role === 'seller' ? 'Vendeur' : 'Affilié'}</div>
                                    </div>
                                </div>
                                <div style={{
                                    ...styles.statusBadge,
                                    backgroundColor: `${getStatusColor(w.status)}15`,
                                    color: getStatusColor(w.status),
                                }}>
                                    {getStatusIcon(w.status)}
                                    {getStatusLabel(w.status)}
                                </div>
                            </div>

                            <div style={styles.amountInfo}>
                                <div style={styles.amount}>{Math.abs(w.amount).toLocaleString()} FCFA</div>
                                <div style={styles.method}>{w.withdrawal_method} - {w.withdrawal_number}</div>
                            </div>

                            <div style={styles.footer}>
                                <div style={styles.date}>
                                    <Clock size={12} /> {new Date(w.created_at).toLocaleDateString()} à {new Date(w.created_at).toLocaleTimeString()}
                                </div>
                                {w.status === 'pending' && (
                                    <div style={styles.actions}>
                                        <button
                                            onClick={() => handleAction(w.id, 'rejected')}
                                            style={styles.rejectBtn}
                                        >
                                            <X size={16} /> Rejeter
                                        </button>
                                        <button
                                            onClick={() => handleAction(w.id, 'completed')}
                                            style={styles.approveBtn}
                                        >
                                            <Check size={16} /> Valider
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
    },
    title: {
        fontSize: '22px',
        fontWeight: '800',
    },
    badge: {
        padding: '6px 12px',
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        color: '#FFB800',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '700',
        marginTop: '8px',
    },
    filterBar: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap' as const,
    },
    filterBtn: {
        padding: '10px 16px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        color: 'var(--text-secondary)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    filterBtnActive: {
        backgroundColor: 'rgba(138, 43, 226, 0.15)',
        color: 'var(--primary)',
        borderColor: 'var(--primary)',
    },
    list: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
    },
    card: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: 'var(--primary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
    },
    userName: {
        fontSize: '16px',
        fontWeight: '700',
    },
    userRole: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    statusBadge: {
        padding: '6px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    amountInfo: {
        padding: '12px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
    },
    amount: {
        fontSize: '20px',
        fontWeight: '900',
        color: 'var(--accent-green)',
    },
    method: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginTop: '4px',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '12px',
    },
    date: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    approveBtn: {
        padding: '8px 12px',
        backgroundColor: 'var(--accent-green)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
    },
    rejectBtn: {
        padding: '8px 12px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'var(--text-secondary)',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
    },
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        color: 'var(--text-secondary)',
    },
    emptyCard: {
        padding: '60px',
        textAlign: 'center' as const,
        color: 'var(--text-secondary)',
    }
};

export default WithdrawalTab;
