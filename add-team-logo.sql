-- Adicionar coluna logo_url à tabela teams
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- Criar bucket no Supabase Storage para logos
-- Este comando deve ser executado via console do Supabase ou via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('team-logos', 'team-logos', true);

-- Atualizar política RLS para permitir que equipes façam upload
-- CREATE POLICY "Users can upload their team logo"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'team-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Atualizar política RLS para permitir leitura pública
-- CREATE POLICY "Public can read team logos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'team-logos');

-- Criar função para atualizar logo_url quando arquivo é feito upload
-- Esta função será chamada via trigger ou API
CREATE OR REPLACE FUNCTION update_team_logo(
  team_id UUID,
  logo_path VARCHAR
)
RETURNS void AS $$
BEGIN
  UPDATE teams
  SET logo_url = CONCAT('https://your-project.supabase.co/storage/v1/object/public/team-logos/', logo_path)
  WHERE id = team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
