import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, Menu, Upload, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <span className="text-lg font-semibold hidden sm:inline">Design & Supply</span>
          </div>

          <nav className="flex items-center gap-2">
            {/* Mobile Actions */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/")}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/file-manager")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    supabase.auth.signOut().then(() => {
                      toast.success("Logged out successfully");
                      navigate("/auth");
                    });
                  }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Home Button (Optional to keep or remove based on request) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 hidden md:inline-flex"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>

          </nav>
        </div>
      </div>
    </header>
  );
};
