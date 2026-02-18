import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Footer } from "@/components/Footer";
import kitchenDesign from "@/assets/kitchen-design.jpg";
import closetDesign from "@/assets/closet-design.jpg";
import garageDesign from "@/assets/garage-design.jpg";
import bedDesign from "@/assets/bed_design.jpg";
import kitchenCabinet from "@/assets/kitchen_cabbinet.jpg";
import tvTable from "@/assets/tv_table.png";
import shoesFur from "@/assets/shoes_fur.png";
import heroCloset from "@/assets/hero-closet.jpg";

type RoomType = "all" | "closet" | "kitchen" | "garage";

const Gallery = () => {
  const [selectedFilter, setSelectedFilter] = useState<RoomType>("all");
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const { elementRef: headerRef, isVisible: headerVisible } = useIntersectionObserver();
  const { elementRef: filterRef, isVisible: filterVisible } = useIntersectionObserver();

  const handleImageClick = (projectId: number) => {
    navigate(`/gallery/${projectId}`);
  };

  const fallbackProjects: Project[] = [
    { id: 1, title: "Modern Walk-in Closet", type: "closet", image: closetDesign, description: "Custom walk-in closet with built-in shelving" },
    { id: 2, title: "Luxury Kitchen Remodel", type: "kitchen", image: kitchenDesign, description: "Full kitchen transformation with premium finishes" },
    { id: 3, title: "Garage Organization", type: "garage", image: garageDesign, description: "Complete garage storage and workspace solution" },
    { id: 4, title: "Master Bedroom Built-ins", type: "closet", image: bedDesign, description: "Custom bedroom cabinetry and storage" },
    { id: 5, title: "Kitchen Cabinetry", type: "kitchen", image: kitchenCabinet, description: "Handcrafted kitchen cabinets with soft-close hardware" },
    { id: 6, title: "Entertainment Center", type: "closet", image: tvTable, description: "Custom TV unit with integrated storage" },
    { id: 7, title: "Shoe & Wardrobe Storage", type: "closet", image: shoesFur, description: "Elegant shoe display and wardrobe organization" },
    { id: 8, title: "Premium Closet System", type: "closet", image: heroCloset, description: "High-end closet system with lighting" },
  ];

  const projects = fallbackProjects;

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
        className={`pt-24 pb-12 bg-gradient-hero text-primary-foreground transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Projects Gallery</h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Explore our portfolio of stunning transformations across closets, kitchens, and garages
          </p>
          <Button variant="secondary" size="lg" onClick={scrollToGallery} className="shadow-medium">
            View Projects
          </Button>
        </div>
      </section>

      {/* Filter Section */}
      <section
        ref={filterRef as React.RefObject<HTMLElement>}
        className={`py-12 bg-secondary/30 transition-all duration-700 ${filterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {(["all", "closet", "kitchen", "garage"] as RoomType[]).map((type) => (
              <Button
                key={type}
                variant={selectedFilter === type ? "default" : "outline"}
                size="lg"
                onClick={() => { setSelectedFilter(type); setShowAll(false); }}
                className="transition-all duration-300 capitalize"
              >
                {type === "all" ? "All Projects" : `${type}s`}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section id="gallery-grid" className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(showAll ? filteredProjects : filteredProjects.slice(0, 9)).map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} onClick={() => handleImageClick(project.id)} />
            ))}
          </div>
          {!showAll && filteredProjects.length > 9 && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAll(true)}
                className="gap-2"
              >
                See More Projects ({filteredProjects.length - 9} more)
              </Button>
            </div>
          )}

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

interface Project {
  id: number;
  title: string;
  type: RoomType;
  image: string;
  description: string;
}

const ProjectCard = ({ project, index, onClick }: { project: Project; index: number; onClick: () => void }) => {
  const { elementRef, isVisible } = useIntersectionObserver();

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      onClick={onClick}
      className={`group relative overflow-hidden shadow-medium hover:shadow-large transition-all duration-700 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
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
