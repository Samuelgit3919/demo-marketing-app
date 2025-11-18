import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const faqs = [
  {
    question: "How long does the design process take?",
    answer: "Typically, the entire process from consultation to installation takes 2-4 weeks, depending on the complexity of your project and current schedule.",
  },
  {
    question: "Do I need to provide measurements?",
    answer: "While it's helpful if you have measurements, our team can take professional measurements during your free consultation to ensure accuracy.",
  },
  {
    question: "What areas do you serve?",
    answer: "We currently serve the greater metropolitan area and surrounding suburbs. Contact us to confirm if we cover your location.",
  },
  {
    question: "Can I customize the design?",
    answer: "Absolutely! Every design is custom-made to your specifications. We work closely with you to ensure the final design matches your vision and needs.",
  },
  {
    question: "What is included in the free consultation?",
    answer: "Our free consultation includes a site visit, measurements, discussion of your needs and preferences, and a preliminary design concept with pricing estimate.",
  },
  {
    question: "Do you offer a warranty?",
    answer: "Yes, all our installations come with a comprehensive warranty covering materials and workmanship. Specific terms vary by project.",
  },
];

export const FAQ = () => {
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section
      ref={elementRef as React.RefObject<HTMLElement>}
      className={`py-24 bg-background transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Find answers to common questions about our design process
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-accent">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
