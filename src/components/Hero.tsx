import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Ruler, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-closet.jpg";
import { Link } from "react-scroll";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { NavLink } from "react-router-dom";

export const Hero = () => {
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });
  return (
    <section
      ref={elementRef as React.RefObject<HTMLElement>}
      className="relative min-h-screen flex items-center pt-20 md:pt-24"
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8 md:py-0">
        <div className={`max-w-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
            Transform Your Space with <span className="text-accent">Custom Design</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 md:mb-8 leading-relaxed">
            Professional closet, kitchen, and garage design made simple. Share your measurements,
            upload photos, custom design or videos, and book a free consultation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 md:mb-12">
            <NavLink to="/wizard">
              <Button size="lg" variant="accent" className="text-base md:text-lg group w-full sm:w-auto">
                Get Free Consultation
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </NavLink>
            <Link
              to="services"
              smooth
              duration={600}
              offset={-80}
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                variant="outline"
                className="text-base md:text-lg bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm w-full sm:w-auto"
              >
                View Our Work
              </Button>
            </Link>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Ruler className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              </div>
              <span className="font-medium text-sm md:text-base">Share Measurements</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              </div>
              <span className="font-medium text-sm md:text-base">Upload Photos or video</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              </div>
              <span className="font-medium text-sm md:text-base">Book Consultation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
