-- Adicionar 'whisper' e 'spell' ao CHECK constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_type_check
  CHECK (type IN ('text', 'roll', 'system', 'whisper', 'spell'));

-- Adicionar coluna para avatar e nome do personagem
ALTER TABLE messages ADD COLUMN IF NOT EXISTS character_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Adicionar coluna parent_id para vincular dano ao ataque original
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Policy de DELETE para mensagens (Apenas o autor pode deletar)
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- Policy de UPDATE (Autor pode atualizar sua própria mensagem)
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);
