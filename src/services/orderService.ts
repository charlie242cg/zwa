import { supabase } from '../lib/supabase';
import { transactionService } from './transactionService';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
    id: string;
    buyer_id: string;
    seller_id: string;
    product_id: string;
    amount: number;
    quantity: number;
    status: OrderStatus;
    created_at: string;
}

export interface CreateOrderParams {
    buyerId: string;
    sellerId: string;
    productId: string;
    affiliateId?: string;
    amount: number;
    quantity: number;
    notes?: string;
}

export const orderService = {
    async createOrder(params: CreateOrderParams) {
        // 1. Fetch product to get commission rate
        const { data: product } = await supabase
            .from('products')
            .select('default_commission')
            .eq('id', params.productId)
            .single();

        const commissionRate = product?.default_commission || 0;
        const commissionAmount = (Number(params.amount) * Number(commissionRate)) / 100;

        const { data, error } = await supabase
            .from('orders')
            .insert([{
                buyer_id: params.buyerId,
                seller_id: params.sellerId,
                product_id: params.productId,
                affiliate_id: params.affiliateId,
                amount: params.amount,
                quantity: params.quantity,
                commission_amount: commissionAmount,
                notes: params.notes,
                status: 'pending'
            }])
            .select()
            .single();

        return { data, error };
    },

    async getOrdersByBuyer(buyerId: string) {
        console.log('[OrderService] 📦 Fetching orders for buyer:', buyerId);

        // Fetch all orders including pending (payment links not yet paid)
        // Join seller profile to get store_name
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(name, image_url), profiles!orders_seller_id_fkey(full_name, store_name, avatar_url)')
            .eq('buyer_id', buyerId)
            .in('status', ['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
            .order('created_at', { ascending: false });

        console.log('[OrderService] 📦 Buyer orders fetched:', { count: data?.length, error });
        return { data, error };
    },

    async getOrdersBySeller(sellerId: string) {
        console.log('[OrderService] 📦 Fetching orders for seller:', sellerId);

        // Fetch all orders including pending (sent payment links)
        // Join buyer profile to get full_name
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(name, image_url), profiles!orders_buyer_id_fkey(full_name, avatar_url)')
            .eq('seller_id', sellerId)
            .in('status', ['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
            .order('created_at', { ascending: false });

        console.log('[OrderService] 📦 Seller orders fetched:', { count: data?.length, error });
        return { data, error };
    },

    async getOrdersByAffiliate(affiliateId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(name, image_url)')
            .eq('affiliate_id', affiliateId)
            .in('status', ['pending', 'paid', 'shipped', 'delivered']) // Exclude cancelled
            .order('created_at', { ascending: false });

        return { data, error };
    },

    async getOrderById(id: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(name, image_url)')
            .eq('id', id)
            .single();

        return { data, error };
    },

    async updateOrder(id: string, params: { amount: number; quantity: number; notes?: string }) {
        // Fetch current order to get product_id
        const { data: order } = await supabase
            .from('orders')
            .select('product_id')
            .eq('id', id)
            .single();

        let commissionAmount = 0;
        if (order) {
            const { data: product } = await supabase
                .from('products')
                .select('default_commission')
                .eq('id', order.product_id)
                .single();

            const rate = product?.default_commission || 0;
            commissionAmount = (Number(params.amount) * Number(rate)) / 100;
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                amount: params.amount,
                quantity: params.quantity,
                commission_amount: commissionAmount,
                notes: params.notes
            })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    async shipOrder(orderId: string) {
        // Generate a random 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // In a real app, we would hash this. For the MVP, we'll store it directly
        // but label it as hash to maintain schema consistency if needed later.
        const { data, error } = await supabase
            .from('orders')
            .update({
                status: 'shipped',
                delivery_otp_hash: otp // Storing plain for MVP simplicity, as requested in PRD logic
            })
            .eq('id', orderId)
            .select()
            .single();

        return { data, error, otp };
    },

    async deliverOrder(orderId: string, otp: string) {
        console.log('[OrderService] 📦 Seller confirming delivery for order:', orderId, 'with OTP:', otp);

        // 1. Fetch the order to verify OTP
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            console.error('[OrderService] ❌ Order not found:', fetchError);
            return { error: fetchError || new Error('Order not found') };
        }

        if (order.delivery_otp_hash !== otp) {
            console.error('[OrderService] ❌ Invalid OTP');
            return { error: new Error('Code OTP invalide') };
        }

        console.log('[OrderService] ✅ OTP verified. Updating order to delivered...');

        // 2. Update order status
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', orderId);

        if (updateError) {
            console.error('[OrderService] ❌ Failed to update order:', updateError);
            return { error: updateError };
        }

        console.log('[OrderService] 💰 Updating wallet balances...');

        // 3. Update seller and affiliate wallet balances
        const { data: sellerProfile, error: sellerErr } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', order.seller_id)
            .single();

        if (sellerErr) {
            console.error('[OrderService] ❌ Failed to fetch seller profile:', sellerErr);
            return { error: sellerErr };
        }

        const commission = Number(order.commission_amount || 0);
        const netAmount = Number(order.amount) - commission;
        const newSellerBalance = Number(sellerProfile.wallet_balance) + netAmount;

        console.log('[OrderService] 💸 Seller payout:', {
            amount: order.amount,
            commission,
            netAmount,
            newBalance: newSellerBalance
        });

        // Update seller
        const { error: walletError } = await supabase
            .from('profiles')
            .update({ wallet_balance: newSellerBalance })
            .eq('id', order.seller_id);

        if (walletError) {
            console.error('[OrderService] ❌ Failed to update seller wallet:', walletError);
            return { error: walletError };
        }

        // Update affiliate if present
        if (order.affiliate_id && commission > 0) {
            console.log('[OrderService] 🎁 Affiliate detected. Updating commission...', {
                affiliateId: order.affiliate_id,
                commission
            });

            const { data: affiliateProfile } = await supabase
                .from('profiles')
                .select('wallet_balance')
                .eq('id', order.affiliate_id)
                .single();

            if (affiliateProfile) {
                const newAffiliateBalance = Number(affiliateProfile.wallet_balance) + commission;
                await supabase
                    .from('profiles')
                    .update({ wallet_balance: newAffiliateBalance })
                    .eq('id', order.affiliate_id);

                console.log('[OrderService] ✅ Affiliate commission paid:', {
                    newBalance: newAffiliateBalance
                });
            }
        }

        console.log('[OrderService] ✅ Delivery confirmed successfully!');

        // 🆕 Create transactions for all parties involved
        console.log('[OrderService] 📝 Creating transactions...');

        // Fetch product details for transactions
        const { data: product } = await supabase
            .from('products')
            .select('name, image_url, default_commission')
            .eq('id', order.product_id)
            .single();

        const productName = product?.name || 'Produit';
        const productImage = product?.image_url || '';
        const quantity = order.quantity || 1;
        const unitPrice = Number(order.amount) / quantity;

        // 1. Create PURCHASE transaction for buyer
        const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', order.buyer_id)
            .single();

        if (buyerProfile) {
            await transactionService.createPurchaseTransaction({
                userId: order.buyer_id,
                orderId: order.id,
                amount: Number(order.amount),
                balanceAfter: Number(buyerProfile.wallet_balance),
                productName,
                productImage,
                quantity,
                unitPrice
            });
            console.log('[OrderService] ✅ Purchase transaction created for buyer');
        }

        // 2. Create SALE transaction for seller
        await transactionService.createSaleTransaction({
            sellerId: order.seller_id,
            orderId: order.id,
            amount: netAmount,
            balanceAfter: newSellerBalance,
            productName,
            productImage,
            quantity,
            unitPrice,
            commissionAmount: commission > 0 ? commission : undefined
        });
        console.log('[OrderService] ✅ Sale transaction created for seller');

        // 3. Create COMMISSION transaction for affiliate (if applicable)
        if (order.affiliate_id && commission > 0) {
            const { data: affiliateProfile } = await supabase
                .from('profiles')
                .select('wallet_balance')
                .eq('id', order.affiliate_id)
                .single();

            if (affiliateProfile) {
                const commissionRate = product?.default_commission || 0;
                await transactionService.createCommissionTransaction({
                    affiliateId: order.affiliate_id,
                    orderId: order.id,
                    amount: commission,
                    balanceAfter: Number(affiliateProfile.wallet_balance),
                    productName,
                    commissionRate,
                    totalSale: Number(order.amount)
                });
                console.log('[OrderService] ✅ Commission transaction created for affiliate');
            }
        }

        console.log('[OrderService] ✅ All transactions created successfully!');
        return { data: { success: true }, error: null };
    },

    async simulatePayment(orderId: string) {
        console.log('[OrderService] 💳 Simulating payment for order:', orderId);

        // First, verify the order exists and is pending
        const { data: existingOrder, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError) {
            console.error('[OrderService] ❌ Order not found:', fetchError);
            return { data: null, error: fetchError };
        }

        console.log('[OrderService] 🔍 Order found:', {
            id: existingOrder.id,
            status: existingOrder.status,
            buyer_id: existingOrder.buyer_id,
            seller_id: existingOrder.seller_id
        });

        // Simulate payment by updating status from 'pending' to 'paid'
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId)
            .select('*, products(name, image_url)');

        if (error) {
            console.error('[OrderService] ❌ Payment update failed:', error);
            return { data: null, error };
        }

        console.log('[OrderService] ✅ Payment simulated successfully. Updated rows:', data?.length, 'Data:', data);

        if (!data || data.length === 0) {
            console.error('[OrderService] ⚠️ Update succeeded but returned no data. This might be an RLS issue.');
            // Try to fetch the order again
            const { data: refetchedOrder } = await supabase
                .from('orders')
                .select('*, products(name, image_url)')
                .eq('id', orderId)
                .single();

            console.log('[OrderService] 🔄 Refetched order:', refetchedOrder);
            return { data: refetchedOrder, error: null };
        }

        return { data: data[0], error: null };
    },

    async simulateFullSale(orderId: string) {
        console.log('[OrderService] 🎬 Simulating FULL SALE cycle for order:', orderId);

        // 1. Simulate payment (pending → paid)
        console.log('[OrderService] 💳 Step 1/3: Simulating payment...');
        const { error: paymentError } = await this.simulatePayment(orderId);
        if (paymentError) {
            console.error('[OrderService] ❌ Payment failed:', paymentError);
            return { error: paymentError };
        }
        console.log('[OrderService] ✅ Payment simulated successfully');

        // 2. Ship order (paid → shipped, generates OTP)
        console.log('[OrderService] 📦 Step 2/3: Shipping order...');
        const { data: shipData, error: shipError, otp } = await this.shipOrder(orderId);
        if (shipError || !otp) {
            console.error('[OrderService] ❌ Shipping failed:', shipError);
            return { error: shipError || new Error('OTP generation failed') };
        }
        console.log('[OrderService] ✅ Order shipped with OTP:', otp);

        // 3. Confirm delivery (shipped → delivered, triggers vente count)
        console.log('[OrderService] ✅ Step 3/3: Confirming delivery...');
        const { error: deliveryError } = await this.confirmDeliveryByBuyer(orderId, otp);
        if (deliveryError) {
            console.error('[OrderService] ❌ Delivery confirmation failed:', deliveryError);
            return { error: deliveryError };
        }

        console.log('[OrderService] 🎉 FULL SALE SIMULATED SUCCESSFULLY!');
        console.log('[OrderService] 📊 Order status: delivered | Wallets updated | Sales count incremented');

        return {
            data: {
                success: true,
                otp,
                message: 'Vente complète simulée avec succès !'
            },
            error: null
        };
    },

    async confirmDeliveryByBuyer(orderId: string, otp: string) {
        console.log('[OrderService] 📦 Buyer confirming delivery for order:', orderId, 'with OTP:', otp);

        // Buyer confirms delivery with OTP code
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (fetchError || !order) {
            console.error('[OrderService] ❌ Order not found:', fetchError);
            return { error: fetchError || new Error('Commande introuvable') };
        }

        console.log('[OrderService] 🔍 Order found. Verifying OTP...', {
            expected: order.delivery_otp_hash,
            provided: otp
        });

        if (order.delivery_otp_hash !== otp) {
            console.error('[OrderService] ❌ Invalid OTP');
            return { error: new Error('Code OTP invalide') };
        }

        console.log('[OrderService] ✅ OTP verified. Updating order to delivered...');

        // Update order status to delivered
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', orderId)
            .select('*, products(name, image_url)');

        if (error) {
            console.error('[OrderService] ❌ Failed to update order:', error);
            return { error };
        }

        console.log('[OrderService] 💰 Updating wallet balances...');

        // Update seller and affiliate wallet balances
        const { data: sellerProfile, error: sellerErr } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', order.seller_id)
            .single();

        if (sellerErr) {
            console.error('[OrderService] ❌ Failed to fetch seller profile:', sellerErr);
            return { error: sellerErr };
        }

        const commission = Number(order.commission_amount || 0);
        const netAmount = Number(order.amount) - commission;
        const newSellerBalance = Number(sellerProfile.wallet_balance) + netAmount;

        console.log('[OrderService] 💸 Seller payout:', {
            amount: order.amount,
            commission,
            netAmount,
            newBalance: newSellerBalance
        });

        // Update seller
        const { error: walletError } = await supabase
            .from('profiles')
            .update({ wallet_balance: newSellerBalance })
            .eq('id', order.seller_id);

        if (walletError) {
            console.error('[OrderService] ❌ Failed to update seller wallet:', walletError);
            return { error: walletError };
        }

        // Update affiliate if present
        if (order.affiliate_id && commission > 0) {
            console.log('[OrderService] 🎁 Affiliate detected. Updating commission...', {
                affiliateId: order.affiliate_id,
                commission
            });

            const { data: affiliateProfile } = await supabase
                .from('profiles')
                .select('wallet_balance')
                .eq('id', order.affiliate_id)
                .single();

            if (affiliateProfile) {
                const newAffiliateBalance = Number(affiliateProfile.wallet_balance) + commission;
                await supabase
                    .from('profiles')
                    .update({ wallet_balance: newAffiliateBalance })
                    .eq('id', order.affiliate_id);

                console.log('[OrderService] ✅ Affiliate commission paid:', {
                    newBalance: newAffiliateBalance
                });
            }
        }

        console.log('[OrderService] ✅ Delivery confirmed successfully!');

        // 🆕 Create transactions for all parties involved
        console.log('[OrderService] 📝 Creating transactions...');

        // Fetch product details for transactions
        const { data: product } = await supabase
            .from('products')
            .select('name, image_url, default_commission')
            .eq('id', order.product_id)
            .single();

        const productName = product?.name || 'Produit';
        const productImage = product?.image_url || '';
        const quantity = order.quantity || 1;
        const unitPrice = Number(order.amount) / quantity;

        // 1. Create PURCHASE transaction for buyer
        const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', order.buyer_id)
            .single();

        if (buyerProfile) {
            await transactionService.createPurchaseTransaction({
                userId: order.buyer_id,
                orderId: order.id,
                amount: Number(order.amount),
                balanceAfter: Number(buyerProfile.wallet_balance),
                productName,
                productImage,
                quantity,
                unitPrice
            });
            console.log('[OrderService] ✅ Purchase transaction created for buyer');
        }

        // 2. Create SALE transaction for seller
        await transactionService.createSaleTransaction({
            sellerId: order.seller_id,
            orderId: order.id,
            amount: netAmount,
            balanceAfter: newSellerBalance,
            productName,
            productImage,
            quantity,
            unitPrice,
            commissionAmount: commission > 0 ? commission : undefined
        });
        console.log('[OrderService] ✅ Sale transaction created for seller');

        // 3. Create COMMISSION transaction for affiliate (if applicable)
        if (order.affiliate_id && commission > 0) {
            const { data: affiliateProfile } = await supabase
                .from('profiles')
                .select('wallet_balance')
                .eq('id', order.affiliate_id)
                .single();

            if (affiliateProfile) {
                const commissionRate = product?.default_commission || 0;
                await transactionService.createCommissionTransaction({
                    affiliateId: order.affiliate_id,
                    orderId: order.id,
                    amount: commission,
                    balanceAfter: Number(affiliateProfile.wallet_balance),
                    productName,
                    commissionRate,
                    totalSale: Number(order.amount)
                });
                console.log('[OrderService] ✅ Commission transaction created for affiliate');
            }
        }

        console.log('[OrderService] ✅ All transactions created successfully!');
        return { data: data?.[0] || null, error: null };
    },

    async updateOrderStatus(orderId: string, status: OrderStatus) {
        console.log(`[OrderService] 🔄 Mise à jour statut commande ${orderId} vers ${status}`);
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();

        return { data, error };
    }
};
