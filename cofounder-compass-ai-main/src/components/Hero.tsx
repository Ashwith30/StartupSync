
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="flex flex-col items-center py-20 px-4 text-center">
      <h1 className="text-5xl md:text-6xl font-bold mb-6">
        Meet Your AI <span className="gradient-text">Co-Founder</span>
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-10">
        The intelligent assistant that evolves with your startup journey—from
        ideation to scale.
      </p>
      
      <div className="flex items-center gap-2 mb-8 px-4 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>This is a demonstration website showcasing product capabilities.</span>
      </div>
      
      <Button
        size="lg"
        className="group text-lg px-8 py-6 rounded-full transition-all duration-300"
        onClick={onGetStarted}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        Get Started
        <ArrowRight
          className={`ml-2 transition-transform duration-300 ${
            isHovering ? "translate-x-1" : ""
          }`}
        />
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl w-full">
        <FeatureCard
          title="Strategic Guidance"
          description="Receive data-driven insights tailored to your business goals and challenges."
        />
        <FeatureCard
          title="Domain Experts"
          description="Access specialized knowledge across marketing, fundraising, legal, and more."
          highlighted
        />
        <FeatureCard
          title="Always Learning"
          description="Your AI co-founder continuously adapts to your needs and feedback."
        />
      </div>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  highlighted?: boolean;
}

const FeatureCard = ({ title, description, highlighted }: FeatureCardProps) => (
  <div
    className={`p-6 rounded-lg flex flex-col items-center text-center ${
      highlighted
        ? "bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
        : "bg-card"
    }`}
  >
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Hero;
