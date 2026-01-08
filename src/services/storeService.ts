import { supabase } from '../lib/supabase';

export interface StoreProfile {
    id: string;
    store_name: string | null;
    store_slug: string | null;
    store_banner_url: string | null;
    store_bio: string | null;
    store_location: string | null;
    phone_number: string | null;
    avatar_url: string | null;
    full_name: string | null;
    is_verified_seller: boolean;
    total_sales_count: number;
    average_rating: number;
    total_reviews: number;
    created_at: string;
}

class StoreService {
    /**
     * Récupère les informations publiques d'une boutique par son ID
     */
    async getStoreById(sellerId: string) {
        console.log('[StoreService] 🏪 Fetching store by ID:', sellerId);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, store_name, store_slug, store_banner_url, store_bio, store_location, phone_number, avatar_url, full_name, is_verified_seller, total_sales_count, average_rating, total_reviews, created_at')
            .eq('id', sellerId)
            .eq('role', 'seller')
            .single();

        if (error) {
            console.error('[StoreService] ❌ Error fetching store:', error);
            return { data: null, error };
        }

        console.log('[StoreService] ✅ Store fetched:', data?.store_name || data?.full_name);
        return { data: data as StoreProfile, error: null };
    }

    /**
     * Récupère les informations publiques d'une boutique par son slug
     */
    async getStoreBySlug(slug: string) {
        console.log('[StoreService] 🏪 Fetching store by slug:', slug);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, store_name, store_slug, store_banner_url, store_bio, store_location, phone_number, avatar_url, full_name, is_verified_seller, total_sales_count, average_rating, total_reviews, created_at')
            .eq('store_slug', slug)
            .eq('role', 'seller')
            .single();

        if (error) {
            console.error('[StoreService] ❌ Error fetching store by slug:', error);
            return { data: null, error };
        }

        console.log('[StoreService] ✅ Store fetched:', data?.store_name || data?.full_name);
        return { data: data as StoreProfile, error: null };
    }

    /**
     * Récupère tous les produits d'une boutique avec filtres optionnels
     */
    async getStoreProducts(sellerId: string, filter: 'all' | 'bestsellers' = 'all') {
        console.log('[StoreService] 📦 Fetching products for seller:', sellerId, 'Filter:', filter);

        let query = supabase
            .from('products')
            .select('*, profiles(full_name, store_name, is_verified_seller, avatar_url)')
            .eq('seller_id', sellerId);

        // Filtres (pour l'instant, "bestsellers" retourne tous les produits)
        if (filter === 'bestsellers') {
            // Future: .order('sales_count', { ascending: false })
            console.log('[StoreService] ℹ️ Filter "bestsellers" not yet implemented, showing all products');
        }

        // Tri par date de création (les plus récents en premier)
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('[StoreService] ❌ Error fetching products:', error);
            return { data: null, error };
        }

        console.log('[StoreService] ✅ Products fetched:', data?.length || 0);
        return { data, error: null };
    }

    /**
     * Suit une boutique (sauvegarde dans localStorage pour MVP)
     */
    async followStore(userId: string, sellerId: string) {
        console.log('[StoreService] ❤️ Following store:', sellerId);

        try {
            const followed = JSON.parse(localStorage.getItem('zwa_followed_stores') || '[]');

            if (!followed.includes(sellerId)) {
                followed.push(sellerId);
                localStorage.setItem('zwa_followed_stores', JSON.stringify(followed));
                console.log('[StoreService] ✅ Store followed successfully');
                return { success: true, error: null };
            } else {
                console.log('[StoreService] ℹ️ Store already followed');
                return { success: true, error: null };
            }
        } catch (error) {
            console.error('[StoreService] ❌ Error following store:', error);
            return { success: false, error };
        }
    }

    /**
     * Ne suit plus une boutique
     */
    async unfollowStore(userId: string, sellerId: string) {
        console.log('[StoreService] 💔 Unfollowing store:', sellerId);

        try {
            const followed = JSON.parse(localStorage.getItem('zwa_followed_stores') || '[]');
            const newFollowed = followed.filter((id: string) => id !== sellerId);
            localStorage.setItem('zwa_followed_stores', JSON.stringify(newFollowed));
            console.log('[StoreService] ✅ Store unfollowed successfully');
            return { success: true, error: null };
        } catch (error) {
            console.error('[StoreService] ❌ Error unfollowing store:', error);
            return { success: false, error };
        }
    }

    /**
     * Vérifie si l'utilisateur suit une boutique
     */
    async isFollowing(userId: string, sellerId: string): Promise<boolean> {
        try {
            const followed = JSON.parse(localStorage.getItem('zwa_followed_stores') || '[]');
            const result = followed.includes(sellerId);
            console.log('[StoreService] 🔍 Is following:', sellerId, '→', result);
            return result;
        } catch (error) {
            console.error('[StoreService] ❌ Error checking follow status:', error);
            return false;
        }
    }

    /**
     * Récupère toutes les boutiques suivies par l'utilisateur
     */
    async getFollowedStores(userId: string) {
        console.log('[StoreService] 📋 Fetching followed stores for user:', userId);

        try {
            const followed = JSON.parse(localStorage.getItem('zwa_followed_stores') || '[]');

            if (followed.length === 0) {
                console.log('[StoreService] ℹ️ No followed stores');
                return { data: [], error: null };
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, store_name, store_slug, avatar_url, full_name, is_verified_seller, total_sales_count, average_rating, total_reviews')
                .in('id', followed)
                .eq('role', 'seller');

            if (error) {
                console.error('[StoreService] ❌ Error fetching followed stores:', error);
                return { data: null, error };
            }

            console.log('[StoreService] ✅ Followed stores fetched:', data?.length || 0);
            return { data, error: null };
        } catch (error) {
            console.error('[StoreService] ❌ Error in getFollowedStores:', error);
            return { data: null, error };
        }
    }
}

export const storeService = new StoreService();
