import { supabase } from '../lib/supabase';

export const paymentService = {
    /**
     * Appelle la fonction Edge pour créer une intention de paiement Yabetoo
     * @param orderId ID de la commande Zwa
     * @returns L'URL de redirection vers le checkout Yabetoo
     */
    async createYabetooCheckout(orderId: string): Promise<{ checkout_url: string; error: any }> {
        console.log('[PaymentService] 💳 Création du checkout Yabetoo pour la commande :', orderId);

        try {
            const { data, error } = await supabase.functions.invoke('create-yabetoo-intent', {
                body: { orderId }
            });

            if (error) {
                console.error('[PaymentService] ❌ Erreur Edge Function :', error);
                return { checkout_url: '', error };
            }

            console.log('[PaymentService] ✅ Checkout URL reçue :', data.checkout_url);
            return { checkout_url: data.checkout_url, error: null };
        } catch (err) {
            console.error('[PaymentService] ❌ Erreur inattendue :', err);
            return { checkout_url: '', error: err };
        }
    }
};
