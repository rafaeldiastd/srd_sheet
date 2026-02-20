/**
 * REVISED Supabase Setup Script (v4 - Sheet Sharing)
 * Fixes: Infinite recursion using SECURITY DEFINER function.
 * Enables: Viewing sheets linked to campaigns.
 * Use this to UPDATE your database.
 */

-- Create tables if not exist
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  dm_id UUID REFERENCES auth.users(id) NOT NULL,
  join_code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sheet_id UUID REFERENCES sheets(id) ON DELETE SET NULL, 
  role TEXT DEFAULT 'player' CHECK (role IN ('dm', 'player', 'spectator')),
  UNIQUE(campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_name TEXT NOT NULL, 
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'roll', 'system'))
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Assuming 'sheets' table already has RLS enabled. If not:
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;

-- 
-- HELPER FUNCTION: Get campaigns a user is a member of.
-- Prevents infinite recursion by bypassing RLS on table READ.
--
DROP FUNCTION IF EXISTS get_user_campaign_ids();

CREATE OR REPLACE FUNCTION get_user_campaign_ids()
RETURNS TABLE (campaign_id UUID) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT campaign_id FROM campaign_members WHERE user_id = auth.uid();
$$;

-- CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Users can view campaigns they belong to" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "DM can update campaign" ON campaigns;
DROP POLICY IF EXISTS "DM can delete campaign" ON campaigns;

DROP POLICY IF EXISTS "Members can view other members" ON campaign_members;
DROP POLICY IF EXISTS "Users can join campaigns" ON campaign_members;

DROP POLICY IF EXISTS "Members can view messages" ON messages;
DROP POLICY IF EXISTS "Members can send messages" ON messages;

DROP POLICY IF EXISTS "Campaign members can view linked sheets" ON sheets;


-- RECREATE POLICIES

-- Campaigns:
CREATE POLICY "Users can view campaigns they belong to" ON campaigns
  FOR SELECT USING (
    auth.uid() = dm_id OR 
    id IN (SELECT campaign_id FROM get_user_campaign_ids())
  );

CREATE POLICY "Users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = dm_id);
  
CREATE POLICY "DM can update campaign" ON campaigns
  FOR UPDATE USING (auth.uid() = dm_id);

CREATE POLICY "DM can delete campaign" ON campaigns
  FOR DELETE USING (auth.uid() = dm_id);


-- Campaign Members:
CREATE POLICY "Members can view other members" ON campaign_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
    campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
  );

CREATE POLICY "Users can join campaigns" ON campaign_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages:
CREATE POLICY "Members can view messages" ON messages
  FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
    campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids()) OR
      campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
    )
  );

-- Sheets:
-- Allow viewing sheets that are linked to a campaign I am also in (or DM of)
CREATE POLICY "Campaign members can view linked sheets" ON sheets
  FOR SELECT USING (
    -- Access if sheet is linked to a campaign I am in
    id IN (
      SELECT sheet_id FROM campaign_members 
      WHERE campaign_id IN (SELECT campaign_id FROM get_user_campaign_ids())
    ) 
    OR
    -- Access if sheet is linked to a campaign I DM
    id IN (
      SELECT sheet_id FROM campaign_members 
      WHERE campaign_id IN (SELECT id FROM campaigns WHERE dm_id = auth.uid())
    )
  );

-- Grants (To ensure authenticated user has access)
GRANT EXECUTE ON FUNCTION get_user_campaign_ids TO authenticated;
GRANT ALL ON campaign_members TO authenticated;
GRANT ALL ON campaigns TO authenticated;
GRANT ALL ON messages TO authenticated;
