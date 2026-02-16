export interface ImageReference {
    public_id: string;
    url: string;
}

export interface ImageAsset {
    public_id: string;
    url: string;
    resource_type: string;
    secure_url?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
    folder?: string;
    created_at?: string;
}

export interface SupabaseFile {
    id: string;
    url: string;
    public_id: string;
    folder: string | null;
    created_at: string;
}

export interface GalleryItem {
    id: string;
    image_url: string;
    public_id: string;
    title: string;
    description: string | null;
    type: 'closet' | 'kitchen' | 'garage' | 'other';
    created_at: string;
}

export interface ServiceItem {
    id: string;
    image_url: string;
    public_id: string;
    title: string;
    description: string | null;
    type: 'closet' | 'kitchen' | 'garage' | 'other';
    created_at: string;
}

export interface BeforeAfterItem {
    id: string;
    before_image_url: string;
    before_public_id: string;
    after_image_url: string;
    after_public_id: string;
    title: string;
    description: string | null;
    type: 'closet' | 'kitchen' | 'garage' | 'other';
    is_active: boolean;
    order_index: number;
    created_at: string;
}
