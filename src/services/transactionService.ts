import { supabase } from '../lib/supabase';

export interface Transaction {
    id: string;
    user_id: string;
    type: 'purchase' | 'sale' | 'commission' | 'withdrawal';
    amount: number;
    balance_after: number;
    order_id?: string;

    // Détails produit
    product_name?: string;
    product_image?: string;
    quantity?: number;
    unit_price?: number;

    // Commission
    commission_rate?: number;

    // Retrait
    withdrawal_method?: string;
    withdrawal_number?: string;
    withdrawal_fee?: number;

    description?: string;
    status: 'pending' | 'completed' | 'rejected';
    created_at: string;
}

export const transactionService = {
    /**
     * Récupérer toutes les transactions d'un utilisateur avec filtre optionnel
     */
    async getTransactionsByUser(
        userId: string,
        filter: 'all' | 'purchase' | 'sale' | 'commission' | 'withdrawal' = 'all'
    ) {
        console.log('[TransactionService] 📊 Fetching transactions for user:', userId, 'Filter:', filter);

        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('type', filter);
        }

        const { data, error } = await query;

        console.log('[TransactionService] 📊 Transactions fetched:', { count: data?.length, error });
        return { data, error };
    },

    /**
     * Créer une transaction ACHAT (pour buyers)
     */
    async createPurchaseTransaction(params: {
        userId: string;
        orderId: string;
        amount: number;
        balanceAfter: number;
        productName: string;
        productImage: string;
        quantity: number;
        unitPrice: number;
    }) {
        console.log('[TransactionService] 🛒 Creating purchase transaction:', params.orderId);

        const { data, error } = await supabase.from('transactions').insert([{
            user_id: params.userId,
            type: 'purchase',
            amount: -Math.abs(params.amount), // Négatif (débit)
            balance_after: params.balanceAfter,
            order_id: params.orderId,
            product_name: params.productName,
            product_image: params.productImage,
            quantity: params.quantity,
            unit_price: params.unitPrice,
            description: `Achat de ${params.quantity}x ${params.productName}`
        }]).select().single();

        if (error) {
            console.error('[TransactionService] ❌ Purchase transaction failed:', error);
        } else {
            console.log('[TransactionService] ✅ Purchase transaction created:', data?.id);
        }

        return { data, error };
    },

    /**
     * Créer une transaction VENTE (pour sellers)
     */
    async createSaleTransaction(params: {
        sellerId: string;
        orderId: string;
        amount: number;
        balanceAfter: number;
        productName: string;
        productImage: string;
        quantity: number;
        unitPrice: number;
        commissionAmount?: number;
    }) {
        console.log('[TransactionService] 💵 Creating sale transaction:', params.orderId);

        const { data, error } = await supabase.from('transactions').insert([{
            user_id: params.sellerId,
            type: 'sale',
            amount: Math.abs(params.amount), // Positif (crédit)
            balance_after: params.balanceAfter,
            order_id: params.orderId,
            product_name: params.productName,
            product_image: params.productImage,
            quantity: params.quantity,
            unit_price: params.unitPrice,
            description: `Vente de ${params.quantity}x ${params.productName}${params.commissionAmount ? ` (Commission: -${params.commissionAmount.toLocaleString()} FCFA)` : ''
                }`
        }]).select().single();

        if (error) {
            console.error('[TransactionService] ❌ Sale transaction failed:', error);
        } else {
            console.log('[TransactionService] ✅ Sale transaction created:', data?.id);
        }

        return { data, error };
    },

    /**
     * Créer une transaction COMMISSION (pour affiliates)
     */
    async createCommissionTransaction(params: {
        affiliateId: string;
        orderId: string;
        amount: number;
        balanceAfter: number;
        productName: string;
        commissionRate: number;
        totalSale: number;
    }) {
        console.log('[TransactionService] 💰 Creating commission transaction:', params.orderId);

        const { data, error } = await supabase.from('transactions').insert([{
            user_id: params.affiliateId,
            type: 'commission',
            amount: Math.abs(params.amount), // Positif (crédit)
            balance_after: params.balanceAfter,
            order_id: params.orderId,
            product_name: params.productName,
            commission_rate: params.commissionRate,
            description: `Commission ${params.commissionRate}% sur vente de ${params.totalSale.toLocaleString()} FCFA`
        }]).select().single();

        if (error) {
            console.error('[TransactionService] ❌ Commission transaction failed:', error);
        } else {
            console.log('[TransactionService] ✅ Commission transaction created:', data?.id);
        }

        return { data, error };
    },

    /**
     * Créer une transaction RETRAIT (pour tous les rôles)
     */
    async createWithdrawalTransaction(params: {
        userId: string;
        amount: number;
        balanceAfter: number;
        method: string;
        number: string;
        fee: number;
    }) {
        console.log('[TransactionService] 💸 Creating withdrawal transaction');

        const { data, error } = await supabase.from('transactions').insert([{
            user_id: params.userId,
            type: 'withdrawal',
            amount: -Math.abs(params.amount), // Négatif (débit)
            balance_after: params.balanceAfter,
            withdrawal_method: params.method,
            withdrawal_number: params.number,
            withdrawal_fee: params.fee,
            status: 'pending',
            description: `Retrait ${params.method} vers ${params.number} (Frais: ${params.fee} FCFA)`
        }]).select().single();

        if (error) {
            console.error('[TransactionService] ❌ Withdrawal transaction failed:', error);
        } else {
            console.log('[TransactionService] ✅ Withdrawal transaction created:', data?.id);
        }

        return { data, error };
    },

    /**
     * Mettre à jour le statut d'une transaction (Admin only)
     */
    async updateTransactionStatus(transactionId: string, status: 'pending' | 'completed' | 'rejected') {
        console.log('[TransactionService] 🔄 Updating transaction status:', transactionId, 'to', status);

        const { data, error } = await supabase
            .from('transactions')
            .update({ status })
            .eq('id', transactionId)
            .select()
            .single();

        return { data, error };
    },

    async getAllTransactions(params?: { type?: string, status?: string }) {
        let query = supabase
            .from('transactions')
            .select('*, profiles(full_name, role)')
            .order('created_at', { ascending: false });

        if (params?.type) query = query.eq('type', params.type);
        if (params?.status) query = query.eq('status', params.status);

        const { data, error } = await query;
        return { data, error };
    },

    /**
     * Facade pour créer un retrait facilement
     */
    async createWithdrawal(params: { userId: string, amount: number, method: string, phoneNumber: string }) {
        // 1. Get current balance
        const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', params.userId).single();
        const currentBalance = profile?.wallet_balance || 0;

        if (currentBalance < params.amount) {
            return { error: new Error('Solde insuffisant') };
        }

        // 2. Create transaction
        return await this.createWithdrawalTransaction({
            userId: params.userId,
            amount: params.amount,
            method: params.method,
            number: params.phoneNumber,
            balanceAfter: currentBalance - params.amount,
            fee: 0 // Free for now or calculate
        });
    }
};
