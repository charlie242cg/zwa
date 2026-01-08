// File: supabase/functions/yabetoo-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// On pourrait importer orderService ici, mais pour une Edge Function isolée, 
// on réimplémente la logique de validation pour éviter les dépendances complexes.

serve(async (req) => {
    try {
        const payload = await req.json()
        console.log('[Webhook] Notification reçue (brute) :', payload)

        // 1. Initialisation du client admin
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Extraction des données (Yabetoo envoie un objet avec intentId, financialTransactionId, id, etc.)
        const data = payload.data || payload;
        const status = data.status || data.event;

        // pi_... (Payment Intent ID)
        const intentId = data.intentId;
        // ch_... (Charge ID / Transaction ID chez Yabetoo)
        const chargeId = data.id;

        // Extraction de l'orderId depuis TOUS les champs possibles renvoyés par Yabetoo
        let orderIdCandidate =
            data.reference ||
            data.metadata?.orderId ||
            data.metadata?.order_id ||
            data.externalId ||
            payload.reference ||
            payload.externalId;

        // Nettoyage si Yabetoo ajoute un préfixe (ex: ext_ID)
        if (typeof orderIdCandidate === 'string' && orderIdCandidate.startsWith('ext_')) {
            orderIdCandidate = orderIdCandidate.replace(/^ext_/, '');
        }

        console.log(`[Webhook] 🔍 Analyse : orderId=${orderIdCandidate}, intentId=${intentId}, chargeId=${chargeId}, status=${status}`);

        // 3. Vérification de la réussite
        if (status === 'succeeded' || status === 'completed' || payload.event === 'intent.completed') {

            let targetOrder = null;

            // Priorité 1 : Recherche par ID de commande direct (si extrait avec succès)
            if (orderIdCandidate && orderIdCandidate.length > 20) { // Un UUID fait 36 chars
                console.log(`[Webhook] 🔎 Recherche par ID de commande : ${orderIdCandidate}`);
                const { data: o } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .eq('id', orderIdCandidate)
                    .single();
                targetOrder = o;
            }

            // Priorité 2 : Recherche par ID de paiement Yabetoo (le champ yabetoo_intent_id)
            if (!targetOrder && intentId) {
                console.log(`[Webhook] 🔎 Recherche par Intent ID : ${intentId}`);
                const { data: o } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .eq('yabetoo_intent_id', intentId)
                    .single();
                targetOrder = o;
            }

            // Priorité 3 : Recherche par Charge ID dans l'URL
            if (!targetOrder && chargeId) {
                console.log(`[Webhook] 🔎 Recherche par Charge ID dans URL : ${chargeId}`);
                const { data: o } = await supabaseAdmin
                    .from('orders')
                    .select('*')
                    .ilike('yabetoo_payment_url', `%${chargeId}%`)
                    .single();
                targetOrder = o;
            }

            // Priorité 3 : Recherche par Intent ID dans l'URL (cas désespéré) - REMOVED as per new logic
            // if (!targetOrder && intentId) {
            //     console.log(`[Webhook] 🔎 Recherche par Intent ID dans URL : ${intentId}`);
            //     const { data: o } = await supabaseAdmin
            //         .from('orders')
            //         .select('*')
            //         .ilike('yabetoo_payment_url', `%${intentId}%`)
            //         .single();
            //     targetOrder = o;
            // }

            if (!targetOrder) {
                console.warn('[Webhook] Commande introuvable pour orderId/intentId :', { orderIdCandidate, intentId, chargeId });
                // On renvoie 200 quand même pour que Yabetoo arrête d'insister,
                // mais on logue l'erreur pour nous.
                return new Response(JSON.stringify({ received: true, error: 'Order not found' }), { status: 200 })
            }

            // Si la commande est déjà payée, on ne fait rien
            if (targetOrder.status === 'paid') {
                console.log('[Webhook] Commande déjà traitée (déjà payée).')
                return new Response(JSON.stringify({ received: true, already_processed: true }), { status: 200 })
            }

            // 4. Mise à jour de la commande
            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({
                    status: 'paid',
                    yabetoo_status: status,
                    // On en profite pour enregistrer le PI ID si on n'avait que le Session ID
                    yabetoo_intent_id: intentId || targetOrder.yabetoo_intent_id
                })
                .eq('id', targetOrder.id)

            if (updateError) {
                console.error('[Webhook] ❌ Erreur Update DB :', updateError);
                throw updateError;
            }

            console.log('[Webhook] ✅ Commande validée avec succès :', targetOrder.id)
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 })

    } catch (error) {
        console.error('[Webhook] 💥 Erreur Critique :', error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})
