import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Process } from "@/components/Process";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      {/* <section className="pt-32 pb-16 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Our Simple 4-Step Process
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              From initial consultation to final installation, we make transforming your space easy and stress-free
            </p>
            
          </div>
        </div>
      </section> */}

      {/* Process Section */}
      <Process />
      {/* <Link to="/">
        <Button variant="accent" size="lg" className="text-lg group">
          Get Started Today
          <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link> */}

      {/* Additional Details */}
      <section className="py-24 bg-background ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-8 text-center">
              Why Choose Our Process?
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Personalized Service
                </h3>
                <p className="text-muted-foreground">
                  Every project is unique, and we tailor our approach to your specific needs, style preferences, and budget requirements.
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Quality Craftsmanship
                </h3>
                <p className="text-muted-foreground">
                  We use premium materials and employ skilled craftsmen to ensure your custom design stands the test of time.
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Transparent Pricing
                </h3>
                <p className="text-muted-foreground">
                  No hidden fees or surprise charges. You'll receive a detailed quote before we begin, and we stick to it.
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Timely Delivery
                </h3>
                <p className="text-muted-foreground">
                  We respect your time and complete projects on schedule, keeping you informed every step of the way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
