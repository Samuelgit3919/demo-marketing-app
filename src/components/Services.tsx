import { useEffect, useState } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import closetImage from "@/assets/cloth_desig2.jpg";
import kitchenImage from "@/assets/kitchen-design.jpg";
import garageImage from "@/assets/garage-design.jpg";
import kitchenCabinetImage from "@/assets/cabinetry1.jpg";
import BedDesign from "@/assets/bed_design.jpg";
import ShoesDesign from "@/assets/shoes-design.jpg";
import { type ServiceItem, cloudinaryService } from "@/lib/cloudinaryService";

interface ServiceViewModel {
  title: string;
  description: string;
  image: string;
  features: string[];
}

const DEFAULT_SERVICES: ServiceViewModel[] = [
  {
    title: "Custom Closets",
    description: "Walk-in closets, reach-in closets, and wardrobe systems designed to maximize space and style.",
    image: closetImage,
    features: ["Custom Shelving", "Drawer Systems", "Lighting Design", "Luxury Finishes"],
  },
  {
    title: "Kitchen Design",
    description: "Beautiful kitchen organization with custom cabinetry and storage solutions that blend form and function.",
    image: kitchenImage,
    features: ["Cabinet Design", "Pantry Organization", "Island Storage", "Smart Solutions"],
  },
  {
    title: "Garage Systems",
    description: "Transform your garage into an organized workspace with professional storage systems and workbenches.",
    image: garageImage,
    features: ["Wall Systems", "Overhead Storage", "Workbenches", "Tool Organization"],
  },
  {
    title: "Kitchen Cabinets",
    description: "High-quality, custom kitchen cabinets tailored to your style and storage needs.",
    image: kitchenCabinetImage,
    features: ["Custom Sizes", "Premium Materials", "Soft-Close Drawers", "Modern & Classic Styles"],
  },
  {
    title: "Bedroom Storage",
    description: "Maximize bedroom space with custom wardrobes, under-bed storage, and shelving solutions.",
    image: BedDesign,
    features: ["Built-in Wardrobes", "Under-Bed Drawers", "Floating Shelves", "Closet Organizers"],
  },
  {
    title: "Shoe Storage",
    description: "Keep your footwear organized and accessible with custom shoe racks and display solutions.",
    image: ShoesDesign,
    features: ["Shoe Racks", "Display Shelves", "Pull-out Drawers", "Adjustable Shelving"],
  },
];

export const Services = () => {
  const [selectedService, setSelectedService] = useState(0);
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  const [services, setServices] = useState<ServiceViewModel[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await cloudinaryService.fetchServices();
        console.log(data);
        if (data && data.length > 0) {
          // Transform if necessary, or just use as is if schema matches
          const transformed: ServiceViewModel[] = data.map(item => ({
            title: item.title,
            description: item.description || "",
            image: item.image_url,
            features: ["Professional Design", "Custom Solution", "Quality Materials"] // Fallback features
          }));

          setServices(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);


  return (
    <section
      id="services"
      ref={elementRef as React.RefObject<HTMLElement>}
      className={`py-24 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our <span className="text-accent">Services</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional design solutions for every space in your home
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Image Display */}
            <div className="lg:col-span-2">
              <div className="relative h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden rounded-xl md:rounded-2xl group">
                <img
                  src={services[selectedService].image}
                  alt={services[selectedService].title}
                  className="w-full h-full object-cover object-center transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3">
                    {services[selectedService].title}
                  </h3>
                  <p className="text-white/90 text-sm sm:text-base md:text-lg mb-3 md:mb-4 line-clamp-2 sm:line-clamp-none">
                    {services[selectedService].description}
                  </p>
                  <ul className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:gap-2">
                    {services[selectedService].features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-white/90 text-xs sm:text-sm md:text-base">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"></div>
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Thumbnail Grid (First 3) - Hidden on mobile, shows on lg */}
            <div className="hidden lg:grid grid-cols-1 gap-4">
              {services.slice(0, 3).map((service, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedService(index)}
                  className={`relative h-[188px] overflow-hidden rounded-xl cursor-pointer transition-all duration-300 ${selectedService === index
                    ? 'ring-4 ring-accent shadow-large scale-105'
                    : 'hover:scale-105 hover:shadow-medium opacity-80 hover:opacity-100'
                    }`}
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h4 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white">
                    {service.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile & Tablet Horizontal Scroll - All Thumbnails */}
          <div className="lg:hidden mt-4 md:mt-6">
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {services.map((service, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedService(index)}
                  className={`relative flex-shrink-0 w-32 sm:w-40 h-32 sm:h-40 overflow-hidden rounded-lg cursor-pointer transition-all duration-300 snap-start ${selectedService === index
                    ? 'ring-3 ring-accent shadow-large scale-105'
                    : 'opacity-70 hover:opacity-100 active:scale-95'
                    }`}
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <h4 className="absolute bottom-2 left-2 right-2 text-xs sm:text-sm font-bold text-white leading-tight">
                    {service.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Bottom Grid (Remaining services) */}
          {services.length > 3 && (
            <div className="hidden lg:grid grid-cols-3 gap-4 mt-6">
              {services.slice(3).map((service, index) => (
                <div
                  key={index + 3}
                  onClick={() => setSelectedService(index + 3)}
                  className={`relative h-56 overflow-hidden rounded-xl cursor-pointer transition-all duration-300 ${selectedService === index + 3
                    ? 'ring-4 ring-accent shadow-large scale-105'
                    : 'hover:scale-105 hover:shadow-medium opacity-80 hover:opacity-100'
                    }`}
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h4 className="absolute bottom-3 left-3 right-3 text-lg font-bold text-white">
                    {service.title}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
