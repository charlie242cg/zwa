import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { chatService, Message } from '../services/chatService';

export const useChatActions = (conversationId?: string) => {
    const queryClient = useQueryClient();

    // Mutation for sending a message
    const sendMessageMutation = useMutation({
        mutationFn: async ({ content, senderId, media, stickerId, orderId }: {
            content: string,
            senderId: string,
            media?: { url: string, type: 'image' | 'video' },
            stickerId?: string,
            orderId?: string
        }) => {
            if (!conversationId) throw new Error("No conversation ID");
            const { data, error } = await chatService.sendMessage(
                conversationId,
                senderId,
                content,
                media,
                stickerId,
                orderId
            );
            if (error) throw error;
            return data;
        },
        // Optimistic UI Update
        onMutate: async (newMsg) => {
            await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
            const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);

            if (previousMessages) {
                const optimisticMsg: Message = {
                    id: `temp-${Date.now()}`,
                    conversation_id: conversationId!,
                    sender_id: newMsg.senderId,
                    content: newMsg.content,
                    media_url: newMsg.media?.url,
                    media_type: newMsg.media?.type,
                    sticker_id: newMsg.stickerId,
                    order_id: newMsg.orderId,
                    created_at: new Date().toISOString(),
                };

                queryClient.setQueryData(['messages', conversationId], [...previousMessages, optimisticMsg]);
            }

            return { previousMessages };
        },
        onError: (err, newMsg, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(['messages', conversationId], context.previousMessages);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });

    // Mutation for marking messages as read
    const markAsReadMutation = useMutation({
        mutationFn: async (userId: string) => {
            if (!conversationId) return;
            return await chatService.markAsRead(conversationId, userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    const sendMessage = useCallback(async (params: any) => {
        return sendMessageMutation.mutateAsync(params);
    }, [sendMessageMutation]);

    const markAsRead = useCallback((userId: string) => {
        markAsReadMutation.mutate(userId);
    }, [markAsReadMutation]);

    return {
        sendMessage,
        isSending: sendMessageMutation.isPending,
        markAsRead
    };
};
