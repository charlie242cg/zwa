// File: supabase/functions/create-yabetoo-intent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Gestion du CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json().catch(() => ({}));
        const { orderId } = body;

        console.log('[CreateIntent] 🔵 Début traitement orderId :', orderId);

        if (!orderId) {
            return new Response(JSON.stringify({ error: 'orderId manquant' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*, products(name)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            console.error('[CreateIntent] ❌ Erreur DB :', orderError);
            return new Response(JSON.stringify({ error: 'Commande introuvable', details: orderError }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404
            });
        }

        const YABETOO_SECRET_KEY = Deno.env.get('YABETOO_SECRET_KEY');
        const YABETOO_ACCOUNT_ID = Deno.env.get('YABETOO_ACCOUNT_ID');

        const totalAmount = Math.round(Number(order.amount));

        // Utilisation de l'API Sessions pour la redirection Hosted Checkout
        // On simplifie au maximum pour éviter les bugs de rendu sur leur page (React errors)
        const payload = {
            total: totalAmount,
            currency: 'xaf',
            accountId: YABETOO_ACCOUNT_ID,
            successUrl: `${req.headers.get('origin') || 'https://zwa.market'}/payment-success?id=${order.id}`,
            cancelUrl: `${req.headers.get('origin') || 'https://zwa.market'}/orders?status=cancelled&id=${order.id}`,
            // externalId et reference sont cruciaux pour la réconciliation
            externalId: String(order.id),
            reference: String(order.id),
            metadata: {
                orderId: String(order.id),
                productId: String(order.product_id)
            },
            // Pour les systèmes compatibles Stripe (test des deux formats)
            paymentIntentData: {
                metadata: {
                    orderId: String(order.id)
                }
            },
            payment_intent_data: {
                metadata: {
                    order_id: String(order.id)
                }
            },
            items: [
                {
                    productId: String(order.product_id).slice(0, 36),
                    quantity: 1,
                    price: totalAmount,
                    productName: "Commande Zwa"
                }
            ]
        };

        console.log('[CreateIntent] 🚀 Envoi Session Yabetoo :', payload);

        const response = await fetch('https://buy.api.yabetoopay.com/v1/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${YABETOO_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const responseText = await response.text();
        console.log('[CreateIntent] 📥 Réponse brute Yabetoo :', responseText);

        let yabetooData;
        try {
            yabetooData = JSON.parse(responseText);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Réponse Yabetoo non-JSON', raw: responseText }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 502
            });
        }

        if (!response.ok) {
            console.error('[CreateIntent] ❌ Erreur API Yabetoo :', yabetooData);
            return new Response(JSON.stringify({
                error: 'Yabetoo Session Error',
                message: yabetooData.message || 'Erreur lors de la création de la session de paiement',
                details: yabetooData
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: response.status
            });
        }

        // L'URL de redirection est dans yabetooData.url
        const checkoutUrl = yabetooData.url;

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                yabetoo_intent_id: yabetooData.id,
                yabetoo_payment_url: checkoutUrl,
                yabetoo_status: 'pending'
            })
            .eq('id', orderId)

        if (updateError) console.error('[CreateIntent] ❌ Erreur Update DB :', updateError);

        return new Response(
            JSON.stringify({ checkout_url: checkoutUrl }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('[CreateIntent] 💥 Erreur Critique :', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
