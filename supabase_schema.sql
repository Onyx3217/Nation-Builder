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
DROP INDEX IF EXISTS public.saved_games_save_key_unique;
CREATE UNIQUE INDEX saved_games_save_key_unique
    ON public.saved_games (save_key);

-- 2. Activer la sécurité au niveau des lignes (Row Level Security)
ALTER TABLE public.saved_games ENABLE ROW LEVEL SECURITY;

-- ATTENTION : ces politiques anon sont publiques. Toute personne ayant l'URL
-- et la clé anon du projet peut lire, modifier ou supprimer TOUTES les sauvegardes.
-- Ne stockez aucune donnée personnelle avec cette configuration.
-- Pour des sauvegardes privées par joueur, activez Supabase Auth, ajoutez un
-- owner_id UUID REFERENCES auth.users(id), puis utilisez auth.uid() dans les
-- politiques SELECT/INSERT/UPDATE/DELETE au lieu de USING (true).
--
-- 3. Politiques anon publiques (adaptées uniquement à des sauvegardes de démonstration)

-- Lecture publique des sauvegardes
CREATE POLICY "Allow anon read saved_games"
    ON public.saved_games
    FOR SELECT
    TO anon
    USING (true);

-- Insertion de nouvelles sauvegardes
CREATE POLICY "Allow anon insert saved_games"
    ON public.saved_games
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Modification de ses sauvegardes
CREATE POLICY "Allow anon update saved_games"
    ON public.saved_games
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Suppression des sauvegardes
CREATE POLICY "Allow anon delete saved_games"
    ON public.saved_games
    FOR DELETE
    TO anon
    USING (true);

-- Index pour accélérer le tri chronologique
CREATE INDEX IF NOT EXISTS idx_saved_games_updated_at ON public.saved_games (updated_at DESC);
