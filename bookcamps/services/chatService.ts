import { supabase, Message } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// 扩展的消息类型
export interface ChatMessage {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  type: 'text' | 'image';
  image_url?: string;
  book_id?: string;
  is_read: boolean;
  is_recalled: boolean;
  extra?: Record<string, any>;
  created_at: string;
}

// 会话类型
export interface Conversation {
  id: string;
  book_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_id?: string;
  last_message_at: string;
  created_at: string;
  // 关联数据
  book?: any;
  other_user?: any;
  last_message?: ChatMessage;
  unread_count?: number;
}

// 在线状态
export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen_at: string;
  device_info?: Record<string, any>;
}

// ==================== 消息服务 ====================

/**
 * 发送文字消息
 */
export async function sendTextMessage(
  toId: string,
  content: string,
  bookId?: string
): Promise<ChatMessage | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const message = {
    from_id: user.id,
    to_id: toId,
    content,
    type: 'text',
    is_read: false,
    is_recalled: false,
    book_id: bookId || null,
    extra: {}
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) {
    console.error('发送消息失败:', error);
    return null;
  }

  // 更新会话最后消息
  await updateConversationLastMessage(toId, bookId, data.id);

  return data;
}

/**
 * 发送图片消息
 */
export async function sendImageMessage(
  toId: string,
  imageUrl: string,
  bookId?: string,
  content?: string
): Promise<ChatMessage | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const message = {
    from_id: user.id,
    to_id: toId,
    content: content || '图片消息',
    type: 'image',
    image_url: imageUrl,
    is_read: false,
    is_recalled: false,
    book_id: bookId || null,
    extra: {}
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) {
    console.error('发送图片消息失败:', error);
    return null;
  }

  // 更新会话最后消息
  await updateConversationLastMessage(toId, bookId, data.id);

  return data;
}

/**
 * 获取与指定用户的聊天记录
 */
export async function getMessages(
  otherUserId: string,
  bookId?: string,
  limit = 50,
  offset = 0
): Promise<ChatMessage[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('messages')
    .select('*')
    .or(`and(from_id.eq.${user.id},to_id.eq.${otherUserId}),and(from_id.eq.${otherUserId},to_id.eq.${user.id})`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (bookId) {
    query = query.eq('book_id', bookId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取消息失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 标记消息为已读
 */
export async function markAsRead(fromId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('from_id', fromId)
    .eq('to_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('标记已读失败:', error);
    return false;
  }

  return true;
}

/**
 * 撤回消息
 */
export async function recallMessage(messageId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('messages')
    .update({ 
      is_recalled: true, 
      content: '消息已撤回' 
    })
    .eq('id', messageId)
    .eq('from_id', user.id);

  if (error) {
    console.error('撤回消息失败:', error);
    return false;
  }

  return true;
}

// ==================== 会话服务 ====================

/**
 * 获取当前用户的会话列表
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      book:books(id, title, price, images, condition),
      last_message:messages!last_message_id(*)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('获取会话列表失败:', error);
    return [];
  }

  // 获取未读消息数
  const conversationsWithUnread = await Promise.all(
    (data || []).map(async (conv) => {
      const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
      
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('from_id', otherUserId)
        .eq('to_id', user.id)
        .eq('is_read', false);

      return {
        ...conv,
        unread_count: count || 0,
        other_user_id: otherUserId
      };
    })
  );

  return conversationsWithUnread;
}

/**
 * 获取或创建会话
 */
export async function getOrCreateConversation(
  bookId: string,
  sellerId: string
): Promise<Conversation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.id === sellerId) return null; // 不能与自己聊天

  // 查找现有会话
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('book_id', bookId)
    .eq('buyer_id', user.id)
    .eq('seller_id', sellerId)
    .single();

  if (existing) return existing;

  // 创建新会话
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      book_id: bookId,
      buyer_id: user.id,
      seller_id: sellerId
    })
    .select()
    .single();

  if (error) {
    console.error('创建会话失败:', error);
    return null;
  }

  return data;
}

/**
 * 更新会话最后消息
 */
async function updateConversationLastMessage(
  toId: string,
  bookId: string | undefined,
  messageId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const otherUserId = toId;
  
  // 查找会话
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('book_id', bookId || null)
    .or(`and(buyer_id.eq.${user.id},seller_id.eq.${otherUserId}),and(buyer_id.eq.${otherUserId},seller_id.eq.${user.id})`)
    .single();

  if (conv) {
    // 更新现有会话
    await supabase
      .from('conversations')
      .update({
        last_message_id: messageId,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conv.id);
  } else {
    // 创建新会话（如果不存在）
    try {
      await supabase
        .from('conversations')
        .insert({
          book_id: bookId || null,
          buyer_id: user.id,
          seller_id: otherUserId,
          last_message_id: messageId,
          last_message_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  }
}

// ==================== 在线状态服务 ====================

/**
 * 更新用户在线状态
 */
export async function updatePresence(isOnline: boolean): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('user_presence')
    .upsert({
      user_id: user.id,
      is_online: isOnline,
      last_seen_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('更新在线状态失败:', error);
    return false;
  }

  return true;
}

/**
 * 获取用户在线状态
 */
export async function getUserPresence(userId: string): Promise<UserPresence | null> {
  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * 获取多个用户在线状态
 */
export async function getUsersPresence(userIds: string[]): Promise<Map<string, UserPresence>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .in('user_id', userIds);

  if (error) {
    console.error('获取在线状态失败:', error);
    return new Map();
  }

  const presenceMap = new Map<string, UserPresence>();
  (data || []).forEach(p => presenceMap.set(p.user_id, p));
  return presenceMap;
}

// ==================== 图片上传服务 ====================

/**
 * 上传聊天图片
 */
export async function uploadChatImage(
  file: File,
  bookId?: string
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const fileName = `${user.id}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('上传图片失败:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('chat-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

// ==================== Realtime 实时订阅 ====================

type MessageCallback = (message: ChatMessage) => void;
type PresenceCallback = (presence: { userId: string; isOnline: boolean }) => void;

/**
 * 订阅消息实时推送
 */
export function subscribeToMessages(
  onNewMessage: MessageCallback
): RealtimeChannel {
  const channel = supabase.channel('messages');

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        // 消息更新（已读/撤回）
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * 订阅指定用户的聊天
 */
export function subscribeToChat(
  otherUserId: string,
  onNewMessage: MessageCallback
): RealtimeChannel {
  const channel = supabase.channel(`chat:${otherUserId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_id=eq.${otherUserId}`
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
}

/**
 * 订阅在线状态变化
 */
export function subscribeToPresence(
  userIds: string[],
  onPresenceChange: PresenceCallback
): RealtimeChannel {
  const channel = supabase.channel('presence');

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      userIds.forEach(userId => {
        const users = state[userId] as any[];
        const isOnline = users && users.length > 0;
        onPresenceChange({ userId, isOnline });
      });
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: 'current' });
      }
    });

  return channel;
}
