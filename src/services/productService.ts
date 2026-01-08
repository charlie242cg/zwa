import { supabase } from '../lib/supabase';

export interface Product {
    id: string;
    seller_id: string;
    name: string;
    description: string;
    price: number;
    original_price?: number | null; // For promotion detection
    min_order_quantity: number;
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
