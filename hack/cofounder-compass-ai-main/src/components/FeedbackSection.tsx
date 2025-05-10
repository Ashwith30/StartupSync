
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, Brain, CheckCircle2, MessageSquare, ThumbsUp, ThumbsDown, BarChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const FeedbackSection = () => {
  const [activeTab, setActiveTab] = useState("learning");

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Continuous Learning & Improvement</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your AI co-founder evolves with you, getting smarter and more tailored to your needs over time.
          </p>
        </div>

        <Tabs defaultValue="learning" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="learning">Learning Process</TabsTrigger>
              <TabsTrigger value="insights">Personalized Insights</TabsTrigger>
              <TabsTrigger value="feedback">User Feedback</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="learning" className="focus:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LearningCard
                icon={<MessageSquare className="h-10 w-10" />}
                title="Conversation Analysis"
                description="Your AI analyzes patterns in your conversations to understand your priorities and decision-making style."
                progress={87}
              />
              <LearningCard
                icon={<BarChart className="h-10 w-10" />}
                title="Data-Driven Insights"
                description="Market trends and business data are continuously integrated to refine recommendations."
                progress={92}
              />
              <LearningCard
                icon={<CheckCircle2 className="h-10 w-10" />}
                title="Feedback Integration"
                description="Your explicit and implicit feedback constantly shapes and improves responses."
                progress={78}
              />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="focus:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InsightCard
                title="Communication Style"
                description="Based on your interactions, your AI co-founder adapts to provide more concise, data-driven insights with visual elements."
                improvement="Responses now include 40% more visual data representation."
              />
              <InsightCard
                title="Decision Priorities"
                description="Your AI has identified that user experience and market differentiation are your top priorities when evaluating options."
                improvement="Recommendations now emphasize UX implications first."
              />
              <InsightCard
                title="Risk Assessment"
                description="Your feedback patterns show a balanced approach to risk, with preference for calculated innovation."
                improvement="Suggestions now include more varied risk/reward scenarios."
              />
              <InsightCard
                title="Growth Focus"
                description="Based on your recent queries, your current priority appears to be sustainable growth over rapid expansion."
                improvement="Strategic advice now emphasizes long-term metrics."
              />
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="focus:outline-none">
            <div className="text-center max-w-2xl mx-auto">
              <Card className="p-8">
                <CardContent className="pt-6 flex flex-col items-center">
                  <Brain className="h-16 w-16 text-primary mb-6" />
                  <h3 className="text-2xl font-bold mb-4">How helpful is your AI Co-founder?</h3>
                  <p className="text-muted-foreground mb-8">
                    Your feedback directly improves the quality and relevance of future insights.
                  </p>
                  <div className="flex gap-4 mb-8">
                    <Button variant="outline" className="flex-1 h-16 text-lg gap-2">
                      <ThumbsDown className="h-5 w-5" /> Not Helpful
                    </Button>
                    <Button className="flex-1 h-16 text-lg gap-2">
                      <ThumbsUp className="h-5 w-5" /> Very Helpful
                    </Button>
                  </div>
                  <Button variant="link" className="gap-1">
                    Provide detailed feedback <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

interface LearningCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  progress: number;
}

const LearningCard = ({ icon, title, description, progress }: LearningCardProps) => {
  return (
    <Card className="p-6">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Learning Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    </Card>
  );
};

interface InsightCardProps {
  title: string;
  description: string;
  improvement: string;
}

const InsightCard = ({ title, description, improvement }: InsightCardProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-md">
        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
        <div className="text-sm">
          <span className="font-medium">Recent Improvement:</span> {improvement}
        </div>
      </div>
    </Card>
  );
};

export default FeedbackSection;
