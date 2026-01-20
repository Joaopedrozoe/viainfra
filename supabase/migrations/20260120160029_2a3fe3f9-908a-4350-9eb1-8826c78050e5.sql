-- Table to track import job progress for resumable imports
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'messages', -- 'messages' | 'contacts' | 'history' | 'avatars' | 'completed'
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  last_cursor TEXT, -- to resume from where it stopped
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see/manage their company's import jobs
CREATE POLICY "Users can view their company import jobs"
ON public.import_jobs
FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create import jobs for their company"
ON public.import_jobs
FOR INSERT
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company import jobs"
ON public.import_jobs
FOR UPDATE
USING (company_id IN (SELECT company_id FROM profiles WHERE user_id = auth.uid()));

-- Index for quick lookup
CREATE INDEX idx_import_jobs_company_status ON public.import_jobs(company_id, status);
CREATE INDEX idx_import_jobs_instance ON public.import_jobs(instance_name, status);

-- Trigger for updated_at
CREATE TRIGGER update_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();