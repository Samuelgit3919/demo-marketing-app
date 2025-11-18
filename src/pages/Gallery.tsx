import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Footer } from "@/components/Footer";

type RoomType = "all" | "closet" | "kitchen" | "garage";

interface Project {
  id: number;
  title: string;
  type: RoomType;
  image: string;
  description: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Modern Walk-In Closet",
    type: "closet",
    image: "https://i.pinimg.com/736x/7c/4b/20/7c4b2024860c5b62c1dfd85157c74351.jpg",
    description: "Custom organized closet with LED lighting and premium finishes"
  },
  {
    id: 2,
    title: "Luxury Master Closet",
    type: "closet",
    image: "https://i.pinimg.com/1200x/01/2e/11/012e114ce36e37e8b30936f068a64f43.jpg",
    description: "Elegant closet design with island and chandelier"
  },
  {
    id: 3,
    title: "Contemporary Closet System",
    type: "closet",
    image: "https://i.pinimg.com/736x/ce/85/21/ce852105f77bb7d802853d4a77b77cb1.jpg",
    description: "Sleek and functional closet organization system"
  },
  {
    id: 4,
    title: "Modern Kitchen Renovation",
    type: "kitchen",
    image: "https://i.pinimg.com/736x/8d/9b/91/8d9b91e04629c08002e307232baaef7c.jpg",
    description: "Complete kitchen transformation with custom cabinetry"
  },
  {
    id: 5,
    title: "Gourmet Kitchen Design",
    type: "kitchen",
    image: "https://i.pinimg.com/1200x/9f/2b/ba/9f2bba36bc0e61a6ccc8c0d83a8bcef7.jpg",
    description: "High-end kitchen with premium appliances and finishes"
  },
  {
    id: 6,
    title: "Contemporary Kitchen",
    type: "kitchen",
    image: "https://i.pinimg.com/736x/46/03/35/460335456cfb1f6910a8e933110fa8c4.jpg",
    description: "Minimalist kitchen design with smart storage solutions"
  },
  {
    id: 7,
    title: "Organized Garage System",
    type: "garage",
    image: "https://i.pinimg.com/1200x/77/3e/bf/773ebfe517df884b2935e7fb338b333c.jpg",
    description: "Complete garage organization with custom storage"
  },
  {
    id: 8,
    title: "Workshop Garage Design",
    type: "garage",
    image: "https://i.pinimg.com/1200x/98/26/30/9826306fbc906e33a249cc4944ba9759.jpg",
    description: "Functional garage workspace with tool organization"
  },
  {
    id: 9,
    title: "Premium Garage Storage",
    type: "garage",
    image: "https://i.pinimg.com/1200x/81/b6/b1/81b6b130e736a41c9b7f638c0b718766.jpg",
    description: "High-end garage storage solutions and flooring"
  }
];

const Gallery = () => {
  const [selectedFilter, setSelectedFilter] = useState<RoomType>("all");
  const { elementRef: headerRef, isVisible: headerVisible } = useIntersectionObserver();
  const { elementRef: filterRef, isVisible: filterVisible } = useIntersectionObserver();

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
        </div>
      </section>

      <Footer />
    </div>
  );
};

const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
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
          src={project.image}
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
