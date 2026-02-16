import { supabase } from "@/integrations/supabase/client";
import { storageService } from "./storageService";
import { 
  type ImageAsset, 
  type GalleryItem, 
  type SupabaseFile, 
  type ServiceItem, 
  type BeforeAfterItem 
} from "@/types/image";

export type { ServiceItem, BeforeAfterItem, SupabaseFile, GalleryItem, ImageAsset };

export const IMAGE_BUCKET = "images";

export const IMAGE_FOLDERS = {
  GALLERY: "gallery",  
  BEFORE_AFTER: "before-after",
  SERVICES: "service"
} as const;

export const imageService = {

  async uploadImage(file: File, folder: string, options?: { originalName?: string; uploadedBy?: string }, retries = 3): Promise<{ url: string; path: string }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
        const path = `${folder}/${fileName}`;

        const data = await storageService.uploadFile(file, IMAGE_BUCKET, path);
        return data;
      } catch (error) {
        console.error(`Upload image attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error("Upload failed after retries");
  },

  async fetchGallery(retries = 3): Promise<GalleryItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(`Fetch gallery attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return [];
  },

  async fetchServices(retries = 3): Promise<ServiceItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(`Fetch services attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return [];
  },

  async fetchBeforeAfter(retries = 3): Promise<BeforeAfterItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("before_after")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(`Fetch before_after attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return [];
  },

  async uploadBeforeAfter(
    beforeFile: File, 
    afterFile: File, 
    data: { title: string; description?: string; type: string },
    retries = 3
  ): Promise<void> {
    const timestamp = Date.now();
    const beforeFileName = `before-${timestamp}-${beforeFile.name.replace(/\s+/g, '_')}`;
    const afterFileName = `after-${timestamp}-${afterFile.name.replace(/\s+/g, '_')}`;
    const beforePath = `${IMAGE_FOLDERS.BEFORE_AFTER}/${beforeFileName}`;
    const afterPath = `${IMAGE_FOLDERS.BEFORE_AFTER}/${afterFileName}`;

    const cleanupUploads = async (paths: string[]) => {
      for (const path of paths) {
        try {
          await storageService.deleteFile(IMAGE_BUCKET, path);
        } catch (cleanupError) {
          console.warn(`Failed to cleanup storage asset ${path}:`, cleanupError);
        }
      }
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // 1. Upload Before image
        const { url: beforeUrl, path: uploadedBeforePath } = await storageService.uploadFile(beforeFile, IMAGE_BUCKET, beforePath);

        // 2. Upload After image
        let afterUrl: string;
        let uploadedAfterPath: string;
        try {
          const res = await storageService.uploadFile(afterFile, IMAGE_BUCKET, afterPath);
          afterUrl = res.url;
          uploadedAfterPath = res.path;
        } catch (afterErr) {
          if (uploadedBeforePath) await cleanupUploads([uploadedBeforePath]);
          throw afterErr;
        }

        // 3. Create DB record
        const { error: dbError } = await supabase
          .from("before_after")
          .insert({
            title: data.title,
            description: data.description || null,
            type: data.type as any,
            before_image_url: beforeUrl,
            before_public_id: uploadedBeforePath,
            after_image_url: afterUrl,
            after_public_id: uploadedAfterPath,
            is_active: true
          });

        if (dbError) {
          await cleanupUploads([uploadedBeforePath, uploadedAfterPath]);
          throw dbError;
        }

        return;
      } catch (error) {
        console.error(`Upload before_after attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  },

  async deleteItem(id: string, table: string, publicIds: string[]): Promise<void> {
    try {
      // 1. Delete from Supabase Storage (loop through all related paths)
      for (const path of publicIds) {
        await storageService.deleteFile(IMAGE_BUCKET, path);
      }

      // 2. Delete from Supabase table
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return;
    } catch (err: any) {
      console.error(`Delete from ${table} failed:`, err);
      throw err;
    }
  },

  async deleteImage(publicId: string, table: "gallery" | "services" | "before_after"): Promise<void> {
    try {
      // First delete from Supabase Storage
      await storageService.deleteFile(IMAGE_BUCKET, publicId);

      // Then delete from the corresponding Supabase table
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq("public_id", publicId);
      
      if (error) throw error;

      return;
    } catch (err: unknown) {
      console.error("Delete function error details:", err);
      throw err;
    }
  },
};
