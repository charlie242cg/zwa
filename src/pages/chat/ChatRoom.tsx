import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, Plus, Image as ImageIcon, Video, Camera, Smile, CheckCircle, PlusCircle, Clock, CheckCheck, X, Calendar, Zap, ChevronRight, FileText, Truck, MapPin } from 'lucide-react';
import { chatService, Message, Conversation } from '../../services/chatService';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { useSkeletonAnimation, SkeletonChatHeader, SkeletonChatMessages } from '../../components/common/SkeletonLoader';

const ChatRoom = () => {
    useSkeletonAnimation(); // Ajoute l'animation CSS
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const [orderParams, setOrderParams] = useState({ price: '', quantity: '1', notes: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showStickers, setShowStickers] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        return () => { try { document.head.removeChild(style); } catch (e) { } };
    }, []);

    const STICKERS = [
        { id: 'cool', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=cool' },
        { id: 'love', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=love' },
        { id: 'happy', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=happy' },
        { id: 'wow', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=wow' },
        { id: 'deal', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=deal' },
        { id: 'money', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=money' },
    ];

    useEffect(() => {
        if (id) {
            fetchConversationDetails(id);
            fetchMessages(id);

            // Marquer messages comme lus
            if (user) {
                chatService.markAsRead(id, user.id);
            }

            const subscription = chatService.subscribeToMessages(id, (msg) => {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                });
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [id, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversationDetails = async (convId: string) => {
        const { data, error } = await chatService.getConversationById(convId);
        if (!error && data) {
            setConversation(data);
            setOrderParams(prev => ({ ...prev, price: data.products?.price.toString() || '' }));
        }
    };

    const fetchMessages = async (convId: string) => {
        setLoading(true);
        const { data, error } = await chatService.getMessages(convId);
        if (!error && data) {
            setMessages(data);
        }
        setLoading(false);
    };

    const handleSendMessage = async (e?: React.FormEvent, contentOverride?: string) => {
        if (e) e.preventDefault();
        const content = contentOverride !== undefined ? contentOverride : newMessage.trim();

        // Allow sending if there's content OR a file OR it's a sticker (contentOverride)
        if (!content && !selectedFile && contentOverride === undefined) return;
        if (!id || !user) return;

        // Fallback for media-only messages to satisfy NOT NULL constraints if any
        const finalContent = content || " ";

        // Optimistic Message Object
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: id,
            sender_id: user.id,
            content: finalContent,
            media_url: previewUrl || undefined,
            media_type: previewType || undefined,
            created_at: new Date().toISOString()
        };

        // 1. Update UI immediately (Optimistic UI)
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        const prevFile = selectedFile;
        const prevPreview = previewUrl;
        const prevType = previewType;

        setSelectedFile(null);
        setPreviewUrl(null);
        setPreviewType(null);
        scrollToBottom();

        try {
            let mediaData = undefined;

            if (prevFile) {
                console.log("Starting media upload for file:", prevFile.name);
                setIsUploading(true);
                const { url, error } = await chatService.uploadMedia(prevFile);
                setIsUploading(false);

                if (error) {
                    console.error("Upload failed in ChatRoom handleSendMessage:", error);
                    alert("Erreur lors de l'upload du média. Vérifiez votre connexion.");
                    // Rollback optimistic message if upload fails
                    setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
                    return;
                }

                console.log("Upload successful, URL:", url);
                mediaData = { url: url!, type: prevType! };
            }

            console.log("Sending message to Supabase...", { finalContent, mediaData });
            const { data, error } = await chatService.sendMessage(id, user.id, finalContent, mediaData);

            if (error) {
                console.error("Supabase sendMessage error:", error);
                alert("Erreur lors de l'envoi du message.");
                // Rollback
                setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            } else if (data) {
                console.log("Message sent successfully and confirmed by DB:", data.id);
                // Replace optimistic message with the real one from DB
                setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data : m));
            }
        } catch (err) {
            console.error("Unexpected error in handleSendMessage flow:", err);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        console.log("File input changed. File selected:", file?.name || "none");
        if (!file) return;

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        console.log("Detected type:", type);

        setSelectedFile(file);
        setPreviewType(type);
        setPreviewUrl(URL.createObjectURL(file));
        setShowMediaMenu(false);
    };

    const triggerFileInput = (accept: string) => {
        console.log("Triggering file input with accept:", accept);
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        } else {
            console.error("fileInputRef is null!");
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setPreviewType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendSticker = async (stickerUrl: string) => {
        if (!id || !user) return;
        await chatService.sendMessage(id, user.id, '', undefined, stickerUrl);
        setShowStickers(false);
    };

    const handleCreateOrder = async () => {
        if (!conversation || !user) return;

        const amount = parseFloat(orderParams.price) * parseInt(orderParams.quantity);
        const quantity = parseInt(orderParams.quantity);
        const notes = orderParams.notes;

        console.log('[ChatRoom] 💼 Creating/Updating order...');

        if (editingOrderId) {
            // Update existing order
            const { data, error } = await orderService.updateOrder(editingOrderId, {
                amount,
                quantity,
                notes
            });

            if (error) {
                alert("Erreur lors de la modification de l'offre : " + error.message);
            } else if (data) {
                console.log('[ChatRoom] ✅ Order updated successfully:', data);

                // Update local state for ALL messages linked to this order
                setMessages(prev => prev.map(m => {
                    if (m.order_id === editingOrderId) {
                        return { ...m, order: { ...m.order, ...data } };
                    }
                    return m;
                }));

                await chatService.sendMessage(
                    conversation.id,
                    user.id,
                    `🔄 Offre mise à jour : ${orderParams.quantity}x ${conversation.products?.name} à ${orderParams.price} FCFA`
                );
                setShowOrderForm(false);
                setEditingOrderId(null);
            }
        } else {
            // Create new order
            const { data, error } = await orderService.createOrder({
                buyerId: conversation.buyer_id,
                sellerId: conversation.seller_id,
                productId: conversation.product_id,
                affiliateId: conversation.source_affiliate_id,
                amount,
                quantity,
                notes
            });

            if (error) {
                console.error('[ChatRoom] ❌ Order creation error:', error);
                alert("Erreur lors de la création de l'offre : " + error.message);
            } else if (data) {
                console.log('[ChatRoom] ✅ Order created successfully:', data);
                // Send special message linked to the order
                await chatService.sendMessage(
                    conversation.id,
                    user.id,
                    `📑 Offre Spéciale : ${conversation.products?.name}`,
                    undefined,
                    undefined,
                    data.id
                );
                setShowOrderForm(false);
            }
        }
    };

    const handlePayOrder = async (orderId: string) => {
        console.log('[ChatRoom] 💳 Initialisation du paiement Yabetoo pour la commande :', orderId);

        const { checkout_url, error: paymentError } = await paymentService.createYabetooCheckout(orderId);

        if (paymentError || !checkout_url) {
            console.error('[ChatRoom] ❌ Yabetoo checkout failed:', paymentError);
            alert("Erreur lors de l'initialisation du paiement : " + (paymentError?.message || 'Inconnue'));
        } else {
            console.log('[ChatRoom] 🚀 Redirecting to Yabetoo:', checkout_url);
            // Redirect user to Yabetoo payment page
            window.location.href = checkout_url;
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <SkeletonChatHeader />
                <div style={styles.trustBanner}>
                    <ShieldCheck size={16} color="#00CC66" />
                    <span>Paiement sécurisé par OTP via Zwa.</span>
                </div>
                <SkeletonChatMessages count={8} gap={12} />
            </div>
        );
    }

    const isSeller = user?.id === conversation?.seller_id;
    const otherParty = isSeller ? conversation?.buyer : conversation?.seller;

    // Déterminer le nom à afficher selon le rôle
    const displayName = isSeller
        ? (conversation?.buyer?.full_name || 'Client')
        : (conversation?.seller?.store_name || conversation?.seller?.full_name || 'Boutique');

    // Déterminer l'avatar à afficher
    const avatarUrl = otherParty?.avatar_url;
    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <button onClick={() => navigate(-1)} style={styles.backButton}>
                        <ArrowLeft size={24} />
                    </button>
                    <div style={styles.partyAvatar}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} style={styles.partyAvatarImage} />
                        ) : (
                            avatarInitial
                        )}
                    </div>
                    <div style={styles.partyInfo}>
                        <div style={styles.partyName}>
                            {displayName}
                        </div>
                        <div style={styles.productRef}>
                            {conversation?.products?.name}
                        </div>
                    </div>
                </div>

                {isSeller && (
                    <button
                        style={styles.actionBtn}
                        onClick={() => setShowOrderForm(true)}
                    >
                        <PlusCircle size={20} />
                        <span>Vendre</span>
                    </button>
                )}
            </header>

            {/* Trust Banner */}
            <div style={styles.trustBanner}>
                <ShieldCheck size={16} color="#00CC66" />
                <span>Paiement sécurisé par OTP via Zwa.</span>
            </div>

            {/* Messages Area */}
            <div style={styles.messagesArea}>
                {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    const isDeal = !!msg.order_id && msg.order;
                    const isSystem = msg.content.includes("Deal créé") && !isDeal;

                    if (isDeal) {
                        const createdAt = new Date(msg.created_at);
                        const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
                        const isExpired = new Date() > expiresAt;
                        const isPending = msg.order?.status === 'pending';

                        // Calculate time remaining for a small badge
                        const diff = expiresAt.getTime() - new Date().getTime();
                        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                        const timeString = daysLeft > 0 ? `${daysLeft}j restant${daysLeft > 1 ? 's' : ''}` : `${hoursLeft}h restante${hoursLeft > 1 ? 's' : ''}`;

                        return (
                            <div key={msg.id} style={{
                                ...styles.messageWrapper,
                                justifyContent: 'center',
                                margin: '24px 0'
                            }}>
                                <div className="alibaba-card" style={styles.alibabaCard}>
                                    <div style={styles.alibabaHeader}>
                                        <div style={styles.alibabaHeaderTitle}>
                                            <FileText size={18} color="var(--primary)" />
                                            <span style={{ color: 'white' }}>Commander</span>
                                        </div>
                                        {isPending && !isExpired && (
                                            <div style={styles.expiryBadge}>
                                                <Clock size={12} />
                                                <span>{timeString}</span>
                                            </div>
                                        )}
                                        {isExpired && isPending && (
                                            <div style={{ ...styles.expiryBadge, background: '#ff4d4d', color: 'white' }}>
                                                <span>EXPIRÉ</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.alibabaProductTitle}>
                                        {msg.order?.products.name}
                                    </div>

                                    <div style={styles.alibabaInfoBox}>
                                        <div style={styles.alibabaInfoRow}>
                                            <span style={styles.alibabaLabel}>Statut de la commande</span>
                                            <span style={styles.alibabaStatusText}>
                                                {msg.order?.status === 'pending' ? 'Paiement en attente' :
                                                    msg.order?.status === 'paid' ? 'Payé' : msg.order?.status}
                                            </span>
                                        </div>
                                        <div style={styles.alibabaInfoRow}>
                                            <span style={styles.alibabaLabel}>Total</span>
                                            <span style={styles.alibabaValueBold}>{msg.order?.amount || 0} FCFA</span>
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                                ({msg.order?.quantity} x {(msg.order?.amount || 0) / (msg.order?.quantity || 1)} FCFA)
                                            </span>
                                        </div>
                                        <div style={styles.alibabaInfoRow}>
                                            <span style={styles.alibabaLabel}>Date d'expédition</span>
                                            <span style={styles.alibabaValue}>Expédier sous 7 jours</span>
                                        </div>
                                    </div>

                                    {msg.order?.notes && (
                                        <div style={styles.alibabaNotesBox}>
                                            <div style={styles.alibabaLabel}>Description & Instructions</div>
                                            <div style={styles.alibabaNotesContent}>{msg.order?.notes}</div>
                                        </div>
                                    )}

                                    <div style={styles.dealActions}>
                                        {!isExpired && isPending && !isOwn && (
                                            <button
                                                style={styles.alibabaPayButton}
                                                onClick={() => handlePayOrder(msg.order?.id || '')}
                                            >
                                                💳 Payer Maintenant
                                            </button>
                                        )}

                                        {isOwn && isPending && (
                                            <button
                                                style={styles.editDealBtn}
                                                onClick={() => {
                                                    setEditingOrderId(msg.order?.id || null);
                                                    setOrderParams({
                                                        price: ((msg.order?.amount || 0) / (msg.order?.quantity || 1)).toString(),
                                                        quantity: (msg.order?.quantity || 1).toString(),
                                                        notes: msg.order?.notes || ''
                                                    });
                                                    setShowOrderForm(true);
                                                }}
                                            >
                                                Modifier l'offre
                                            </button>
                                        )}
                                    </div>

                                    {isExpired && isPending && (
                                        <div style={styles.alibabaExpiredBox}>
                                            Lien expiré le {expiresAt.toLocaleDateString()}
                                        </div>
                                    )}

                                    <div style={styles.alibabaExpiryHint}>
                                        Offre personnalisée • Paiement sécurisé Zwa
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} style={{
                            ...styles.messageWrapper,
                            justifyContent: isSystem ? 'center' : (isOwn ? 'flex-end' : 'flex-start')
                        }}>
                            {isSystem ? (
                                <div style={styles.systemMsg}>
                                    <CheckCircle size={14} />
                                    <span>{msg.content}</span>
                                </div>
                            ) : (
                                <div style={{
                                    ...styles.messageBubble,
                                    background: isOwn ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                    borderBottomRightRadius: isOwn ? '4px' : '16px',
                                    borderBottomLeftRadius: isOwn ? '16px' : '4px',
                                    padding: (msg.media_url || msg.sticker_id) ? '6px' : '10px 14px',
                                }}>
                                    {msg.media_url && (
                                        <div style={styles.mediaContainer}>
                                            {msg.media_type === 'video' ? (
                                                <video src={msg.media_url} controls style={styles.mediaContent} />
                                            ) : (
                                                <img src={msg.media_url} alt="Media" style={styles.mediaContent} onClick={() => window.open(msg.media_url, '_blank')} />
                                            )}
                                        </div>
                                    )}
                                    {msg.sticker_id && (
                                        <img src={msg.sticker_id} alt="Sticker" style={styles.stickerContent} />
                                    )}
                                    {msg.content && <div style={styles.messageText}>{msg.content}</div>}
                                    <div style={styles.messageMeta}>
                                        <div style={styles.messageTime}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {isOwn && (
                                            <div style={styles.statusIcon}>
                                                {msg.id.startsWith('temp-') ?
                                                    <Clock size={10} color="rgba(255,255,255,0.4)" /> :
                                                    <CheckCheck size={11} color="#00FFCC" />
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {isUploading && (
                    <div style={{ ...styles.messageWrapper, justifyContent: 'flex-end' }}>
                        <div style={{ ...styles.messageBubble, background: 'rgba(255,255,255,0.05)' }}>
                            <div style={styles.messageText}>Envoi du média...</div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Media Menu Popup */}
            {showMediaMenu && (
                <div style={styles.mediaOverlay} onClick={() => setShowMediaMenu(false)}>
                    <div style={styles.mediaMenu} onClick={e => e.stopPropagation()}>
                        <div style={styles.mediaGrid}>
                            <button style={styles.mediaItem} onClick={() => triggerFileInput("image/*")}>
                                <div style={{ ...styles.mediaIcon, background: '#8A2BE2' }}><ImageIcon size={24} /></div>
                                <span>Galerie</span>
                            </button>
                            <button style={styles.mediaItem} onClick={() => triggerFileInput("image/*")}>
                                <div style={{ ...styles.mediaIcon, background: '#FF4444' }}><Camera size={24} /></div>
                                <span>Photo</span>
                            </button>
                            <button style={styles.mediaItem} onClick={() => triggerFileInput("video/*")}>
                                <div style={{ ...styles.mediaIcon, background: '#00CC66' }}><Video size={24} /></div>
                                <span>Vidéo</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden File Input - Always in DOM */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleFileUpload}
            />

            {/* Sticker Picker */}
            {showStickers && (
                <div style={styles.mediaOverlay} onClick={() => setShowStickers(false)}>
                    <div style={styles.stickerPicker} onClick={e => e.stopPropagation()}>
                        <div style={styles.stickerGrid}>
                            {STICKERS.map(sticker => (
                                <button key={sticker.id} style={styles.stickerItem} onClick={() => sendSticker(sticker.url)}>
                                    <img src={sticker.url} alt={sticker.id} style={styles.stickerPreview} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Order Creation Popup */}
            {showOrderForm && (
                <div style={styles.mediaOverlay} onClick={() => { setShowOrderForm(false); setEditingOrderId(null); }}>
                    <div style={styles.mediaMenu} onClick={e => e.stopPropagation()}>
                        <div style={styles.mediaHeader}>
                            <div style={styles.mediaTitle}>
                                {editingOrderId ? "Modifier le Deal" : "Finaliser le Deal 🤝"}
                            </div>
                            <button onClick={() => { setShowOrderForm(false); setEditingOrderId(null); }} style={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={styles.mediaSubtitle}>
                            {editingOrderId ? "Ajustez le prix final convenu." : "Fixez le prix final convenu."}
                        </p>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Prix Unitaire (FCFA)</label>
                            <input
                                type="number"
                                style={styles.inputField}
                                value={orderParams.price}
                                onChange={e => setOrderParams(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="Ex: 25000"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Quantité</label>
                            <input
                                type="number"
                                style={styles.inputField}
                                value={orderParams.quantity}
                                onChange={e => setOrderParams(prev => ({ ...prev, quantity: e.target.value }))}
                                min="1"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Description (Couleur, Taille, Adresse...)</label>
                            <textarea
                                style={{ ...styles.inputField, height: '80px', resize: 'none' }}
                                value={orderParams.notes}
                                onChange={e => setOrderParams(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Indiquez les options choisies et l'adresse de livraison..."
                            />
                        </div>

                        <div style={styles.popupActions}>
                            <button style={styles.cancelBtn} onClick={() => { setShowOrderForm(false); setEditingOrderId(null); }}>Annuler</button>
                            <button style={styles.confirmBtn} onClick={handleCreateOrder}>
                                {editingOrderId ? "Sauvegarder" : "Confirmer la Vente"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div style={styles.inputArea}>
                {previewUrl && (
                    <div style={styles.previewBar}>
                        <div style={styles.previewContainer}>
                            {previewType === 'video' ? (
                                <video src={previewUrl} style={styles.previewContent} />
                            ) : (
                                <img src={previewUrl} alt="Preview" style={styles.previewContent} />
                            )}
                            <button style={styles.closePreview} onClick={clearSelection}>
                                <X size={14} color="white" />
                            </button>
                        </div>
                    </div>
                )}
                <div style={styles.inputBar}>
                    <button style={styles.plusButton} onClick={() => setShowMediaMenu(!showMediaMenu)}>
                        <Plus size={24} color="var(--primary)" />
                    </button>
                    <form style={styles.inputWrapper} onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={previewUrl ? "Ajouter une légende..." : "Écrivez votre message..."}
                            style={styles.inputSimple}
                        />
                        <button type="button" style={styles.iconButton} onClick={() => setShowStickers(true)}>
                            <Smile size={22} color="var(--text-secondary)" />
                        </button>
                        <button type="submit" style={styles.sendButton} disabled={!newMessage.trim() && !selectedFile}>
                            <Send size={20} color="white" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column' as const,
        background: 'var(--background)',
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
    },
    header: {
        padding: '12px 16px',
        background: 'rgba(18, 18, 18, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    backButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        padding: '4px',
    },
    partyAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary), #FF1493)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        flexShrink: 0,
        overflow: 'hidden' as const,
    },
    partyAvatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    partyInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
    },
    partyName: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'white',
    },
    productRef: {
        fontSize: '10px',
        color: 'var(--text-secondary)',
        fontWeight: '600',
    },
    actionBtn: {
        background: 'var(--primary)',
        border: 'none',
        borderRadius: '12px',
        padding: '6px 12px',
        color: 'white',
        fontSize: '13px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
    },
    trustBanner: {
        background: 'rgba(0, 204, 102, 0.05)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '11px',
        color: 'rgba(0, 204, 102, 0.8)',
        borderBottom: '1px solid rgba(0, 204, 102, 0.1)',
    },
    messagesArea: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    messageWrapper: {
        display: 'flex',
        width: '100%',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: '16px',
        position: 'relative' as const,
    },
    messageText: {
        fontSize: '14px',
        color: 'white',
        lineHeight: '1.4',
    },
    messageTime: {
        fontSize: '9px',
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'right' as const,
        marginTop: '4px',
        padding: '0 4px',
    },
    mediaContainer: {
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '4px',
        background: 'rgba(0,0,0,0.2)',
    },
    mediaContent: {
        maxWidth: '100%',
        maxHeight: '300px',
        display: 'block',
        cursor: 'pointer',
    },
    stickerContent: {
        width: '120px',
        height: '120px',
        display: 'block',
    },
    stickerPicker: {
        background: '#1a1a1a',
        borderRadius: '24px',
        padding: '20px',
        width: 'auto',
        maxWidth: '320px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        animation: 'slideUp 0.3s ease-out',
    },
    stickerGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
    },
    stickerItem: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        borderRadius: '12px',
        padding: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s',
    },
    stickerPreview: {
        width: '100%',
        height: 'auto',
    },
    previewBar: {
        background: 'rgba(255,255,255,0.02)',
        padding: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: '12px',
    },
    previewContainer: {
        position: 'relative' as const,
        width: '80px',
        height: '80px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.2)',
    },
    previewContent: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    closePreview: {
        position: 'absolute' as const,
        top: '4px',
        right: '4px',
        width: '20px',
        height: '20px',
        background: 'rgba(0,0,0,0.5)',
        border: 'none',
        borderRadius: '50%',
        color: 'white',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
    },
    systemMsg: {
        background: 'rgba(0, 204, 102, 0.12)',
        color: '#00CC66',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '10px 0',
    },
    inputArea: {
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        background: '#1a1a1a',
        borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    inputBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    plusButton: {
        background: 'rgba(138, 43, 226, 0.1)',
        border: 'none',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    inputWrapper: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.05)',
        padding: '6px 6px 6px 14px',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
    },
    inputSimple: {
        flex: 1,
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
    },
    iconButton: {
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    sendButton: {
        width: '32px',
        height: '32px',
        background: 'var(--primary)',
        border: 'none',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: 1,
        transition: 'opacity 0.2s',
    },
    mediaOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '20px',
        paddingBottom: '100px',
    },
    mediaMenu: {
        background: '#1a1a1a',
        borderRadius: '24px',
        padding: '24px',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        animation: 'slideUp 0.3s ease-out',
    },
    mediaHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '4px',
    },
    mediaTitle: {
        fontSize: '20px',
        fontWeight: '800',
        color: 'white',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        padding: '4px',
    },
    mediaSubtitle: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginBottom: '24px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        marginBottom: '16px',
    },
    inputField: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    mediaGrid: {
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
    },
    mediaItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    mediaIcon: {
        width: '50px',
        height: '50px',
        borderRadius: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
    },
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 3000,
    },
    messageMeta: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '4px',
        marginTop: '2px',
    },
    statusIcon: {
        display: 'flex',
        alignItems: 'center',
    },
    popup: {
        width: '100%',
        maxWidth: '340px',
        padding: '24px',
        background: '#1a1a1a',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    popupTitle: {
        fontSize: '20px',
        fontWeight: '800',
        marginBottom: '4px',
        color: 'white',
    },
    popupSubtitle: {
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px',
    },
    label: {
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
    },
    input: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '12px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
    },
    popupActions: {
        display: 'flex',
        gap: '12px',
        marginTop: '10px',
    },
    cancelBtn: {
        flex: 1,
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        padding: '12px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer',
    },
    confirmBtn: {
        flex: 2,
        background: 'var(--primary)',
        border: 'none',
        padding: '12px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '800',
        cursor: 'pointer',
    },
    centered: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        color: 'var(--text-secondary)',
    },
    alibabaCard: {
        width: '90%',
        maxWidth: '340px',
        background: 'linear-gradient(145deg, rgba(138, 43, 226, 0.15), rgba(0,0,0,0.8))',
        backdropFilter: 'blur(15px)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)',
        animation: 'slideUp 0.4s ease-out',
        color: '#fff',
    },
    alibabaHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '12px',
    },
    alibabaHeaderTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        fontWeight: '700',
    },
    alibabaProductTitle: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: '20px',
    },
    alibabaInfoBox: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
    },
    alibabaInfoRow: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
        marginBottom: '12px',
    },
    alibabaLabel: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
    },
    alibabaStatusText: {
        fontSize: '14px',
        fontWeight: '700',
        color: 'var(--primary)',
    },
    alibabaValueBold: {
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
    },
    alibabaValue: {
        fontSize: '13px',
        color: 'white',
        fontWeight: '500',
    },
    alibabaNotesBox: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '20px',
    },
    alibabaNotesContent: {
        fontSize: '13px',
        color: 'rgba(255,255,255,0.8)',
        marginTop: '6px',
        lineHeight: '1.4',
    },
    dealActions: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        marginBottom: '12px',
    },
    alibabaPayButton: {
        width: '100%',
        background: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '15px',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(138, 43, 226, 0.4)',
    },
    editDealBtn: {
        width: '100%',
        background: 'transparent',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '15px',
        padding: '10px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    alibabaExpiredBox: {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center' as const,
        padding: '12px',
        borderRadius: '15px',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '12px',
    },
    alibabaExpiryHint: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center' as const,
    },
    expiryBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.1)',
        padding: '4px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
    }
};

export default ChatRoom;
