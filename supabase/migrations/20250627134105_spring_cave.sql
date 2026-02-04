/*
  # Sistema de Anexos para Laudos

  1. Novas Tabelas
    - `laudos_anexos` - Anexos dos laudos com descrições

  2. Storage
    - Bucket 'laudos' para armazenar imagens dos laudos

  3. Segurança
    - RLS habilitado
    - Políticas para usuários autenticados
*/

-- Criar bucket para anexos de laudos
INSERT INTO storage.buckets (id, name, public)
VALUES ('laudos', 'laudos', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar bucket
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'laudos';

-- Tabela de anexos dos laudos
CREATE TABLE IF NOT EXISTS laudos_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laudo_id uuid REFERENCES laudos(id) ON DELETE CASCADE,
  arquivo_url text NOT NULL,
  nome_arquivo text NOT NULL,
  descricao text,
  tamanho_arquivo integer,
  tipo_arquivo text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE laudos_anexos ENABLE ROW LEVEL SECURITY;

-- Políticas para anexos de laudos
CREATE POLICY "Usuários autenticados podem gerenciar anexos de laudos"
  ON laudos_anexos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para storage de laudos
DO $$ 
BEGIN
  -- Policy para upload de anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload laudo attachments'
  ) THEN
    CREATE POLICY "Authenticated users can upload laudo attachments"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'laudos');
  END IF;

  -- Policy para atualizar anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update laudo attachments'
  ) THEN
    CREATE POLICY "Authenticated users can update laudo attachments"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'laudos');
  END IF;

  -- Policy para deletar anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete laudo attachments'
  ) THEN
    CREATE POLICY "Authenticated users can delete laudo attachments"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'laudos');
  END IF;

  -- Policy para visualizar anexos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view laudo attachments'
  ) THEN
    CREATE POLICY "Public can view laudo attachments"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'laudos');
  END IF;
END $$;

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_laudos_anexos_laudo_id ON laudos_anexos(laudo_id);
CREATE INDEX IF NOT EXISTS idx_laudos_anexos_created_at ON laudos_anexos(created_at);

-- Atualizar tabela de laudos para incluir relacionamento com cliente e veículo diretamente
DO $$
BEGIN
  -- Adicionar colunas cliente_id e veiculo_id se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'laudos' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE laudos ADD COLUMN cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'laudos' AND column_name = 'veiculo_id'
  ) THEN
    ALTER TABLE laudos ADD COLUMN veiculo_id uuid REFERENCES veiculos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_laudos_cliente_id ON laudos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_laudos_veiculo_id ON laudos(veiculo_id);