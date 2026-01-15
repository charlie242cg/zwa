import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { affiliateService } from '../services/affiliateService';

export const useAffiliateLinks = (userId: string | undefined) => {
    const queryClient = useQueryClient();

    const linksQuery = useQuery({
        queryKey: ['affiliate-links', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await affiliateService.getAffiliateLinks(userId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        staleTime: 60000,
    });

    const pauseMutation = useMutation({
        mutationFn: (linkId: string) => affiliateService.pausePromotion(linkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliate-links', userId] });
        }
    });

    const resumeMutation = useMutation({
        mutationFn: (linkId: string) => affiliateService.resumePromotion(linkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliate-links', userId] });
        }
    });

    const archiveMutation = useMutation({
        mutationFn: (linkId: string) => affiliateService.archivePromotion(linkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliate-links', userId] });
        }
    });

    const registerMutation = useMutation({
        mutationFn: ({ affiliateId, productId }: { affiliateId: string, productId: string }) =>
            affiliateService.registerPromotion(affiliateId, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliate-links', userId] });
        }
    });

    return {
        links: linksQuery.data || [],
        isLoading: linksQuery.isLoading,
        error: linksQuery.error,
        pause: pauseMutation.mutateAsync,
        resume: resumeMutation.mutateAsync,
        archive: archiveMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        isPausing: pauseMutation.isPending,
        isResuming: resumeMutation.isPending,
        isArchiving: archiveMutation.isPending,
        isRegistering: registerMutation.isPending,
    };
};
