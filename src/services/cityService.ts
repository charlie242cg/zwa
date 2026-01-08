import { supabase } from '../lib/supabase';

export interface City {
    id: string;
    name: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export const cityService = {
    /**
     * Get all active cities
     */
    getActiveCities: async () => {
        const { data, error } = await supabase
            .from('cities')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        return { data: data as City[] | null, error };
    },

    /**
     * Get all cities (admin only)
     */
    getAllCities: async () => {
        const { data, error } = await supabase
            .from('cities')
            .select('*')
            .order('display_order', { ascending: true });

        return { data: data as City[] | null, error };
    },

    /**
     * Create a new city
     */
    createCity: async (name: string, displayOrder?: number) => {
        const { data, error } = await supabase
            .from('cities')
            .insert({
                name,
                display_order: displayOrder || 0
            })
            .select()
            .single();

        return { data: data as City | null, error };
    },

    /**
     * Update a city
     */
    updateCity: async (id: string, updates: Partial<City>) => {
        const { data, error } = await supabase
            .from('cities')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return { data: data as City | null, error };
    },

    /**
     * Delete a city
     */
    deleteCity: async (id: string) => {
        const { error } = await supabase
            .from('cities')
            .delete()
            .eq('id', id);

        return { error };
    }
};
