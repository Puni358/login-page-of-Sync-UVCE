import { supabase } from "@/lib/supabaseClient"
import type { ChatConversation, ChatItemType, ChatMessage, OpenChatParams } from "./types"

export async function fetchUserConversations(currentUserId: string): Promise<ChatConversation[]> {
  if (!currentUserId) return []

  const { data: convRows, error: convErr } = await supabase
    .from("conversations")
    .select(`
      id,
      item_id,
      buyer_id,
      seller_id,
      deleted_by_buyer,
      deleted_by_seller,
      created_at,
      items ( id, title, type ),
      buyer:profiles!buyer_id ( id, full_name ),
      seller:profiles!seller_id ( id, full_name )
    `)
    .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
    .order("created_at", { ascending: false })

  if (convErr) {
    console.error(
      "Error fetching conversations:",
      convErr.message,
      convErr.details,
      convErr.hint,
      convErr.code
    )
    return []
  }

  if (!convRows || convRows.length === 0) return []

  // Filter out conversations that current user soft deleted
  const activeConvRows = convRows.filter((conv: any) => {
    const isBuyer = conv.buyer_id === currentUserId
    if (isBuyer && conv.deleted_by_buyer === true) return false
    if (!isBuyer && conv.deleted_by_seller === true) return false
    return true
  })

  const result: ChatConversation[] = await Promise.all(
    activeConvRows.map(async (conv: any) => {
      const isBuyer = conv.buyer_id === currentUserId
      const otherPartyProfile = isBuyer ? conv.seller : conv.buyer
      const otherPartyId = isBuyer ? conv.seller_id : conv.buyer_id
      const otherPartyName = otherPartyProfile?.full_name || "Campus User"

      const { data: msgRows, error: msgErr } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, read, deleted_by_sender, deleted_by_recipient, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true })

      if (msgErr) {
        console.error(
          "Error fetching messages for conv",
          conv.id,
          msgErr.message,
          msgErr.details,
          msgErr.hint,
          msgErr.code
        )
      }

      // Filter out messages soft-deleted by current user
      const visibleMsgRows = (msgRows || []).filter((m: any) => {
        const isSender = m.sender_id === currentUserId
        if (isSender && m.deleted_by_sender === true) return false
        if (!isSender && m.deleted_by_recipient === true) return false
        return true
      })

      const messages: ChatMessage[] = visibleMsgRows.map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        body: m.content,
        senderId: m.sender_id,
        isOwn: m.sender_id === currentUserId,
        read: m.read === true,
        createdAt: m.created_at,
      }))

      const unreadCount = messages.filter((m) => !m.isOwn && !m.read).length
      const lastMsgDate = messages.length > 0 ? messages[messages.length - 1].createdAt : conv.created_at

      return {
        id: conv.id,
        itemId: conv.item_id,
        itemType: (conv.items?.type as ChatItemType) || "marketplace",
        itemTitle: conv.items?.title || "Listing",
        otherPartyUserId: otherPartyId,
        otherPartyName: otherPartyName,
        messages,
        unreadCount,
        updatedAt: lastMsgDate,
      }
    })
  )

  return result.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export async function getOrCreateConversationInSupabase(
  currentUserId: string,
  params: OpenChatParams
): Promise<ChatConversation | null> {
  if (!currentUserId) {
    console.error("[ChatService] getOrCreateConversationInSupabase missing currentUserId")
    return null
  }

  // 1. Search for existing conversation between currentUserId & params.otherPartyUserId for this item
  const { data: existingConvs, error: findErr } = await supabase
    .from("conversations")
    .select(`
      id,
      item_id,
      buyer_id,
      seller_id,
      deleted_by_buyer,
      deleted_by_seller,
      created_at,
      items ( id, title, type ),
      buyer:profiles!buyer_id ( id, full_name ),
      seller:profiles!seller_id ( id, full_name )
    `)
    .eq("item_id", params.itemId)

  if (findErr) {
    console.error(
      "Error searching conversation:",
      findErr.message,
      findErr.details,
      findErr.hint,
      findErr.code
    )
  }

  let convRow = (existingConvs || []).find(
    (c: any) =>
      (c.buyer_id === currentUserId && c.seller_id === params.otherPartyUserId) ||
      (c.buyer_id === params.otherPartyUserId && c.seller_id === currentUserId)
  )

  // If conversation was previously soft deleted for current user, reset soft delete flag upon opening
  if (convRow) {
    const isBuyer = convRow.buyer_id === currentUserId
    const isDeletedForUser = isBuyer ? convRow.deleted_by_buyer : convRow.deleted_by_seller
    if (isDeletedForUser) {
      const updatePayload = isBuyer ? { deleted_by_buyer: false } : { deleted_by_seller: false }
      await supabase.from("conversations").update(updatePayload).eq("id", convRow.id)
    }
  }

  // 2. If not existing, create new conversation row in Supabase
  if (!convRow) {
    console.log("[ChatService] Creating new conversation in Supabase...", {
      item_id: params.itemId,
      buyer_id: currentUserId,
      seller_id: params.otherPartyUserId,
    })

    const { data: newConv, error: createErr } = await supabase
      .from("conversations")
      .insert({
        item_id: params.itemId,
        buyer_id: currentUserId,
        seller_id: params.otherPartyUserId,
      })
      .select(`
        id,
        item_id,
        buyer_id,
        seller_id,
        created_at,
        items ( id, title, type ),
        buyer:profiles!buyer_id ( id, full_name ),
        seller:profiles!seller_id ( id, full_name )
      `)
      .single()

    if (createErr) {
      console.error(
        "Error creating conversation in Supabase:",
        createErr.message,
        createErr.details,
        createErr.hint,
        createErr.code
      )
      return null
    }

    convRow = newConv
    console.log("[ChatService] Successfully created conversation in Supabase with ID:", convRow?.id)
  } else {
    console.log("[ChatService] Found existing conversation in Supabase with ID:", convRow?.id)
  }

  if (!convRow?.id) {
    console.error("[ChatService] Conversation row object missing valid ID!", convRow)
    return null
  }

  // 3. Fetch messages for conversation
  const { data: msgRows, error: msgErr } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, read, deleted_by_sender, deleted_by_recipient, created_at")
    .eq("conversation_id", convRow.id)
    .order("created_at", { ascending: true })

  if (msgErr) {
    console.error(
      "Error fetching messages for conversation:",
      msgErr.message,
      msgErr.details,
      msgErr.hint,
      msgErr.code
    )
  }

  const isBuyer = convRow.buyer_id === currentUserId
  const otherPartyProfile = isBuyer ? convRow.seller : convRow.buyer
  const otherPartyId = isBuyer ? convRow.seller_id : convRow.buyer_id

  // Filter out messages soft-deleted by current user
  const visibleMsgRows = (msgRows || []).filter((m: any) => {
    const isSender = m.sender_id === currentUserId
    if (isSender && m.deleted_by_sender === true) return false
    if (!isSender && m.deleted_by_recipient === true) return false
    return true
  })

  const messages: ChatMessage[] = visibleMsgRows.map((m: any) => ({
    id: m.id,
    conversationId: m.conversation_id,
    body: m.content,
    senderId: m.sender_id,
    isOwn: m.sender_id === currentUserId,
    read: m.read === true,
    createdAt: m.created_at,
  }))

  const unreadCount = messages.filter((m) => !m.isOwn && !m.read).length

  return {
    id: convRow.id,
    itemId: convRow.item_id,
    itemType: (convRow.items?.type as ChatItemType) || params.itemType,
    itemTitle: convRow.items?.title || params.itemTitle,
    otherPartyUserId: otherPartyId,
    otherPartyName: otherPartyProfile?.full_name || params.otherPartyName || "Campus User",
    messages,
    unreadCount,
    updatedAt: messages.length > 0 ? messages[messages.length - 1].createdAt : convRow.created_at,
  }
}

