import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeService } from '../services/storeService';
import { supabase } from '../lib/supabase';

export const useStore = (sellerId: string | undefined) => {
    const queryClient = useQueryClient();

    const storeQuery = useQuery({
        queryKey: ['store', sellerId],
        queryFn: async () => {
            if (!sellerId) return null;
            const { data, error } = await storeService.getStoreById(sellerId);
            if (error) throw error;
            return data;
        },
        enabled: !!sellerId,
        staleTime: 300000, // 5 minutes
    });

    const followingQuery = useQuery({
        queryKey: ['store-following', sellerId],
        queryFn: async () => {
            if (!sellerId) return false;
            // Note: In a real app, we'd need the current user ID here, 
            // but storeService.isFollowing uses localStorage which is client-side.
            // We'll pass a dummy userId for now since it's not used in service implementation.
            return storeService.isFollowing('', sellerId);
        },
        enabled: !!sellerId,
    });

    const financialStatsQuery = useQuery({
        queryKey: ['store-financials', sellerId],
        queryFn: async () => {
            if (!sellerId) return null;
            const { data, error } = await supabase
                .from('orders')
                .select('amount, commission_amount')
                .eq('seller_id', sellerId)
                .eq('status', 'delivered');

            if (error) throw error;

            const totalRevenue = (data || []).reduce((sum: number, order: any) => sum + Number(order.amount), 0);
            const totalCommissions = (data || []).reduce((sum: number, order: any) => sum + Number(order.commission_amount || 0), 0);

            return {
                totalRevenue,
                totalCommissions,
                grandTotal: totalRevenue + totalCommissions
            };
        },
        enabled: !!sellerId,
        staleTime: 60000, // 1 minute
    });

    const reviewsQuery = useQuery({
        queryKey: ['store-reviews', sellerId],
        queryFn: async () => {
            if (!sellerId) return [];
            const { data, error } = await storeService.getStoreReviews(sellerId, 3);
            if (error) throw error;
            return data || [];
        },
        enabled: !!sellerId,
        staleTime: 60000,
    });

    const followMutation = useMutation({
        mutationFn: async ({ userId, action }: { userId: string, action: 'follow' | 'unfollow' }) => {
            if (action === 'follow') {
                return storeService.followStore(userId, sellerId!);
            } else {
                return storeService.unfollowStore(userId, sellerId!);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-following', sellerId] });
        }
    });

    return {
        store: storeQuery.data,
        isLoadingStore: storeQuery.isLoading,
        storeError: storeQuery.error,
        isFollowing: followingQuery.data,
        isLoadingFollowing: followingQuery.isLoading,
        financialStats: financialStatsQuery.data,
        isLoadingFinancials: financialStatsQuery.isLoading,
        reviews: reviewsQuery.data,
        isLoadingReviews: reviewsQuery.isLoading,
        follow: (userId: string) => followMutation.mutate({ userId, action: 'follow' }),
        unfollow: (userId: string) => followMutation.mutate({ userId, action: 'unfollow' }),
        isFollowPending: followMutation.isPending
    };
};
