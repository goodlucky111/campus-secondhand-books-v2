
import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate }) => {
  const tabs: { id: ViewState; icon: string; label: string }[] = [
    { id: 'HOME', icon: 'home', label: '首页' },
    { id: 'SEARCH', icon: 'search', label: '搜索' },
    { id: 'PUBLISH', icon: 'add', label: '卖书' },
    { id: 'MESSAGES', icon: 'chat_bubble', label: '消息' },
    { id: 'PROFILE', icon: 'person', label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-100 flex items-center justify-between pb-8 pt-2 px-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
      {tabs.map((tab) => {
        if (tab.id === 'PUBLISH') {
          return (
            <button 
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center -mt-8 relative z-10"
            >
              <div className="size-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white transition-transform active:scale-90">
                <span className="material-symbols-outlined text-3xl font-bold">add</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1">{tab.label}</span>
            </button>
          );
        }
        
        const isActive = activeView === tab.id;
        
        return (
          <button 
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center flex-1 gap-1 transition-all ${isActive ? 'text-primary' : 'text-slate-300 hover:text-slate-400'}`}
          >
            <span className={`material-symbols-outlined text-[26px] ${isActive ? 'fill-1 font-bold' : ''}`}>
              {tab.icon}
            </span>
            <span className={`text-[10px] ${isActive ? 'font-black' : 'font-bold'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
