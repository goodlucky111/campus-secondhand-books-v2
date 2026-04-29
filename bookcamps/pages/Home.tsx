
import React, { useState, useEffect } from 'react';
import { Book, Condition, ViewState, WantedPost } from '../types';
import { getBooks, searchBooks } from '../services/bookService';
import { Book as SupabaseBook, supabase } from '../supabase';
import BottomNav from '../components/BottomNav';

const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: '微积分：早期超越函数',
    author: 'James Stewart',
    price: 45,
    originalPrice: 120,
    condition: Condition.New,
    school: '本部',
    location: '图书馆',
    imageUrl: 'https://picsum.photos/seed/math/300/400',
    sellerId: 'user_2',
    publishTime: '10分钟前'
  },
  {
    id: '2',
    title: '心理学：核心概念',
    author: 'Philip Zimbardo',
    price: 32.5,
    originalPrice: 85,
    condition: Condition.LikeNew,
    school: '南校区',
    location: '宿舍楼',
    imageUrl: 'https://picsum.photos/seed/psy/300/400',
    sellerId: 'user_3',
    publishTime: '30分钟前'
  },
  {
    id: '3',
    title: '经济学原理',
    author: 'N. Gregory Mankiw',
    price: 28,
    originalPrice: 105,
    condition: Condition.Good,
    school: '本部',
    location: '教学楼',
    imageUrl: 'https://picsum.photos/seed/eco/300/400',
    sellerId: 'user_4',
    publishTime: '1小时前'
  },
  {
    id: '4',
    title: '生物学：全球方法',
    author: 'Neil Campbell',
    price: 55,
    originalPrice: 150,
    condition: Condition.New,
    school: '西区',
    location: '实验楼',
    imageUrl: 'https://picsum.photos/seed/bio/300/400',
    sellerId: 'user_5',
    publishTime: '2小时前'
  },
  {
    id: '5',
    title: '算法导论 (CLRS)',
    author: 'Thomas H. Cormen',
    price: 65,
    originalPrice: 180,
    condition: Condition.LikeNew,
    school: '本部',
    location: '图书馆',
    imageUrl: 'https://picsum.photos/seed/algo/300/400',
    sellerId: 'user_6',
    publishTime: '4小时前'
  },
  {
    id: '6',
    title: '全球通史：从史前到21世纪',
    author: 'L.S. Stavrianos',
    price: 18,
    originalPrice: 58,
    condition: Condition.Used,
    school: '东区',
    location: '宿舍3号楼',
    imageUrl: 'https://picsum.photos/seed/history/300/400',
    sellerId: 'user_7',
    publishTime: '昨天'
  },
  {
    id: '7',
    title: '计算机组成与设计',
    author: 'David Patterson',
    price: 42,
    originalPrice: 110,
    condition: Condition.New,
    school: '南校区',
    location: '计算中心',
    imageUrl: 'https://picsum.photos/seed/comp/300/400',
    sellerId: 'user_8',
    publishTime: '刚刚'
  },
  {
    id: '8',
    title: '解忧杂货店',
    author: '东野圭吾',
    price: 12,
    originalPrice: 39,
    condition: Condition.Good,
    school: '本部',
    location: '学生活动中心',
    imageUrl: 'https://picsum.photos/seed/fiction/300/400',
    sellerId: 'user_9',
    publishTime: '12小时前'
  }
];

const HOT_PICKS: Book[] = MOCK_BOOKS.slice(4, 8);

const MOCK_WANTED: WantedPost[] = [
  {
    id: 'w1',
    title: '线性代数及其应用',
    budget: 30,
    condition: '七成新及以上',
    school: '本部',
    description: '希望是第五版，笔记多一点也没关系，最好是本部的学长学姐，可以线下交易。',
    userId: 'u10',
    userName: '小明同学',
    userAvatar: 'https://picsum.photos/seed/xm/100/100',
    publishTime: '10分钟前'
  },
  {
    id: 'w2',
    title: '高等数学 下册',
    budget: 20,
    condition: '无要求',
    school: '南校区',
    description: '求一本高数下，最好有重点笔记，感激不尽！',
    userId: 'u11',
    userName: '张三',
    userAvatar: 'https://picsum.photos/seed/zs/100/100',
    publishTime: '1小时前'
  }
];

