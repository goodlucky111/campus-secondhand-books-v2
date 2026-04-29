
import React from 'react';
import { ViewState } from '../types';

const SOLD_ITEMS = [
  {
    id: 's1',
    title: '高等数学（第七版）上册',
    price: 25.00,
    date: '2023-10-20',
    status: '买家已收货',
    image: 'https://picsum.photos/seed/math7/200/300',
    hasRated: true
  },
  {
    id: 's2',
    title: '解忧杂货店',
    price: 18.50,
    date: '2023-10-15',
    status: '买家已收货',
    image: 'https://picsum.photos/seed/namiya/200/300',
    hasRated: false
  },
  {
    id: 's3',
    title: '算法导论（原书第3版）',
    price: 45.00,
    date: '2023-10-02',
    status: '买家已收货',
    image: 'https://picsum.photos/seed/clrs/200/300',
    hasRated: true
  }
];

interface SoldProps {
  onNavigate: (view: ViewState) => void;
}

const Sold: React.FC<SoldProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F8F7] h-full overflow-hidden font-display">
      <header className="sticky top-0 z-40 bg-white px-4 h-16 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => onNavigate('PROFILE')} className="text-primary flex items-center">
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
          <span className="text-[15px] font-bold">返回</span>
        </button>
        <h1 className="text-lg font-black text-slate-900">已卖出</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {SOLD_ITEMS.map(item => (
          <div key={item.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-50">
            <div className="p-4 flex gap-4">
              <div className="w-[80px] h-[100px] rounded-xl bg-slate-100 overflow-hidden shrink-0 shadow-inner">
                <img src={item.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <h3 className="text-[16px] font-black text-slate-800 truncate mb-1">{item.title}</h3>
                <div className="space-y-0.5 mb-3">
                  <p className="text-[13px] text-slate-400 font-bold">成交价：<span className="text-slate-800">¥{item.price.toFixed(2)}</span></p>
                  <p className="text-[13px] text-slate-400 font-bold">成交日期：<span className="text-slate-800">{item.date}</span></p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-slate-50 rounded-full text-[11px] font-bold text-slate-400">{item.status}</span>
                  {item.hasRated ? (
                    <button className="px-5 py-1.5 border border-primary/20 text-primary text-[12px] font-bold rounded-full bg-primary/5 active:scale-95 transition-all">查看评价</button>
                  ) : (
                    <button className="px-5 py-1.5 bg-primary text-white text-[12px] font-bold rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all">回评买家</button>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-[#F5F8F7]/50 px-4 py-3 border-t border-slate-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] fill-1">verified_user</span>
              <p className="text-[11px] font-bold text-slate-500 flex-1">本次交易获得校园信用分 <span className="text-primary">+2</span></p>
            </div>
          </div>
        ))}

        <div className="text-center py-12 opacity-30">
          <p className="text-[12px] font-bold uppercase tracking-widest">仅展示近一年的成交记录</p>
        </div>
      </main>
    </div>
  );
};

export default Sold;
