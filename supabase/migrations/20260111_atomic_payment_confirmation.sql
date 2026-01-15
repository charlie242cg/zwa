-- Migration : Action atomique pour confirmer le paiement et décrémenter le stock
-- Description : Évite les conflits de timing entre le webhook et la redirection client.

CREATE OR REPLACE FUNCTION public.confirm_order_payment(
    p_order_id UUID,
    p_yabetoo_status TEXT DEFAULT NULL,
    p_yabetoo_intent_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_stock_result BOOLEAN;
    v_updated_order RECORD;
BEGIN
    -- 1. Récupération de la commande avec verrouillage pour éviter les accès concurrents
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- 2. Si la commande est DEJÀ payée, on ne fait rien (succès silencieux)
    IF v_order.status = 'paid' THEN
        RETURN jsonb_build_object(
            'success', true, 
            'already_paid', true,
            'order', row_to_json(v_order)
        );
    END IF;

    -- 3. Décrémentation du stock
    v_stock_result := public.decrement_product_stock(v_order.product_id, v_order.quantity);

    -- 4. Mise à jour du statut et des infos Yabetoo
    UPDATE public.orders
    SET 
        status = 'paid',
        yabetoo_status = COALESCE(p_yabetoo_status, yabetoo_status),
        yabetoo_intent_id = COALESCE(p_yabetoo_intent_id, yabetoo_intent_id)
    WHERE id = p_order_id
    RETURNING * INTO v_updated_order;

    RETURN jsonb_build_object(
        'success', true, 
        'stock_decremented', v_stock_result,
        'order', row_to_json(v_updated_order)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permission d'exécution
GRANT EXECUTE ON FUNCTION public.confirm_order_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_payment TO service_role;
