import { supabase, Profile } from '../supabase';
import { User } from '@supabase/supabase-js';

// ==================== 邮箱/密码登录 ====================

/**
 * 邮箱密码登录
 */
export async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      return { success: true, user: data.user };
    }

    return { success: false, error: '登录失败' };
  } catch (err) {
    return { success: false, error: '登录失败' };
  }
}

/**
 * 邮箱注册
 */
export async function registerWithEmail(email: string, password: string, nickname: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname
        },
        emailRedirectTo: window.location.origin
      }
    });
    
    // 检查是否需要邮箱验证
    if (data.user && !data.session) {
      return { 
        success: false, 
        error: '注册成功！请查收邮箱验证链接完成验证。' 
      };
    }

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // 创建用户资料
      await ensureProfile(data.user, nickname);
      return { success: true, user: data.user };
    }

    return { success: false, error: '注册失败' };
  } catch (err) {
    return { success: false, error: '注册失败' };
  }
}

// 保留手机验证码接口（兼容）
export async function sendPhoneVerification(phone: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: '暂不支持手机登录，请使用邮箱登录' };
}

export async function verifyAndLogin(phone: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> {
  return { success: false, error: '暂不支持手机登录' };
}

// 确保用户资料存在
async function ensureProfile(user: User, nickname?: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existing) {
      // 创建新资料
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        nickname: nickname || user.email?.split('@')[0] || '用户',
        phone: user.phone,
        credit_score: 100,
        is_verified: false
      });
      
      if (error) {
        console.error('创建用户资料失败:', error);
      }
    }
  } catch (err) {
    console.error('ensureProfile异常:', err);
  }
}

// 获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// 获取用户资料
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('获取资料失败:', error);
      return null;
    }

    // 如果profile不存在，返回默认值
    if (!data) {
      return {
        id: userId,
        nickname: '用户',
        avatar: null,
        student_id: null,
        phone: null,
        credit_score: 100,
        is_verified: false,
        verified_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return data;
  } catch (err) {
    console.error('获取资料异常:', err);
    return null;
  }
}

// 更新用户资料
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: '更新资料失败' };
  }
}

// 退出登录
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

// 监听登录状态变化
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}
