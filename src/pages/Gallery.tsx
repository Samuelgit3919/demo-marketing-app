import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Footer } from "@/components/Footer";
import { cloudinaryService } from "@/lib/cloudinaryService";
import { type GalleryItem } from "@/types/cloudinary";
import { Loader2 } from "lucide-react";

type RoomType = "all" | "closet" | "kitchen" | "garage" | "other";

const Gallery = () => {
  const [selectedFilter, setSelectedFilter] = useState<RoomType>("all");
  const [projects, setProjects] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { elementRef: headerRef, isVisible: headerVisible } = useIntersectionObserver();
  const { elementRef: filterRef, isVisible: filterVisible } = useIntersectionObserver();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await cloudinaryService.fetchGallery();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching gallery projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = selectedFilter === "all"
    ? projects
    : projects.filter(p => p.type === selectedFilter);

  const scrollToGallery = () => {
    document.getElementById('gallery-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section
        ref={headerRef as React.RefObject<HTMLElement>}
        className={`pt-24 pb-12 bg-gradient-hero text-primary-foreground transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our Projects Gallerye
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Explore our portfolio of stunning transformations across closets, kitchens, and garages
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={scrollToGallery}
            className="shadow-medium"
          >
            View Projects
          </Button>
        </div>
      </section>

      {/* Filter Section */}
      <section
        ref={filterRef as React.RefObject<HTMLElement>}
        className={`py-12 bg-secondary/30 transition-all duration-700 ${filterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedFilter("all")}
              className="transition-all duration-300"
            >
              All Projects
            </Button>
            <Button
              variant={selectedFilter === "closet" ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedFilter("closet")}
              className="transition-all duration-300"
            >
              Closets
            </Button>
            <Button
              variant={selectedFilter === "kitchen" ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedFilter("kitchen")}
              className="transition-all duration-300"
            >
              Kitchens
            </Button>
            <Button
              variant={selectedFilter === "garage" ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedFilter("garage")}
              className="transition-all duration-300"
            >
              Garages
            </Button>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section id="gallery-grid" className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-xl text-muted-foreground animate-pulse">Loading gallery items...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>

              {filteredProjects.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-2xl text-muted-foreground">No projects found in this category.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

const ProjectCard = ({ project, index }: { project: GalleryItem; index: number }) => {
  const { elementRef, isVisible } = useIntersectionObserver();

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`group relative overflow-hidden rounded-lg shadow-medium hover:shadow-large transition-all duration-700 ${isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-10'
        }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={project.image_url}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
          <p className="text-sm text-primary-foreground/90">{project.description}</p>
          <span className="inline-block mt-3 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full uppercase">
            {project.type}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
