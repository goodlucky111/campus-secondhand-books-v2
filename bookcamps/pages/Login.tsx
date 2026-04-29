
import React, { useState } from 'react';
import { User } from '../types';
import { loginWithEmail, registerWithEmail, getProfile } from '../services/authService';

interface LoginProps {
  onLogin: (user: User) => void;
}

type LoginMode = 'login' | 'register';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!isAgreed) {
      setError('请同意用户协议');
      return;
    }

    if (!email || !password) {
      setError('请填写完整信息');
      return;
    }

    if (mode === 'register') {
      if (!nickname) {
        setError('请输入昵称');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次密码输入不一致');
        return;
      }
      if (password.length < 6) {
        setError('密码至少6位');
        return;
      }
    }

    setError('');
    setIsLoading(true);

    let result;
    if (mode === 'login') {
      result = await loginWithEmail(email, password);
    } else {
      result = await registerWithEmail(email, password, nickname);
    }

    if (result.success && result.user) {
      try {
        const profile = await getProfile(result.user.id);
        
        onLogin({
          id: result.user.id,
          phone: result.user.email || '',
          name: profile?.nickname || nickname || email.split('@')[0] || '用户',
          avatar: profile?.avatar || '',
          isVerified: profile?.is_verified || false,
          creditScore: profile?.credit_score ?? 100,
          joinedDays: Math.floor((Date.now() - new Date(profile?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
          likes: 0
        });
      } catch (profileError) {
        // 即使获取profile失败，也允许登录
        onLogin({
          id: result.user.id,
          phone: result.user.email || '',
          name: nickname || email.split('@')[0] || '用户',
          avatar: '',
          isVerified: false,
          creditScore: 100,
          joinedDays: 0,
          likes: 0
        });
      }
    } else {
      setError(result.error || (mode === 'login' ? '登录失败' : '注册失败'));
    }

    setIsLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="flex-1 flex flex-col px-8 pt-16 pb-8 bg-white font-display">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary text-5xl">auto_stories</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {mode === 'login' ? '欢迎登录 BookCampus' : '注册 BookCampus 账号'}
        </h1>
        <p className="text-slate-500 text-sm">
          {mode === 'login' ? '发现更多学霸的珍藏教材' : '开始你的二手书交易之旅'}
        </p>
      </div>

      <div className="flex-1 space-y-5">
        {mode === 'register' && (
          <div className="relative flex items-center border-b border-slate-200 py-3 group focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-slate-400 mr-3">person</span>
            <input
              className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-slate-900 placeholder-slate-400 text-base"
              placeholder="昵称"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        )}

        <div className="relative flex items-center border-b border-slate-200 py-3 group focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-slate-400 mr-3">email</span>
          <input
            className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-slate-900 placeholder-slate-400 text-base"
            placeholder="邮箱地址"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {email && (
            <button onClick={() => setEmail('')} className="text-slate-300 hover:text-slate-500">
              <span className="material-icons text-xl">cancel</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center border-b border-slate-200 py-3 focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-slate-400 mr-3">lock</span>
          <input
            className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-slate-900 placeholder-slate-400 text-base"
            placeholder="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === 'register' && (
          <div className="relative flex items-center border-b border-slate-200 py-3 focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-slate-400 mr-3">lock</span>
            <input
              className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-slate-900 placeholder-slate-400 text-base"
              placeholder="确认密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full font-semibold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] text-lg ${
              !isLoading ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isLoading ? '处理中...' : (mode === 'login' ? '登录' : '注册')}
          </button>
        </div>

        <div className="text-center pt-2">
          <span className="text-slate-500 text-sm">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
          </span>
          <button 
            onClick={switchMode}
            className="text-primary font-medium text-sm ml-1 hover:underline"
          >
            {mode === 'login' ? '立即注册' : '立即登录'}
          </button>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <div className="flex items-start justify-center gap-2">
          <input
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            className="mt-1 rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            id="terms"
            type="checkbox"
          />
          <label className="text-xs text-slate-500 leading-tight" htmlFor="terms">
            {mode === 'login' ? '登录即代表您同意' : '注册即代表您同意'}
            <a className="text-primary hover:underline mx-0.5" href="#">《用户协议》</a>
            和
            <a className="text-primary hover:underline mx-0.5" href="#">《隐私政策》</a>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Login;
