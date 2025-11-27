import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export const CTA = () => {
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  return (
    <section
      ref={elementRef as React.RefObject<HTMLElement>}
      className={`py-12 md:py-20 lg:py-24 bg-secondary transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-4xl mx-auto bg-card rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-large border border-border/50 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
          <div className="text-center">
            <Calendar className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-accent mx-auto mb-4 md:mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 md:mb-4 leading-tight">
              Ready to Transform Your Space?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
              Book your free consultation today. No obligation, just expert advice and a custom design plan tailored to your needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button size="lg" variant="accent" className="text-base md:text-lg group w-full sm:w-auto">
                Schedule Free Consultation
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-base md:text-lg w-full sm:w-auto">
                Call Us: (555) 123-4567
              </Button>
            </div>

            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-accent mb-1 md:mb-2">200+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Projects Completed</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-accent mb-1 md:mb-2">15+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Years Experience</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-accent mb-1 md:mb-2">100%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
