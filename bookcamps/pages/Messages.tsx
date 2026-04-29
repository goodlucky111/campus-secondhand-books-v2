
import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Book, Condition } from '../types';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabase';
import { 
  getConversations, 
  subscribeToMessages, 
  getUsersPresence,
  Conversation 
} from '../services/chatService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ConversationWithUser extends Conversation {
  userName: string;
  userAvatar: string;
}

// 模拟数据（未登录时使用）
const MOCK_CONVERSATIONS: any[] = [
  {
    id: 'c1',
    userName: '张明',
    userAvatar: 'https://picsum.photos/seed/zm/200/200',
    lastMessage: '价格还能再少点吗？我今天可以...',
    time: '10分钟前',
    unreadCount: 2,
    book: {
      id: '1',
      title: 'Organic Chemistry',
      author: 'Unknown',
      price: 45,
      originalPrice: 120,
      condition: Condition.New,
      school: '本部',
      location: '图书馆',
      imageUrl: 'https://picsum.photos/seed/chem/300/400',
      sellerId: 'user_2',
      publishTime: '10分钟前'
    }
  },
  {
    id: 'c2',
    userName: '小明同学',
    userAvatar: 'https://picsum.photos/seed/xm/200/200',
    lastMessage: '好的，收到了！看上去很不错...',
    time: '25分钟前',
    unreadCount: 0,
    book: {
      id: 'w1',
      title: '线性代数及其应用',
      author: 'David C. Lay',
      price: 30,
      originalPrice: 85,
      condition: Condition.LikeNew,
      school: '本部',
      location: '图书馆',
      imageUrl: 'https://picsum.photos/seed/mathwanted/400/400',
      sellerId: 'u10',
      publishTime: '30分钟前'
    }
  },
  {
    id: 'c3',
    userName: '陈思羽',
    userAvatar: 'https://picsum.photos/seed/csy/200/200',
    lastMessage: '我现在在图书馆，5分钟后见。',
    time: '昨天',
    unreadCount: 0,
    book: {
      id: '2',
      title: 'Macroeconomics',
      author: 'Unknown',
      price: 32.5,
      originalPrice: 85,
      condition: Condition.LikeNew,
      school: '南校区',
      location: '宿舍楼',
      imageUrl: 'https://picsum.photos/seed/eco1/300/400',
      sellerId: 'user_3',
      publishTime: '30分钟前'
    }
  }
];

interface MessagesProps {
  onNavigate: (view: ViewState) => void;
  onOpenChat: (book: Book) => void;
  userId?: string;
}

const Messages: React.FC<MessagesProps> = ({ onNavigate, onOpenChat, userId }) => {
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // 未登录时使用模拟数据
        setConversations(MOCK_CONVERSATIONS.map(c => ({
          ...c,
          userName: c.userName,
          userAvatar: c.userAvatar,
          book: c.book
        })));
        setLoading(false);
        return;
      }
      
      setCurrentUserId(user.id);
      const convs = await getConversations();
      
      // 获取对方用户信息
      const convsWithUser = await Promise.all(
        convs.map(async (conv) => {
          const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
          
          // 获取对方用户资料
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar')
            .eq('id', otherUserId)
            .single();

          return {
            ...conv,
            userName: profile?.nickname || '未知用户',
            userAvatar: profile?.avatar || `https://picsum.photos/seed/${otherUserId.slice(0, 8)}/200/200`,
            book: conv.book
          };
        })
      );

      // 叠加模拟数据 + 真实会话（模拟数据在上，真实数据在下）
      const allConversations = [...MOCK_CONVERSATIONS.map(c => ({
        ...c,
        userName: c.userName,
        userAvatar: c.userAvatar,
        book: c.book,
        isMock: true
      })), ...convsWithUser];
      
      setConversations(allConversations);

      // 获取在线状态
      const userIds = convs.map(c => c.buyer_id === user.id ? c.seller_id : c.buyer_id);
      const presenceMap = await getUsersPresence(userIds);
      const onlineSet = new Set<string>();
      presenceMap.forEach((p, userId) => {
        if (p.is_online) onlineSet.add(userId);
      });
      setOnlineUsers(onlineSet);
    } catch (error) {
      console.error('加载会话失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();

    // 订阅实时消息
    const channel: RealtimeChannel = subscribeToMessages((message) => {
      // 有新消息时刷新会话列表
      loadConversations();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 处理点击会话
  const handleConversationClick = (conv: ConversationWithUser) => {
    if (!currentUserId) {
      // 未登录使用模拟书籍
      const mockBook = MOCK_CONVERSATIONS[0].book;
      onOpenChat(mockBook);
      return;
    }
    
    const otherUserId = conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id;
    onOpenChat({
      id: conv.book_id || '',
      title: conv.book?.title || '书籍',
      author: '',
      price: conv.book?.price || 0,
      originalPrice: conv.book?.original_price || 0,
      condition: Condition.LikeNew,
      school: '',
      location: '',
      imageUrl: conv.book?.images?.[0] || '',
      sellerId: otherUserId,
      publishTime: ''
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden font-display">
      <header className="sticky top-0 z-40 bg-white/95 ios-blur px-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-50">
        <h1 className="text-[28px] font-black text-slate-900 tracking-tight">消息</h1>
        <div className="flex gap-4">
          <button className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
          <button className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[24px]">checklist</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-4 opacity-40">
            <span className="material-symbols-outlined text-4xl">chat_bubble_outline</span>
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">暂无消息</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {conversations.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => handleConversationClick(conv)}
                className="flex items-center gap-4 px-6 py-5 active:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <div 
                    className="size-14 rounded-full bg-cover bg-center border border-slate-100 shadow-sm"
                    style={{ backgroundImage: `url(${conv.userAvatar})` }}
                  />
                  {conv.unread_count && conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 size-5 bg-red-500 border-2 border-white text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce-slow">
                      {conv.unread_count}
                    </div>
                  )}
                  {onlineUsers.has(conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id) && (
                    <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[17px] font-black text-slate-800 truncate">{conv.userName}</h3>
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-[14px] truncate flex-1 leading-snug ${(conv.unread_count || 0) > 0 ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                      {conv.last_message?.content || '暂无消息'}
                    </p>
                  </div>
                </div>

                <div className="size-14 rounded-xl bg-slate-50 shrink-0 overflow-hidden border border-slate-100 ml-2 group-active:scale-95 transition-transform">
                  <img src={conv.book?.images?.[0] || conv.book?.imageUrl || 'https://picsum.photos/seed/book/200/200'} className="w-full h-full object-cover opacity-80" alt="" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="py-12 flex flex-col items-center gap-4 opacity-20">
           <span className="material-symbols-outlined text-4xl">chat_bubble_outline</span>
           <p className="text-[11px] font-black uppercase tracking-[0.2em]">没有更多消息了</p>
        </div>
      </main>

      <BottomNav activeView="MESSAGES" onNavigate={onNavigate} />
    </div>
  );
};

export default Messages;
