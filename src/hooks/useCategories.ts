import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await categoryService.getActiveCategories();
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 60, // Categories change rarely, keep for 1 hour
    });
};
