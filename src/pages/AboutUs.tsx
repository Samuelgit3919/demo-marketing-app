import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Users, Heart, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const AboutUs = () => {
  const heroSection = useIntersectionObserver({ threshold: 0.2 });
  const storySection = useIntersectionObserver({ threshold: 0.2 });
  const valuesSection = useIntersectionObserver({ threshold: 0.2 });
  const ctaSection = useIntersectionObserver({ threshold: 0.2 });
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section
        ref={heroSection.elementRef as React.RefObject<HTMLElement>}
        className={`pt-32 pb-16 bg-secondary transition-all duration-1000 ${heroSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              About Closet Design Wizard
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transforming spaces and lives for over 15 years with custom design solutions
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section
        ref={storySection.elementRef as React.RefObject<HTMLElement>}
        className={`py-24 bg-background transition-all duration-1000 ${storySection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-4xl font-bold text-foreground mb-6">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  Founded in 2009, Closet Design Wizard began with a simple mission: to help people create organized, beautiful spaces that enhance their daily lives.
                </p>
                <p className="text-muted-foreground mb-4">
                  What started as a small family business has grown into a trusted name in custom closet and storage solutions, serving hundreds of satisfied customers throughout the region.
                </p>
                <p className="text-muted-foreground">
                  Today, we combine traditional craftsmanship with modern design technology to deliver exceptional results that exceed expectations.
                </p>
              </div>
              <div className="bg-accent/10 rounded-2xl p-8 border border-accent/20">
                <img
                  src="https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=600&h=400&fit=crop"
                  alt="Our team"
                  className="rounded-xl w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section
        ref={valuesSection.elementRef as React.RefObject<HTMLElement>}
        className={`py-24 bg-secondary transition-all duration-1000 ${valuesSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">
            Our Core Values
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
              <Award className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">Excellence</h3>
              <p className="text-muted-foreground">
                We strive for perfection in every project, no matter the size
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
              <Users className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">Collaboration</h3>
              <p className="text-muted-foreground">
                Your vision guides our design, making each project uniquely yours
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
              <Heart className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">Integrity</h3>
              <p className="text-muted-foreground">
                Honest pricing, quality materials, and transparent communication
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
              <Lightbulb className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">Innovation</h3>
              <p className="text-muted-foreground">
                Combining creativity with functionality for optimal solutions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaSection.elementRef as React.RefObject<HTMLElement>}
        className={`py-24 bg-background transition-all duration-1000 ${ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center bg-card rounded-3xl p-12 shadow-large border border-border/50">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Ready to Work With Us?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let's transform your space together. Schedule your free consultation today.
            </p>
            <Link to="/">
              <Button variant="accent" size="lg" className="text-lg group">
                Get Started
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;