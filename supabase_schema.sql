-- ==============================================================================
-- NATION BUILDER — SUPABASE DATABASE SCHEMA
-- Instructions:
-- 1. Rendez-vous sur votre dashboard Supabase (https://supabase.com/dashboard)
-- 2. Allez dans "SQL Editor" dans le menu de gauche
-- 3. Cliquez sur "New query", collez ce script et cliquez sur "Run"
-- ==============================================================================

-- 1. Création de la table des sauvegardes
CREATE TABLE IF NOT EXISTS public.saved_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nation_name TEXT NOT NULL,
    nation_flag TEXT DEFAULT '🏳️',
    save_key TEXT,
    turn INT DEFAULT 0,
    game_data JSONB NOT NULL
);

ALTER TABLE public.saved_games ADD COLUMN IF NOT EXISTS save_key TEXT;
ALTER TABLE public.saved_games
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
DROP INDEX IF EXISTS public.saved_games_save_key_unique;
CREATE UNIQUE INDEX saved_games_save_key_unique
    ON public.saved_games (save_key);
CREATE INDEX IF NOT EXISTS saved_games_owner_id_idx ON public.saved_games (owner_id);

-- 2. Activer la sécurité au niveau des lignes (Row Level Security)
ALTER TABLE public.saved_games ENABLE ROW LEVEL SECURITY;

-- Supabase Auth anonymous users are authenticated Postgres users with a stable
-- per-browser user ID. Enable Anonymous Sign-Ins in the Supabase Auth dashboard.
-- Existing rows with a NULL owner_id are intentionally not exposed to clients.
DROP POLICY IF EXISTS "Allow anon read saved_games" ON public.saved_games;
DROP POLICY IF EXISTS "Allow anon insert saved_games" ON public.saved_games;
DROP POLICY IF EXISTS "Allow anon update saved_games" ON public.saved_games;
DROP POLICY IF EXISTS "Allow anon delete saved_games" ON public.saved_games;
DROP POLICY IF EXISTS "Users read their own saved_games" ON public.saved_games;
DROP POLICY IF EXISTS "Users insert their own saved_games" ON public.saved_games;
DROP POLICY IF EXISTS "Users update their own saved_games" ON public.saved_games;
DROP POLICY IF EXISTS "Users delete their own saved_games" ON public.saved_games;

REVOKE ALL ON TABLE public.saved_games FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_games TO authenticated;

CREATE POLICY "Users read their own saved_games"
    ON public.saved_games
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Users insert their own saved_games"
    ON public.saved_games
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Users update their own saved_games"
    ON public.saved_games
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id)
    WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Users delete their own saved_games"
    ON public.saved_games
    FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id);

-- Index pour accélérer le tri chronologique
CREATE INDEX IF NOT EXISTS idx_saved_games_updated_at ON public.saved_games (updated_at DESC);
