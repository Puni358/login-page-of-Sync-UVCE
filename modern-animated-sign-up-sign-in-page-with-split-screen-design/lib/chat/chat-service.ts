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

  const result: ChatConversation[] = await Promise.all(
    convRows.map(async (conv: any) => {
      const isBuyer = conv.buyer_id === currentUserId
      const otherPartyProfile = isBuyer ? conv.seller : conv.buyer
      const otherPartyId = isBuyer ? conv.seller_id : conv.buyer_id
      const otherPartyName = otherPartyProfile?.full_name || "Campus User"

      const { data: msgRows, error: msgErr } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, read, created_at")
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

      const messages: ChatMessage[] = (msgRows || []).map((m: any) => ({
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
    .select("id, conversation_id, sender_id, content, read, created_at")
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

  const messages: ChatMessage[] = (msgRows || []).map((m: any) => ({
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

  console.log(
    "[ChatService] sendMessageToSupabase - inserting message into Supabase for conversationId:",
    conversationId
  )

  const { data: newMsg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content.trim(),
      read: false,
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

  console.log("[ChatService] Successfully inserted message in Supabase with message ID:", newMsg?.id)

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
    .select("id")
    .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)

  if (convErr || !convs || convs.length === 0) return 0

  const convIds = convs.map((c: any) => c.id)

  const { count, error: countErr } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", convIds)
    .neq("sender_id", currentUserId)
    .eq("read", false)

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
