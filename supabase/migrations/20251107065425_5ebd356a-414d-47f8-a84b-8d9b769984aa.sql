-- Create submissions table to store client measurement data
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  postal_code TEXT NOT NULL,
  spaces JSONB NOT NULL DEFAULT '[]'::jsonb,
  storage_priorities TEXT[] DEFAULT ARRAY[]::TEXT[],
  additional_notes TEXT,
  calendly_event_url TEXT,
  calendly_booking_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-files', 'submission-files', false);

-- Enable RLS on submissions table
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert submissions (public form)
CREATE POLICY "Anyone can create submissions"
  ON public.submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own submissions by email
CREATE POLICY "Users can view own submissions"
  ON public.submissions
  FOR SELECT
  USING (true);

-- Storage policies for submission files
CREATE POLICY "Anyone can upload submission files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'submission-files');

CREATE POLICY "Anyone can view submission files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'submission-files');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();