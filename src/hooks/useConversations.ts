import { useQuery } from '@tanstack/react-query';
import { chatService } from '../services/chatService';

export const useConversations = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['conversations', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await chatService.getConversations(userId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        staleTime: 30000, // 30 seconds
    });
};
