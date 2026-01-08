import { supabase } from '../lib/supabase';

export interface KYCRequest {
    id: string;
    seller_id: string;
    status: 'pending' | 'approved' | 'rejected';
    id_card_url?: string;
    selfie_with_id_url?: string;
    whatsapp_number?: string;
    notes?: string;
    admin_notes?: string;
    reviewed_by?: string;
    reviewed_at?: string;
    created_at: string;
    updated_at: string;
}

class KYCService {
    /**
     * Récupérer la demande KYC d'un vendeur
     */
    async getSellerKYCRequest(sellerId: string) {
        const { data, error } = await supabase
            .from('kyc_requests')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return { data, error };
    }

    /**
     * Soumettre une nouvelle demande KYC
     */
    async submitKYCRequest(request: {
        seller_id: string;
        id_card_url: string;
        selfie_with_id_url: string;
        whatsapp_number: string;
        notes?: string;
    }) {
        const { data, error } = await supabase
            .from('kyc_requests')
            .insert([{
                ...request,
                status: 'pending'
            }])
            .select()
            .single();

        return { data, error };
    }

    /**
     * Re-soumettre une demande rejetée
     */
    async resubmitKYCRequest(requestId: string, updates: {
        id_card_url: string;
        selfie_with_id_url: string;
        whatsapp_number: string;
        notes?: string;
    }) {
        const { data, error } = await supabase
            .from('kyc_requests')
            .update({
                ...updates,
                status: 'pending',
                admin_notes: null,
                reviewed_by: null,
                reviewed_at: null
            })
            .eq('id', requestId)
            .select()
            .single();

        return { data, error };
    }

    /**
     * Upload fichier vers Supabase Storage
     */
    async uploadKYCDocument(file: File, sellerId: string, type: 'id_card' | 'selfie'): Promise<{ url: string | null; error: any }> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${sellerId}_${type}_${Date.now()}.${fileExt}`;
        const filePath = `kyc/${fileName}`;

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            return { url: null, error };
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        return { url: publicUrl, error: null };
    }

    /**
     * Admin: Récupérer toutes les demandes KYC
     */
    async getAllKYCRequests(status?: 'pending' | 'approved' | 'rejected') {
        let query = supabase
            .from('kyc_requests')
            .select('*, profiles!kyc_requests_seller_id_fkey(full_name, store_name, phone_number, avatar_url)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        return { data, error };
    }

    /**
     * Admin: Approuver une demande KYC
     */
    async approveKYCRequest(requestId: string, sellerId: string, adminId: string, adminNotes?: string) {
        // 1. Mettre à jour la demande
        const { error: requestError } = await supabase
            .from('kyc_requests')
            .update({
                status: 'approved',
                admin_notes: adminNotes,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (requestError) return { error: requestError };

        // 2. Activer KYC sur le profil vendeur
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ kyc_verified: true })
            .eq('id', sellerId);

        return { error: profileError };
    }

    /**
     * Admin: Rejeter une demande KYC
     */
    async rejectKYCRequest(requestId: string, adminId: string, reason: string) {
        const { error } = await supabase
            .from('kyc_requests')
            .update({
                status: 'rejected',
                admin_notes: reason,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        return { error };
    }
}

export const kycService = new KYCService();
