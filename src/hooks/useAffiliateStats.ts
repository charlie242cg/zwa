import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useAffiliateStats = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['affiliate-stats', userId],
        queryFn: async () => {
            if (!userId) return null;

            // 1. Fetch delivered orders for earned commissions
            const { data: deliveredOrders, error: deliveredError } = await supabase
                .from('orders')
                .select('amount, commission_amount')
                .eq('affiliate_id', userId)
                .eq('status', 'delivered');

            if (deliveredError) throw deliveredError;

            // 2. Fetch pending orders (paid/shipped but not delivered yet)
            const { data: pendingOrders, error: pendingError } = await supabase
                .from('orders')
                .select('amount, commission_amount')
                .eq('affiliate_id', userId)
                .in('status', ['paid', 'shipped']);

            if (pendingError) throw pendingError;

            // 3. Fetch sales by product (delivered)
            const { data: salesData, error: salesError } = await supabase
                .from('orders')
                .select('product_id, commission_amount, created_at, products(name, image_url, price)')
                .eq('affiliate_id', userId)
                .eq('status', 'delivered')
                .order('created_at', { ascending: false });

            if (salesError) throw salesError;

            const totalEarned = (deliveredOrders || []).reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);
            const pendingEarnings = (pendingOrders || []).reduce((sum, o) => sum + Number(o.commission_amount || 0), 0);

            // Group by product
            const groupedSales: any[] = [];
            const productMap = new Map();

            (salesData || []).forEach((order: any) => {
                const productId = order.product_id;
                const product = order.products;
                if (!productMap.has(productId)) {
                    productMap.set(productId, {
                        product_id: productId,
                        product_name: product?.name || 'Produit',
                        product_image: product?.image_url || '',
                        product_price: product?.price || 0,
                        sales_count: 0,
                        total_earned: 0,
                        last_sale: order.created_at
                    });
                }
                const sale = productMap.get(productId);
                sale.sales_count++;
                sale.total_earned += Number(order.commission_amount || 0);
            });

            const salesByProduct = Array.from(productMap.values()).sort((a, b) => b.total_earned - a.total_earned);

            return {
                totalEarned,
                pendingEarnings,
                salesCount: (deliveredOrders || []).length,
                pendingSalesCount: (pendingOrders || []).length,
                salesByProduct
            };
        },
        enabled: !!userId,
        staleTime: 60000, // 1 minute
    });
};
