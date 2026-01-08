import { supabase } from '../lib/supabase';
import { Category, CategoryWithCount } from '../types/category';

export const categoryService = {
    /**
     * Get all active categories ordered by display_order
     */
    getActiveCategories: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        return { data: data as Category[] | null, error };
    },

    /**
     * Get all categories (admin only) with product counts
     */
    getAllCategoriesWithCounts: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select(`
        *,
        products:products(count)
      `)
            .order('display_order', { ascending: true });

        if (error) return { data: null, error };

        // Transform the data to include product_count
        const categoriesWithCounts = data?.map(cat => ({
            ...cat,
            product_count: cat.products?.[0]?.count || 0
        })) as CategoryWithCount[];

        return { data: categoriesWithCounts, error: null };
    },

    /**
     * Create a new category (admin only)
     */
    createCategory: async (name: string, icon?: string, displayOrder?: number) => {
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name,
                icon,
                display_order: displayOrder || 999,
                created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single();

        return { data: data as Category | null, error };
    },

    /**
     * Update a category (admin only)
     */
    updateCategory: async (id: string, updates: Partial<Category>) => {
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return { data: data as Category | null, error };
    },

    /**
     * Toggle category active status (admin only)
     */
    toggleCategoryStatus: async (id: string, isActive: boolean) => {
        const { data, error } = await supabase
            .from('categories')
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();

        return { data: data as Category | null, error };
    },

    /**
     * Delete a category (admin only)
     * Note: Products will have category_id set to NULL due to ON DELETE SET NULL
     */
    deleteCategory: async (id: string) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        return { error };
    },

    /**
     * Reorder categories (admin only)
     */
    reorderCategories: async (categoryOrders: { id: string; display_order: number }[]) => {
        const updates = categoryOrders.map(({ id, display_order }) =>
            supabase
                .from('categories')
                .update({ display_order })
                .eq('id', id)
        );

        const results = await Promise.all(updates);
        const errors = results.filter(r => r.error);

        return { error: errors.length > 0 ? errors[0].error : null };
    }
};
