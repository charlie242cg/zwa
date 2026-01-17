import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { storeService } from '../services/storeService'; // If needed for orders/store
import { useAuth } from './useAuth';

/**
 * This hook initiates pre-fetching of critical data as soon as the user is authenticated.
 * It helps make navigation feel instant by ensuring data is already in the cache.
 */
export const useBootstrapData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user?.id) return;

        console.log('[Bootstrap] 🚀 Starting background data prefetch...');

        // 1. Prefetch Conversations (Critical for Chat)
        const conversationsState = queryClient.getQueryState(['conversations', user.id]);
        const now = Date.now();

        // Only prefetch if data is missing or stale (older than 5 minutes)
        if (!conversationsState || !conversationsState.data || (now - conversationsState.dataUpdatedAt) > 1000 * 60 * 5) {
            console.log('[Bootstrap] 📡 Prefetching conversations (cache miss or stale)');
            queryClient.prefetchQuery({
                queryKey: ['conversations', user.id],
                queryFn: async () => {
                    const { data } = await chatService.getConversations(user.id);
                    return data || [];
                },
                staleTime: 1000 * 60 * 5, // 5 mins
            });
        } else {
            console.log('[Bootstrap] ✅ Conversations already cached and fresh, skipping prefetch');
        }

        // 2. Prefetch User Profile (Usually already loaded by AuthContext, but good to ensure)
        // (Skipped as AuthContext handles it)

        // 3. If seller, prefetch Store Details
        // We'd need to know if they are a seller, but we can just try or wait for profile.
        // For now, let's keep it lightweight.

    }, [user?.id, queryClient]);
};
