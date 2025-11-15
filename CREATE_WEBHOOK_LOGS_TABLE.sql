-- Create table to store webhook logs for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL DEFAULT 'retell_call_result',
  call_id TEXT,
  user_id UUID,
  lead_id UUID,
  payload JSONB NOT NULL,
  headers JSONB,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_call_id ON webhook_logs(call_id);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all logs
CREATE POLICY "Admins can view all webhook logs"
  ON webhook_logs
  FOR SELECT
  USING (true); -- For now, allow all authenticated users to view (we'll restrict to admins later)

-- Allow insert without auth (for webhooks)
CREATE POLICY "Allow webhook inserts"
  ON webhook_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE webhook_logs IS 'Stores webhook payloads for debugging';

