import { useQuery } from '@tanstack/react-query';
import { chatService } from '../services/chatService';

export const useConversationDetail = (conversationId: string | undefined) => {
    return useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: async () => {
            if (!conversationId) return null;
            const { data, error } = await chatService.getConversationById(conversationId);
            if (error) throw error;
            return data;
        },
        enabled: !!conversationId,
    });
};
