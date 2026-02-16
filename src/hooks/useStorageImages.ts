import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StorageImage {
  public_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  folder: string;
  filename: string;
}

export const useStorageImages = (folder: string) => {
  return useQuery({
    queryKey: ["storage-images", folder],
    queryFn: async (): Promise<StorageImage[]> => {
      const { data, error } = await supabase.storage
        .from("images")
        .list(folder);

      if (error) throw error;

      const images = (data || []).filter(file => file.name !== '.emptyFolderPlaceholder').map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from("images")
          .getPublicUrl(`${folder}/${file.name}`);

        return {
          public_id: `${folder}/${file.name}`,
          url: publicUrl,
          width: 0, // Metadata not easily available from list
          height: 0,
          format: file.name.split('.').pop() || '',
          created_at: file.created_at,
          folder: folder,
          filename: file.name
        } as StorageImage;
      });

      return images;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
