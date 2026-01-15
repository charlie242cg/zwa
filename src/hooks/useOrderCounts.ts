import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';

export const useOrderCounts = (userId: string | undefined, role: string | undefined) => {
    return useQuery({
        queryKey: ['orderCounts', userId, role],
        queryFn: async () => {
            if (!userId || !role) return null;
            const { data, error } = await orderService.getOrderCounts(userId, role);
            if (error) throw error;
            return data;
        },
        enabled: !!userId && !!role,
        staleTime: 30000, // 30 seconds
    });
};
