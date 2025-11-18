import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Ruler, Upload, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import heroBackground from "@/assets/hero-background.jpg";
import { Navigation } from "@/components/Navigation";
import { Process } from "@/components/Process";
import { Services } from "@/components/Services";
import { BeforeAfter } from "@/components/BeforeAfter";
import { VideoSection } from "@/components/VideoSection";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";

const Index = () => {

  return (
    <>
      <div className="min-h-screen">
        <Navigation />
        <Hero />
        <Process />
        <Services />
        <BeforeAfter />
        <VideoSection />
        <Testimonials />
        <CTA />
        <FAQ />
        <Footer />
      </div>
    </>
  );
};

export default Index;
