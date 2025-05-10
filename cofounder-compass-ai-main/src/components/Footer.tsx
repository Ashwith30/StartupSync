
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/40 border-t">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">StartupSync</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your intelligent AI co-founder that evolves with your startup journey—from ideation to scale.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="sm">
                Twitter
              </Button>
              <Button variant="outline" size="sm">
                LinkedIn
              </Button>
              <Button variant="outline" size="sm">
                Discord
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#domains" className="text-muted-foreground hover:text-foreground transition-colors">
                  Domain Experts
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                  Testimonials
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="/career" className="text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 StartupSync. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="/security" className="text-sm text-muted-foreground hover:text-foreground">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
