import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  return (
    <section
      ref={elementRef as React.RefObject<HTMLElement>}
      className={`py-24 bg-gradient-hero transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              See Our Process in Action
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Watch how we transform ordinary spaces into extraordinary organized environments
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-large aspect-video bg-black">
            {!isPlaying && (
              <>
                <img
                  src="/videos/closet-cover.jpg"
                  alt="Video cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    variant="accent"
                    onClick={() => setIsPlaying(true)}
                    className="h-20 w-20 rounded-full p-0 hover:scale-110 transition-transform"
                  >
                    <Play className="w-10 h-10 ml-1" fill="currentColor" />
                  </Button>
                </div>
              </>
            )}


            {/* 
        
            */}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <iframe width="1266" height="712" src="https://www.youtube.com/embed/YSZsHwAM5c4" title="Stunning Walk-In Closet Ideas 2025 | Luxury Closet Designs | Chic Storage Solutions" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/70 text-sm">
              * Click to play our showcase video demonstrating design transformations
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
