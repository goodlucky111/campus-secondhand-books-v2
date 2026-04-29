
import React, { useState, useRef } from 'react';
import { ViewState, User } from '../types';
import { autoFillBookInfo, validateISBN, createBook, uploadBookImage } from '../services/bookService';
import { supabase } from '../supabase';

interface PublishProps {
  onNavigate: (view: ViewState) => void;
  user: User | null;
}

const Publish: React.FC<PublishProps> = ({ onNavigate, user }) => {
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('九成新');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [publishError, setPublishError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理ISBN扫描
  const handleScan = async () => {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    if (!cleanISBN) {
      setScanError('请先输入 ISBN');
      return;
    }
    
    if (!validateISBN(cleanISBN)) {
      setScanError('ISBN 格式无效');
      return;
    }
    
    setIsScanning(true);
    setScanError('');
    
    const info = await autoFillBookInfo(cleanISBN);
    
    if (info) {
      setTitle(info.title);
      setAuthor(info.author || '');
      if (info.originalPrice) {
        setPrice(Math.round(info.originalPrice * 0.4 * 100) / 100);
      }
    } else {
      setScanError('未找到该书籍信息，请手动填写');
    }
    
    setIsScanning(false);
  };

  // 处理图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < Math.min(files.length, 6 - images.length); i++) {
        const file = files[i];
        const url = await uploadBookImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls]);
      } else if (files.length > 0) {
        // 如果上传失败，使用本地预览（临时方案）
        for (let i = 0; i < Math.min(files.length, 6 - images.length); i++) {
          const file = files[i];
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        }
        setImages([...images, ...uploadedUrls]);
        setUploadError('图片上传服务暂时不可用，已使用本地预览');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      setUploadError('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 发布书籍
  const handlePublish = async () => {
    if (!user) {
      setPublishError('请先登录');
      return;
    }
    
    if (!title) {
      setPublishError('请填写书名');
      return;
    }
    
    if (!price) {
      setPublishError('请填写售价');
      return;
    }
    
    setIsPublishing(true);
    setPublishError('');
    
    const result = await createBook({
      sellerId: user.id,
      title,
      author: author || undefined,
      isbn: isbn || undefined,
      price: parseFloat(price),
      condition,
      description: description || undefined,
      images: images.length > 0 ? images : undefined
    });
    
    console.log('发布结果:', result);
    if (result.success) {
      setShowSuccessModal(true);
      // 2秒后自动跳转
      setTimeout(() => {
        setShowSuccessModal(false);
        onNavigate('HOME');
      }, 2000);
    } else {
      setPublishError(result.error || '发布失败');
    }
    
    setIsPublishing(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      <header className="sticky top-0 z-10 flex items-center bg-white/80 ios-blur p-4 border-b border-slate-50 justify-between">
        <button onClick={() => onNavigate('HOME')} className="text-slate-800 flex size-10 items-center justify-center">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-lg font-bold">发布教材</h2>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar p-5 space-y-6">
        {/* 图片上传 */}
        <div>
          <h3 className="text-base font-bold mb-4">书籍照片</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {/* 添加图片按钮 */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="min-w-[120px] h-[160px] rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              {isUploading ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-primary text-3xl font-bold">add_a_photo</span>
                  <p className="text-[10px] font-bold text-primary uppercase">添加照片</p>
                </>
              )}
            </div>
            
            {/* 已上传的图片 */}
            {images.map((url, index) => (
              <div key={index} className="min-w-[120px] h-[160px] rounded-2xl bg-slate-100 relative overflow-hidden group">
                <img src={url} alt={`书籍图片${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-white text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">建议上传封面、背面、目录页，最多6张。</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          {/* ISBN扫描 */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ISBN 扫描</label>
            <div className="flex gap-2">
              <input 
                className="flex-1 h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                placeholder="输入或扫描 ISBN" 
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              />
              <button 
                onClick={handleScan}
                disabled={isScanning}
                className="bg-primary text-white px-4 rounded-xl font-bold flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
              >
                {isScanning ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined">barcode_scanner</span>
                )}
              </button>
            </div>
            {scanError && <p className="text-red-500 text-xs mt-1 ml-1">{scanError}</p>}
          </div>

          {/* 书名 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">书籍名称</label>
            <input 
              className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold" 
              placeholder="书名" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 作者 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">作者</label>
            <input 
              className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              placeholder="作者"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* 价格和成色 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">售价</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">¥</span>
                <input 
                  className="w-full h-12 pl-8 pr-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="0.00" 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">成色</label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="九成新">九成新</option>
                <option value="全新">全新</option>
                <option value="八成新">八成新</option>
                <option value="有划线/笔记">有划线/笔记</option>
              </select>
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">书籍描述</label>
            <textarea 
              className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none h-32 resize-none" 
              placeholder="说说书的成色，有没有划线，或者是交易地点..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          {publishError && <p className="text-red-500 text-sm">{publishError}</p>}
          {uploadError && <p className="text-orange-500 text-xs">{uploadError}</p>}
        </div>
      </main>

      {/* 发布成功弹窗 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white w-full max-w-[280px] rounded-[32px] p-8 shadow-2xl animate-scale-in flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">发布成功!</h3>
            <p className="text-sm text-slate-500 text-center">你的书籍已成功发布</p>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-5 bg-white/90 ios-blur border-t border-slate-50">
        <button 
          className="w-full h-14 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={!user || !title || !price || isPublishing}
          onClick={handlePublish}
        >
          {isPublishing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>发布中...</span>
            </>
          ) : (
            '立即发布'
          )}
        </button>
      </footer>
    </div>
  );
};

export default Publish;
