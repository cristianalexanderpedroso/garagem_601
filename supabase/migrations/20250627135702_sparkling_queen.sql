-- Criar bucket para anexos de orçamentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos', 'orcamentos', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'orcamentos';

-- Tabela de anexos dos orçamentos
CREATE TABLE IF NOT EXISTS orcamentos_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid REFERENCES orcamentos(id) ON DELETE CASCADE,
  arquivo_url text NOT NULL,
  nome_arquivo text NOT NULL,
  descricao text,
  tamanho_arquivo integer,
  tipo_arquivo text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE orcamentos_anexos ENABLE ROW LEVEL SECURITY;

-- Políticas para anexos de orçamentos
CREATE POLICY "Usuários autenticados podem gerenciar anexos de orçamentos"
  ON orcamentos_anexos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para storage de orçamentos
DO $$ 
BEGIN
  -- Policy para upload de anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload orcamento attachments'
  ) THEN
    CREATE POLICY "Authenticated users can upload orcamento attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'orcamentos');
  END IF;

  -- Policy para atualizar anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update orcamento attachments'
  ) THEN
    CREATE POLICY "Authenticated users can update orcamento attachments"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'orcamentos');
  END IF;

  -- Policy para deletar anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete orcamento attachments'
  ) THEN
    CREATE POLICY "Authenticated users can delete orcamento attachments"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'orcamentos');
  END IF;

  -- Policy para visualizar anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view orcamento attachments'
  ) THEN
    CREATE POLICY "Public can view orcamento attachments"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'orcamentos');
  END IF;
END $$;

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_orcamentos_anexos_orcamento_id ON orcamentos_anexos(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_anexos_created_at ON orcamentos_anexos(created_at);