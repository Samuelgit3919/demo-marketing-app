import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
interface CloudinaryImage {
  public_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  folder: string;
  filename: string;
}
export const useCloudinaryImages = (folder: string) => {
  return useQuery({
    queryKey: ["cloudinary-images", folder],
    queryFn: async (): Promise<CloudinaryImage[]> => {
      const { data, error } = await supabase.functions.invoke("cloudinary-images", {
        body: { folder },
      });
      if (error) throw error;
      return data.images || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};