import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    sticker_id?: string;
    order_id?: string;
    is_read?: boolean;
    read_at?: string;
    created_at: string;
    order?: {
        id: string;
        amount: number;
        quantity: number;
        notes?: string;
        status: string;
        products: {
            name: string;
        };
    };
}

export interface Conversation {
    id: string;
    buyer_id: string;
    seller_id: string;
    product_id: string;
    source_affiliate_id?: string;
    created_at: string;
    last_message_at?: string;
    last_message_preview?: string;
    last_sender_id?: string;
    last_message_for_buyer?: string;
    last_message_for_seller?: string;
    last_message_for_buyer_at?: string;
    last_message_for_seller_at?: string;
    last_media_type_for_buyer?: 'image' | 'video';
    last_media_type_for_seller?: 'image' | 'video';
    hidden_for_buyer?: boolean;
    hidden_for_seller?: boolean;
    products?: {
        name: string;
        price: number;
        image_url: string;
    };
    buyer?: {
        full_name: string;
        avatar_url: string | null;
        role: string;
    };
    seller?: {
        full_name: string;
        store_name: string | null;
        avatar_url: string | null;
        role: string;
    };
    unread_count?: number;
}

export const chatService = {
    async getConversations(userId: string) {
        // 1. Charger les conversations avec JOINs
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                products(name, price, image_url),
                buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url, role),
                seller:profiles!conversations_seller_id_fkey(full_name, store_name, avatar_url, role)
            `)
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
            .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error || !data) return { data: null, error };

        // 2. Filtrer les conversations masquées
        const visibleConversations = data.filter(conv => {
            const isBuyer = conv.buyer_id === userId;
            return isBuyer ? !conv.hidden_for_buyer : !conv.hidden_for_seller;
        });

        if (visibleConversations.length === 0) {
            return { data: [], error: null };
        }

        // 3. OPTIMISATION: Charger TOUS les unread counts en UNE SEULE requête
        const conversationIds = visibleConversations.map(c => c.id);

        const { data: unreadMessages } = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', conversationIds)
            .eq('is_read', false)
            .neq('sender_id', userId);

        // 4. Compter côté client (ultra rapide)
        const unreadMap = (unreadMessages || []).reduce((acc, msg) => {
            acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 5. Enrichir les conversations avec unread_count
        const conversationsWithUnread = visibleConversations.map(conv => ({
            ...conv,
            unread_count: unreadMap[conv.id] || 0
        }));

        return { data: conversationsWithUnread, error: null };
    },

    async getConversationById(id: string) {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                products(name, price, image_url),
                buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url, role),
                seller:profiles!conversations_seller_id_fkey(full_name, store_name, avatar_url, role)
            `)
            .eq('id', id)
            .single();

        return { data, error };
    },

    async getMessages(conversationId: string) {
        try {
            // First attempt: with order details
            console.log("Attempting to fetch messages with order details...");
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    order:orders(
                        id,
                        amount,
                        quantity,
                        notes,
                        status,
                        products(name)
                    )
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                console.warn("Linked query failed, trying simple query:", error.message);
                // Fallback to simple query if the column or link is missing
                return await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });
            }

            return { data, error: null };
        } catch (err) {
            console.error("Critical error in getMessages:", err);
            return { data: [], error: err };
        }
    },

    async sendMessage(conversationId: string, senderId: string, content: string, media?: { url: string, type: 'image' | 'video' }, stickerId?: string, orderId?: string) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content,
                    media_url: media?.url,
                    media_type: media?.type,
                    sticker_id: stickerId,
                    order_id: orderId
                }])
                .select(`
                    *,
                    order:orders(
                        id,
                        amount,
                        quantity,
                        notes,
                        status,
                        products(name)
                    )
                `)
                .single();

            if (error && error.code === '42703') {
                console.warn("sendMessage failed due to missing order_id, retrying without it...");
                return await supabase
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        sender_id: senderId,
                        content,
                        media_url: media?.url,
                        media_type: media?.type,
                        sticker_id: stickerId
                    }])
                    .select()
                    .single();
            }

            return { data, error };
        } catch (err) {
            console.error("Critical error in sendMessage:", err);
            return { data: null, error: err };
        }
    },

    async uploadMedia(file: File) {
        try {
            console.log("Uploading file to Cloudinary:", file.name);
            const url = await uploadToCloudinary(file);
            console.log("Cloudinary upload successful:", url);
            return { url, error: null };
        } catch (err) {
            console.error("Cloudinary Upload Error:", err);
            return { error: err };
        }
    },

    async createConversation(buyerId: string, sellerId: string, productId: string, affiliateId?: string) {
        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .match({ buyer_id: buyerId, seller_id: sellerId, product_id: productId })
            .maybeSingle();

        if (existing) return { data: existing, error: null };

        const { data, error } = await supabase
            .from('conversations')
            .insert([{ buyer_id: buyerId, seller_id: sellerId, product_id: productId, source_affiliate_id: affiliateId }])
            .select()
            .single();

        return { data, error };
    },

    subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
        return supabase
            .channel(`chat:${conversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
                callback(payload.new as Message);
            })
            .subscribe();
    },

    // Compter messages non lus pour un utilisateur
    async getUnreadCount(userId: string): Promise<number> {
        const { data, error } = await supabase
            .from('messages')
            .select('id, conversation_id, conversations!inner(buyer_id, seller_id)')
            .eq('is_read', false)
            .neq('sender_id', userId);

        if (error || !data) return 0;

        // Filtrer uniquement les conversations où l'utilisateur est participant
        const userMessages = data.filter((msg: any) => {
            const conv = msg.conversations;
            if (!conv) return false;
            return conv.buyer_id === userId || conv.seller_id === userId;
        });

        return userMessages.length;
    },

    // Compter messages non lus par conversation
    async getUnreadCountByConversation(conversationId: string, userId: string): Promise<number> {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId)
            .eq('is_read', false)
            .neq('sender_id', userId);

        return count || 0;
    },

    // Marquer messages comme lus
    async markAsRead(conversationId: string, userId: string) {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        return { error };
    },

    // Masquer conversation (soft delete)
    async hideConversation(conversationId: string, userId: string, isBuyer: boolean) {
        const column = isBuyer ? 'hidden_for_buyer' : 'hidden_for_seller';

        const { error } = await supabase
            .from('conversations')
            .update({ [column]: true })
            .eq('id', conversationId);

        return { error };
    },

    // Restaurer conversation masquée
    async unhideConversation(conversationId: string, userId: string, isBuyer: boolean) {
        const column = isBuyer ? 'hidden_for_buyer' : 'hidden_for_seller';

        const { error } = await supabase
            .from('conversations')
            .update({ [column]: false })
            .eq('id', conversationId);

        return { error };
    }
};
