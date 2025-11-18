import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Ruler, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-closet.jpg";
import { Link } from "react-scroll";
import { NavLink } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            Transform Your Space with <span className="text-accent">Custom Design</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Professional closet, kitchen, and garage design made simple. Share your measurements,
            upload photos,custom design or videos, and book a free consultation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <NavLink to="/wizard">
              <Button size="lg" variant="accent" className="text-lg group">
                Get Free Consultation
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </NavLink>
            <Link
              to="services"
              smooth
              duration={600}
              offset={-80}
            >
              <Button
                size="lg"
                variant="outline"
                className="text-lg bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
              >
                View Our Work
              </Button>
            </Link>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-12 h-12 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                <Ruler className="w-6 h-6 text-accent" />
              </div>
              <span className="font-medium">Share Measurements</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-12 h-12 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <span className="font-medium">Upload Photos or video</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-12 h-12 rounded-lg bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <span className="font-medium">Book Consultation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
