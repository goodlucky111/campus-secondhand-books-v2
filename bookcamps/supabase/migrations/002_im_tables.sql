-- IM即时通讯数据库表结构

-- 1. 扩展 messages 表
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id),
ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS extra JSONB DEFAULT '{}'::jsonb;

-- 2. 创建 conversations 表（会话）
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  last_message_id UUID REFERENCES messages(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, buyer_id, seller_id)
);

-- 3. 创建 user_presence 表（在线状态）
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(from_id, to_id);
CREATE INDEX IF NOT EXISTS idx_messages_book ON messages(book_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_book ON conversations(book_id);

-- 5. 启用RLS策略
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 6. Conversations RLS策略
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- 7. Messages RLS策略
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (from_id = auth.uid() OR to_id = auth.uid());

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (from_id = auth.uid());

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (from_id = auth.uid());

-- 8. User Presence RLS策略
CREATE POLICY "Users can update own presence" ON user_presence
  FOR ALL USING (user_id = auth.uid());

-- 9. Realtime 设置
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
