import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const projects = [
  {
    id: 1,
    before: "https://i.pinimg.com/1200x/77/3e/bf/773ebfe517df884b2935e7fb338b333c.jpg",
    after: "https://i.pinimg.com/736x/7c/4b/20/7c4b2024860c5b62c1dfd85157c74351.jpg",
    thumbnail: "https://i.pinimg.com/1200x/9f/2b/ba/9f2bba36bc0e61a6ccc8c0d83a8bcef7.jpg",
  },
  {
    id: 2,
    before: "https://i.pinimg.com/1200x/98/26/30/9826306fbc906e33a249cc4944ba9759.jpg",
    after: "https://i.pinimg.com/1200x/01/2e/11/012e114ce36e37e8b30936f068a64f43.jpg",
    thumbnail: "https://i.pinimg.com/1200x/8d/9b/91/8d9b91e04629c08002e307232baaef7c.jpg",
  },
  {
    id: 3,
    before: "https://i.pinimg.com/1200x/81/b6/b1/81b6b130e736a41c9b7f638c0b718766.jpg",
    after: "https://i.pinimg.com/736x/ce/85/21/ce852105f77bb7d802853d4a77b77cb1.jpg",
    thumbnail: "https://i.pinimg.com/736x/46/03/35/460335456cfb1f6910a8e933110fa8c4.jpg",
  },
  {
    id: 4,
    before: "https://i.pinimg.com/1200x/77/3e/bf/773ebfe517df884b2935e7fb338b333c.jpg",
    after: "https://i.pinimg.com/736x/7c/4b/20/7c4b2024860c5b62c1dfd85157c74351.jpg",
    thumbnail: "https://i.pinimg.com/1200x/9f/2b/ba/9f2bba36bc0e61a6ccc8c0d83a8bcef7.jpg",
  },
  {
    id: 5,
    before: "https://i.pinimg.com/1200x/98/26/30/9826306fbc906e33a249cc4944ba9759.jpg",
    after: "https://i.pinimg.com/1200x/01/2e/11/012e114ce36e37e8b30936f068a64f43.jpg",
    thumbnail: "https://i.pinimg.com/1200x/8d/9b/91/8d9b91e04629c08002e307232baaef7c.jpg",
  },
  {
    id: 6,
    before: "https://i.pinimg.com/1200x/81/b6/b1/81b6b130e736a41c9b7f638c0b718766.jpg",
    after: "https://i.pinimg.com/736x/ce/85/21/ce852105f77bb7d802853d4a77b77cb1.jpg",
    thumbnail: "https://i.pinimg.com/736x/46/03/35/460335456cfb1f6910a8e933110fa8c4.jpg",
  },
];

export const BeforeAfter = () => {
  const [emblaRef] = useEmblaCarousel({ dragFree: true, loop: true });
  const [activeProject, setActiveProject] = useState(projects[0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });

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

  return (
    <section 
      ref={elementRef as React.RefObject<HTMLElement>}
      className={`py-24 bg-gradient-to-b from-background to-muted/30 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Closet <span className="text-accent">Transformations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how we transform ordinary spaces into extraordinary organized solutions
          </p>
        </div>

        {/* Preview Panel */}
        <div className={`mb-12 flex justify-center items-center transition-all duration-700 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="w-full max-w-4xl rounded-2xl overflow-hidden bg-card shadow-large p-4 transition-all duration-500 hover:shadow-xl">
            <div 
              className="relative rounded-xl overflow-hidden aspect-video cursor-ew-resize select-none"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
            >
              {/* Before Image */}
              <img
                src={activeProject.after}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* After Image with clip */}
              <div 
                className="absolute inset-0 overflow-hidden transition-all duration-100"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={activeProject.before}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {/* Slider Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-0.5 h-6 bg-gray-400"></div>
                    <div className="w-0.5 h-6 bg-gray-400"></div>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                Before
              </div>
              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                After
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Slider */}
        <div className={`overflow-hidden transition-all duration-700 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} ref={emblaRef}>
          <div className="flex gap-6 px-4 cursor-grab active:cursor-grabbing">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => setActiveProject(project)}
                className={`
                  min-w-[220px] cursor-pointer rounded-xl overflow-hidden 
                  transition-all duration-300 ease-out
                  ${activeProject?.id === project.id
                    ? "ring-4 ring-accent shadow-large scale-105"
                    : "shadow-medium hover:shadow-large hover:scale-105 opacity-80 hover:opacity-100"
                  }
                `}
              >
                <div className="relative group">
                  <img
                    src={project.thumbnail}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    alt="Project thumbnail"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center font-semibold text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    View Project →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};