import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';

export const useProductDetail = (productId: string | undefined) => {
    // Basic product data
    const productQuery = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            if (!productId) return null;
            const { data, error } = await productService.getProductById(productId);
            if (error) throw error;
            return data;
        },
        enabled: !!productId,
    });

    // Similar products
    const similarProductsQuery = useQuery({
        queryKey: ['product', productId, 'similar'],
        queryFn: async () => {
            if (!productId || !productQuery.data?.category_id) return [];
            const { data, error } = await productService.getSimilarProducts(
                productQuery.data.category_id,
                productId
            );
            if (error) throw error;
            return data || [];
        },
        enabled: !!productId && !!productQuery.data?.category_id,
    });

    // Reviews
    const reviewsQuery = useQuery({
        queryKey: ['product', productId, 'reviews'],
        queryFn: async () => {
            if (!productId) return { reviews: [], total: 0 };
            const [reviewsRes, countRes] = await Promise.all([
                reviewService.getProductReviews(productId, 3),
                reviewService.getProductReviewCount(productId)
            ]);
            return {
                reviews: reviewsRes.data || [],
                total: countRes.count || 0
            };
        },
        enabled: !!productId,
    });

    return {
        product: productQuery.data,
        isLoading: productQuery.isLoading,
        error: productQuery.error,
        similarProducts: similarProductsQuery.data || [],
        isLoadingSimilar: similarProductsQuery.isLoading,
        reviews: reviewsQuery.data?.reviews || [],
        totalReviews: reviewsQuery.data?.total || 0,
        isLoadingReviews: reviewsQuery.isLoading,
    };
};
