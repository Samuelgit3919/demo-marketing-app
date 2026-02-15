import { supabase } from "@/integrations/supabase/client";

export const CLOUDINARY_FOLDERS = {
  GALLERY: "gallery",
  BEFORE_AFTER: "before-after",
  SERVICES: "service"
} as const;

export interface CloudinaryImage {
  id: string;
  public_id: string;
  url: string;
  folder: string | null;
  created_at: string;
}

export const cloudinaryService = {
  async fetchAllFiles(retries = 3): Promise<CloudinaryImage[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("cloudinary_files")
          .select("id,url,public_id,folder,created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;

        return data || [];
      } catch (error) {
        console.error(`Fetch all files attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    return [];
  },

  async fetchImages(folder: string, retries = 3): Promise<CloudinaryImage[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from("cloudinary_files")
          .select("id,url,public_id,folder,created_at")
          .eq("folder", folder)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // If DB has images, return them
        if (data && data.length > 0) {
          return data;
        }

        // If DB is empty, try fetching from Cloudinary
        console.log(`No images in DB for folder ${folder}, fetching from Cloudinary`);
        try {
          const { data: listData, error: listError } = await supabase.functions.invoke("cloudinary-list", {
            body: { folder },
          });

          if (listError) {
            console.error('Cloudinary list function failed:', {
              message: listError.message,
              name: listError.name,
              details: listError
            });
            return [];
          }

          return (listData as CloudinaryImage[]) || [];
        } catch (cloudinaryError) {
          console.warn("Failed to fetch from Cloudinary, returning empty array:", cloudinaryError);
          return [];
        }
      } catch (error) {
        console.error(`Fetch images attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return [];
  },

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

  async deleteImage(publicId: string): Promise<void> {
    try {
      // supabase.functions.invoke throws for non-2xx responses — capture and normalize errors
      const res = await supabase.functions.invoke("cloudinary-delete", { body: { publicId } });

      // Some SDK responses include an `error` field even on 2xx — handle that too
      if ((res as any).error) {
        const funcErr = (res as any).error;
        console.error("Delete function returned error payload:", funcErr);
        throw new Error(funcErr.message || JSON.stringify(funcErr));
      }

      return;
    } catch (err: unknown) {
      console.error("Delete function error details:", err);

      const anyErr = err as any;

      // Try several heuristics to detect a 401 / auth-related function response
      const status = anyErr?.status || anyErr?.response?.status || anyErr?.statusCode || null;
      let bodyMessage: string | null = null;

      try {
        if (anyErr?.response?.json) {
          // some SDK errors expose parsed JSON
          bodyMessage = anyErr.response.json?.message || anyErr.response.json?.error || null;
        } else if (anyErr?.message && typeof anyErr.message === "string") {
          const m = anyErr.message.match(/\{.*\}$/s);
          if (m) {
            const parsed = JSON.parse(m[0]);
            bodyMessage = parsed.message || parsed.error || null;
          }
        }
      } catch (_parseErr) {
        /* ignore parse errors */
      }

      const msg = (err instanceof Error && err.message) ? err.message : (bodyMessage || String(err));

      if (status === 401 || /Missing authorization header|Invalid JWT|Unauthorized/.test(msg) || /401/.test(String(status))) {
        throw new Error("Unauthorized: cloudinary-delete requires a valid user session. Please sign in again.");
      }

      throw new Error(`Delete function failed: ${msg}`);
    }
  },
};