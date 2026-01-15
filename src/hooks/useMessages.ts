import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, Message } from '../services/chatService';

export const useMessages = (conversationId: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const { data, error } = await chatService.getMessages(conversationId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!conversationId,
        staleTime: 0, // Messages should be as fresh as possible
    });

    useEffect(() => {
        if (!conversationId) return;

        console.log(`📡 [Realtime] Subscribing to conversation: ${conversationId}`);
        const subscription = chatService.subscribeToMessages(conversationId, (newMessage) => {
            console.log("📩 [Realtime] New message received:", newMessage.id);

            // Update the messages cache
            queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
                if (!oldData) return [newMessage];

                // Avoid duplicates
                if (oldData.find(m => m.id === newMessage.id)) return oldData;

                return [...oldData, newMessage].sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
            });

            // Also invalidate conversations list to update previews
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        });

        return () => {
            console.log(`🔌 [Realtime] Unsubscribing from conversation: ${conversationId}`);
            subscription.unsubscribe();
        };
    }, [conversationId, queryClient]);

    return query;
};
