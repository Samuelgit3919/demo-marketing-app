import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import kitchenDesign from "@/assets/kitchen-design.jpg";
import closetDesign from "@/assets/closet-design.jpg";
import garageDesign from "@/assets/garage-design.jpg";
import bedDesign from "@/assets/bed_design.jpg";
import kitchenCabinet from "@/assets/kitchen_cabbinet.jpg";
import tvTable from "@/assets/tv_table.png";
import shoesFur from "@/assets/shoes_fur.png";
import heroCloset from "@/assets/hero-closet.jpg";

type RoomType = "all" | "closet" | "kitchen" | "garage";

interface Project {
    id: number;
    title: string;
    type: RoomType;
    image: string;
    description: string;
}

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

const GalleryDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const projects = fallbackProjects;
    const projectIndex = projects.findIndex((p) => p.id === Number(id));
    const project = projects[projectIndex] ?? projects[0];

    const [activeIndex, setActiveIndex] = useState(0);

    // Use all project images as the "album" for this detail view
    const allImages = projects.map((p) => p.image);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (projectIndex >= 0) setActiveIndex(projectIndex);
    }, [projectIndex, id]);

    const goNext = () => setActiveIndex((prev) => (prev + 1) % allImages.length);
    const goPrev = () => setActiveIndex((prev) => (prev - 1 + allImages.length) % allImages.length);


    // Related projects: same type, excluding current
    const relatedProjects = projects
        .filter((p) => p.type === project?.type && p.id !== project?.id)
        .slice(0, 4);

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            {/* Breadcrumb / Back */}
            <section className="pt-24 pb-4">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <button onClick={() => navigate("/gallery")} className="hover:text-foreground transition-colors">Gallery</button>
                        <span>/</span>
                        <span className="text-foreground">{project?.title}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/gallery")}
                        className="gap-2 text-muted-foreground hover:text-foreground -ml-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Gallery
                    </Button>
                </div>
            </section>

            {/* Main Detail */}
            <section className="pb-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                        {/* Left: Info */}
                        <div className="lg:col-span-2 flex flex-col justify-center">
                            <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider rounded-full w-fit mb-4">
                                {project?.type}
                            </span>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
                                {project?.title}
                            </h1>
                            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                                {project?.description}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground border-t border-border pt-5">
                                <span className="font-medium text-foreground">{activeIndex + 1}</span>
                                <span>of</span>
                                <span className="font-medium text-foreground">{allImages.length}</span>
                                <span>photos in this collection</span>
                            </div>
                        </div>

                        {/* Right: Images */}
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            {/* Main Image */}
                            <div className="relative aspect-[4/3] bg-foreground/5 overflow-hidden shadow-large">
                                <img
                                    src={allImages[activeIndex]}
                                    alt={`${project?.title} - Photo ${activeIndex + 1}`}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />
                                {/* Gradient overlay at bottom for controls */}
                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                                {allImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={goPrev}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:bg-background shadow-medium transition-all hover:scale-105"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-foreground" />
                                        </button>
                                        <button
                                            onClick={goNext}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:bg-background shadow-medium transition-all hover:scale-105"
                                        >
                                            <ChevronRight className="w-5 h-5 text-foreground" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Row */}
                            {allImages.length > 1 && (
                                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveIndex(idx)}
                                            className={`flex-shrink-0 w-20 h-16 sm:w-28 sm:h-20 overflow-hidden border-2 transition-all duration-200 ${activeIndex === idx
                                                ? "border-accent shadow-md scale-105 opacity-100"
                                                : "border-transparent opacity-60 hover:opacity-100"
                                                }`}
                                        >
                                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="container mx-auto px-4">
                <div className="border-t border-border" />
            </div>

            {/* Related Projects */}
            {relatedProjects.length > 0 && (
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Related Projects</h2>
                                <p className="text-muted-foreground mt-1">More {project?.type} designs you might like</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate("/gallery")}
                                className="hidden sm:flex"
                            >
                                View All
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProjects.map((rp) => (
                                <button
                                    key={rp.id}
                                    onClick={() => navigate(`/gallery/${rp.id}`)}
                                    className="group text-left overflow-hidden border border-border bg-card hover:shadow-large transition-all duration-300"
                                >
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img
                                            src={rp.image}
                                            alt={rp.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">{rp.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{rp.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
};

export default GalleryDetailPage;
