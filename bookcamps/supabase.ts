import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrwvhjjbsuzimnuqyej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncnd2aGpqYnN1emltbnVxeWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzcyNjUsImV4cCI6MjA4ODUxMzI2NX0.ok-k2K2TlFCt03KVG95gDky3uAuyydtWx-_f9b4z_9M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 类型导出
export type Profile = {
  id: string;
  nickname: string | null;
  avatar: string | null;
  student_id: string | null;
  phone: string | null;
  credit_score: number;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Book = {
  id: string;
  seller_id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  original_price: number | null;
  price: number;
  condition: string;
  description: string | null;
  images: string[] | null;
  category: string | null;
  status: 'available' | 'sold' | 'removed';
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  book_id: string | null;
  buyer_id: string;
  seller_id: string;
  price: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  shipping_address: string | null;
  contact_phone: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  type: 'text' | 'image' | 'system';
  is_read: boolean;
  created_at: string;
};

export type BookCatalog = {
  id: string;
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  published_date: string | null;
  original_price: number | null;
  category: string | null;
  cover_url: string | null;
  created_at: string;
};
