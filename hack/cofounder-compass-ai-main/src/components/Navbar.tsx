import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft } from "lucide-react"; // Added ArrowLeft for the back button
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Navbar = () => {
  const [isLoggedIn] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { label: "Features", href: "#insights" },
    { label: "Domains", href: "#domains" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
  ];

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId.replace('#', ''));
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Update the URL hash and reload the page
      window.location.hash = sectionId;
      window.location.reload();
    }
  };

  // Handle scrolling to the section after page reload
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const section = document.getElementById(hash.replace('#', ''));
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []); // Run only once after the component mounts

  return (
    <nav className="border-b py-4 px-6 bg-background/95 backdrop-blur-sm fixed top-0 w-full z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (window.location.href = window.location.origin)}
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <Compass className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">StartupSync</span>
        </div>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 pt-10">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.href);
                    }}
                    className="text-foreground hover:text-primary py-2 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
                {isLoggedIn ? (
                  <Button className="mt-4">Dashboard</Button>
                ) : (
                  <div className="flex flex-col gap-3 mt-4">
                    <Button variant="outline">Log In</Button>
                    <Button>Sign Up</Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            <div className="flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.href);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Button>Dashboard</Button>
              ) : (
                <>
                  <Button variant="outline">Log In</Button>
                  <Button>Sign Up</Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
