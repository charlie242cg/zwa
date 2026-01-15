import { supabase } from '../lib/supabase';

export interface Product {
    id: string;
    seller_id: string;
    name: string;
    description: string;
    price: number;
    original_price?: number | null; // For promotion detection
    min_order_quantity: number;
    stock_quantity: number; // Stock disponible (0 = illimité/non suivi)
    default_commission: number;
    is_affiliate_enabled: boolean;
    image_url: string; // Keep as main/first image for compatibility
    images_url?: string[]; // Additional or all images
    category_id?: string | null; // Link to categories table
    city_id?: string | null; // Link to cities table
    average_rating?: number; // Product's own rating
    total_reviews?: number; // Product's own review count
    created_at: string;
    profiles?: {
        full_name: string;
        is_verified_seller: boolean;
        avatar_url?: string;
        store_name?: string;
        total_sales_count?: number;
        average_rating?: number;
    };
    categories?: {
        id: string;
        name: string;
        icon?: string;
    };
    cities?: {
        id: string;
        name: string;
    };
}

export const productService = {
    async getProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*, profiles(full_name, is_verified_seller, avatar_url, store_name, total_sales_count, average_rating), categories(id, name, icon)')
            .order('created_at', { ascending: false });

        return { data: data as Product[] | null, error };
    },

    async getPaginatedProducts(
        page: number = 0,
        limit: number = 20,
        filters?: {
            search?: string;
            categories?: string[];
            verifiedOnly?: boolean;
            newOnly?: boolean;
            moqOne?: boolean;
            promoOnly?: boolean;
            sellerId?: string;
        }
    ) {
        const from = page * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('products')
            .select('*, profiles(full_name, is_verified_seller, avatar_url, store_name, total_sales_count, average_rating), categories(id, name, icon)', { count: 'exact' });

        if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`);
        }

        if (filters?.categories && filters.categories.length > 0) {
            query = query.in('category_id', filters.categories);
        }

        if (filters?.verifiedOnly) {
            // Note: This requires a join filter which is tricky in Supabase without a RPC or a specific view
            // For now, we'll keep it simple if possible, but profiles is a joined table.
            // In Supabase, you can't filter by a joined table directly easily without '!inner'
            query = query.filter('profiles.is_verified_seller', 'eq', true);
        }

        if (filters?.moqOne) {
            query = query.eq('min_order_quantity', 1);
        }

        if (filters?.promoOnly) {
            query = query.not('original_price', 'is', null);
        }

        if (filters?.sellerId) {
            query = query.eq('seller_id', filters.sellerId);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        return { data: data as Product[] | null, error, count };
    },

    async getSimilarProducts(categoryId: string, currentProductId: string, limit: number = 8) {
        const { data, error } = await supabase
            .from('products')
            .select('*, profiles(full_name, is_verified_seller, avatar_url, store_name, total_sales_count, average_rating), categories(id, name, icon)')
            .eq('category_id', categoryId)
            .neq('id', currentProductId)
            .order('created_at', { ascending: false })
            .limit(limit);

        return { data: data as Product[] | null, error };
    },

    async getProductById(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*, profiles(full_name, is_verified_seller, avatar_url, store_name, total_sales_count, average_rating), categories(id, name, icon)')
            .eq('id', id)
            .single();

        return { data: data as Product | null, error };
    },

    async getProductsByCategory(categoryId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*, profiles(full_name, is_verified_seller, avatar_url, store_name, total_sales_count, average_rating), categories(id, name, icon)')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });

        return { data: data as Product[] | null, error };
    },

    async createProduct(product: Omit<Product, 'id' | 'created_at' | 'profiles' | 'categories'>) {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select('*, profiles(full_name, is_verified_seller), categories(id, name, icon)')
            .single();

        return { data: data as Product | null, error };
    },

    async updateProduct(id: string, updates: Partial<Product>) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select('*, profiles(full_name, is_verified_seller), categories(id, name, icon)')
            .single();

        return { data, error };
    },

    async deleteProduct(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        return { error };
    }
};
