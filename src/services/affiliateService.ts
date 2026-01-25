import { supabase } from '../lib/supabase';

export interface AffiliateLink {
    id: string;
    affiliate_id: string;
    product_id: string;
    status: 'active' | 'paused' | 'archived';
    created_at: string;
    products?: {
        name: string;
        price: number;
        image_url: string;
        default_commission: number;
        is_affiliate_enabled: boolean;
    };
}

export const affiliateService = {
    async getAffiliateLinks(affiliateId: string, status?: 'active' | 'paused' | 'archived') {
        let query = supabase
            .from('affiliate_links')
            .select('*, products(name, price, image_url, default_commission, is_affiliate_enabled)')
            .eq('affiliate_id', affiliateId);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        return { data: data as AffiliateLink[] | null, error };
    },

    async registerPromotion(affiliateId: string, productId: string) {
        // Verify product is affiliate-enabled before registering
        const { data: product } = await supabase
            .from('products')
            .select('is_affiliate_enabled')
            .eq('id', productId)
            .single();

        if (!product?.is_affiliate_enabled) {
            return { data: null, error: new Error('Ce produit n\'est plus disponible pour l\'affiliation') };
        }

        // Use upsert to avoid duplicates, set status to 'active'
        const { data, error } = await supabase
            .from('affiliate_links')
            .upsert({
                affiliate_id: affiliateId,
                product_id: productId,
                status: 'active'
            }, {
                onConflict: 'affiliate_id, product_id'
            })
            .select()
            .single();

        return { data, error };
    },

    async pausePromotion(linkId: string) {
        const { error } = await supabase
            .from('affiliate_links')
            .update({ status: 'paused' })
            .eq('id', linkId);

        return { error };
    },

    async resumePromotion(linkId: string) {
        const { error } = await supabase
            .from('affiliate_links')
            .update({ status: 'active' })
            .eq('id', linkId);

        return { error };
    },

    async archivePromotion(linkId: string) {
        const { error } = await supabase
            .from('affiliate_links')
            .update({ status: 'archived' })
            .eq('id', linkId);

        return { error };
    },

    async requestVipStatus(affiliateId: string, socialLinks: string) {
        // Option simple MVP: On stocke la demande dans les métadonnées de l'utilisateur ou la table profiles
        // Nous allons utiliser la table profiles avec une colonne status ou un champ json
        // Pour l'instant, on utilise une mise à jour directe (suppose la colonne existe ou sera créée)
        const { error } = await supabase
            .from('profiles')
            .update({
                // @ts-ignore - Colonnes dynamiques
                vip_request_status: 'pending',
                social_links: socialLinks
            })
            .eq('id', affiliateId);

        return { error };
    },

    async getVipStatus(affiliateId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('vip_request_status, is_vip_influencer')
            .eq('id', affiliateId)
            .single();
        return { data, error };
    }
};
