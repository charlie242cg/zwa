import { useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';

export const useProducts = (
    filters?: {
        search?: string;
        categories?: string[];
        verifiedOnly?: boolean;
        moqOne?: boolean;
        promoOnly?: boolean;
        sellerId?: string;
    },
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest',
    limit: number = 20
) => {
    return useInfiniteQuery({
        queryKey: ['products', filters, sortBy],
        queryFn: async ({ pageParam = 0 }) => {
            // Use optimized query for better performance
            const { data, error, count } = await productService.getPaginatedProductsOptimized(
                pageParam,
                limit,
                filters,
                sortBy
            );
            if (error) throw error;
            return {
                products: data || [],
                nextPage: (data && data.length === limit) ? pageParam + 1 : undefined,
                totalCount: count || 0
            };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
