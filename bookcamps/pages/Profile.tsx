
import React, { useState } from 'react';
import { User, ViewState } from '../types';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabase';

interface ProfileProps {
  user: User;
  onNavigate: (view: ViewState) => void;
  onStartVerification: () => void;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onNavigate, onStartVerification, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'RECORDS' | 'AUTH'>('RECORDS');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowSettingsMenu(false);
      onLogout?.();
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const transactions = [
    {
      id: 'BC-98231',
      title: '微积分：早期超越函数',
      price: 320.00,
      date: '10月24日',
      status: '已完成',
      statusColor: 'bg-primary/10 text-primary',
      image: 'https://picsum.photos/seed/calc/100/150'
    },
    {
      id: 'BC-98104',
      title: '宏观经济学 第10版',
      price: 215.00,
      date: '10月28日',
      status: '待确认',
      statusColor: 'bg-orange-50 text-orange-500',
      image: 'https://picsum.photos/seed/econ/100/150'
    },
    {
      id: 'BC-97552',
      title: '坎贝尔生物学',
      price: 380.00,
      date: '9月12日',
      status: '已完成',
      statusColor: 'bg-primary/10 text-primary',
      image: 'https://picsum.photos/seed/bio/100/150'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden font-display">
      <header className="sticky top-0 z-30 bg-background/90 px-4 pt-10 pb-4 flex items-center justify-between">
        <button 
          className="text-slate-800 relative"
          onClick={() => setShowSettingsMenu(true)}
        >
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>
        <h1 className="text-[17px] font-black">我的</h1>
        <button className="text-slate-800">
          <span className="material-symbols-outlined text-[24px]">share</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Profile Header Circle Section */}
        <div className="flex flex-col items-center mt-6 mb-8">
          <div className="relative size-48">
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
              <circle className="text-slate-100" cx="50" cy="50" fill="transparent" r="46" stroke="currentColor" strokeWidth="4"></circle>
              <circle className="text-primary" cx="50" cy="50" fill="transparent" r="46" stroke="currentColor" strokeDasharray="289" strokeDashoffset={289 * (1 - user.creditScore/100)} strokeLinecap="round" strokeWidth="4"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[42px] font-black text-primary leading-none">{user.creditScore}</span>
              <span className="text-[11px] font-bold text-slate-400 mt-1">校园信用</span>
            </div>
            {/* Avatar positioned on the circle edge as per screenshot */}
            <div className="absolute bottom-2 right-2 size-16 rounded-full border-4 border-white shadow-lg overflow-hidden z-10">
              <img src={user.avatar} className="size-full object-cover" alt="" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h2 className="text-[24px] font-black text-slate-900">{user.name}</h2>
            <p className="text-[14px] text-slate-400 font-bold mt-1">
              {user.department || '计算机学院'} · {user.schoolName || '清华大学'}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 rounded-full text-primary">
              <span className="material-symbols-outlined text-[16px] fill-1">verified_user</span>
              <span className="text-[12px] font-black">学生认证已通过</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 px-6 mb-10">
          {[
            { label: '我发布的', val: 12, view: 'MY_PUBLISHED' },
            { label: '已卖出', val: 8, view: 'SOLD' },
            { label: '正在买', val: 2, view: 'BUYING' }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white p-5 rounded-[24px] flex flex-col items-center shadow-sm border border-slate-50 cursor-pointer active:scale-95 transition-all"
              onClick={() => onNavigate(item.view as any)}
            >
              <span className="text-[22px] font-black text-slate-900 leading-none mb-2">{item.val}</span>
              <span className="text-[11px] text-slate-400 font-bold">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="px-2">
          <div className="flex border-b border-slate-100 mb-6">
            {['个人信息', '交易记录', '认证信息'].map((tab, idx) => {
              const tabId = idx === 0 ? 'INFO' : idx === 1 ? 'RECORDS' : 'AUTH';
              const isActive = activeTab === tabId;
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tabId as any)}
                  className={`flex-1 py-4 text-[15px] font-black transition-all relative ${isActive ? 'text-primary' : 'text-slate-400'}`}
                >
                  {tab}
                  {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full" />}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="px-4">
            {activeTab === 'RECORDS' && (
               <div className="space-y-4">
                 {transactions.map(item => (
                   <div key={item.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-50 flex gap-4">
                     <div className="size-20 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                       <img src={item.image} className="size-full object-cover" alt="" />
                     </div>
                     <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                       <div className="flex justify-between items-start gap-2">
                         <h4 className="text-[15px] font-black text-slate-800 truncate">{item.title}</h4>
                         <span className="text-[16px] font-black text-primary shrink-0">¥{item.price.toFixed(2)}</span>
                       </div>
                       <p className="text-[11px] text-slate-400 font-bold mb-3 uppercase tracking-wider">
                         订单号 #{item.id} • {item.date}
                       </p>
                       <div className="flex justify-between items-center">
                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${item.statusColor}`}>
                           {item.status}
                         </span>
                         <button 
                           onClick={() => onNavigate('ORDER_DETAIL')}
                           className="flex items-center gap-1 text-[12px] font-black text-primary hover:opacity-70"
                         >
                           详情 <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}

            {activeTab === 'INFO' && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[13px] text-slate-400 font-bold">所属院系</span>
                      <span className="text-[14px] font-black text-slate-800">{user.department}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[13px] text-slate-400 font-bold">常驻校区</span>
                      <span className="text-[14px] font-black text-slate-800">{user.campus}</span>
                   </div>
                </div>
              </div>
            )}
            
            {activeTab === 'AUTH' && (
              <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-50 flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-[56px] fill-1 mb-4">verified_user</span>
                <p className="text-[16px] font-black text-slate-900 mb-1">学生证已认证</p>
                <p className="text-[12px] text-slate-400 font-bold">有效期至：2025-06-30</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav activeView="PROFILE" onNavigate={onNavigate} />

      {/* 设置菜单弹窗 */}
      {showSettingsMenu && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowSettingsMenu(false)}
          ></div>
          <div className="relative bg-white w-full sm:w-[340px] sm:rounded-[24px] rounded-t-[24px] overflow-hidden shadow-2xl animate-slide-up">
            {/* 菜单项 */}
            <div className="py-2">
              <button 
                className="w-full px-6 py-4 flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setShowSettingsMenu(false);
                  // 可以在这里添加账号设置功能
                }}
              >
                <span className="material-symbols-outlined text-slate-400">person</span>
                <span className="text-[15px] font-medium">账号设置</span>
              </button>
              <button 
                className="w-full px-6 py-4 flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setShowSettingsMenu(false);
                  // 可以在这里添加通知设置功能
                }}
              >
                <span className="material-symbols-outlined text-slate-400">notifications</span>
                <span className="text-[15px] font-medium">通知设置</span>
              </button>
              <button 
                className="w-full px-6 py-4 flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => {
                  setShowSettingsMenu(false);
                  // 可以在这里添加隐私设置功能
                }}
              >
                <span className="material-symbols-outlined text-slate-400">privacy_tip</span>
                <span className="text-[15px] font-medium">隐私设置</span>
              </button>
              <div className="h-px bg-slate-100 mx-4 my-2"></div>
              <button 
                className="w-full px-6 py-4 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-[15px] font-medium">退出登录</span>
              </button>
            </div>
            {/* 取消按钮 */}
            <div className="h-px bg-slate-100"></div>
            <button 
              className="w-full py-4 text-[15px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={() => setShowSettingsMenu(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
