
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, TrendingUp, Scale, Settings, Lightbulb, BadgeDollarSign } from "lucide-react";

const DomainExpertsSection = () => {
  return (
    <section id="domains" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Domain-Specific Expertise</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your AI co-founder brings specialized knowledge across critical business domains, 
            providing targeted insights when you need them most.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DomainCard
            title="Marketing & Growth"
            description="Optimize your acquisition channels, content strategy, and customer engagement."
            icon={<TrendingUp className="h-10 w-10" />}
            color="marketing"
          />
          
          <DomainCard
            title="Fundraising"
            description="Strategic guidance for investor outreach, pitch optimization, and financial planning."
            icon={<BadgeDollarSign className="h-10 w-10" />}
            color="fundraising"
          />
          
          <DomainCard
            title="Legal & Compliance"
            description="Navigate regulatory requirements, contracts, IP protection, and corporate governance."
            icon={<Scale className="h-10 w-10" />}
            color="legal"
          />
          
          <DomainCard
            title="Operations"
            description="Streamline workflows, optimize resources, and implement efficient systems."
            icon={<Settings className="h-10 w-10" />}
            color="operations"
          />
          
          <DomainCard
            title="Product Strategy"
            description="Prioritize features, improve UX, and align product roadmap with market needs."
            icon={<Lightbulb className="h-10 w-10" />}
            color="product"
          />
          
          <DomainCard
            title="General Strategy"
            description="Holistic business guidance drawing from all domains for integrated decision-making."
            icon={<BadgeCheck className="h-10 w-10" />}
            color="primary"
          />
        </div>
      </div>
    </section>
  );
};

interface DomainCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const DomainCard = ({ title, description, icon, color }: DomainCardProps) => {
  return (
    <Card className="border overflow-hidden transition-all hover:shadow-md">
      <CardHeader className={`text-${color}`}>
        {icon}
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

export default DomainExpertsSection;
