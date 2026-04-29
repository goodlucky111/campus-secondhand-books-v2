
import React, { useState } from 'react';
import { ViewState } from '../types';

interface PublishRequestProps {
  onNavigate: (view: ViewState) => void;
}

const PublishRequest: React.FC<PublishRequestProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [campus, setCampus] = useState('清华大学 - 紫荆校区');
  const [description, setDescription] = useState('');
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(true);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FBFA] h-full overflow-hidden font-display">
      <header className="sticky top-0 z-50 bg-white px-4 h-16 flex items-center border-b border-slate-50">
        <button onClick={() => onNavigate('HOME')} className="p-1 -ml-1 text-slate-800">
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
        </button>
        <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2 text-slate-900">发布求书需求</h1>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-5 pb-40 space-y-8">
        {/* Core Info */}
        <section>
          <h3 className="text-[15px] font-black text-primary mb-4 flex items-center gap-2">核心信息</h3>
          <div className="bg-white rounded-[24px] overflow-hidden border border-slate-50 shadow-sm">
            <div className="p-5 border-b border-slate-50">
              <label className="text-[14px] font-bold text-slate-800 mb-2 flex items-center">
                想求的书名 <span className="text-red-500 ml-1 font-black">*</span>
              </label>
              <input 
                className="w-full h-10 bg-transparent border-none p-0 text-[15px] focus:ring-0 placeholder:text-slate-300"
                placeholder="请输入完整书名"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="p-5 border-b border-slate-50">
              <label className="text-[14px] font-bold text-slate-800 mb-2">作者/译者</label>
              <input 
                className="w-full h-10 bg-transparent border-none p-0 text-[15px] focus:ring-0 placeholder:text-slate-300"
                placeholder="多位作者请用逗号隔开"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="p-5 relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[14px] font-bold text-slate-800">ISBN (可选)</label>
                <button className="px-2 py-1 border border-slate-200 rounded text-[10px] font-bold text-slate-400">扫码</button>
              </div>
              <input 
                className="w-full h-10 bg-transparent border-none p-0 text-[15px] focus:ring-0 placeholder:text-slate-300"
                placeholder="13位ISBN条形码"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Expected Details */}
        <section>
          <h3 className="text-[15px] font-black text-primary mb-4 flex items-center gap-2">期望详情</h3>
          <div className="bg-white rounded-[24px] overflow-hidden border border-slate-50 shadow-sm">
            <div className="p-5 border-b border-slate-50">
              <label className="text-[14px] font-bold text-slate-800 mb-2">意向价格范围</label>
              <input 
                className="w-full h-10 bg-transparent border-none p-0 text-[15px] focus:ring-0 placeholder:text-slate-300"
                placeholder="如：10-20元"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              />
            </div>
            <div className="p-5 flex items-center justify-between cursor-pointer">
              <div className="flex flex-col">
                <label className="text-[14px] font-bold text-slate-800 mb-1">联系校区</label>
                <p className="text-[15px] text-slate-600 font-medium">{campus}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">unfold_more</span>
            </div>
          </div>
        </section>

        {/* Description */}
        <section>
          <h3 className="text-[15px] font-black text-primary mb-4 flex items-center gap-2">求书详情描述</h3>
          <div className="bg-white rounded-[24px] p-5 border border-slate-50 shadow-sm min-h-[140px]">
             <textarea 
               className="w-full bg-transparent border-none p-0 text-[15px] focus:ring-0 placeholder:text-slate-300 resize-none min-h-[100px]"
               placeholder="请描述你对书籍的要求（如：版本、成色、是否需要笔记等）..."
               value={description}
               onChange={(e) => setDescription(e.target.value)}
             />
          </div>
        </section>

        {/* Options */}
        <section className="space-y-6">
           <div className="flex gap-4">
              <div className="size-20 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center text-primary cursor-pointer active:scale-95 transition-all">
                <span className="material-symbols-outlined text-3xl font-bold">add_a_photo</span>
              </div>
              <div className="relative size-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden group">
                 <img src="https://picsum.photos/seed/samplebook/200/200" className="w-full h-full object-cover opacity-50" alt="" />
                 <button className="absolute top-1 right-1 size-5 bg-black/40 rounded-full flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                 </button>
              </div>
           </div>

           <div className="flex items-start gap-3">
              <button 
                onClick={() => setIsVerifiedOnly(!isVerifiedOnly)}
                className={`size-6 rounded-lg flex items-center justify-center transition-colors border-2 ${isVerifiedOnly ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200'}`}
              >
                {isVerifiedOnly && <span className="material-symbols-outlined text-sm font-black">check</span>}
              </button>
              <div className="flex flex-col">
                <p className="text-[15px] font-bold text-slate-800">仅认证学生可联系我</p>
                <p className="text-[11px] text-slate-400 mt-1">开启后将过滤非校友身份的联系请求</p>
              </div>
           </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 ios-blur border-t border-slate-100 p-5 pb-8 flex flex-col items-center gap-4 z-50">
        <button 
          className="w-full h-14 bg-primary text-white rounded-[20px] font-bold text-[17px] shadow-xl shadow-primary/20 active:scale-95 transition-all"
          onClick={() => onNavigate('HOME')}
        >
          发布需求
        </button>
        <p className="text-[11px] text-slate-400">点击发布即代表您同意《BookCampus用户协议》</p>
      </footer>
    </div>
  );
};

export default PublishRequest;
