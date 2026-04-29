
import React, { useState, useEffect } from 'react';
import { ViewState, Book, Condition } from '../types';
import { getBooks } from '../services/bookService';
import { supabase } from '../supabase';

interface MyBookItem {
  id: string;
  title: string;
  price: number;
  views: number;
  likes: number;
  image: string;
}

const ITEMS = [
  {
    id: '1',
    title: '高等数学（第十版）上下册精装版',
    price: 45.00,
    views: 128,
    likes: 12,
    image: 'https://picsum.photos/seed/math10/200/300'
  },
  {
    id: '2',
    title: '自私的基因（40周年增订版）',
    price: 28.00,
    views: 86,
    likes: 5,
    image: 'https://picsum.photos/seed/gene/200/300'
  },
  {
    id: '3',
    title: '现代心理学导论：全彩图解版',
    price: 32.00,
    views: 42,
    likes: 2,
    image: 'https://picsum.photos/seed/psyintro/200/300'
  }
];

interface MyPublishedProps {
  onNavigate: (view: ViewState) => void;
}

const MyPublished: React.FC<MyPublishedProps> = ({ onNavigate }) => {
  const [myBooks, setMyBooks] = useState<MyBookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载用户真实发布的书籍
  useEffect(() => {
    const loadMyBooks = async () => {
      setIsLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('当前用户ID:', user.id);
          // 获取当前用户发布的所有书籍（包括已卖出和未卖出）
          const realBooks = await getBooks({ sellerId: user.id });
          console.log('查询到的书籍:', realBooks);
          
          // 转换为页面需要的格式
          const convertedBooks: MyBookItem[] = realBooks.map((book: any) => ({
            id: book.id,
            title: book.title,
            price: book.price,
            views: Math.floor(Math.random() * 100) + 10, // 暂时随机，后续可加字段
            likes: Math.floor(Math.random() * 20),
            image: book.images?.[0] || 'https://picsum.photos/seed/book/200/300'
          }));
          
          // 模拟数据在上，真实数据在下
          setMyBooks([...ITEMS, ...convertedBooks]);
        } else {
          // 未登录时只显示模拟数据
          setMyBooks(ITEMS);
        }
      } catch (error) {
        console.error('加载我的发布失败:', error);
        setMyBooks(ITEMS);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMyBooks();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FBFA] h-full overflow-hidden font-display">
      <header className="sticky top-0 z-40 bg-white px-4 h-16 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => onNavigate('PROFILE')} className="text-slate-800">
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
        </button>
        <h1 className="text-lg font-black text-slate-900">我发布的</h1>
        <button className="text-slate-400">
          <span className="material-symbols-outlined text-[24px]">more_horiz</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-40 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : myBooks.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-4 opacity-40">
            <span className="material-symbols-outlined text-4xl">menu_book</span>
            <p className="text-[13px] font-bold">还没有发布任何书籍</p>
          </div>
        ) : (
        myBooks.map(item => (
          <div key={item.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-50">
            <div className="p-4 flex gap-4">
              <div className="w-[100px] h-[130px] rounded-xl bg-slate-100 overflow-hidden shrink-0">
                <img src={item.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <h3 className="text-[16px] font-black text-slate-800 leading-snug line-clamp-2">{item.title}</h3>
                <p className="text-[20px] font-black text-primary">¥{item.price.toFixed(2)}</p>
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span className="text-[12px] font-bold">{item.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] fill-1">favorite</span>
                    <span className="text-[12px] font-bold">{item.likes}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-slate-50">
              <button className="py-4 flex items-center justify-center gap-2 text-[14px] font-bold text-primary active:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
                擦亮
              </button>
              <button className="py-4 flex items-center justify-center gap-2 text-[14px] font-bold text-slate-600 border-x border-slate-50 active:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[20px]">edit</span>
                编辑
              </button>
              <button className="py-4 flex items-center justify-center gap-2 text-[14px] font-bold text-slate-500 active:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                下架
              </button>
            </div>
          </div>
        ))
        )}

        <div className="text-center py-6">
          <p className="text-[13px] text-slate-300 font-bold">没有更多发布了</p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-5 pb-8 flex items-center gap-4 bg-[#F8FBFA]/80 ios-blur">
        <button 
          className="flex-1 h-14 bg-primary text-white rounded-[20px] font-black text-[17px] shadow-xl shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          onClick={() => onNavigate('PUBLISH')}
        >
          <span className="material-symbols-outlined text-[24px]">add_circle</span>
          发布新书籍
        </button>
        <button className="size-14 bg-white rounded-full shadow-lg border border-slate-50 flex items-center justify-center text-slate-600 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[28px]">help_outline</span>
        </button>
      </footer>
    </div>
  );
};

export default MyPublished;
