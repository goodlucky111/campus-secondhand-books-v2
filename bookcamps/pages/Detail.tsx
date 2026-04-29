
import React, { useState, useEffect } from 'react';
import { Book, ViewState } from '../types';
import { supabase } from '../supabase';

interface DetailProps {
  book: Book | null;
  onNavigate: (view: ViewState) => void;
  onChat: () => void;
}

interface SellerInfo {
  name: string;
  avatar: string;
  creditScore: number;
  soldCount: number;
}

const Detail: React.FC<DetailProps> = ({ book, onNavigate, onChat }) => {
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [loadingSeller, setLoadingSeller] = useState(false);

  // 加载卖家信息
  useEffect(() => {
    const loadSeller = async () => {
      if (!book?.sellerId) return;
      
      setLoadingSeller(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar, credit_score')
          .eq('id', book.sellerId)
          .single();

        // 获取该卖家已售出的书籍数量
        const { count } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', book.sellerId)
          .eq('status', 'sold');

        setSeller({
          name: profile?.nickname || '未知用户',
          avatar: profile?.avatar || `https://picsum.photos/seed/${book.sellerId.slice(0, 8)}/100/100`,
          creditScore: profile?.credit_score || 80,
          soldCount: count || 0
        });
      } catch (error) {
        console.error('加载卖家信息失败:', error);
        setSeller({
          name: '未知用户',
          avatar: `https://picsum.photos/seed/${book.sellerId.slice(0, 8)}/100/100`,
          creditScore: 80,
          soldCount: 0
        });
      } finally {
        setLoadingSeller(false);
      }
    };

    loadSeller();
  }, [book?.sellerId]);

  if (!book) return null;

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <header className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between p-4 pointer-events-none">
        <button 
          onClick={() => onNavigate('HOME')}
          className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-800 shadow-sm active:scale-90"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <button className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-800 shadow-sm active:scale-90">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="relative w-full aspect-[4/5] bg-slate-200">
          <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            <div className="h-1.5 w-6 rounded-full bg-primary"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white/60"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white/60"></div>
          </div>
        </div>

        <div className="px-5 pt-6 bg-white rounded-t-[40px] -mt-8 relative z-10 shadow-ios-lg">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-primary font-display">¥{book.price.toFixed(2)}</span>
            <span className="text-sm font-medium text-slate-400 line-through">原价 ¥{book.originalPrice.toFixed(2)}</span>
            <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-lg">
              {Math.round((book.price / book.originalPrice) * 10)}折
            </span>
          </div>
          
          <h1 className="text-xl font-bold leading-tight mb-3 text-slate-900">{book.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              {book.condition}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              ISBN: 978-0134088976
            </span>
          </div>

          <div className="h-px bg-slate-100 w-full mb-6"></div>

          <div className="mb-8">
            <h3 className="text-lg font-bold mb-2">书籍描述</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {book.description || '暂无描述'}
            </p>
          </div>

          <h3 className="text-lg font-bold mb-3">卖家信息</h3>
          <div 
            className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 mb-6 cursor-pointer"
            onClick={() => onNavigate('PROFILE')}
          >
            <div className="size-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
              <img src={seller?.avatar || 'https://picsum.photos/seed/default/100/100'} alt="Seller" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base">{seller?.name || '加载中...'}</span>
                <span className="material-symbols-outlined text-primary text-sm fill-1">verified</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-lg">
                  <span className="text-[10px] font-bold text-primary tracking-wider">信用分：{seller?.creditScore || 80}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">• 已售 {seller?.soldCount || 0} 本</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300">chevron_right</span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-400">location_on</span>
              <div>
                <p className="font-semibold text-sm">{book.school}{book.location}</p>
                <p className="text-xs text-slate-500">周一至周五支持面交</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-400">local_shipping</span>
              <div>
                <p className="font-semibold text-sm">校园内送货 (¥5)</p>
                <p className="text-xs text-slate-500">下单后 1-2 个工作日内送达</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/90 ios-blur border-t border-slate-100 px-5 pt-3 pb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onChat}
            className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-primary/20 bg-white text-primary font-bold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            聊一聊
          </button>
          <button className="flex-[1.5] h-14 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
            立即购买
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Detail;
