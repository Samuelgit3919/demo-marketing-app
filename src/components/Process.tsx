import { CheckCircle } from "lucide-react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const steps = [
  {
    number: "01",
    title: "Consultation & Measurement",
    description: "Share your space dimensions and photos. We'll schedule a free consultation to understand your needs and vision.",
  },
  {
    number: "02",
    title: "Custom Design",
    description: "Our design team creates a personalized 3D layout tailored to your space, style preferences, and budget.",
  },
  {
    number: "03",
    title: "Professional Installation",
    description: "Expert installation by our certified team. Enjoy your beautifully organized space with lifetime warranty.",
  },
];

export const Process = () => {
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });

  return (
    <section
      ref={elementRef as React.RefObject<HTMLElement>}
      className={`py-24 bg-secondary transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Simple <span className="text-accent">3-Step Process</span>
          </h2> 
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From initial consultation to final installation, we make custom design effortless
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              style={{ transitionDelay: `${300 + index * 150}ms` }}
            >
              <div className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 h-full border border-border/50">
                <div className="text-6xl font-bold text-accent/20 mb-4">
                  {step.number}
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                  <h3 className="text-2xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-accent"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
