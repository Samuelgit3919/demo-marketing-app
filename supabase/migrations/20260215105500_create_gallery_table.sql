-- Create ENUM type for gallery item types
CREATE TYPE public.gallery_item_type AS ENUM ('closet', 'kitchen', 'garage', 'other');

-- Create gallery table
CREATE TABLE public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    public_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type public.gallery_item_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on gallery table
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active gallery items
CREATE POLICY "Allow public read access to gallery"
    ON public.gallery
    FOR SELECT
    USING (true);

-- Allow authenticated admins to manage all gallery items
CREATE POLICY "Admins can manage all gallery items"
    ON public.gallery
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Create trigger to update updated_at column
CREATE TRIGGER update_gallery_updated_at
    BEFORE UPDATE ON public.gallery
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
