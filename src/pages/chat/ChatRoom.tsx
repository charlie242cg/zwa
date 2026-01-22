import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, ShieldCheck, Plus, Image as ImageIcon, Video, Camera, Smile, CheckCircle, PlusCircle, Clock, CheckCheck, X, Calendar, Zap, ChevronRight, FileText, Truck, MapPin } from 'lucide-react';
import { chatService, Message, Conversation } from '../../services/chatService';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { useConversationDetail } from '../../hooks/useConversationDetail';
import { useChatActions } from '../../hooks/useChatActions';
import { SkeletonChatHeader, SkeletonChatMessages } from '../../components/common/SkeletonLoader';

const ChatRoom = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // TanStack Query Hooks
    const { data: conversation, isLoading: convLoading } = useConversationDetail(id);
    const { data: messages = [], isLoading: messagesLoading } = useMessages(id);
    const { sendMessage: sendMessageAction, markAsRead } = useChatActions(id);

    const [newMessage, setNewMessage] = useState('');
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const [orderParams, setOrderParams] = useState({
        price: '',
        quantity: '1',
        notes: '',
        validity: '7', // jours
        shipping: '7 jours'
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showStickers, setShowStickers] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

    const loading = convLoading || messagesLoading;

    useEffect(() => {
        if (id && user) {
            markAsRead(user.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user?.id]); // Only mark as read when entering the room or if user changes

    // Set order price from product when conversation is loaded
    useEffect(() => {
        if (conversation?.products?.price) {
            setOrderParams(prev => ({
                ...prev,
                price: conversation.products!.price.toString(),
                quantity: '1',
                notes: '',
                validity: '7',
                shipping: '7 jours'
            }));
        }
    }, [conversation]);

    const STICKERS = [
        { id: 'cool', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=cool' },
        { id: 'love', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=love' },
        { id: 'happy', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=happy' },
        { id: 'wow', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=wow' },
        { id: 'deal', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=deal' },
        { id: 'money', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=money' },
    ];

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e?: React.FormEvent, contentOverride?: string) => {
        if (e) e.preventDefault();
        const content = contentOverride !== undefined ? contentOverride : newMessage.trim();

        if (!content && !selectedFile && contentOverride === undefined) return;
        if (!id || !user) return;

        const finalContent = content || " ";

        // Save current selection for upload
        const prevFile = selectedFile;
        const prevPreview = previewUrl;
        const prevType = previewType;

        // Clear UI immediately
        setNewMessage('');
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
                    alert("Erreur lors de l'upload du média.");
                    return;
                }
                mediaData = { url: url!, type: prevType! };
            }

            await sendMessageAction({
                content: finalContent,
                senderId: user.id,
                media: mediaData
            });

        } catch (err) {
            console.error("Unexpected error in handleSendMessage flow:", err);
            alert("Erreur lors de l'envoi du message.");
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
        await sendMessageAction({
            content: '',
            senderId: user.id,
            stickerId: stickerUrl
        });
        setShowStickers(false);
    };

    const handleCreateOrder = async () => {
        if (!conversation || !user) return;

        const amount = parseFloat(orderParams.price) * parseInt(orderParams.quantity);
        const quantity = parseInt(orderParams.quantity);
        const notes = orderParams.notes;

        // Calculer la date d'expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(orderParams.validity));
        const expiresAtIso = expiresAt.toISOString();
        const shippingTimeline = orderParams.shipping;

        console.log('[ChatRoom] 💼 Creating/Updating order...');

        if (editingOrderId) {
            // Update existing order
            const { data, error } = await orderService.updateOrder(editingOrderId, {
                amount,
                quantity,
                notes,
                expiresAt: expiresAtIso,
                shippingTimeline
            });

            if (error) {
                alert("Erreur lors de la modification de l'offre : " + error.message);
            } else if (data) {
                console.log('[ChatRoom] ✅ Order updated successfully:', data);

                await sendMessageAction({
                    content: `🔄 Offre mise à jour : ${orderParams.quantity}x ${conversation?.products?.name} à ${orderParams.price} FCFA`,
                    senderId: user.id
                });
                setShowOrderForm(false);
                setEditingOrderId(null);
            }
        } else {
            // Create new order
            const { data, error } = await orderService.createOrder({
                buyerId: conversation!.buyer_id,
                sellerId: conversation!.seller_id,
                productId: conversation!.product_id,
                affiliateId: conversation!.source_affiliate_id,
                amount,
                quantity,
                notes,
                expiresAt: expiresAtIso,
                shippingTimeline
            });

            if (error) {
                console.error('[ChatRoom] ❌ Order creation error:', error);
                alert("Erreur lors de la création de l'offre : " + error.message);
            } else if (data) {
                console.log('[ChatRoom] ✅ Order created successfully:', data);
                // Send special message linked to the order
                await sendMessageAction({
                    content: `📑 Offre Spéciale : ${conversation?.products?.name}`,
                    senderId: user.id,
                    orderId: data.id
                });
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

    const renderMessageContent = (content: string) => {
        // Simple regex to match [Label](url)
        const parts = content.split(/(\[.*?\]\(.*?\))/g);

        return parts.map((part, index) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                const label = match[1];
                const url = match[2];
                return (
                    <a
                        key={index}
                        href={url}
                        target={url.startsWith('http') ? '_blank' : undefined}
                        rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        style={styles.link}
                    >
                        {label}
                    </a>
                );
            }
            return part;
        });
    };

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
                        const expiresAt = msg.order?.expires_at ? new Date(msg.order.expires_at) : new Date(new Date(msg.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
                        const isExpired = new Date() > expiresAt;
                        const isPending = msg.order?.status === 'pending';

                        // Calculate time remaining for a small badge
                        const diff = expiresAt.getTime() - new Date().getTime();
                        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                        let timeString = '';
                        if (isExpired) {
                            timeString = 'EXPIRÉ';
                        } else if (daysLeft > 0) {
                            timeString = `${daysLeft}j restant${daysLeft > 1 ? 's' : ''}`;
                        } else if (hoursLeft > 0) {
                            timeString = `${hoursLeft}h restante${hoursLeft > 1 ? 's' : ''}`;
                        } else {
                            timeString = 'Moins d\'une heure';
                        }

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
                                            <span style={styles.alibabaValue}>Expédier sous {msg.order?.shipping_timeline || '7 jours'}</span>
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
                                                        notes: msg.order?.notes || '',
                                                        validity: '7',
                                                        shipping: msg.order?.shipping_timeline || '7 jours'
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
                                    {msg.content && <div style={styles.messageText}>{renderMessageContent(msg.content)}</div>}
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
                                style={{ ...styles.inputField, height: '60px', resize: 'none' }}
                                value={orderParams.notes}
                                onChange={e => setOrderParams(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Indiquez les options choisies et l'adresse de livraison..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ ...styles.formGroup, flex: 1 }}>
                                <label style={styles.label}>Validité de l'offre</label>
                                <select
                                    style={styles.inputField}
                                    value={orderParams.validity}
                                    onChange={e => setOrderParams(prev => ({ ...prev, validity: e.target.value }))}
                                >
                                    <option value="1">24 Heures</option>
                                    <option value="3">3 Jours</option>
                                    <option value="7">7 Jours</option>
                                    <option value="30">30 Jours</option>
                                </select>
                            </div>

                            <div style={{ ...styles.formGroup, flex: 1 }}>
                                <label style={styles.label}>Délai d'expédition</label>
                                <select
                                    style={styles.inputField}
                                    value={orderParams.shipping}
                                    onChange={e => setOrderParams(prev => ({ ...prev, shipping: e.target.value }))}
                                >
                                    <option value="Immédiat">Immédiat</option>
                                    <option value="24-48h">24-48h</option>
                                    <option value="3 jours">3 Jours</option>
                                    <option value="7 jours">7 Jours</option>
                                    <option value="15 jours">15 Jours</option>
                                </select>
                            </div>
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
        background: '#0D0D0D', // Fait ressortir les éléments premium
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
    },
    header: {
        padding: '16px 18px',
        background: 'rgba(18, 18, 18, 0.95)',
        // backdropFilter removed - causes crashes,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    backButton: {
        background: 'rgba(255,255,255,0.03)',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        width: '40px',
        height: '40px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    partyAvatar: {
        width: '44px',
        height: '44px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--primary), #FF1493)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '800',
        color: 'white',
        flexShrink: 0,
        overflow: 'hidden' as const,
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    partyAvatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    partyInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
    },
    partyName: {
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
        letterSpacing: '-0.3px',
    },
    productRef: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
        maxWidth: '180px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    actionBtn: {
        background: 'var(--primary)',
        border: 'none',
        borderRadius: '14px',
        padding: '8px 16px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '800',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(138, 43, 226, 0.3)',
        transition: 'transform 0.2s',
    },
    trustBanner: {
        background: 'rgba(0, 204, 102, 0.03)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '11px',
        color: 'rgba(0, 204, 102, 0.7)',
        fontWeight: '700',
        borderBottom: '1px solid rgba(0, 204, 102, 0.05)',
        letterSpacing: '0.2px',
    },
    messagesArea: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        background: 'radial-gradient(circle at top right, rgba(138,43,226,0.03) 0%, transparent 40%)',
    },
    messageWrapper: {
        display: 'flex',
        width: '100%',
        margin: '2px 0',
    },
    messageBubble: {
        maxWidth: '82%',
        padding: '12px 16px',
        borderRadius: '22px',
        position: 'relative' as const,
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        wordBreak: 'break-word' as const,
    },
    messageText: {
        fontSize: '15px',
        color: 'white',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap' as const,
    },
    messageMeta: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '4px',
        marginTop: '4px',
    },
    messageTime: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    statusIcon: {
        display: 'flex',
        alignItems: 'center',
    },
    systemMsg: {
        background: 'rgba(255,255,255,0.03)',
        color: 'rgba(255,255,255,0.4)',
        padding: '8px 20px',
        borderRadius: '100px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '16px auto',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    inputArea: {
        padding: '16px 18px 34px',
        background: '#121212',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
    },
    inputBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    plusButton: {
        width: '46px',
        height: '46px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    inputWrapper: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255,255,255,0.03)',
        padding: '4px 6px 4px 18px',
        borderRadius: '22px',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.2s',
    },
    inputSimple: {
        flex: 1,
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '15px',
        padding: '10px 0',
        outline: 'none',
    },
    iconButton: {
        background: 'none',
        border: 'none',
        padding: '8px',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        transition: 'transform 0.2s',
    },
    sendButton: {
        width: '42px',
        height: '42px',
        background: 'var(--primary)',
        border: 'none',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 6px 15px rgba(138, 43, 226, 0.4)',
        transition: 'all 0.2s',
    },
    previewBar: {
        marginBottom: '12px',
    },
    previewContainer: {
        position: 'relative' as const,
        width: '72px',
        height: '72px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '2px solid var(--primary)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
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
        background: 'rgba(0,0,0,0.6)',
        border: 'none',
        borderRadius: '50%',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    mediaOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        // backdropFilter removed - causes crashes,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '24px',
        paddingBottom: '40px',
        animation: 'fadeIn 0.3s ease',
    },
    mediaMenu: {
        background: '#181818',
        borderRadius: '32px',
        padding: '30px 24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 -20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
    },
    mediaGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
    },
    mediaItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '10px',
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
    },
    mediaIcon: {
        width: '64px',
        height: '64px',
        borderRadius: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
    },
    mediaContainer: {
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#000',
    },
    mediaContent: {
        maxWidth: '100%',
        maxHeight: '320px',
        display: 'block',
    },
    link: {
        color: 'var(--primary)',
        textDecoration: 'underline',
        fontWeight: '700',
    },
    stickerContent: {
        width: '130px',
        height: '130px',
    },
    stickerPicker: {
        background: '#181818',
        borderRadius: '32px',
        padding: '20px',
        maxWidth: '400px',
        maxHeight: '55vh',
        overflowY: 'auto' as const,
        border: '1px solid rgba(255,255,255,0.08)',
    },
    stickerGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
    },
    stickerItem: {
        background: 'rgba(255,255,255,0.02)',
        border: 'none',
        borderRadius: '16px',
        padding: '8px',
        cursor: 'pointer',
    },
    stickerPreview: {
        width: '100%',
    },
    mediaHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    },
    mediaTitle: {
        fontSize: '22px',
        fontWeight: '900',
        color: 'white',
        letterSpacing: '-0.5px',
    },
    mediaSubtitle: {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: '24px',
    },
    closeBtn: {
        background: 'rgba(255,255,255,0.03)',
        border: 'none',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#fff',
    },
    formGroup: {
        marginBottom: '18px',
    },
    label: {
        fontSize: '12px',
        fontWeight: '800',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase' as const,
        marginBottom: '8px',
        display: 'block',
        letterSpacing: '0.5px',
    },
    inputField: {
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '14px 18px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
    },
    popupActions: {
        display: 'flex',
        gap: '14px',
        marginTop: '28px',
    },
    cancelBtn: {
        flex: 1,
        padding: '16px',
        borderRadius: '18px',
        background: 'none',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    confirmBtn: {
        flex: 2,
        padding: '16px',
        borderRadius: '18px',
        background: 'var(--primary)',
        color: 'white',
        fontSize: '16px',
        fontWeight: '900',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(138, 43, 226, 0.4)',
    },
    alibabaCard: {
        width: '100%',
        maxWidth: '320px',
        background: '#1A1A1A',
        borderRadius: '28px',
        overflow: 'hidden',
        border: '1px solid rgba(138,43,226,0.15)',
        boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
    },
    alibabaHeader: {
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(138,43,226,0.1) 0%, transparent 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    alibabaHeaderTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '800',
        color: '#fff',
    },
    alibabaProductTitle: {
        padding: '18px 20px 8px',
        fontSize: '18px',
        fontWeight: '900',
        color: 'white',
        lineHeight: '1.3',
    },
    alibabaInfoBox: {
        padding: '0 20px 18px',
    },
    alibabaInfoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: '12px',
    },
    alibabaLabel: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
        textTransform: 'uppercase' as const,
    },
    alibabaValueBold: {
        fontSize: '16px',
        color: 'var(--primary)',
        fontWeight: '900',
    },
    alibabaValue: {
        fontSize: '13px',
        color: 'white',
        fontWeight: '600',
    },
    alibabaStatusText: {
        fontSize: '12px',
        color: '#00FFCC',
        fontWeight: '800',
        textTransform: 'uppercase' as const,
    },
    alibabaNotesBox: {
        margin: '0 20px 20px',
        padding: '14px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '18px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    alibabaNotesContent: {
        fontSize: '13px',
        color: 'rgba(255,255,255,0.8)',
        lineHeight: '1.5',
        marginTop: '6px',
    },
    dealActions: {
        padding: '0 20px 20px',
        display: 'flex',
        gap: '12px',
    },
    alibabaPayButton: {
        flex: 1,
        padding: '14px',
        background: 'var(--primary)',
        color: 'white',
        borderRadius: '16px',
        border: 'none',
        fontSize: '15px',
        fontWeight: '900',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(138, 43, 226, 0.4)',
    },
    editDealBtn: {
        flex: 1,
        padding: '14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        color: 'white',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    expiryBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        fontWeight: '800',
        color: '#FFB800',
        background: 'rgba(255,184,0,0.1)',
        padding: '4px 10px',
        borderRadius: '8px',
    },
    alibabaExpiredBox: {
        padding: '12px',
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#ff4d4d',
        fontWeight: '700',
        background: 'rgba(255,77,77,0.05)',
        width: '100%',
        marginBottom: '20px',
        borderRadius: '16px',
    },
    alibabaExpiryHint: {
        padding: '14px',
        textAlign: 'center' as const,
        fontSize: '10px',
        color: 'rgba(255,255,255,0.2)',
        fontWeight: '600',
        borderTop: '1px solid rgba(255,255,255,0.03)',
    },
    centered: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0A',
    }
};

export default ChatRoom;
