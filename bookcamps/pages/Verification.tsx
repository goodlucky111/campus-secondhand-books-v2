
import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';

interface VerificationProps {
  onNavigate: (view: ViewState) => void;
  onComplete: () => void;
}

const Verification: React.FC<VerificationProps> = ({ onNavigate, onComplete }) => {
  const [step, setStep] = useState<'FORM' | 'PENDING' | 'SUCCESS'>('FORM');
  const [school, setSchool] = useState('');
  const [id, setId] = useState('');

  const handleSubmit = () => {
    if (school && id) {
      setStep('PENDING');
    }
  };

  useEffect(() => {
    if (step === 'PENDING') {
      const timer = setTimeout(() => {
        setStep('SUCCESS');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (step === 'SUCCESS') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-background">
        <div className="relative w-full flex flex-col items-center mb-12">
          <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20 mb-8 animate-bounce">
            <span className="material-icons text-white text-7xl">check</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">认证成功！</h1>
          <p className="text-slate-500">身份验证已通过，开启你的校园悦读之旅</p>
        </div>
        
        <div className="w-full max-w-sm bg-primary/5 border border-primary/10 rounded-2xl p-8 mb-12 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">发布书籍</h3>
              <p className="text-xs text-slate-500">无限次上架二手书籍</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">在线议价</h3>
              <p className="text-xs text-slate-500">直接与买家实时沟通价格</p>
            </div>
          </div>
        </div>

        <button 
          className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20"
          onClick={onComplete}
        >
          立即开始交易
        </button>
      </div>
    );
  }

  if (step === 'PENDING') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-background text-center">
        <div className="relative mb-10">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="material-symbols-outlined text-primary text-6xl">schedule</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">认证资料审核中</h1>
        <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
          预计在 <span className="text-primary font-semibold">1-2 个工作日</span> 内完成审核，审核结果将通过系统消息通知您。
        </p>
        <button 
          className="mt-12 w-full py-4 text-primary font-bold border-2 border-primary/20 rounded-2xl"
          onClick={() => onNavigate('PROFILE')}
        >
          返回个人中心
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      <header className="sticky top-0 z-50 bg-background/80 ios-blur px-4 h-14 flex items-center">
        <button onClick={() => onNavigate('PROFILE')} className="p-1 -ml-2 text-primary">
          <span className="material-icons text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">学生认证</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar space-y-6">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <div className="bg-primary rounded-full p-1.5 flex items-center justify-center">
            <span className="material-icons text-white text-sm">verified_user</span>
          </div>
          <div>
            <p className="text-sm font-bold text-primary">认证学生身份</p>
            <p className="text-xs text-primary/80 mt-1 leading-relaxed">
              解锁买卖权限，提升交易信誉，共建纯净校园交易社区。
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">基本信息</label>
          <div className="space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 text-lg">school</span>
              <select 
                className="w-full bg-white border border-primary/20 rounded-xl pl-10 pr-4 py-4 appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all shadow-sm"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              >
                <option value="">选择学校名称</option>
                <option value="pku">北京大学</option>
                <option value="tsinghua">清华大学</option>
                <option value="fudan">复旦大学</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary/40">expand_more</span>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 text-lg">badge</span>
              <input 
                className="w-full bg-white border border-primary/20 rounded-xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all shadow-sm" 
                placeholder="学号 (Student ID)" 
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">身份凭证上传</label>
          <div className="space-y-4">
            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl bg-white p-8 group active:scale-[0.98] transition-all cursor-pointer">
              <div className="mb-3 w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl font-bold">add</span>
              </div>
              <p className="text-sm font-bold">上传学生证正面</p>
              <p className="text-[10px] text-slate-400 mt-1">请确保姓名、学号、照片清晰可见</p>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-background/90 ios-blur border-t border-slate-100">
        <button 
          onClick={handleSubmit}
          disabled={!school || !id}
          className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            school && id ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-200 text-slate-400'
          }`}
        >
          提交审核
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>
    </div>
  );
};

export default Verification;
