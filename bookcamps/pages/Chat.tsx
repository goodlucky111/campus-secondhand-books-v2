
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Book, ViewState, ChatMessage as AppChatMessage } from '../types';
import { supabase } from '../supabase';
import {
  sendTextMessage,
  sendImageMessage,
  getMessages,
  markAsRead,
  recallMessage,
  uploadChatImage,
  subscribeToChat,
  getUserPresence,
  updatePresence,
  ChatMessage,
  getOrCreateConversation
} from '../services/chatService';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatProps {
  book: Book | null;
  onNavigate: (view: ViewState) => void;
}

// 辅助函数：从会话中获取买家ID
async function getBuyerIdFromConversation(bookId: string, sellerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('buyer_id')
    .eq('book_id', bookId)
    .eq('seller_id', sellerId)
    .single();
  
  if (error || !data) {
    return null;
  }
  return data.buyer_id;
}

const Chat: React.FC<ChatProps> = ({ book, onNavigate }) => {
  const [messages, setMessages] = useState<AppChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showBargain, setShowBargain] = useState(false);
  const [showMeetup, setShowMeetup] = useState(false);
  const [bargainPrice, setBargainPrice] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupTime, setMeetupTime] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherUserName, setOtherUserName] = useState('对方用户');
  const [otherUserAvatar, setOtherUserAvatar] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [sendingImage, setSendingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 加载消息
  const loadMessages = useCallback(async () => {
    if (!book?.sellerId) {
      // 未登录使用模拟数据
      setMessages(MOCK_MESSAGES);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessages(MOCK_MESSAGES);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // 判断当前用户身份：如果是卖家，对方是买家；如果是买家，对方是卖家
      const isCurrentUserSeller = user.id === book.sellerId;
      const targetOtherUserId = isCurrentUserSeller 
        ? await getBuyerIdFromConversation(book.id, user.id) || book.sellerId
        : book.sellerId;
      
      setOtherUserId(targetOtherUserId);

      // 获取对方用户信息
      if (targetOtherUserId && targetOtherUserId !== user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar')
          .eq('id', targetOtherUserId)
          .single();

        if (profile) {
          setOtherUserName(profile.nickname || '对方用户');
          setOtherUserAvatar(profile.avatar || '');
        }

        // 获取在线状态
        const presence = await getUserPresence(targetOtherUserId);
        setIsOtherUserOnline(presence?.is_online || false);

        // 确保会话存在（如果当前用户是买家，需要创建会话）
        if (!isCurrentUserSeller) {
          await getOrCreateConversation(book.id, targetOtherUserId);
        }
      }

      // 获取消息历史 - 传入正确的对方ID
      const dbMessages = await getMessages(targetOtherUserId || book.sellerId, book.id);
      
      // 转换为前端格式
      const formattedMessages: AppChatMessage[] = dbMessages.map(msg => ({
        id: msg.id,
        senderId: msg.from_id === user.id ? 'user' : 'seller',
        content: msg.content,
        type: msg.type as 'text' | 'image' | 'bargain' | 'meetup',
        timestamp: new Date(msg.created_at).getTime(),
        isRead: msg.is_read,
        isRecalled: msg.is_recalled,
        imageUrl: msg.image_url
      }));

      setMessages(formattedMessages);

      // 标记已读
      await markAsRead(targetOtherUserId || book.sellerId);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [book?.sellerId, book?.id]);

  // 订阅实时消息
  useEffect(() => {
    if (!otherUserId || !currentUserId) return;

    const channel = subscribeToChat(otherUserId, async (newMessage) => {
      // 排除自己发送的消息
      if (newMessage.from_id !== currentUserId) {
        const appMessage: AppChatMessage = {
          id: newMessage.id,
          senderId: 'seller',
          content: newMessage.content,
          type: newMessage.type as 'text' | 'image' | 'bargain' | 'meetup',
          timestamp: new Date(newMessage.created_at).getTime(),
          isRead: newMessage.is_read,
          isRecalled: newMessage.is_recalled,
          imageUrl: newMessage.image_url
        };
        
        setMessages(prev => [...prev, appMessage]);
        
        // 标记已读
        await markAsRead(newMessage.from_id);
      }
    });

    channelRef.current = channel;

    // 更新在线状态
    updatePresence(true);

    return () => {
      supabase.removeChannel(channel);
      updatePresence(false);
    };
  }, [otherUserId, currentUserId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载初始数据
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 发送文字消息
  const handleSendText = async () => {
    if (!inputText.trim() || !otherUserId) return;

    if (!currentUserId) {
      // 未登录使用模拟发送
      const newMessage: AppChatMessage = {
        id: Date.now().toString(),
        senderId: 'user',
        content: inputText,
        type: 'text',
        timestamp: Date.now()
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      return;
    }

    const result = await sendTextMessage(otherUserId, inputText, book?.id);
    if (result) {
      const newMessage: AppChatMessage = {
        id: result.id,
        senderId: 'user',
        content: result.content,
        type: result.type as 'text' | 'image',
        timestamp: new Date(result.created_at).getTime(),
        isRead: false,
        isRecalled: false
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  // 发送图片消息
  const handleSendImage = async (file: File) => {
    if (!otherUserId || !currentUserId) return;

    setSendingImage(true);
    try {
      const imageUrl = await uploadChatImage(file, book?.id);
      if (imageUrl) {
        const result = await sendImageMessage(otherUserId, imageUrl, book?.id);
        if (result) {
          const newMessage: AppChatMessage = {
            id: result.id,
            senderId: 'user',
            content: '图片消息',
            type: 'image',
            timestamp: new Date(result.created_at).getTime(),
            isRead: false,
            isRecalled: false,
            imageUrl: imageUrl
          };
          setMessages([...messages, newMessage]);
        }
      }
    } catch (error) {
      console.error('发送图片失败:', error);
    } finally {
      setSendingImage(false);
    }
  };

  // 撤回消息
  const handleRecall = async (messageId: string) => {
    if (!currentUserId) return;

    const success = await recallMessage(messageId);
    if (success) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: '消息已撤回', isRecalled: true }
            : msg
        )
      );
    }
  };

  // 议价提交
  const handleBargainSubmit = () => {
    if (bargainPrice) {
      const newMessage: AppChatMessage = {
        id: Date.now().toString(),
        senderId: 'user',
        content: `我想以 ¥${bargainPrice} 的价格购买`,
        type: 'bargain',
        timestamp: Date.now(),
        extra: { price: bargainPrice }
      };
      setMessages([...messages, newMessage]);
      setShowBargain(false);
      setBargainPrice('');
    }
  };

  // 面交提交
  const handleMeetupSubmit = () => {
    const newMessage: AppChatMessage = {
      id: Date.now().toString(),
      senderId: 'user',
      content: `发起了面交邀请`,
      type: 'meetup',
      timestamp: Date.now(),
      extra: { location: meetupLocation, time: meetupTime }
    };
    setMessages([...messages, newMessage]);
    setShowMeetup(false);
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendImage(file);
    }
  };

  // 模拟消息数据
  const MOCK_MESSAGES: AppChatMessage[] = [
    { 
      id: 'resp-1', 
      senderId: 'seller', 
      content: '同学你好，我有你要找的这本书，看下图片是否合适？', 
      type: 'text', 
      timestamp: Date.now() - 1000000,
      extra: { 
        isWantedResponse: true,
        title: '线性代数及其应用',
        condition: '九成新，有少量笔记',
        image: 'https://picsum.photos/seed/mathwanted/400/400'
      }
    },
    { 
      id: 'resp-2', 
      senderId: 'user', 
      content: '好的，收到了！看上去很不错，是第五版吗？', 
      type: 'text', 
      timestamp: Date.now() - 500000 
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F5F8F7] h-full overflow-hidden font-display relative">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => onNavigate('MESSAGES')} className="text-slate-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            <span className="text-[15px] font-bold">返回</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-slate-900 text-[17px] font-black leading-tight">
              {otherUserName || '对方用户'}
            </h1>
            <div className="flex items-center gap-1.5">
              <div className={`size-2 rounded-full animate-pulse ${isOtherUserOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <span className="text-[11px] text-slate-400 font-bold tracking-wide">
                {isOtherUserOnline ? '在线' : '离线'}
              </span>
            </div>
          </div>
          <button className="text-slate-400">
            <span className="material-symbols-outlined text-[24px]">more_horiz</span>
          </button>
        </div>
        
        {showSuccessBanner && (
          <div className="px-4 py-2.5 bg-[#E8F6F1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] fill-1">check_circle</span>
              <p className="text-[12px] text-primary font-bold">已成功发起响应，快去商定细节吧！</p>
            </div>
            <button onClick={() => setShowSuccessBanner(false)} className="text-primary/40">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-40">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <span className="text-[11px] font-bold text-slate-300 bg-slate-100/50 px-4 py-1 rounded-full uppercase tracking-widest">
                {formatTime(Date.now() - 1000000)}
              </span>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div 
                  className="size-10 rounded-full bg-cover shrink-0 border border-slate-100 shadow-sm" 
                  style={{ backgroundImage: `url(${msg.senderId === 'user' ? 'https://picsum.photos/seed/alex/100/100' : otherUserAvatar || 'https://picsum.photos/seed/xm/100/100'})` }} 
                />
                
                <div className={`flex flex-col ${msg.senderId === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  {/* 消息已撤回 */}
                  {msg.isRecalled ? (
                    <div className="text-[12px] text-slate-300 italic px-4 py-2">
                      消息已撤回
                    </div>
                  ) : msg.type === 'image' ? (
                    // 图片消息
                    <div className="rounded-[16px] overflow-hidden shadow-sm max-w-[250px]">
                      <img 
                        src={msg.imageUrl} 
                        className="w-full h-auto object-cover" 
                        alt="图片消息"
                      />
                    </div>
                  ) : msg.type === 'bargain' ? (
                    // 议价消息
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-orange-100 p-4 w-64 animate-scale-in">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-orange-500 fill-1">sell</span>
                        <span className="text-[14px] font-black text-slate-800">出价议价</span>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 mb-4">
                        <p className="text-[12px] text-orange-600 font-bold mb-1">期望价格</p>
                        <p className="text-[20px] font-black text-orange-500">¥ {msg.extra?.price}</p>
                      </div>
                      <button className="w-full py-2 bg-orange-500 text-white rounded-full text-xs font-black shadow-lg shadow-orange-200 active:scale-95 transition-transform">
                        {msg.senderId === 'user' ? '等待对方同意' : '查看详情'}
                      </button>
                    </div>
                  ) : msg.type === 'meetup' ? (
                    // 面交消息
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-primary/10 p-4 w-64 animate-scale-in">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary fill-1">handshake</span>
                        <span className="text-[14px] font-black text-slate-800">面交邀请</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-[12px] text-slate-500">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          <span className="font-bold">{msg.extra?.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-slate-500">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          <span className="font-bold">{msg.extra?.time}</span>
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded-lg mb-4 flex items-start gap-2">
                        <span className="material-symbols-outlined text-yellow-600 text-[14px] mt-0.5">warning</span>
                        <p className="text-[9px] text-yellow-700 font-bold leading-tight">安全提示：建议在校园公共场所（如图书馆）进行面交。</p>
                      </div>
                      <button className="w-full py-2 bg-primary text-white rounded-full text-xs font-black shadow-lg shadow-primary/10 active:scale-95 transition-transform">
                        查看详情
                      </button>
                    </div>
                  ) : msg.extra?.isWantedResponse ? (
                    // 响应书籍消息
                    <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                      <div className="aspect-[4/3] bg-slate-200">
                        <img src={msg.extra.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black">响应书籍</span>
                          <h4 className="text-[15px] font-black text-slate-800">{msg.extra.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-bold">
                          <span className="material-symbols-outlined text-[14px]">temp_preferences_custom</span>
                          <span>成色：{msg.extra.condition}</span>
                        </div>
                        <div className="bg-[#F5F8F7] p-3 rounded-xl border-l-4 border-primary">
                          <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">"{msg.content}"</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 普通文字消息
                    <div className={`relative rounded-[20px] px-4 py-3 shadow-sm text-[15px] leading-relaxed font-medium ${
                      msg.senderId === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                  
                  {/* 消息状态 */}
                  {msg.senderId === 'user' && !msg.isRecalled && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-slate-300 font-bold pr-1 uppercase tracking-widest">
                        {msg.isRead ? '已读' : '已发送'}
                      </span>
                      {/* 撤回按钮 */}
                      {!msg.isRead && (
                        <button 
                          onClick={() => handleRecall(msg.id)}
                          className="text-[10px] text-slate-400 hover:text-primary underline"
                        >
                          撤回
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-50 px-4 pt-3 pb-8 absolute bottom-0 w-full z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setShowBargain(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">sell</span>
            <span className="text-[13px] font-black">议价</span>
          </button>
          <button 
            onClick={() => setShowMeetup(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">handshake</span>
            <span className="text-[13px] font-black">发起面交</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* 图片上传按钮 */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={sendingImage}
            className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 disabled:opacity-50"
          >
            {sendingImage ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-[24px]">image</span>
            )}
          </button>
          
          <div className="relative flex-1">
            <input 
              className="w-full h-11 bg-slate-100 border-none rounded-full px-5 pr-12 text-[14px] font-medium focus:ring-0 text-slate-900 placeholder:text-slate-400"
              placeholder="我想和你说..."
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && inputText && handleSendText()}
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300">
              <span className="material-symbols-outlined text-[20px]">mood</span>
            </button>
          </div>
          <button 
            onClick={handleSendText}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-sm active:scale-90 transition-transform disabled:opacity-50"
            disabled={!inputText}
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </footer>

      {/* Bargain Modal */}
      {showBargain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBargain(false)}></div>
          <div className="relative w-full max-w-[400px] bg-white rounded-[24px] overflow-hidden shadow-2xl animate-scale-in flex flex-col">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-black text-slate-900">我要出价</h3>
                <button onClick={() => setShowBargain(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div className="bg-[#F3F9F7] rounded-[20px] p-4 flex gap-4 mb-6 border border-[#E0F2EC]">
                <div className="size-16 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                   <img src={book?.imageUrl || 'https://picsum.photos/seed/namiya/100/150'} className="w-10 h-14 object-cover" alt="" />
                </div>
                <div className="flex flex-col justify-center">
                   <h4 className="text-[15px] font-black text-slate-800 leading-snug">{book?.title || '书籍'}</h4>
                   <p className="text-[12px] text-slate-400 font-bold mt-1">原发布价：¥{book?.originalPrice || book?.price || 0}.00</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[13px] font-bold text-slate-400 mb-3 block">议价金额</label>
                <div className="relative flex items-center h-16 bg-white border-2 border-primary rounded-2xl px-5 focus-within:shadow-md transition-shadow">
                  <span className="text-[24px] font-black text-primary mr-2">¥</span>
                  <input 
                    autoFocus
                    className="flex-1 bg-transparent border-none p-0 text-[32px] font-black text-slate-900 focus:ring-0 h-full"
                    type="number"
                    placeholder="0.00"
                    value={bargainPrice}
                    onChange={(e) => setBargainPrice(e.target.value)}
                  />
                  <div className="flex flex-col gap-1 text-slate-300">
                    <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary">arrow_drop_up</span>
                    <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary">arrow_drop_down</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F0F7F4] p-4 rounded-xl flex gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  出价不含运费，校园面交建议面议。请务必在面交时核实书籍品相后再进行最终付款。
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  className="flex-1 h-14 font-black text-slate-500 bg-[#F5F8F7] rounded-[18px] active:scale-95 transition-all"
                  onClick={() => setShowBargain(false)}
                >
                  取消
                </button>
                <button 
                  className="flex-1 h-14 font-black text-white bg-primary rounded-[18px] shadow-lg shadow-primary/20 active:scale-95 transition-all"
                  onClick={handleBargainSubmit}
                >
                  发送出价
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meetup Modal */}
      {showMeetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMeetup(false)}></div>
          <div className="relative w-full max-w-[400px] bg-white rounded-[32px] overflow-hidden shadow-2xl animate-slide-up flex flex-col pt-12 pb-8 px-6">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>
            
            <div className="text-center mb-8">
              <h3 className="text-[22px] font-black text-slate-900">确认交易信息</h3>
              <p className="text-[13px] text-slate-400 font-bold mt-2">请与卖方协商好线下见面细节</p>
            </div>

            <div className="bg-[#F5FBFA] rounded-[24px] p-5 border-2 border-[#E0F2EC] flex gap-4 mb-8">
               <div className="size-20 bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center shrink-0 border border-slate-50">
                  <img src={book?.imageUrl || 'https://picsum.photos/seed/calc/100/150'} className="w-14 h-18 object-cover" alt="" />
               </div>
               <div className="flex flex-col justify-center">
                  <span className="text-primary text-[11px] font-black uppercase tracking-wider mb-1">待购书目</span>
                  <h4 className="text-[16px] font-black text-slate-800 leading-tight mb-2">{book?.title || '书籍'}</h4>
                  <p className="text-[20px] font-black text-primary">¥{book?.price || 0}.00</p>
               </div>
            </div>

            <div className="space-y-6 mb-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px] fill-1">location_on</span>
                  <label className="text-[14px] font-bold text-slate-900">见面地点</label>
                </div>
                <div className="relative">
                  <input 
                    className="w-full h-14 bg-slate-50 rounded-2xl border-none pl-5 pr-12 text-[14px] font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="请输入见面地点（如：图书馆一楼）"
                    value={meetupLocation}
                    onChange={(e) => setMeetupLocation(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary">map</span>
                </div>
                <p className="text-[10px] text-slate-400 italic px-1 font-medium italic">请选择校园内光线充足的安全公共场所。</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px] fill-1">schedule</span>
                  <label className="text-[14px] font-bold text-slate-900">见面时间</label>
                </div>
                <div className="relative">
                  <select 
                    className="w-full h-14 bg-slate-50 rounded-2xl border-none px-5 text-[14px] font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-primary/10 transition-all"
                    value={meetupTime}
                    onChange={(e) => setMeetupTime(e.target.value)}
                  >
                    <option value="" disabled>请选择见面时间</option>
                    <option value="今天上午">今天上午</option>
                    <option value="今天下午">今天下午</option>
                    <option value="今天晚上">今天晚上</option>
                    <option value="明天">明天</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                className="w-full h-14 bg-primary text-white rounded-[20px] font-black text-[17px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                onClick={handleMeetupSubmit}
              >
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                确认
              </button>
              <button 
                className="w-full py-2 text-slate-400 font-bold text-[15px] hover:text-slate-600 transition-colors"
                onClick={() => setShowMeetup(false)}
              >
                取消
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
               <span className="material-symbols-outlined text-primary text-[18px] fill-1">verified_user</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">受 BOOKCAMPUS 信任保障体系保护</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
