-- Create services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    public_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type public.gallery_item_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create before_after table (Different structure for comparisons)
CREATE TABLE public.before_after (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    before_image_url TEXT NOT NULL,
    before_public_id TEXT NOT NULL,
    after_image_url TEXT NOT NULL,
    after_public_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type public.gallery_item_type NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Allow public read access to services"
    ON public.services FOR SELECT USING (true);

CREATE POLICY "Admins can manage services"
    ON public.services FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS Policies for before_after
CREATE POLICY "Allow public read access to before_after"
    ON public.before_after FOR SELECT USING (true);

CREATE POLICY "Admins can manage before_after"
    ON public.before_after FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Timestamps triggers
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_before_after_updated_at
    BEFORE UPDATE ON public.before_after
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
