CREATE TABLE IF NOT EXISTS public.contact_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  display_name text,
  saved_name text,
  is_my_contact boolean,
  company_id uuid REFERENCES public.companies(id),
  source text NOT NULL DEFAULT 'spreadsheet',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contact_directory TO authenticated;
GRANT ALL ON public.contact_directory TO service_role;

ALTER TABLE public.contact_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read contact directory"
ON public.contact_directory FOR SELECT TO authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS contact_directory_phone_source_idx
  ON public.contact_directory (phone, source);
CREATE INDEX IF NOT EXISTS contact_directory_saved_name_idx
  ON public.contact_directory (lower(saved_name));
CREATE INDEX IF NOT EXISTS contact_directory_display_name_idx
  ON public.contact_directory (lower(display_name));

CREATE TRIGGER update_contact_directory_updated_at
BEFORE UPDATE ON public.contact_directory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();