export async function sendMessageToSupabase(
  conversationId: string,
  currentUserId: string,
  content: string
): Promise<ChatMessage | null> {
  if (!conversationId || !currentUserId || !content.trim()) {
    console.error("[ChatService] sendMessageToSupabase missing required parameters:", {
      conversationId,
      currentUserId,
      hasContent: Boolean(content?.trim()),
    })
    return null
  }

  // If conversation was soft-deleted by seller or buyer, reset deletion flags on new message
  await supabase
    .from("conversations")
    .update({ deleted_by_buyer: false, deleted_by_seller: false })
    .eq("id", conversationId)

  const { data: newMsg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      read: false,
      deleted_by_sender: false,
      deleted_by_recipient: false,
    })
    .select("id, conversation_id, sender_id, content, read, created_at")
    .single()

  if (error) {
    console.error(
      "Error sending message to Supabase:",
      error.message,
      error.details,
      error.hint,
      error.code
    )
    return null
  }

  return {
    id: newMsg.id,
    conversationId: newMsg.conversation_id,
    body: newMsg.content,
    senderId: newMsg.sender_id,
    isOwn: true,
    read: false,
    createdAt: newMsg.created_at,
  }
}

export async function markSupabaseConversationRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  if (!conversationId || !currentUserId) return

  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", currentUserId)
    .eq("read", false)

  if (error) {
    console.error(
      "Error marking messages as read in Supabase:",
      error.message,
      error.details,
      error.hint,
      error.code
    )
  }
}

