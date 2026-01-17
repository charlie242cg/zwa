import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { kycService } from '../services/kycService';

export const useSellerStats = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['seller-stats', userId],
        queryFn: async () => {
            if (!userId) return null;

            // 1. Fetch stats from delivered orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('amount, status, commission_amount')
                .eq('seller_id', userId)
                .eq('status', 'delivered');

            if (ordersError) throw ordersError;

            // 2. Fetch seller profile stats (ratings, reviews, sales count)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('average_rating, total_reviews, total_sales_count, is_verified_seller, kyc_verified, store_name, phone_number, avatar_url')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // 3. Fetch KYC status
            const { data: kycData } = await kycService.getSellerKYCRequest(userId);

            const totalSales = (ordersData || []).reduce((sum: number, o: any) => sum + Number(o.amount), 0);
            const totalCommissions = (ordersData || []).reduce((sum: number, o: any) => sum + Number(o.commission_amount || 0), 0);

            return {
                stats: {
                    totalSales,
                    orderCount: (ordersData || []).length,
                    totalCommissions,
                    averageRating: profileData?.average_rating || 0,
                    totalReviews: profileData?.total_reviews || 0,
                    totalSalesCount: profileData?.total_sales_count || 0
                },
                profile: profileData,
                kycRequest: kycData
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes (Data is considered "fresh" for 5 mins)
        gcTime: 1000 * 60 * 60 * 24, // 24 hours (Keep data in cache for a day)
    });
};
