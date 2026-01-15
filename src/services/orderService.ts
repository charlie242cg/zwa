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
    expires_at?: string;
    shipping_timeline?: string;
}

export interface CreateOrderParams {
    buyerId: string;
    sellerId: string;
    productId: string;
    affiliateId?: string;
    amount: number;
    quantity: number;
    notes?: string;
    buyerPhone?: string;
    deliveryLocation?: string;
    expiresAt?: string;
    shippingTimeline?: string;
}

export const orderService = {
    async createOrder(params: CreateOrderParams) {
        // 1. Fetch product to get commission rate and stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('default_commission, stock_quantity')
            .eq('id', params.productId)
            .single();

        console.log('[OrderService] 📦 Product stock check:', {
            productId: params.productId,
            stock_quantity: product?.stock_quantity,
            requested_quantity: params.quantity,
            productError
        });

        // 2. Check stock availability (null = unlimited, >=0 = tracked)
        const stockQty = product?.stock_quantity;
        if (stockQty !== null && stockQty !== undefined) {
            if (params.quantity > stockQty) {
                console.log('[OrderService] ❌ Stock insufficient!');
                return {
                    data: null,
                    error: {
                        message: stockQty === 0
                            ? "Produit en rupture de stock."
                            : `Stock insuffisant. Seulement ${stockQty} unité(s) disponible(s).`
                    }
                };
            }
        }

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
                buyer_phone: params.buyerPhone,
                delivery_location: params.deliveryLocation,
                expires_at: params.expiresAt,
                shipping_timeline: params.shippingTimeline || '7 jours',
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
            .select('*, products(name, image_url), seller:profiles!orders_seller_id_fkey(full_name, store_name, avatar_url)')
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
            .select('*, products(name, image_url), buyer:profiles!orders_buyer_id_fkey(full_name, avatar_url)')
            .eq('seller_id', sellerId)
            .in('status', ['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
            .order('created_at', { ascending: false });

        console.log('[OrderService] 📦 Seller orders fetched:', { count: data?.length, error });
        return { data, error };
    },

    async getPaginatedOrders({
        userId,
        role,
        status,
        search,
        page = 0,
        limit = 10
    }: {
        userId: string,
        role: 'buyer' | 'seller' | 'affiliate',
        status?: string,
        search?: string,
        page?: number,
        limit?: number
    }) {
        const from = page * limit;
        const to = from + limit - 1;

        console.log(`[OrderService] 📑 Fetching paginated orders for ${role} ${userId}`, { status, search, page });

        let query = supabase
            .from('orders')
            .select(`
                *,
                products(name, image_url),
                buyer:profiles!orders_buyer_id_fkey(full_name, avatar_url),
                seller:profiles!orders_seller_id_fkey(full_name, store_name, avatar_url),
                reviews(id)
            `, { count: 'exact' });

        // Filter by role
        if (role === 'seller') {
            query = query.eq('seller_id', userId);
        } else if (role === 'affiliate') {
            query = query.eq('affiliate_id', userId);
        } else {
            query = query.eq('buyer_id', userId);
        }

        // Filter by status
        if (status && status !== 'all') {
            query = query.eq('status', status);
        } else if (role === 'affiliate') {
            // Affiliates don't see cancelled orders by default
            query = query.in('status', ['pending', 'paid', 'shipped', 'delivered']);
        }

        // Search (if provided) - This is tricky in Supabase for joined tables, 
        // but we can at least filter by order ID or product name if we use a flat structure or specific queries.
        // For now, let's focus on the basics and add search if possible.
        if (search) {
            query = query.or(`id.ilike.%${search}%, notes.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        return { data, error, count };
    },

    async getOrderCounts(userId: string, role: string) {
        let query = supabase
            .from('orders')
            .select('status, amount', { count: 'exact' });

        if (role === 'seller') {
            query = query.eq('seller_id', userId);
        } else if (role === 'affiliate') {
            query = query.eq('affiliate_id', userId);
        } else {
            query = query.eq('buyer_id', userId);
        }

        const { data, error } = await query;
        if (error) return { data: null, error };

        const counts = {
            all: data.length,
            pending: 0,
            paid: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            totalRevenue: 0
        };

        data.forEach(order => {
            if (counts[order.status as keyof typeof counts] !== undefined) {
                (counts[order.status as keyof typeof counts] as number)++;
            }
            if (order.status === 'delivered' || order.status === 'paid' || order.status === 'shipped') {
                counts.totalRevenue += Number(order.amount);
            }
        });

        return { data: counts, error: null };
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

    async updateOrder(id: string, params: { amount: number; quantity: number; notes?: string; expiresAt?: string; shippingTimeline?: string }) {
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
                notes: params.notes,
                expires_at: params.expiresAt,
                shipping_timeline: params.shippingTimeline
            })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    async shipOrder(orderId: string) {
        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const { data, error } = await supabase
            .from('orders')
            .update({
                status: 'shipped',
                delivery_otp_hash: otp,
                shipped_at: new Date().toISOString()
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

        if (order.delivery_otp_hash !== otp.trim()) {
            console.error('[OrderService] ❌ Invalid OTP. Expected:', order.delivery_otp_hash, 'Got:', otp.trim());
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
            seller_id: existingOrder.seller_id,
            product_id: existingOrder.product_id,
            quantity: existingOrder.quantity
        });

        // Use the atomic confirmation RPC
        console.log('[OrderService] ⚡ Calling confirm_order_payment RPC...');
        const { data: confirmResult, error: confirmError } = await supabase
            .rpc('confirm_order_payment', {
                p_order_id: orderId,
                p_yabetoo_status: 'succeeded'
            });

        console.log('[OrderService] 📦 Atomic RPC result:', { confirmResult, confirmError });

        if (confirmError) {
            console.error('[OrderService] ❌ Atomic confirmation failed:', confirmError);
            return { data: null, error: confirmError };
        }

        // Return the order from the RPC result
        return { data: confirmResult.order, error: null };
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

        // 3. Confirm delivery (shipped → delivered)
        console.log('[OrderService] ✅ Step 3/3: Confirming delivery...');
        const { error: deliveryError } = await this.deliverOrder(orderId, otp);
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



    async updateOrderStatus(orderId: string, status: OrderStatus) {
        console.log(`[OrderService] 🔄 Mise à jour statut commande ${orderId} vers ${status}`);

        // If transitioning to 'paid', use atomic RPC to ensure stock decrement
        if (status === 'paid') {
            console.log(`[OrderService] ⚡ Appel atomique confirm_order_payment pour ${orderId}`);
            const { data: confirmResult, error: confirmError } = await supabase
                .rpc('confirm_order_payment', {
                    p_order_id: orderId,
                    p_yabetoo_status: 'completed'
                });

            if (confirmError) {
                console.error('[OrderService] ❌ Erreur confirmation atomique :', confirmError);
                return { error: confirmError };
            }

            console.log('[OrderService] ✅ Résultat confirmation atomique :', confirmResult);
            return { data: confirmResult.order, error: null };
        }

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();

        return { data, error };
    }
};
