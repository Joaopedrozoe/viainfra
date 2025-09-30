-- Criar bucket público para o widget
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'widget',
  'widget',
  true,
  5242880,
  ARRAY['text/html', 'text/css', 'application/javascript']
);

-- Política para permitir leitura pública
CREATE POLICY "Widget files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'widget');

-- Política para permitir upload (apenas usuários autenticados)
CREATE POLICY "Authenticated users can upload widget files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'widget' AND auth.role() = 'authenticated');