import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cloudinaryService, CLOUDINARY_FOLDERS, type CloudinaryImage } from "@/lib/cloudinaryService";

export const BeforeAfter = () => {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await cloudinaryService.fetchImages(CLOUDINARY_FOLDERS.BEFORE_AFTER);
        setImages(data);
      } catch (error) {
        console.error("Failed to fetch before-after images:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (images.length === 0) return null;

  // Pair images: assume they're uploaded in pairs (before, after)
  const pairs: [CloudinaryImage, CloudinaryImage | undefined][] = [];
  for (let i = 0; i < images.length; i += 2) {
    pairs.push([images[i], images[i + 1]]);
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-10">Before & After</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {pairs.map(([before, after], idx) => (
            <div key={idx} className="grid grid-cols-2 gap-3 rounded-xl overflow-hidden shadow-md bg-card p-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Before</span>
                <img
                  src={before.url}
                  alt="Before"
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
              {after && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">After</span>
                  <img
                    src={after.url}
                    alt="After"
                    className="w-full h-48 object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};