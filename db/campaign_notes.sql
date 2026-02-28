CREATE TABLE IF NOT EXISTS campaign_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Conteúdo
  title TEXT NOT NULL DEFAULT 'Sem título',
  content JSONB NOT NULL DEFAULT '{}',  -- TipTap JSON (doc structure)
  
  -- Organização
  parent_id UUID REFERENCES campaign_notes(id) ON DELETE CASCADE,  -- NULL = raiz
  is_folder BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,  -- posição dentro da pasta
  
  UNIQUE(campaign_id, user_id, id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_notes_lookup 
  ON campaign_notes(campaign_id, user_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_campaign_notes_sort 
  ON campaign_notes(parent_id, sort_order);

ALTER TABLE campaign_notes ENABLE ROW LEVEL SECURITY;

-- Cada jogador só vê suas próprias notas
CREATE POLICY "Users can view own notes" ON campaign_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes" ON campaign_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON campaign_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON campaign_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON campaign_notes TO authenticated;
