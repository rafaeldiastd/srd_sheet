DROP TABLE IF EXISTS spells CASCADE;

CREATE TABLE spells (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    school TEXT,
    cast_time TEXT,
    range TEXT,
    target TEXT,
    duration TEXT,
    saving_throw TEXT,
    spell_resistance TEXT,
    description TEXT,
    
    -- Mekanicas de rolagem/combate
    roll_mode TEXT DEFAULT 'none',
    is_attack BOOLEAN DEFAULT false,
    attack_formula TEXT,
    damage_formula TEXT,
    heal_formula TEXT,
    roll_formula TEXT,
    roll_passive_formula TEXT,
    
    -- Efeitos passivos, ativos, fórmulas
    passive_effects JSONB DEFAULT '[]'::jsonb,
    active_effects JSONB DEFAULT '[]'::jsonb,
    formulas JSONB DEFAULT '[]'::jsonb,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Impede a criação de magias com o mesmo nome na mesma campanha
    UNIQUE(campaign_id, name)
);

-- Habilitar RLS
ALTER TABLE spells ENABLE ROW LEVEL SECURITY;

-- Exemplo de política: Jogadores da campanha e DM podem ver as magias, 
-- e talvez apenas o DM ou quem criou pode editar (depende de como está o controle de acesso de campaign_members)

-- Permite leitura para quem for membro da campanha (ou DM)
CREATE POLICY "Permitir leitura de magias na campanha" ON spells FOR SELECT
USING (
    campaign_id IN (
        SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
    OR 
    campaign_id IN (
        SELECT id FROM campaigns WHERE dm_id = auth.uid()
    )
);

-- Permite inserção/atualização/deleção para quem for DM ou membro
CREATE POLICY "Permitir edição de magias na campanha" ON spells
FOR ALL
USING (
    campaign_id IN (
        SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
    OR 
    campaign_id IN (
        SELECT id FROM campaigns WHERE dm_id = auth.uid()
    )
)
WITH CHECK (
    campaign_id IN (
        SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid()
    )
    OR 
    campaign_id IN (
        SELECT id FROM campaigns WHERE dm_id = auth.uid()
    )
);