export async function fetchTotalUnreadCountFromSupabase(currentUserId: string): Promise<number> {
  if (!currentUserId) return 0

  const { data: convs, error: convErr } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, deleted_by_buyer, deleted_by_seller")
    .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)

  if (convErr || !convs || convs.length === 0) return 0

  const activeConvIds = convs
    .filter((c: any) => {
      const isBuyer = c.buyer_id === currentUserId
      return isBuyer ? !c.deleted_by_buyer : !c.deleted_by_seller
    })
    .map((c: any) => c.id)

  if (activeConvIds.length === 0) return 0

  const { count, error: countErr } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", activeConvIds)
    .neq("sender_id", currentUserId)
    .eq("read", false)
    .eq("deleted_by_recipient", false)

  if (countErr) {
    console.error(
      "Error fetching unread count from Supabase:",
      countErr.message,
      countErr.details,
      countErr.hint,
      countErr.code
    )
    return 0
  }

  return count || 0
}

export async function deleteMessageFromSupabase(
  messageId: string,
  currentUserId: string
): Promise<boolean> {
  if (!messageId || !currentUserId) return false

  // Fetch message to see if user is sender or recipient
  const { data: msg, error: fetchErr } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("id", messageId)
    .single()

  if (fetchErr || !msg) {
    console.error("Error fetching message for soft delete:", fetchErr)
    return false
  }

  const isSender = msg.sender_id === currentUserId
  const updatePayload = isSender
    ? { deleted_by_sender: true }
    : { deleted_by_recipient: true }

  const { error: updateErr } = await supabase
    .from("messages")
    .update(updatePayload)
    .eq("id", messageId)

  if (updateErr) {
    console.error(
      "Error soft deleting message in Supabase:",
      updateErr.message,
      updateErr.details,
      updateErr.hint,
      updateErr.code
    )
    return false
  }

  return true
}

export async function deleteConversationFromSupabase(
  conversationId: string,
  currentUserId: string
): Promise<boolean> {
  if (!conversationId || !currentUserId) return false

  // Fetch conversation to determine buyer/seller role
  const { data: conv, error: fetchErr } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single()

  if (fetchErr || !conv) {
    console.error("Error fetching conversation for soft delete:", fetchErr)
    return false
  }

  const isBuyer = conv.buyer_id === currentUserId
  const updatePayload = isBuyer
    ? { deleted_by_buyer: true }
    : { deleted_by_seller: true }

  const { error: updateErr } = await supabase
    .from("conversations")
    .update(updatePayload)
    .eq("id", conversationId)

  if (updateErr) {
    console.error(
      "Error soft deleting conversation in Supabase:",
      updateErr.message,
      updateErr.details,
      updateErr.hint,
      updateErr.code
    )
    return false
  }

  return true
}
