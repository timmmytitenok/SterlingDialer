-- Create custom_revenue_expenses table for tracking manual revenue and expenses
CREATE TABLE IF NOT EXISTS custom_revenue_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')), -- 'revenue' or 'expense'
  category TEXT NOT NULL, -- e.g., "Production", "Marketing", "Consulting", "Services"
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT, -- Optional description
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_revenue_expenses ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin full access to custom_revenue_expenses"
  ON custom_revenue_expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_revenue_expenses_date ON custom_revenue_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_custom_revenue_expenses_category ON custom_revenue_expenses(category);
CREATE INDEX IF NOT EXISTS idx_custom_revenue_expenses_type ON custom_revenue_expenses(type);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_revenue_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_revenue_expenses_updated_at
  BEFORE UPDATE ON custom_revenue_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_revenue_expenses_updated_at();

COMMENT ON TABLE custom_revenue_expenses IS 'Manual revenue and expense tracking for admin dashboard (consulting, production costs, etc.)';

