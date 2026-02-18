import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { imageService } from "@/lib/imageService";
import closetImage from "@/assets/cloth_desig2.jpg";
import kitchenImage from "@/assets/kitchen-design.jpg";
import garageImage from "@/assets/garage-design.jpg";
import kitchenCabinetImage from "@/assets/cabinetry1.jpg";
import BedDesign from "@/assets/bed_design.jpg";
import ShoesDesign from "@/assets/shoes-design.jpg";

// Duplicate of the interface from Services.tsx - ideally should be shared
interface ServiceViewModel {
    title: string;
    description: string;
    image: string;
    features: string[];
}

const DEFAULT_SERVICES: ServiceViewModel[] = [
    {
        title: "Custom Closets",
        description:
            "Walk-in closets, reach-in closets, and wardrobe systems designed to maximize space and style.",
        image: closetImage,
        features: [
            "Custom Shelving",
            "Drawer Systems",
            "Lighting Design",
            "Luxury Finishes",
        ],
    },
    {
        title: "Kitchen Design",
        description:
            "Beautiful kitchen organization with custom cabinetry and storage solutions that blend form and function.",
        image: kitchenImage,
        features: [
            "Cabinet Design",
            "Pantry Organization",
            "Island Storage",
            "Smart Solutions",
        ],
    },
    {
        title: "Garage Systems",
        description:
            "Transform your garage into an organized workspace with professional storage systems and workbenches.",
        image: garageImage,
        features: [
            "Wall Systems",
            "Overhead Storage",
            "Workbenches",
            "Tool Organization",
        ],
    },
    {
        title: "Kitchen Cabinets",
        description:
            "High-quality, custom kitchen cabinets tailored to your style and storage needs.",
        image: kitchenCabinetImage,
        features: [
            "Custom Sizes",
            "Premium Materials",
            "Soft-Close Drawers",
            "Modern & Classic Styles",
        ],
    },
    {
        title: "Bedroom Storage",
        description:
            "Maximize bedroom space with custom wardrobes, under-bed storage, and shelving solutions.",
        image: BedDesign,
        features: [
            "Built-in Wardrobes",
            "Under-Bed Drawers",
            "Floating Shelves",
            "Closet Organizers",
        ],
    },
    {
        title: "Shoe Storage",
        description:
            "Keep your footwear organized and accessible with custom shoe racks and display solutions.",
        image: ShoesDesign,
        features: [
            "Shoe Racks",
            "Display Shelves",
            "Pull-out Drawers",
            "Adjustable Shelving",
        ],
    },
];

const ServiceDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState<ServiceViewModel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);

        const findService = async () => {
            // Try to find in default services first
            const foundDefault = DEFAULT_SERVICES.find(s =>
                s.title.toLowerCase().replace(/\s+/g, '-') === slug
            );

            if (foundDefault) {
                setService(foundDefault);
                setLoading(false);
                return;
            }

            // If not found, try fetching from API (simulated here based on Services.tsx logic)
            try {
                const data = await imageService.fetchServices();
                if (data && data.length > 0) {
                    const foundApi = data.find((item: any) => item.title.toLowerCase().replace(/\s+/g, '-') === slug);
                    if (foundApi) {
                        setService({
                            title: foundApi.title,
                            description: foundApi.description || "",
                            image: foundApi.image_url,
                            features: [
                                "Professional Design",
                                "Custom Solution",
                                "Quality Materials",
                            ]
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch service details:", error);
            } finally {
                setLoading(false);
            }
        };

        findService();
    }, [slug]);

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <p>Loading...</p>
                </div>
                <Footer />
            </>
        );
    }

    if (!service) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
                    <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
                    <Button onClick={() => navigate("/")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-background pt-20">
                {/* Hero Section */}
                <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
                    <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-white text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {service.title}
                        </h1>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12 md:py-20">
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl font-bold mb-4 text-foreground">Overview</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {service.description}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-4">Key Features</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {service.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg border shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button size="lg" onClick={() => navigate("/wizard")}>
                                    Start Your Design
                                </Button>
                            </div>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-square md:aspect-[4/5]">
                            <img
                                src={service.image}
                                alt={`${service.title} Detail`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ServiceDetail;
