
export enum Condition {
  New = '全新',
  LikeNew = '九成新',
  Good = '八成新',
  Used = '有笔记',
  Fair = '破损/旧'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
  condition: Condition;
  school: string;
  location: string;
  imageUrl: string;
  sellerId: string;
  description?: string;
  isbn?: string;
  publishTime: string;
}

export interface WantedPost {
  id: string;
  title: string;
  budget: number;
  condition: string;
  school: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar: string;
  publishTime: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  isVerified: boolean;
  creditScore: number;
  department?: string;
  schoolName?: string;
  campus?: string;
  joinedDays: number;
  likes: number;
}

export type ViewState = 'HOME' | 'SEARCH' | 'PUBLISH' | 'MESSAGES' | 'PROFILE' | 'LOGIN' | 'DETAIL' | 'CHAT' | 'VERIFICATION' | 'PUBLISH_REQUEST' | 'MY_PUBLISHED' | 'SOLD' | 'BUYING' | 'ORDER_DETAIL';

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'bargain' | 'meetup';
  timestamp: number;
  extra?: any;
}
