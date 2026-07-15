-- Enable uuid-ossp extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exam_papers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_filename TEXT NOT NULL,
    parsed_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create evaluations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_paper_id UUID REFERENCES public.exam_papers(id) ON DELETE CASCADE,
    pdf_filename TEXT NOT NULL,
    parsed_data JSONB NOT NULL,
    student_name TEXT,
    roll_number TEXT,
    exam_code TEXT,
    subject TEXT,
    obtained_marks NUMERIC,
    max_marks NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable Row Level Security (RLS) for easy development access
-- (Alternatively, you can enable RLS and write appropriate policy rules if this goes into production)
ALTER TABLE public.exam_papers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations DISABLE ROW LEVEL SECURITY;
