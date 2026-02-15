import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import before from "@/assets/beforeAfter/before1.jpg";
import after from "@/assets/beforeAfter/after1.jpg";
import before2 from "@/assets/beforeAfter/before2.jpg";
import after2 from "@/assets/beforeAfter/after2.jpg";
import before3 from "@/assets/beforeAfter/before3.jpeg";
import after3 from "@/assets/beforeAfter/after3.jpeg";



const projects = [
  {
    id: 1,
    before: before,
    after: after,
    thumbnail: after,
  },
  {
    id: 2,
    before: before2,
    after: after2,
    thumbnail: after2,
  },
  {
    id: 3,
    before: before3,
    after: after3,
    thumbnail: after3,
  },
  {
    id: 4,
    before: before,
    after: after,
    thumbnail: after
  },
  {
    id: 5,
    before: before2,
    after: after2,
    thumbnail: after2,
  },
  {
    id: 6,
    before: before3,
    after: after3,
    thumbnail: after3,
  },
];

export const BeforeAfter = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      dragFree: true,
      loop: true,
      align: "start",
      containScroll: "trimSnaps"
    },
    [Autoplay({ delay: 3000, stopOnInteraction: true })]
  );
  const [activeProject, setActiveProject] = useState(projects[0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false });
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedSlides(emblaApi.selectedScrollSnap() ? [emblaApi.selectedScrollSnap()] : []);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition(prev => Math.max(prev - 5, 0));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(prev => Math.min(prev + 5, 100));
    }
  };

  useEffect(() => {
    setImagesLoaded({ before: false, after: false });
    setSliderPosition(50);
  }, [activeProject]);

  useEffect(() => {
    const fetchImages = async () => {
      const { data: files, error } = await supabase
        .storage
        .from("services-images")
        .list("beforeafter", {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error(error);
        return;
      }

      console.log(files);
    };

    fetchImages();
  }, []);


  return (
    <section
      ref={elementRef as React.RefObject<HTMLElement>}
      className={`py-32 bg-gradient-subtle relative overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`text-center mb-20 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="inline-block mb-4 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-semibold tracking-wide">
            TRANSFORMATIONS
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Closet <span className="text-accent relative inline-block">
              Transformations
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-accent rounded-full" />
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the dramatic difference our expert design brings to every project
          </p>
        </div>

        {/* Preview Panel */}
        <div className={`mb-16 flex justify-center items-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <div className="w-full max-w-5xl rounded-2xl overflow-hidden bg-card shadow-elegant border border-border/50 p-2 transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]">
            <div
              className="relative rounded-2xl overflow-hidden aspect-video cursor-ew-resize select-none group focus:outline-none focus:ring-4 focus:ring-accent/50"
              tabIndex={0}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
              onKeyDown={handleKeyDown}
              role="slider"
              aria-label="Before and after comparison slider"
              aria-valuenow={sliderPosition}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {/* Loading State */}
              {(!imagesLoaded.before || !imagesLoaded.after) && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-accent animate-spin" />
                </div>
              )}

              {/* Before Image */}
              <img
                src={activeProject.after}
                alt="After transformation"
                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
                style={{ opacity: imagesLoaded.after ? 1 : 0 }}
                onLoad={() => setImagesLoaded(prev => ({ ...prev, after: true }))}
              />

              {/* After Image with clip */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                  transition: isDragging ? 'none' : 'clip-path 0.1s ease-out'
                }}
              >

                <img
                  src={activeProject.before}
                  alt="Before transformation"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
                  style={{ opacity: imagesLoaded.before ? 1 : 0 }}
                  onLoad={() => setImagesLoaded(prev => ({ ...prev, before: true }))}
                />
              </div>

              {/* Slider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-white via-white to-white shadow-[0_0_20px_rgba(255,255,255,0.8)] backdrop-blur-sm z-20"
                style={{
                  left: `${sliderPosition}%`,
                  transition: isDragging ? 'none' : 'left 0.1s ease-out'
                }}
              >
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-white to-white/90 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.3)] flex items-center justify-center border-4 border-accent/30 transition-all duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <div className="flex gap-1.5">
                    <ChevronLeft className="w-4 h-4 text-foreground/60" strokeWidth={3} />
                    <ChevronRight className="w-4 h-4 text-foreground/60" strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-6 left-6 bg-gradient-to-br from-foreground/90 to-foreground/80 backdrop-blur-md text-background px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider shadow-elegant z-10 transition-all duration-300 hover:scale-105">
                Before
              </div>
              <div className="absolute top-6 right-6 bg-gradient-to-br from-accent via-accent to-accent/90 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider shadow-elegant z-10 transition-all duration-300 hover:scale-105">
                After
              </div>

              {/* Instruction hint */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-foreground/70 backdrop-blur-md text-white px-6 py-2.5 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                ← Drag or use arrow keys to compare →
              </div>
            </div>
          </div>
        </div>



        {/* Horizontal Slider with Navigation */}
        <div className={`relative transition-all  duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          {/* Navigation Buttons */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-gradient-to-br from-white via-white to-white/95 backdrop-blur-md rounded-full shadow-elegant flex items-center justify-center transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none border-2 border-accent/20 group"
            aria-label="Previous projects"
          >
            <ChevronLeft className="w-7 h-7 text-foreground transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2.5} />
          </button>

          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-gradient-to-br from-white via-white to-white/95 backdrop-blur-md rounded-full shadow-elegant flex items-center justify-center transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none border-2 border-accent/20 group"
            aria-label="Next projects"
          >
            <ChevronRight className="w-7 h-7 text-foreground transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.5} />
          </button>

          <div className="overflow-hidden mx-4" ref={emblaRef}>
            <div className="flex gap-6 py-6 cursor-grab active:cursor-grabbing touch-pan-x">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setActiveProject(project);
                    emblaApi?.scrollTo(index);
                  }}
                  className={`
                    min-w-[260px] cursor-pointer rounded-2xl overflow-hidden 
                    transition-all duration-500 ease-smooth
                    ${activeProject?.id === project.id
                      ? "ring-4 ring-accent shadow-elegant scale-105"
                      : "shadow-medium hover:shadow-elegant hover:scale-[1.02] opacity-75 hover:opacity-100"
                    }
                  `}
                >
                  <div className="relative group/card">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={project.thumbnail}
                        className="w-full h-full object-cover transition-all duration-700 ease-smooth group-hover/card:scale-110 group-hover/card:brightness-110"
                        alt={`Project ${project.id} thumbnail`}
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500">
                      <div className="bg-gradient-to-r from-white via-white to-white/95 backdrop-blur-md text-foreground px-7 py-3.5 rounded-full font-bold text-sm shadow-elegant transform translate-y-4 group-hover/card:translate-y-0 transition-all duration-500 border border-accent/20">
                        View Project →
                      </div>
                    </div>
                    {activeProject?.id === project.id && (
                      <div className="absolute top-4 right-4 bg-gradient-to-br from-accent to-accent/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-elegant animate-fade-in border border-white/20">
                        ACTIVE
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
