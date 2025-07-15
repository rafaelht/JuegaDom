-- Script de migración a Supabase PostgreSQL
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de usuarios (extendiendo auth.users de Supabase)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de números de lotería
CREATE TABLE public.lottery_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    numbers TEXT NOT NULL, -- JSON string de números
    mas_number TEXT, -- JSON string para número Más (Leidsa)
    game_type TEXT NOT NULL CHECK (game_type IN ('leidsa', 'kino', 'pale', 'tripleta')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de estadísticas de números
CREATE TABLE public.number_statistics (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('leidsa', 'kino', 'pale', 'tripleta', 'leidsa_mas', 'kino_mas', 'pale_mas', 'tripleta_mas')),
    frequency INTEGER DEFAULT 0,
    last_appearance TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(number, game_type)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_lottery_numbers_user_id ON public.lottery_numbers(user_id);
CREATE INDEX idx_lottery_numbers_game_type ON public.lottery_numbers(game_type);
CREATE INDEX idx_lottery_numbers_generated_at ON public.lottery_numbers(generated_at);
CREATE INDEX idx_number_statistics_game_type ON public.number_statistics(game_type);
CREATE INDEX idx_number_statistics_frequency ON public.number_statistics(frequency);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_number_statistics_updated_at BEFORE UPDATE ON public.number_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Configurar Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_statistics ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para lottery_numbers
CREATE POLICY "Users can view their own lottery numbers" ON public.lottery_numbers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lottery numbers" ON public.lottery_numbers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lottery numbers" ON public.lottery_numbers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lottery numbers" ON public.lottery_numbers
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all lottery numbers" ON public.lottery_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Políticas para number_statistics (lectura pública, escritura para todos)
CREATE POLICY "Anyone can view number statistics" ON public.number_statistics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert number statistics" ON public.number_statistics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update number statistics" ON public.number_statistics
    FOR UPDATE USING (true);

-- Crear función para obtener estadísticas globales
CREATE OR REPLACE FUNCTION get_global_stats(game_type_param TEXT DEFAULT NULL)
RETURNS TABLE (
    total_generations BIGINT,
    total_users BIGINT,
    most_used_game_type TEXT,
    last_generation TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ln.id) as total_generations,
        COUNT(DISTINCT ln.user_id) as total_users,
        ln.game_type as most_used_game_type,
        MAX(ln.generated_at) as last_generation
    FROM public.lottery_numbers ln
    WHERE ln.is_deleted = FALSE
    AND (game_type_param IS NULL OR ln.game_type = game_type_param)
    GROUP BY ln.game_type
    ORDER BY COUNT(ln.id) DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener números calientes
CREATE OR REPLACE FUNCTION get_hot_numbers(game_type_param TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    number INTEGER,
    frequency INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT ns.number, ns.frequency
    FROM public.number_statistics ns
    WHERE ns.game_type = game_type_param
    ORDER BY ns.frequency DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Crear función para obtener números fríos
CREATE OR REPLACE FUNCTION get_cold_numbers(game_type_param TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    number INTEGER,
    frequency INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT ns.number, ns.frequency
    FROM public.number_statistics ns
    WHERE ns.game_type = game_type_param
    ORDER BY ns.frequency ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql; 