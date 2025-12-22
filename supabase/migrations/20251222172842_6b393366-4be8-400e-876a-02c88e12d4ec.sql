-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule realtime-sync to run every minute
SELECT cron.schedule(
  'realtime-sync-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/realtime-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4b2pwZmhua3hwYnpuYm1obXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzY4NTUsImV4cCI6MjA3NDgxMjg1NX0.K7pqFCShUgQWJgrHThPynEguIkS0_TjIOuKXvIEgNR4"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);