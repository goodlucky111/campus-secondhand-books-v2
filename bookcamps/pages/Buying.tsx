
import React, { useState } from 'react';
import { ViewState } from '../types';
import BottomNav from '../components/BottomNav';

interface Order {
  id: string;
  sellerName: string;
  sellerAvatar: string;
  status: string;
  statusColor: string;
  bookTitle: string;
  bookCondition: string;
  price: number;
  bookImage: string;
  meetupTime?: string;
  meetupLocation?: string;
}

const ORDERS: Order[] = [
  {
    id: 'b1',
    sellerName: '张学长 (Senior Zhang)',
    sellerAvatar: 'https://picsum.photos/seed/szhang/100/100',
    status: '待见面',
    statusColor: 'text-primary',
    bookTitle: '计算机网络：自顶向下方法（原书第7版）',
    bookCondition: '9成新 · 有笔记',
    price: 35.00,
    bookImage: 'https://picsum.photos/seed/comnet/200/300',
    meetupTime: '10月25日 17:30',
    meetupLocation: '图书馆南门 (Library South Gate)'
  },
  {
    id: 'b2',
    sellerName: '李同学 (Student Li)',
    sellerAvatar: 'https://picsum.photos/seed/sli/100/100',
    status: '待评价',
    statusColor: 'text-slate-400',
    bookTitle: '红楼梦（校注本上下册）',
    bookCondition: '全新 · 塑封未拆',
    price: 48.50,
    bookImage: 'https://picsum.photos/seed/redman/200/300'
  }
];

interface BuyingProps {
  onNavigate: (view: ViewState) => void;
}

const Buying: React.FC<BuyingProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('全部');

  return (
    <div className="flex-1 flex flex-col bg-[#F5F8F7] h-full overflow-hidden font-display">
      <header className="sticky top-0 z-40 bg-white">
        <div className="px-4 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate('PROFILE')} className="text-slate-800">
            <span className="material-symbols-outlined text-[28px]">chevron_left</span>
          </button>
          <h1 className="text-lg font-black text-slate-900">正在买</h1>
          <div className="w-10"></div>
        </div>
        <div className="flex border-b border-slate-50">
          {['全部', '待见面', '待评价'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[15px] font-black transition-all ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 pb-32">
        {ORDERS.map(order => (
          <div key={order.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src={order.sellerAvatar} className="size-8 rounded-full border border-slate-100" alt="" />
                <span className="text-[14px] font-black text-slate-800">{order.sellerName}</span>
              </div>
              <span className={`text-[13px] font-bold ${order.statusColor}`}>{order.status}</span>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="size-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 shadow-inner">
                <img src={order.bookImage} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <h3 className="text-[15px] font-black text-slate-800 line-clamp-2 leading-snug mb-1">{order.bookTitle}</h3>
                <p className="text-[11px] text-slate-400 font-bold mb-2">成色：{order.bookCondition}</p>
                <p className="text-[19px] font-black text-slate-900">¥ {order.price.toFixed(2)}</p>
              </div>
            </div>

            {order.meetupTime && (
              <div className="bg-[#F5F8F7] rounded-2xl p-4 space-y-2 mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                  <p className="text-[13px] font-bold text-slate-800">面交时间：<span className="ml-1">{order.meetupTime}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                  <p className="text-[13px] font-bold text-slate-800 truncate">面交地点：<span className="ml-1">{order.meetupLocation}</span></p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {order.status === '待见面' ? (
                <>
                  <button className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 text-[13px] font-bold active:scale-95 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    联系卖家
                  </button>
                  <button className="px-6 py-2.5 rounded-full bg-primary text-white text-[13px] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">确认收货</button>
                </>
              ) : (
                <>
                  <button className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 text-[13px] font-bold active:scale-95 transition-all">再买一本</button>
                  <button className="px-6 py-2.5 rounded-full bg-primary text-white text-[13px] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">去评价</button>
                </>
              )}
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-30">
           <div className="size-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-[40px]">menu_book</span>
           </div>
           <p className="text-[13px] font-bold">没有更多订单了</p>
        </div>
      </main>

      <BottomNav activeView="BUYING" onNavigate={onNavigate} />
    </div>
  );
};

export default Buying;
