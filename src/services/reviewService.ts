import { supabase } from '../lib/supabase';

export interface Review {
    id: string;
    order_id: string;
    buyer_id: string;
    seller_id: string;
    product_id: string;
    seller_rating?: number | null;
    product_rating?: number | null;
    seller_comment?: string | null;
    product_comment?: string | null;
    review_images?: string[];
    created_at: string;
    updated_at: string;
    // Relations
    buyer?: {
        full_name: string;
        avatar_url?: string;
    };
}

export interface CreateReviewData {
    orderId: string;
    buyerId: string;
    sellerId: string;
    productId: string;
    sellerRating?: number;
    productRating?: number;
    sellerComment?: string;
    productComment?: string;
    reviewImages?: string[];
}

export const reviewService = {
    /**
     * Create a new review
     */
    async createReview(data: CreateReviewData) {
        const { data: review, error } = await supabase
            .from('reviews')
            .insert({
                order_id: data.orderId,
                buyer_id: data.buyerId,
                seller_id: data.sellerId,
                product_id: data.productId,
                seller_rating: data.sellerRating || null,
                product_rating: data.productRating || null,
                seller_comment: data.sellerComment || null,
                product_comment: data.productComment || null,
                review_images: data.reviewImages || [],
            })
            .select()
            .single();

        return { data: review, error };
    },

    /**
     * Check if an order already has a review
     */
    async hasReview(orderId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', orderId)
            .maybeSingle();

        return { hasReview: !!data, error };
    },

    /**
     * Get reviews for a specific product
     */
    async getProductReviews(productId: string, limit = 10, offset = 0) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                buyer:profiles!buyer_id(full_name, avatar_url)
            `)
            .eq('product_id', productId)
            .not('product_rating', 'is', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        return { data: data as Review[], error };
    },

    /**
     * Get reviews for a specific seller
     */
    async getSellerReviews(sellerId: string, limit = 10, offset = 0) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                buyer:profiles!buyer_id(full_name, avatar_url)
            `)
            .eq('seller_id', sellerId)
            .not('seller_rating', 'is', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        return { data: data as Review[], error };
    },

    /**
     * Get review by order ID
     */
    async getReviewByOrderId(orderId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();

        return { data: data as Review | null, error };
    },

    /**
     * Count total reviews for a product
     */
    async getProductReviewCount(productId: string) {
        const { count, error } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', productId)
            .not('product_rating', 'is', null);

        return { count: count || 0, error };
    },

    /**
     * Count total reviews for a seller
     */
    async getSellerReviewCount(sellerId: string) {
        const { count, error } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', sellerId)
            .not('seller_rating', 'is', null);

        return { count: count || 0, error };
    }
};
