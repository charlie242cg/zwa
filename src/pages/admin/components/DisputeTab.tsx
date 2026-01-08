import React, { useEffect, useState } from 'react';
import { ShieldAlert, Unlock, MessageSquare, Package, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const DisputeTab = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        // On récupère les commandes expédiées (où l'acheteur pourrait avoir oublié son OTP)
        const { data } = await supabase
            .from('orders')
            .select('*, products(name, image_url), profiles!orders_buyer_id_fkey(full_name, phone_number)')
            .eq('status', 'shipped')
            .order('created_at', { ascending: false });

        if (data) setOrders(data);
        setLoading(false);
    };

    const forceDeliver = async (orderId: string, otp: string) => {
        const notes = window.prompt(`Voulez-vous forcer la livraison de cette commande ?

OTP de livraison: ${otp}

⚠️ IMPORTANT: Ne forcez la livraison que si:
- L'acheteur confirme avoir reçu le produit
- Il y a un problème technique avec l'OTP
- Vous avez une preuve de livraison

Entrez une note explicative (ou annuler):`);

        if (!notes) return;

        try {
            // 1. Marquer la commande comme livrée
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'delivered' })
                .eq('id', orderId);

            if (orderError) {
                alert('❌ Erreur lors de la mise à jour de la commande: ' + orderError.message);
                return;
            }

            // 2. Logger l'action d'arbitrage
            const { error: logError } = await supabase
                .from('dispute_resolutions')
                .insert([{
                    order_id: orderId,
                    resolution_type: 'force_delivery',
                    notes: `Admin a forcé la livraison. OTP utilisé: ${otp}. Notes: ${notes}`
                }]);

            if (logError) {
                console.error('Erreur log arbitrage:', logError);
                // On continue quand même car la commande est marquée livrée
            }

            // 3. Rafraîchir la liste
            fetchDisputes();
            alert('✅ Commande marquée comme livrée.\n\nLes fonds seront disponibles pour le vendeur lors du prochain retrait.');
        } catch (error: any) {
            console.error('Erreur:', error);
            alert('❌ Erreur: ' + error.message);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Litiges & Arbitrage ⚖️</h2>
                <p style={styles.subtitle}>Gestion des fonds bloqués et problèmes de code OTP.</p>
            </div>

            {loading ? <div style={styles.loading}>Analyse des commandes...</div> : orders.length === 0 ? (
                <div style={styles.emptyCard} className="premium-card">
                    <ShieldAlert size={40} color="var(--text-secondary)" />
                    <p>Aucun litige ou commande bloquée à l'expédition.</p>
                </div>
            ) : (
                <div style={styles.list}>
                    {orders.map((order) => (
                        <div key={order.id} style={styles.card} className="premium-card">
                            <div style={styles.orderHead}>
                                <img src={order.products?.image_url} style={styles.img} alt="" />
                                <div style={styles.info}>
                                    <div style={styles.prodName}>{order.products?.name}</div>
                                    <div style={styles.buyer}>{order.profiles?.full_name} • {order.profiles?.phone_number}</div>
                                </div>
                                <div style={styles.otpBox}>
                                    <div style={styles.otpLabel}>OTP REQUIS</div>
                                    <div style={styles.otpValue}>{order.delivery_otp_hash}</div>
                                </div>
                            </div>

                            <div style={styles.footer}>
                                <div style={styles.status}>
                                    <Package size={14} /> Expédié le {new Date(order.created_at).toLocaleDateString()}
                                </div>
                                <div style={styles.actions}>
                                    <button style={styles.chatBtn}>
                                        <MessageSquare size={16} /> Contacter
                                    </button>
                                    <button
                                        onClick={() => forceDeliver(order.id, order.delivery_otp_hash)}
                                        style={styles.actionBtn}
                                    >
                                        <Unlock size={16} /> Libérer les fonds
                                    </button>
                                </div>
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
        flexDirection: 'column' as const,
        gap: '4px',
    },
    title: {
        fontSize: '22px',
        fontWeight: '800',
    },
    subtitle: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
    },
    list: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    card: {
        padding: '16px',
    },
    orderHead: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
    },
    img: {
        width: '60px',
        height: '60px',
        borderRadius: '10px',
        objectFit: 'cover' as const,
    },
    info: {
        flex: 1,
    },
    prodName: {
        fontWeight: '700',
        fontSize: '15px',
    },
    buyer: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginTop: '2px',
    },
    otpBox: {
        padding: '10px 16px',
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        border: '1px solid rgba(255, 184, 0, 0.2)',
        borderRadius: '12px',
        textAlign: 'center' as const,
    },
    otpLabel: {
        fontSize: '9px',
        fontWeight: '900',
        color: '#FFB800',
        marginBottom: '2px',
    },
    otpValue: {
        fontSize: '20px',
        fontWeight: '900',
        color: 'white',
        letterSpacing: '2px',
    },
    footer: {
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    status: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    chatBtn: {
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.05)',
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
    actionBtn: {
        padding: '8px 12px',
        background: 'var(--primary)',
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

export default DisputeTab;
