import { supabase } from "@/integrations/supabase/client";

export const storageService = {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(file: File, bucket: string, path: string): Promise<{ path: string; url: string }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.error(`Error uploading file to ${bucket}/${path}:`, error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl,
    };
  },

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error(`Error deleting file ${path} from ${bucket}:`, error);
      throw error;
    }
  },

  /**
   * List files in a bucket/path
   */
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      console.error(`Error listing files in ${bucket}/${path}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  },
};
