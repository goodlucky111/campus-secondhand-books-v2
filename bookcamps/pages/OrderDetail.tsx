
import React from 'react';
import { ViewState } from '../types';

interface OrderDetailProps {
  onNavigate: (view: ViewState) => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F8F7] h-full overflow-hidden font-display relative">
      <header className="sticky top-0 z-50 bg-[#F5F8F7] px-4 h-16 flex items-center">
        <button onClick={() => onNavigate('PROFILE')} className="text-slate-800">
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
        </button>
        <h1 className="text-[18px] font-black text-slate-800 absolute left-1/2 -translate-x-1/2">订单详情</h1>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32">
        {/* Status Section */}
        <div className="flex flex-col items-center py-10">
          <div className="size-16 bg-[#E8F6F1] rounded-full flex items-center justify-center text-primary mb-5 shadow-inner">
            <span className="material-symbols-outlined text-[32px] fill-1">handshake</span>
          </div>
          <h2 className="text-[22px] font-black text-slate-900 mb-2">待见面交易</h2>
          <p className="text-[13px] text-slate-400 font-bold tracking-wide">请按约定时间地点前往交易</p>
        </div>

        {/* Transaction Progress Card */}
        <div className="bg-white rounded-[32px] p-6 mb-5 shadow-sm border border-slate-50">
          <div className="flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-primary text-[20px] fill-1">trending_up</span>
            <h3 className="text-[15px] font-black text-slate-800">交易进度</h3>
          </div>

          <div className="space-y-0">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-primary/10">
                  <span className="material-symbols-outlined text-[14px] font-black">check</span>
                </div>
                <div className="w-0.5 h-12 bg-primary"></div>
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[14px] font-black text-slate-900">订单已创建</span>
                  <span className="text-[11px] font-bold text-slate-300">10-20 10:00</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-primary/10">
                  <span className="material-symbols-outlined text-[14px] font-black">check</span>
                </div>
                <div className="w-0.5 h-12 bg-primary"></div>
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[14px] font-black text-slate-900">双方达成交易意向</span>
                  <span className="text-[11px] font-bold text-slate-300">10-20 14:30</span>
                </div>
              </div>
            </div>

            {/* Step 3 - Current Active Step */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-primary/10">
                  <span className="material-symbols-outlined text-[14px] font-black">check</span>
                </div>
                <div className="w-0.5 h-20 bg-primary"></div>
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[14px] font-black text-slate-900">面交信息已确认</span>
                  <span className="text-[11px] font-bold text-slate-300">10-25 17:30</span>
                </div>
                <div className="bg-[#F5F8F7] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                    <p className="text-[13px] font-bold text-slate-800">时间：<span className="ml-1">10-25 17:30</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                    <p className="text-[13px] font-bold text-slate-800">地点：<span className="ml-1">图书馆南门</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 - Upcoming */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 border-2 border-slate-50">
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-[14px] font-black text-slate-300">等待双方见面</span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-lg">进行中</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book Info Card */}
        <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-50">
          <h3 className="text-[13px] font-bold text-slate-300 mb-5 uppercase tracking-widest">书籍信息</h3>
          <div className="flex gap-4">
            <div className="size-24 rounded-2xl bg-slate-50 overflow-hidden shadow-inner border border-slate-100 shrink-0">
               <img src="https://picsum.photos/seed/calc/200/300" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0">
               <h4 className="text-[15px] font-black text-slate-800 leading-snug mb-2">计算机网络：自顶向下方法 ( 原书第7版 )</h4>
               <p className="text-[12px] text-slate-400 font-bold mb-3">卖家：张学长</p>
               <div className="flex justify-between items-baseline">
                  <span className="text-[12px] text-slate-400 font-bold">实付金额</span>
                  <span className="text-[20px] font-black text-slate-900">¥ 35.00</span>
               </div>
            </div>
          </div>
        </div>

        {/* Order Footer Info */}
        <div className="mt-8 space-y-2 text-center">
          <p className="text-[11px] font-bold text-slate-300">订单编号：BC202310200001</p>
          <p className="text-[11px] font-bold text-slate-300">交易协议：校园面交安全保障协议已生效</p>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-100 px-5 pt-4 pb-10 z-50">
        <div className="flex items-center gap-3">
          <button className="flex-1 h-14 rounded-[20px] border-2 border-slate-100 text-slate-800 font-black text-[15px] flex items-center justify-center gap-2 active:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            联系对方
          </button>
          <button className="px-6 h-14 text-slate-400 font-bold text-[14px]">
            取消订单
          </button>
          <button className="flex-1 h-14 rounded-[20px] bg-primary text-white font-black text-[16px] shadow-xl shadow-primary/20 active:scale-95 transition-all">
            确认收货
          </button>
        </div>
        
        {/* Verification Shield footer as seen in image */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
           <span className="material-symbols-outlined text-primary text-[18px] fill-1">verified_user</span>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">受 BOOKCAMPUS 信任保障体系保护</span>
        </div>
      </footer>
    </div>
  );
};

export default OrderDetail;
