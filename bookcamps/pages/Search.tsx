
import React, { useState, useEffect } from 'react';
import { Book, ViewState, Condition } from '../types';
import { getSmartSuggestions, searchBooks } from '../services/bookService';
import { Book as SupabaseBook } from '../supabase';

const MOCK_RECOMMENDATIONS: Book[] = [
  {
    id: 'r1',
    title: '同济大学高等数学第七版·上册',
    author: '同济大学数学系',
    price: 15,
    originalPrice: 45,
    condition: Condition.LikeNew,
    school: '本部',
    location: '教学楼',
    imageUrl: 'https://picsum.photos/seed/math1/300/400',
    sellerId: 'user_r1',
    publishTime: '2小时前'
  },
  {
    id: 'r2',
    title: '线性代数及其应用 (原书第5版)',
    author: 'David C. Lay',
    price: 28.5,
    originalPrice: 89,
    condition: Condition.New,
    school: '本部',
    location: '图书馆',
    imageUrl: 'https://picsum.photos/seed/math2/300/400',
    sellerId: 'user_r2',
    publishTime: '刚刚'
  },
  {
    id: 'r3',
    title: '大学物理学 (第三版) 学习辅导',
    author: '赵近芳',
    price: 12,
    originalPrice: 35,
    condition: Condition.Good,
    school: '南校区',
    location: '宿舍楼',
    imageUrl: 'https://picsum.photos/seed/phys1/300/400',
    sellerId: 'user_r3',
    publishTime: '昨天'
  },
  {
    id: 'r4',
    title: '考研数学：接力题典1800题',
    author: '汤家凤',
    price: 45,
    originalPrice: 98,
    condition: Condition.LikeNew,
    school: '南校区',
    location: '自习室',
    imageUrl: 'https://picsum.photos/seed/math3/300/400',
    sellerId: 'user_r4',
    publishTime: '5小时前'
  }
];

interface SearchProps {
  onNavigate: (view: ViewState) => void;
  onSelectBook: (book: Book) => void;
}

// 辅助函数
const mapCondition = (condition: string): Condition => {
  switch (condition) {
    case '全新': return Condition.New;
    case '九成新': return Condition.LikeNew;
    case '八成新': return Condition.Good;
    default: return Condition.Used;
  }
};

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

const Search: React.FC<SearchProps> = ({ onNavigate, onSelectBook }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setIsSearching(true);
    setHasSearched(true);
    
    // 从 Supabase 搜索
    const supabaseBooks = await searchBooks(q);
    
    // 转换为前端类型
    const mappedBooks: Book[] = supabaseBooks.map((b: SupabaseBook) => ({
      id: b.id,
      title: b.title,
      author: b.author || '',
      price: b.price,
      originalPrice: b.original_price || undefined,
      condition: mapCondition(b.condition),
      school: '本部',
      location: '线上交易',
      imageUrl: b.images?.[0] || `https://picsum.photos/seed/${b.id}/300/400`,
      sellerId: b.seller_id,
      publishTime: formatTime(b.created_at)
    }));
    
    setResults(mappedBooks);
    setIsSearching(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FBFA] h-full overflow-hidden font-display">
      <header className="sticky top-0 z-40 bg-white px-4 pt-12 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('HOME')} className="text-slate-700">
            <span className="material-symbols-outlined text-[28px]">chevron_left</span>
          </button>
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">search</span>
            <input
              autoFocus
              className="w-full h-11 pl-10 pr-10 bg-[#F5F8F7] border-none rounded-full text-[15px] focus:ring-0 placeholder:text-slate-300"
              placeholder="搜索教材、ISBN或作者"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                <span className="material-symbols-outlined text-[20px] fill-1">cancel</span>
              </button>
            )}
          </div>
          <button 
            onClick={() => handleSearch(query)} 
            className="text-primary font-bold text-base"
          >
            搜索
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400 font-bold">搜索中...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="animate-fade-in">
            {/* Empty State Illustration */}
            <div className="flex flex-col items-center px-10 pt-10 text-center">
              <div className="relative w-full max-w-[280px] aspect-square mb-8">
                 <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white rounded-full scale-110 opacity-50"></div>
                 <img 
                   src="https://picsum.photos/seed/catstudy/600/600" 
                   className="w-full h-full object-cover rounded-3xl shadow-ios-lg relative z-10" 
                   alt="No results" 
                 />
                 <div className="absolute -bottom-4 -right-4 size-20 bg-white rounded-full shadow-lg flex items-center justify-center z-20 border-4 border-[#F8FBFA]">
                    <span className="material-symbols-outlined text-primary text-5xl font-black">question_mark</span>
                 </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">哎呀，没找到这本书...</h3>
              <p className="text-[15px] text-slate-400 leading-relaxed mb-10">可能这本书宝贝太稀缺了，或者同学还没来得及上架</p>
            </div>

            {/* Try Post Action */}
            <div className="px-5 mb-12">
              <div className="bg-white rounded-[24px] p-5 flex items-center justify-between border border-primary/10 shadow-sm shadow-primary/5">
                <div className="flex flex-col">
                  <h4 className="text-[17px] font-bold text-slate-900 mb-1">试试【发布求书】</h4>
                  <p className="text-[13px] text-slate-400">让全校同学帮你一起寻找</p>
                </div>
                <button 
                  onClick={() => onNavigate('PUBLISH_REQUEST')}
                  className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-[15px] shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                  去求书
                </button>
              </div>
            </div>

            {/* Recommendations */}
            <div className="px-5 pb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-5 bg-primary rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900">你可能感兴趣的其他书籍</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {MOCK_RECOMMENDATIONS.map(book => (
                  <div 
                    key={book.id} 
                    className="bg-white rounded-[24px] overflow-hidden flex flex-col shadow-sm border border-slate-50 active:scale-[0.98] transition-transform"
                    onClick={() => onSelectBook(book)}
                  >
                    <div className="relative aspect-square">
                      <img src={book.imageUrl} className="w-full h-full object-cover" alt="" />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-lg bg-black/30 backdrop-blur-md text-white text-[10px] font-bold">
                          {book.condition === Condition.LikeNew ? '9.5成新' : book.condition === Condition.New ? '全新' : '8成新'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <h4 className="text-[14px] font-bold text-slate-900 line-clamp-2 leading-snug mb-3 min-h-[40px]">{book.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-primary text-[17px] font-black">¥{book.price.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-300 font-medium">{book.publishTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex flex-col items-center gap-3 pb-8">
                 <div className="flex items-center gap-2">
                   <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
                   <span className="text-[13px] font-bold text-slate-300">正在加载更多精品书籍...</span>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-40">
            <span className="material-symbols-outlined text-7xl mb-6">book_5</span>
            <p className="text-lg font-bold">输入关键词开始探索吧</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
