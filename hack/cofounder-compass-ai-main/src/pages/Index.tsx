
import { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import DomainExpertsSection from "../components/DomainExpertsSection";
import NewsInsightsSection from "../components/NewsInsightsSection";
import FeedbackSection from "../components/FeedbackSection";
import Footer from "../components/Footer";
import Dashboard from "../components/Dashboard";

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleGetStarted = () => {
    setShowDashboard(true);
    // Scroll to top when showing dashboard
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        {showDashboard ? (
          <Dashboard />
        ) : (
          <>
            <Hero onGetStarted={handleGetStarted} />
            <div id="domains">
              <DomainExpertsSection />
            </div>
            <div id="insights">
              <NewsInsightsSection />
            </div>
            <div id="pricing">
              {/* Placeholder for Pricing section */}
              <div className="py-16 px-4 bg-muted/10">
                <div className="max-w-6xl mx-auto text-center">
                  <h2 className="text-3xl font-bold mb-4">Pricing Plans</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                    Choose the right plan for your Indian business needs
                  </p>
                  <div className="flex flex-col items-center">
                    <p className="text-muted-foreground text-lg mb-4">Pricing content coming soon</p>
                    <p className="text-sm text-muted-foreground">
                      This is a demonstration website. All pricing information will be transparent and clearly displayed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div id="about">
              <div id="features">
                <FeedbackSection />
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
