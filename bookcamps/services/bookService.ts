
/**
 * 图书信息服务 - 使用本地目录 + Google Books API + AI 降级方案
 * 优先级：本地图书目录 > Google Books API > Open Library > Gemini AI (兜底)
 */

import { GoogleGenAI, Type } from "@google/genai";
import { supabase, Book } from '../supabase';

// ==================== ISBN 校验算法 ====================

/**
 * 校验 ISBN-13
 * 校验码计算：奇数位*1 + 偶数位*3，求和后取模10
 */
export function validateISBN13(isbn: string): boolean {
  const clean = isbn.replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(clean)) return false;
  
  const digits = clean.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => 
    acc + d * (i % 2 === 0 ? 1 : 3), 0);
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}

/**
 * 校验 ISBN-10
 * 校验码计算：∑(d[i] * (10-i))，求模11
 */
export function validateISBN10(isbn: string): boolean {
  const clean = isbn.replace(/[-\s]/g, '');
  if (!/^\d{9}[\dX]$/.test(clean)) return false;
  
  const digits = clean.split('').map(d => d === 'X' ? 10 : parseInt(d));
  const sum = digits.reduce((acc, d, i) => acc + d * (10 - i), 0);
  
  return sum % 11 === 0;
}

/**
 * 统一校验入口（宽松模式 - 接受任意10或13位数字）
 */
export function validateISBN(isbn: string): boolean {
  const clean = isbn.replace(/[-\s]/g, '');
  // 宽松模式：只要是10位或13位数字就接受
  if (clean.length === 13 && /^\d+$/.test(clean)) return true;
  if (clean.length === 10 && /^\d+X?$/i.test(clean)) return true;
  return false;
}

// ==================== 类型定义 ====================

export interface BookInfo {
  title: string;
  author: string;
  originalPrice: number | null;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  thumbnail?: string;
  pageCount?: number;
}

// ==================== Google Books API ====================

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

/**
 * 通过 Google Books API 查询图书信息
 */
export async function fetchBookFromGoogleBooks(isbn: string): Promise<BookInfo | null> {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}&maxResults=1`);
    
    if (!response.ok) {
      console.error('Google Books API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const book = data.items[0].volumeInfo;
    
    // 尝试提取价格
    let originalPrice: number | null = null;
    if (book.listPrice) {
      originalPrice = book.listPrice.amount;
    } else if (book.retailPrice) {
      originalPrice = book.retailPrice.amount;
    }
    
    return {
      title: book.title || '',
      author: book.authors?.join(', ') || '',
      originalPrice,
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
      thumbnail: book.imageLinks?.thumbnail,
      pageCount: book.pageCount
    };
  } catch (error) {
    console.error('Google Books fetch error:', error);
    return null;
  }
}

// ==================== Open Library API (备选) ====================

const OPEN_LIBRARY_API = 'https://openlibrary.org/api/books';

/**
 * 通过 Open Library 查询图书信息
 */
export async function fetchBookFromOpenLibrary(isbn: string): Promise<BookInfo | null> {
  try {
    const response = await fetch(
      `${OPEN_LIBRARY_API}?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const bookData = data[`ISBN:${isbn}`];
    
    if (!bookData) return null;
    
    return {
      title: bookData.title || '',
      author: bookData.authors?.map((a: any) => a.name).join(', ') || '',
      originalPrice: null, // Open Library 不提供价格
      publisher: bookData.publishers?.[0]?.name,
      publishedDate: bookData.publish_date,
      description: bookData.notes,
      thumbnail: bookData.cover?.medium
    };
  } catch (error) {
    console.error('Open Library fetch error:', error);
    return null;
  }
}

// ==================== Gemini AI 降级方案 ====================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 只有设置了 API key 才初始化
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Gemini AI 作为最后兜底方案
 */
async function fetchBookFromGemini(isbn: string): Promise<BookInfo | null> {
  // 没有 API key 时跳过
  if (!ai) {
    console.warn('Gemini API key 未设置，跳过 AI 查询');
    return null;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Look up book information for ISBN ${isbn}. Return ONLY accurate book details. If you're not certain about any field, omit it rather than guessing. Return JSON with fields: title, author, originalPrice (in CNY, number or null), publisher, publishedDate.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            originalPrice: { type: Type.NUMBER },
            publisher: { type: Type.STRING },
            publishedDate: { type: Type.STRING }
          }
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Gemini fallback error:', error);
    return null;
  }
}

// ==================== 本地图书目录查询 ====================

/**
 * 从本地图书目录查询（优先，最可靠）
 */
export async function fetchBookFromCatalog(isbn: string): Promise<BookInfo | null> {
  try {
    const { data, error } = await supabase
      .from('book_catalog')
      .select('*')
      .eq('isbn', isbn)
      .single();

    if (error || !data) return null;

    return {
      title: data.title,
      author: data.author || '',
      originalPrice: data.original_price,
      publisher: data.publisher,
      publishedDate: data.published_date,
      thumbnail: data.cover_url
    };
  } catch (error) {
    console.error('Catalog fetch error:', error);
    return null;
  }
}

