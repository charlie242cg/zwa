import { useInfiniteQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';

export const useOrders = (params: {
    userId: string | undefined,
    role: 'buyer' | 'seller' | 'affiliate',
    status?: string,
    search?: string
}) => {
    return useInfiniteQuery({
        queryKey: ['orders', params.userId, params.role, params.status, params.search],
        queryFn: async ({ pageParam = 0 }) => {
            if (!params.userId) return { data: [], count: 0 };

            const { data, error, count } = await orderService.getPaginatedOrders({
                userId: params.userId,
                role: params.role,
                status: params.status,
                search: params.search,
                page: pageParam,
                limit: 10
            });

            if (error) throw error;
            return { data: data || [], count: count || 0 };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((sum, page) => sum + page.data.length, 0);
            return loadedCount < lastPage.count ? allPages.length : undefined;
        },
        enabled: !!params.userId,
        staleTime: 60000, // 1 minute
    });
};
