import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';

export const useTransactions = (
    userId: string | undefined,
    filter: 'all' | 'purchase' | 'sale' | 'commission' | 'withdrawal' = 'all'
) => {
    return useQuery({
        queryKey: ['transactions', userId, filter],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await transactionService.getTransactionsByUser(userId, filter);
            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    });
};