interface HomeProps {
  onNavigate: (view: ViewState) => void;
  onSelectBook: (book: Book) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onSelectBook }) => {
  const [activeTab, setActiveTab] = useState<'RECOMMEND' | 'WANTED'>('RECOMMEND');
  const [showProvideModal, setShowProvideModal] = useState(false);
  const [selectedWanted, setSelectedWanted] = useState<WantedPost | null>(null);
  const [myBookCondition, setMyBookCondition] = useState('九成新');
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [isLoading, setIsLoading] = useState(false);

  // 加载书籍列表 - 模拟数据 + 真实数据叠加
  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      
      // 模拟数据
      const mockBooks = MOCK_BOOKS;
      
      try {
        // 获取所有可用的真实书籍
        const realBooks = await getBooks({ status: 'available' });
        
        // 将真实书籍转换为前端类型
        const convertedRealBooks: Book[] = realBooks.map((book: any) => ({
          id: book.id,
          title: book.title,
          author: book.author || '',
          price: book.price,
          originalPrice: book.original_price || 0,
          condition: mapConditionFromDb(book.condition),
          school: book.school || '本部',
          location: book.location || '图书馆',
          imageUrl: book.images?.[0] || 'https://picsum.photos/seed/book/300/400',
          sellerId: book.seller_id,
          description: book.description || '',
          isbn: book.isbn || '',
          publishTime: formatTime(book.created_at)
        }));
        
        // 模拟数据在上，真实数据在下（最新发布的在上面）
        const allBooks = [...mockBooks, ...convertedRealBooks];
        setBooks(allBooks);
      } catch (error) {
        console.error('加载书籍失败:', error);
        setBooks(mockBooks);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBooks();
  }, []);

  // 从数据库成色转换为前端类型
  const mapConditionFromDb = (condition: string): Condition => {
    switch (condition) {
      case 'new': return Condition.New;
      case 'like_new': return Condition.LikeNew;
      case 'good': return Condition.Good;
      default: return Condition.Used;
    }
  };

  // 映射成色
  const mapCondition = (condition: string): Condition => {
    switch (condition) {
      case '全新': return Condition.New;
      case '九成新': return Condition.LikeNew;
      case '八成新': return Condition.Good;
      default: return Condition.Used;
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string): string => {
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

  const handleProvideClick = (post: WantedPost) => {
    setSelectedWanted(post);
    setShowProvideModal(true);
  };

  const confirmProvide = () => {
    setShowProvideModal(false);
    onNavigate('CHAT');
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <header className="sticky top-0 z-30 bg-white/80 ios-blur px-4 pt-12 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">book_4</span>
            </div>
            <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">BookCampus</h1>
          </div>
          <div className="flex gap-3">
            <button className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-active active:scale-90">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div 
              className="size-10 rounded-full bg-cover bg-center border-2 border-white cursor-pointer shadow-sm active:scale-90 transition-all" 
              style={{ backgroundImage: `url(https://picsum.photos/seed/alex/100/100)` }}
              onClick={() => onNavigate('PROFILE')}
            />
          </div>
        </div>
        <div 
          className="relative flex items-center cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => onNavigate('SEARCH')}
        >
          <div className="absolute left-3 text-primary flex items-center">
            <span className="material-symbols-outlined">search</span>
          </div>
          <div className="w-full h-12 pl-10 pr-12 bg-slate-100 border-none rounded-xl flex items-center text-slate-400 text-sm">
            搜索教材、ISBN或作者
          </div>
          <div className="absolute right-3 text-slate-400">
            <span className="material-symbols-outlined">barcode_scanner</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 px-4 mt-4">
          <div 
            className="bg-primary/10 p-4 rounded-xl flex flex-col justify-between h-32 border border-primary/20 cursor-pointer active:scale-95 transition-transform"
            onClick={() => onNavigate('PUBLISH')}
          >
            <div>
              <span className="material-symbols-outlined text-primary text-3xl">bolt</span>
              <h3 className="font-bold text-slate-900 mt-1">快速卖书</h3>
            </div>
            <p className="text-[10px] text-primary font-medium">极速发布，学弟学妹在等你</p>
          </div>
          <div 
            className="bg-orange-50 p-4 rounded-xl flex flex-col justify-between h-32 border border-orange-100 cursor-pointer active:scale-95 transition-transform"
            onClick={() => onNavigate('PUBLISH_REQUEST')}
          >
            <div>
              <span className="material-symbols-outlined text-orange-500 text-3xl">local_offer</span>
              <h3 className="font-bold text-slate-900 mt-1">便捷求书</h3>
            </div>
            <p className="text-[10px] text-orange-600 font-medium">发布心仪书籍，等待同学联系</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-4 mt-8 mb-4">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('RECOMMEND')}
              className={`text-lg transition-all relative py-1 ${activeTab === 'RECOMMEND' ? 'font-bold text-slate-900' : 'text-slate-400'}`}
            >
              为你推荐
              {activeTab === 'RECOMMEND' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('WANTED')}
              className={`text-lg transition-all relative py-1 ${activeTab === 'WANTED' ? 'font-bold text-slate-900' : 'text-slate-400'}`}
            >
              求书广场
              {activeTab === 'WANTED' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
            </button>
          </div>
        </div>

        {activeTab === 'RECOMMEND' ? (
          <div className="animate-fade-in">
            {/* Horizontal Hot Picks */}
            <div className="mb-6">
              <div className="px-4 flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-orange-500 text-base fill-1">local_fire_department</span>
                  近期热门
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">滑动查看更多</span>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 snap-x">
                {HOT_PICKS.map(book => (
                  <div 
                    key={book.id}
                    onClick={() => onSelectBook(book)}
                    className="min-w-[140px] snap-start flex flex-col active:scale-95 transition-transform"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm mb-2 border border-slate-50">
                      <img src={book.imageUrl} className="w-full h-full object-cover" alt={book.title} />
                      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md rounded-lg px-2 py-0.5 text-[8px] font-bold text-white">
                        {book.publishTime}
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{book.title}</h4>
                    <span className="text-primary font-bold text-xs mt-0.5">¥{book.price}</span>
                  </div>
                ))}
                <div className="min-w-[140px] snap-start bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200">
                   <span className="material-symbols-outlined">arrow_forward</span>
                   <span className="text-[10px] font-bold">查看更多</span>
                </div>
              </div>
            </div>

            {/* Main Recommendation Grid */}
            <div className="px-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                <h3 className="text-sm font-bold text-slate-800">最新发布</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {isLoading ? (
                  <div className="col-span-2 text-center py-8 text-slate-400">
                    加载中...
                  </div>
                ) : books.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-slate-400">
                    暂无书籍，快去发布一本吧！
                  </div>
                ) : (
                  books.map(book => (
                  <div 
                    key={book.id} 
                    className="flex flex-col cursor-pointer active:scale-[0.98] transition-transform group"
                    onClick={() => onSelectBook(book)}
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm mb-2 bg-white border border-slate-50">
                      <img src={book.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt={book.title} />
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm ${book.condition === Condition.New ? 'bg-primary' : book.condition === Condition.LikeNew ? 'bg-blue-500' : 'bg-slate-500'}`}>
                          {book.condition}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug min-h-[40px]">{book.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 mb-1 font-medium">{book.author}</p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-primary font-bold text-base">¥{book.price.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 line-through">¥{book.originalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 opacity-70">
                      <span className="material-symbols-outlined text-slate-400 text-[14px]">location_on</span>
                      <span className="text-[10px] text-slate-500 font-medium">{book.school}</span>
                    </div>
                  </div>
                ))
                )}
              </div>
              {!isLoading && books.length > 0 && (
                <div className="flex flex-col items-center py-12 gap-2 opacity-30">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <p className="text-[10px] font-bold tracking-widest uppercase">正在努力加载更多...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 flex flex-col gap-4 animate-fade-in">
            {MOCK_WANTED.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:scale-[0.99] transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900">求购：{post.title}</h4>
                  <span className="text-orange-500 font-black text-sm">预算 ¥{post.budget}</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded bg-slate-50 text-[10px] text-slate-500 font-bold">成色：{post.condition}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-50 text-[10px] text-slate-500 font-bold">校区：{post.school}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{post.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-cover shadow-inner" style={{ backgroundImage: `url(${post.userAvatar})` }}></div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-700">{post.userName}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{post.publishTime}发布</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleProvideClick(post)}
                    className="bg-primary text-white text-[11px] px-5 py-2 rounded-full font-bold shadow-sm shadow-primary/20 active:scale-95 transition-transform"
                  >
                    我有这本书
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Provide Book Confirmation Modal */}
      {showProvideModal && selectedWanted && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProvideModal(false)}></div>
          <div className="relative bg-white w-full max-w-[340px] rounded-[32px] p-8 shadow-2xl animate-scale-in flex flex-col items-center">
            <h3 className="text-[19px] font-black text-slate-900 mb-8 tracking-tight">确认向TA提供书籍?</h3>
            
            <div className="w-full bg-[#F5F8F7] rounded-2xl p-5 mb-8 border border-slate-100 shadow-inner">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">求购书名</span>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">期望价格</span>
              </div>
              <div className="flex justify-between items-baseline">
                <h4 className="text-[17px] font-black text-slate-800 truncate pr-4">{selectedWanted.title}</h4>
                <span className="text-[19px] font-black text-orange-500 shrink-0">¥{selectedWanted.budget}</span>
              </div>
            </div>

            <div className="w-full mb-8">
              <label className="text-[13px] font-bold text-slate-400 mb-3 block">我的书籍状态</label>
              <div className="grid grid-cols-3 gap-2">
                {['全新', '九成新', '有笔记'].map((c) => (
                  <button 
                    key={c}
                    onClick={() => setMyBookCondition(c)}
                    className={`py-2.5 rounded-xl text-[13px] font-bold transition-all border-2 ${
                      myBookCondition === c ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-slate-50 border-slate-50 text-slate-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 items-start bg-slate-50 p-4 rounded-2xl mb-10 w-full border border-slate-100">
              <span className="material-symbols-outlined text-slate-400 text-[20px] mt-0.5">info</span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                点击确认后将自动发起聊天并告知TA： 我有这本书
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl active:scale-95 transition-all"
                onClick={() => setShowProvideModal(false)}
              >
                取消
              </button>
              <button 
                className="flex-1 py-4 font-black text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                onClick={confirmProvide}
              >
                确认提供
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeView="HOME" onNavigate={onNavigate} />
    </div>
  );
};

export default Home;
