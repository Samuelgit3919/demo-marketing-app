import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="text-xl font-bold text-foreground">
            Closet Design Wizard
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Home
            </NavLink>
            <NavLink
              to="/how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              How It Works
            </NavLink>
            <NavLink
              to="/gallery"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Gallery
            </NavLink>
            <NavLink
              to="/about-us"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              About Us
            </NavLink>
            <NavLink to="/wizard">
              <Button variant="accent" size="sm">
                Get Started
              </Button>
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <NavLink
              to="/"
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/how-it-works"
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </NavLink>
            <NavLink
              to="/gallery"
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Gallery
            </NavLink>
            <NavLink
              to="/about-us"
              className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </NavLink>
            <Button variant="accent" size="sm" className="w-full mt-2">
              Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
