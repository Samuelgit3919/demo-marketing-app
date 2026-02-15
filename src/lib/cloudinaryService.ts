import { supabase } from "@/integrations/supabase/client";
import { 
  type CloudinaryAsset, 
  type GalleryItem, 
  type SupabaseFile, 
  type ServiceItem, 
  type BeforeAfterItem 
} from "@/types/cloudinary";

export type { ServiceItem, BeforeAfterItem, SupabaseFile, GalleryItem, CloudinaryAsset };

export const CLOUDINARY_FOLDERS = {
  GALLERY: "gallery",
  BEFORE_AFTER: "before-after",
  SERVICES: "service",
  TEAM: "team_members",
  BLOG: "blog_posts"
} as const;

export const cloudinaryService = {

  async uploadImage(file: File, folder: string, options?: { originalName?: string; uploadedBy?: string }, retries = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        if (options?.originalName) formData.append("original_name", options.originalName);
        if (options?.uploadedBy) formData.append("uploaded_by", options.uploadedBy);

        const { error: uploadError } = await supabase.functions.invoke('cloudinary-upload', {
          body: formData
        });

        if (uploadError) {
          console.error("Upload function error details:", uploadError);
          throw new Error(`Upload function failed: ${uploadError.message || JSON.stringify(uploadError)}`);
        }

        return;
      } catch (error) {
        console.error(`Upload image attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  },

  async fetchGallery(retries = 3): Promise<GalleryItem[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data as GalleryItem[]) || [];
      } catch (error) {
        console.error(`Fetch gallery attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
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
        return (data as ServiceItem[]) || [];
      } catch (error) {
        console.error(`Fetch services attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
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
        return (data as BeforeAfterItem[]) || [];
      } catch (error) {
        console.error(`Fetch before_after attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
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
    let beforePublicId: string | null = null;
    let afterPublicId: string | null = null;

    const cleanupUploads = async (publicIds: string[]) => {
      for (const publicId of publicIds) {
        try {
          await supabase.functions.invoke("cloudinary-delete", { body: { publicId } });
        } catch (cleanupError) {
          console.warn(`Failed to cleanup Cloudinary asset ${publicId}:`, cleanupError);
        }
      }
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // 1. Upload Before image
        const beforeFormData = new FormData();
        beforeFormData.append("file", beforeFile);
        beforeFormData.append("folder", CLOUDINARY_FOLDERS.BEFORE_AFTER);
        
        const { data: beforeRes, error: beforeErr } = await supabase.functions.invoke('cloudinary-upload', {
          body: beforeFormData
        });
        if (beforeErr) throw beforeErr;

        beforePublicId = (beforeRes as any).public_id;

        // 2. Upload After image
        const afterFormData = new FormData();
        afterFormData.append("file", afterFile);
        afterFormData.append("folder", CLOUDINARY_FOLDERS.BEFORE_AFTER);
        
        const { data: afterRes, error: afterErr } = await supabase.functions.invoke('cloudinary-upload', {
          body: afterFormData
        });
        if (afterErr) {
          // Cleanup before image if after upload fails
          if (beforePublicId) await cleanupUploads([beforePublicId]);
          throw afterErr;
        }

        afterPublicId = (afterRes as any).public_id;

        // 3. Create DB record
        const { error: dbError } = await supabase
          .from("before_after")
          .insert({
            title: data.title,
            description: data.description || null,
            type: data.type as any,
            before_image_url: (beforeRes as any).url,
            before_public_id: beforePublicId,
            after_image_url: (afterRes as any).url,
            after_public_id: afterPublicId,
            is_active: true
          });

        if (dbError) {
          // Cleanup both images if DB insert fails
          await cleanupUploads([beforePublicId, afterPublicId].filter(Boolean) as string[]);
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
      // 1. Delete from Cloudinary (loop through all related public IDs)
      for (const publicId of publicIds) {
        const { error: funcError } = await supabase.functions.invoke("cloudinary-delete", { body: { publicId } });
        if (funcError) {
          console.warn(`Cloudinary delete warning for ${publicId}:`, funcError);
        }
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
      // First delete from Cloudinary
      const res = await supabase.functions.invoke("cloudinary-delete", { body: { publicId } });

      if ((res as any).error) {
        const funcErr = (res as any).error;
        console.error("Delete function returned error payload:", funcErr);
        throw new Error(funcErr.message || JSON.stringify(funcErr));
      }

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