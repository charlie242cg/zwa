import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useProfile = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            console.log(`[useProfile] 📡 Fetching profile for UID: ${userId}`);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("[useProfile] ❌ Error fetching profile:", error.message);
                throw error;
            }

            return data;
        },
        enabled: !!userId,
        staleTime: 300000, // 5 minutes - Profile doesn't change often
    });
};
