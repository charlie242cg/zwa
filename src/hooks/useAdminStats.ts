import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useAdminStats = () => {
    return useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // GMV & Commissions from delivered orders
            const { data: orderStats, error: orderError } = await supabase
                .from('orders')
                .select('amount, commission_amount, status, created_at')
                .eq('status', 'delivered');

            if (orderError) throw orderError;

            // Active orders
            const { count: activeOrderCount, error: activeError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'processing', 'shipped']);

            if (activeError) throw activeError;

            // Today's completed orders
            const today = new Date().toISOString().split('T')[0];
            const { count: todayCount, error: todayError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'delivered')
                .gte('created_at', today);

            if (todayError) throw todayError;

            // User counts
            const { count: sellerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller');
            const { count: verifiedSellerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller').eq('kyc_verified', true);
            const { count: affiliateCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'affiliate');
            const { count: buyerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer');

            // Product count
            const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

            // Pending withdrawals
            const { data: pendingWithdrawals, count: pendingCount } = await supabase
                .from('transactions')
                .select('amount', { count: 'exact' })
                .eq('type', 'withdrawal')
                .eq('status', 'pending');

            const gmv = orderStats?.reduce((sum, o) => sum + Number(o.amount), 0) || 0;
            const commissions = orderStats?.reduce((sum, o) => sum + Number(o.commission_amount || 0), 0) || 0;
            const pendingAmount = pendingWithdrawals?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            return {
                totalGMV: gmv,
                totalCommissions: commissions,
                totalOrders: orderStats?.length || 0,
                totalSellers: sellerCount || 0,
                totalAffiliates: affiliateCount || 0,
                totalBuyers: buyerCount || 0,
                totalProducts: productCount || 0,
                pendingWithdrawals: pendingCount || 0,
                pendingWithdrawalAmount: pendingAmount,
                verifiedSellers: verifiedSellerCount || 0,
                activeOrders: activeOrderCount || 0,
                completedToday: todayCount || 0,
            };
        },
        staleTime: 60000, // 1 minute
    });
};