// ==================== 主入口函数 ====================

/**
 * 自动填充图书信息
 * 查询优先级：本地目录 > Google Books > Open Library > Gemini AI
 */
export async function autoFillBookInfo(isbn: string): Promise<BookInfo | null> {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  if (!validateISBN(cleanISBN)) {
    console.warn('Invalid ISBN format:', isbn);
    return null;
  }
  
  // 方案0: 本地图书目录（最可靠）
  const catalogResult = await fetchBookFromCatalog(cleanISBN);
  if (catalogResult && catalogResult.title) {
    console.log('Found book in local catalog:', catalogResult.title);
    return catalogResult;
  }
  
  // 方案1: Google Books API
  const googleResult = await fetchBookFromGoogleBooks(cleanISBN);
  if (googleResult && googleResult.title) {
    console.log('Found book via Google Books:', googleResult.title);
    return googleResult;
  }
  
  // 方案2: Open Library
  const openLibResult = await fetchBookFromOpenLibrary(cleanISBN);
  if (openLibResult && openLibResult.title) {
    console.log('Found book via Open Library:', openLibResult.title);
    return openLibResult;
  }
  
  // 方案3: Gemini AI (兜底)
  console.log('Falling back to Gemini AI...');
  const geminiResult = await fetchBookFromGemini(cleanISBN);
  if (geminiResult) {
    console.log('Found book via Gemini AI:', geminiResult.title);
  }
  
  return geminiResult;
}

// ==================== 智能建议 ====================

export async function getSmartSuggestions(query: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Provide 5 search suggestions for college textbooks based on query: "${query}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Smart suggestions error:', error);
    return [];
  }
}

// ==================== Supabase 书籍 CRUD ====================

// 成色映射：前端中文 -> 数据库英文
const CONDITION_MAP: Record<string, string> = {
  '全新': 'new',
  '九成新': 'like_new',
  '八成新': 'good',
  '有划线/笔记': 'used'
};

const CONDITION_MAP_REVERSE: Record<string, string> = {
  'new': '全新',
  'like_new': '九成新',
  'good': '八成新',
  'used': '有划线/笔记'
};

/**
 * 创建书籍（发布）
 */
export async function createBook(bookData: {
  sellerId: string;
  title: string;
  author?: string;
  isbn?: string;
  originalPrice?: number;
  price: number;
  condition: string;
  description?: string;
  images?: string[];
  category?: string;
}): Promise<{ success: boolean; book?: Book; error?: string }> {
  try {
    // 转换 condition 为数据库格式
    const dbCondition = CONDITION_MAP[bookData.condition] || bookData.condition;
    
    const { data, error } = await supabase
      .from('books')
      .insert({
        seller_id: bookData.sellerId,
        title: bookData.title,
        author: bookData.author || null,
        isbn: bookData.isbn || null,
        original_price: bookData.originalPrice || null,
        price: bookData.price,
        condition: dbCondition,
        description: bookData.description || null,
        images: bookData.images || [],
        category: bookData.category || null,
        status: 'available'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, book: data };
  } catch (err) {
    return { success: false, error: '发布失败' };
  }
}

/**
 * 获取书籍列表
 */
export async function getBooks(options?: {
  category?: string;
  status?: 'available' | 'sold' | 'removed';
  sellerId?: string;
  limit?: number;
  offset?: number;
}): Promise<Book[]> {
  try {
    let query = supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.sellerId) {
      query = query.eq('seller_id', options.sellerId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // 转换 condition 为前端格式
    const convertedBooks = (data || []).map(book => ({
      ...book,
      condition: CONDITION_MAP_REVERSE[book.condition] || book.condition
    }));
    
    return convertedBooks;
  } catch (err) {
    console.error('Get books error:', err);
    return [];
  }
}

/**
 * 获取单本书籍详情
 */
export async function getBookById(bookId: string): Promise<Book | null> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) return null;
    return data;
  } catch (err) {
    console.error('Get book error:', err);
    return null;
  }
}

/**
 * 更新书籍
 */
export async function updateBook(
  bookId: string,
  sellerId: string,
  updates: Partial<{
    title: string;
    author: string;
    price: number;
    condition: string;
    description: string;
    images: string[];
    status: 'available' | 'sold' | 'removed';
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('books')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .eq('seller_id', sellerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: '更新失败' };
  }
}

/**
 * 删除书籍（下架）
 */
export async function deleteBook(bookId: string, sellerId: string): Promise<{ success: boolean; error?: string }> {
  return updateBook(bookId, sellerId, { status: 'removed' });
}

// ==================== 图片上传 ====================

/**
 * 上传书籍图片
 */
export async function uploadBookImage(file: File): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileName = `books/${user.id}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('book-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('上传图片失败:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('book-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('上传图片失败:', error);
    return null;
  }
}

/**
 * 搜索书籍
 */
export async function searchBooks(query: string): Promise<Book[]> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Search books error:', err);
    return [];
  }
}
