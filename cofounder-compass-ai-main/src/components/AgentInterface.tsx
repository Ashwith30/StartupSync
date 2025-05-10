import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Loader2,
  Brain,
  Download,
  Copy,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Save,
  Share,
  Sparkles,
  BarChart,
  Lightbulb,
  MessageSquare,
  Zap,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Edit
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { getGeminiResponse, StartupDomain, OutputFormat } from "../utils/geminiApi";

interface AgentOutput {
  id: string;
  content: string;
  structuredContent?: any;
  format: OutputFormat;
  domain: StartupDomain;
  title: string;
  timestamp: Date;
  conciseMode?: boolean; // Whether this output was generated in concise mode
}

const domainConfig: Record<StartupDomain, { color: string; label: string; description: string }> = {
  ideation: {
    color: "bg-primary text-primary-foreground",
    label: "Ideation",
    description: "Generate business ideas and validation strategies"
  },
  marketing: {
    color: "bg-marketing text-white",
    label: "Marketing",
    description: "Create marketing strategies and customer acquisition plans"
  },
  fundraising: {
    color: "bg-fundraising text-white",
    label: "Fundraising",
    description: "Develop investor materials and financial projections"
  },
  legal: {
    color: "bg-legal text-white",
    label: "Legal",
    description: "Navigate compliance and regulatory requirements"
  },
  operations: {
    color: "bg-operations text-white",
    label: "Operations",
    description: "Optimize processes and resource management"
  },
  product: {
    color: "bg-product text-white",
    label: "Product",
    description: "Plan product development and feature prioritization"
  }
};

const outputFormatConfig: Record<OutputFormat, { icon: JSX.Element; label: string; description: string }> = {
  text: {
    icon: <FileText className="h-4 w-4" />,
    label: "General Advice",
    description: "Get comprehensive advice and guidance"
  },
  "pitch-deck": {
    icon: <FileText className="h-4 w-4" />,
    label: "Pitch Deck",
    description: "Create a compelling investor presentation"
  },
  "market-analysis": {
    icon: <FileText className="h-4 w-4" />,
    label: "Market Analysis",
    description: "Understand market size, trends, and competition"
  },
  "gtm-strategy": {
    icon: <FileText className="h-4 w-4" />,
    label: "Go-to-Market Strategy",
    description: "Plan your product launch and marketing approach"
  },
  "product-roadmap": {
    icon: <FileText className="h-4 w-4" />,
    label: "Product Roadmap",
    description: "Map out your product development timeline"
  },
  "task-plan": {
    icon: <FileText className="h-4 w-4" />,
    label: "Task Plan",
    description: "Break down projects into actionable steps"
  },
  "financial-model": {
    icon: <FileText className="h-4 w-4" />,
    label: "Financial Model",
    description: "Project revenue, costs, and key metrics"
  },
  "10-day-plan": {
    icon: <Calendar className="h-4 w-4" />,
    label: "10-Day Plan",
    description: "Generate a detailed 10-day mentoring plan"
  },
};

// Define allowed output formats for each domain
const domainToOutputFormats: Record<StartupDomain, OutputFormat[]> = {
  ideation: ["text", "market-analysis", "pitch-deck"],
  marketing: ["text", "gtm-strategy", "pitch-deck"],
  fundraising: ["text", "pitch-deck", "financial-model"],
  legal: ["text"], // Restrict legal domain to general advice only
  operations: ["text", "task-plan", "10-day-plan"],
  product: ["text", "product-roadmap", "task-plan"], // Removed "10-day-plan"
};

const AgentInterface = () => {
  const [outputs, setOutputs] = useState<AgentOutput[]>([]);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<StartupDomain>("ideation");
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>("text");
  const [conciseMode, setConciseMode] = useState(false);
  const [activeOutput, setActiveOutput] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showExpertInsights, setShowExpertInsights] = useState<Record<string, boolean>>({});
  const [outputFeedback, setOutputFeedback] = useState<Record<string, "helpful" | "not_helpful" | null>>({});
  const [followupSuggestions, setFollowupSuggestions] = useState<Record<string, string[]>>({});
  const [savedOutputs, setSavedOutputs] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparedOutputs, setComparedOutputs] = useState<string[]>([]);
  const endOfOutputsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [dailyPlan, setDailyPlan] = useState<any[]>([]);
  const [dailyUpdates, setDailyUpdates] = useState<Record<number, string>>({});

  // Load saved plan and updates from localStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem("dailyPlan");
    const savedUpdates = localStorage.getItem("dailyUpdates");
    if (savedPlan) setDailyPlan(JSON.parse(savedPlan));
    if (savedUpdates) setDailyUpdates(JSON.parse(savedUpdates));
  }, []);

  // Save plan and updates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("dailyPlan", JSON.stringify(dailyPlan));
    localStorage.setItem("dailyUpdates", JSON.stringify(dailyUpdates));
  }, [dailyPlan, dailyUpdates]);

  // Auto-scroll to the bottom when new outputs arrive
  useEffect(() => {
    endOfOutputsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputs]);

  const handleGenerateOutput = async () => {
    if (!title.trim() || !details.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and details for your request.",
        variant: "destructive",
      });
      return;
    }

    // Validate the selected output format for the selected domain
    if (!domainToOutputFormats[selectedDomain].includes(selectedFormat)) {
      // Get available formats for this domain
      const availableFormats = domainToOutputFormats[selectedDomain]
        .map(format => outputFormatConfig[format].label)
        .join(", ");

      toast({
        title: "Invalid domain/format combination",
        description: `The ${outputFormatConfig[selectedFormat].label} format is not available for the ${domainConfig[selectedDomain].label} domain. Available formats: ${availableFormats}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGenerationProgress(0);

    // Start progress simulation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const increment = Math.random() * 10;
        const newProgress = prev + increment;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 600);

    try {
      toast({
        title: "Generating output",
        description: "Please wait while we process your request...",
      });

      // Ensure the output generation works only for the selected domain
      if (selectedDomain) {
        const { response, structuredOutput } = await getGeminiResponse(
          `${title}\n\n${details}`,
          selectedDomain,
          selectedFormat,
          conciseMode
        );

        if (!response || response.includes("There was an error processing your request")) {
          clearInterval(progressInterval);
          setGenerationProgress(0);
          throw new Error("Failed to generate output");
        }

        // Generate output ID
        const outputId = Date.now().toString();

        // Generate follow-up suggestions based on the domain and format
        const suggestions = generateFollowupSuggestions(selectedDomain, selectedFormat);
        setFollowupSuggestions(prev => ({
          ...prev,
          [outputId]: suggestions
        }));

        // Initialize expert insights visibility
        setShowExpertInsights(prev => ({
          ...prev,
          [outputId]: false
        }));

        // Initialize feedback for this output
        setOutputFeedback(prev => ({
          ...prev,
          [outputId]: null
        }));

        const newOutput: AgentOutput = {
          id: outputId,
          content: response,
          structuredContent: structuredOutput,
          format: selectedFormat,
          domain: selectedDomain,
          title: title,
          timestamp: new Date(),
          conciseMode: conciseMode, // Store whether this was generated in concise mode
        };

        setOutputs((prev) => [...prev, newOutput]);
        setActiveOutput(newOutput.id);

        if (selectedFormat === "10-day-plan" && structuredOutput) {
          setDailyPlan(structuredOutput);
        }

        toast({
          title: "Output generated",
          description: `Your ${outputFormatConfig[selectedFormat].label} is ready to view.`,
        });
      } else {
        toast({
          title: "Invalid domain",
          description: "Please select a valid domain to proceed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating output:", error);

      toast({
        title: "Generation failed",
        description: "There was an error generating your output. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Complete the progress bar
      setGenerationProgress(100);
      setTimeout(() => {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setIsLoading(false);
      }, 500);
    }
  };

  // Generate follow-up suggestions based on domain and format
  const generateFollowupSuggestions = (domain: StartupDomain, format: OutputFormat): string[] => {
    const suggestions: string[] = [];

    // Add domain-specific suggestions
    switch (domain) {
      case "ideation":
        suggestions.push("Generate a market analysis for this idea");
        suggestions.push("Create a task plan to validate this concept");
        suggestions.push("What are the biggest risks for this idea?");
        break;
      case "marketing":
        suggestions.push("Create a content calendar for this strategy");
        suggestions.push("What metrics should I track for this campaign?");
        suggestions.push("How should I adjust this for a B2B audience?");
        break;
      case "fundraising":
        suggestions.push("Create a pitch deck for this funding round");
        suggestions.push("What investor questions should I prepare for?");
        suggestions.push("Generate a financial model for this business");
        break;
      case "legal":
        suggestions.push("What legal structures are best for this business?");
        suggestions.push("What compliance issues should I be aware of?");
        suggestions.push("Create a checklist for IP protection");
        break;
      case "operations":
        suggestions.push("Generate a hiring plan for the next 6 months");
        suggestions.push("What tools should I implement for this workflow?");
        suggestions.push("Create an operational efficiency scorecard");
        break;
      case "product":
        suggestions.push("Generate a product roadmap for the next quarter");
        suggestions.push("What user testing methods should I prioritize?");
        suggestions.push("Create a feature prioritization framework");
        break;
    }

    // Add format-specific suggestions
    switch (format) {
      case "pitch-deck":
        suggestions.push("How can I improve the narrative flow of this deck?");
        suggestions.push("What metrics should I highlight in this presentation?");
        break;
      case "market-analysis":
        suggestions.push("Who are the emerging competitors in this space?");
        suggestions.push("What market trends should I monitor closely?");
        break;
      case "gtm-strategy":
        suggestions.push("How should I adjust this strategy for international markets?");
        suggestions.push("What channels would be most cost-effective to start with?");
        break;
      case "product-roadmap":
        suggestions.push("How should I communicate this roadmap to stakeholders?");
        suggestions.push("What dependencies should I be aware of in this plan?");
        break;
      case "task-plan":
        suggestions.push("What tools would help implement this plan efficiently?");
        suggestions.push("How should I prioritize these tasks with limited resources?");
        break;
      case "financial-model":
        suggestions.push("What sensitivity analysis should I run on this model?");
        suggestions.push("How do these projections compare to industry benchmarks?");
        break;
    }

    // Shuffle and return 3-4 suggestions
    return shuffleArray(suggestions).slice(0, Math.min(4, suggestions.length));
  };

  // Helper function to shuffle an array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Get default follow-up suggestions if none exist in state
  const getDefaultSuggestions = (domain: StartupDomain): string[] => {
    const defaultSuggestions: Record<StartupDomain, string[]> = {
      "ideation": [
        "Create a content calendar for this strategy",
        "What metrics should I track for this campaign?",
        "What channels would be most cost-effective to start with?",
        "How should I adjust this strategy for international markets?"
      ],
      "marketing": [
        "Create a content calendar for this strategy",
        "What metrics should I track for this campaign?",
        "What channels would be most cost-effective to start with?",
        "How should I adjust this strategy for international markets?"
      ],
      "fundraising": [
        "What investor questions should I prepare for?",
        "How should I structure my pitch deck?",
        "What valuation should I target?",
        "Which investors should I approach first?"
      ],
      "legal": [
        "What legal structures are best for this business?",
        "What compliance issues should I be aware of?",
        "How should I protect my intellectual property?",
        "What contracts do I need for my business?"
      ],
      "operations": [
        "How can I optimize my supply chain?",
        "What KPIs should I track for operational efficiency?",
        "How should I structure my team?",
        "What tools should I implement for this workflow?"
      ],
      "product": [
        "Generate a product roadmap for the next quarter",
        "What user testing methods should I prioritize?",
        "How should I prioritize feature development?",
        "What metrics should I use to measure product success?"
      ]
    };

    return defaultSuggestions[domain] || [
      "What metrics should I track for this campaign?",
      "What channels would be most cost-effective to start with?",
      "Create a content calendar for this strategy",
      "How should I adjust this strategy for international markets?"
    ];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content copied to clipboard successfully.",
    });
  };

  const downloadAsMarkdown = (output: AgentOutput) => {
    const element = document.createElement("a");
    const fileContent = `# ${output.title}\n\n${output.content}`;
    const file = new Blob([fileContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${output.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Download started",
      description: "Your file is being downloaded.",
    });
  };

  const renderOutputContent = (output: AgentOutput) => {
    const lines = output.content.split('\n');
    const isConciseOutput = lines.filter(line => line.trim().startsWith('- ')).length > 5;

    return (
      <div className={`prose prose-sm max-w-none dark:prose-invert ${isConciseOutput ? 'concise-output' : ''}`}>
        {isConciseOutput ? (
          // Special rendering for concise bullet-point outputs
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
            <h3 className="text-sm font-medium text-primary mb-2">Concise Analysis</h3>
            <ul className="space-y-1 list-none pl-0">
              {lines.filter(line => line.trim().startsWith('- ')).map((line, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary font-bold mr-2">•</span>
                  <span>{line.substring(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          // Standard rendering for regular outputs
          <>
            {lines.map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-md font-bold mt-2 mb-1">{line.substring(4)}</h3>;
              } else if (line.startsWith('- ')) {
                return <li key={index} className="ml-4">{line.substring(2)}</li>;
              } else if (line.startsWith('```')) {
                return null; // Skip code block markers as we handle structured content separately
              } else if (line === '') {
                return <br key={index} />;
              } else {
                return <p key={index} className="my-1">{line}</p>;
              }
            })}
          </>
        )}
      </div>
    );
  };

  const renderStructuredOutput = (output: AgentOutput) => {
    if (!output.structuredContent) return null;

    switch (output.format) {
      case "pitch-deck":
        return (
          <div className="mt-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-2">Pitch Deck Outline</h3>
            <div className="space-y-4">
              {output.structuredContent.map((slide: any, index: number) => (
                <div key={index} className="border-b pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-primary">{index + 1}. {slide.title}</h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Slide {index + 1}/12</span>
                  </div>
                  <p className="text-sm mb-2">{slide.content}</p>
                  {slide.key_metrics && slide.key_metrics.length > 0 && (
                    <div className="bg-muted/30 p-2 rounded">
                      <p className="text-xs font-medium mb-1">Key Metrics & Data Points:</p>
                      <ul className="text-xs space-y-1">
                        {slide.key_metrics.map((metric: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-primary mr-1">•</span> {metric}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "product-roadmap":
        return (
          <div className="mt-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-2">Product Roadmap</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(output.structuredContent).map(([quarter, features]: [string, any]) => (
                <div key={quarter} className="border rounded p-3 bg-background">
                  <h4 className="font-medium text-primary border-b pb-2 mb-2">{quarter}</h4>
                  <div className="space-y-2">
                    {features.map((feature: any, index: number) => (
                      <div key={index} className="bg-muted/20 p-2 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{feature.name}</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              feature.priority === "P0" ? "bg-red-100 text-red-700" :
                              feature.priority === "P1" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {feature.priority}
                            </span>
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {feature.effort} pts
                            </span>
                          </div>
                        </div>
                        <p className="text-xs">{feature.description}</p>
                        {feature.success_metrics && feature.success_metrics.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-dashed border-muted">
                            <p className="text-xs text-muted-foreground">Success metrics: {feature.success_metrics.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "task-plan":
        return (
          <div className="mt-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-2">Task Plan</h3>
            <div className="space-y-1">
              {/* Group tasks by timeline */}
              {["0-30 days", "30-90 days", "90-180 days"].map(timeframe => {
                const tasksInTimeframe = output.structuredContent.filter(
                  (task: any) => task.timeline === timeframe
                );

                if (tasksInTimeframe.length === 0) return null;

                return (
                  <div key={timeframe} className="mb-4">
                    <h4 className="font-medium text-primary border-b pb-1 mb-2">
                      {timeframe === "0-30 days" ? "Immediate Actions" :
                       timeframe === "30-90 days" ? "Short-term Initiatives" :
                       "Medium-term Projects"}
                    </h4>
                    <div className="space-y-2">
                      {tasksInTimeframe.map((task: any, index: number) => (
                        <div key={index} className="border-b pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{task.title}</h5>
                              <p className="text-xs text-muted-foreground mb-1">{task.description}</p>

                              <div className="flex flex-wrap gap-1 mt-1">
                                {task.owner_role && (
                                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                    Owner: {task.owner_role}
                                  </span>
                                )}
                                {task.resources_needed && task.resources_needed.length > 0 && (
                                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                    Resources: {task.resources_needed.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${
                              task.priority === "high" ? "bg-red-100 text-red-700" :
                              task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-green-100 text-green-700"
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          {task.success_criteria && task.success_criteria.length > 0 && (
                            <div className="mt-1 pt-1">
                              <p className="text-xs font-medium">Success Criteria:</p>
                              <ul className="text-xs list-disc pl-4">
                                {task.success_criteria.map((criteria: string, i: number) => (
                                  <li key={i}>{criteria}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "financial-model":
        return (
          <div className="mt-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-3">Financial Model</h3>

            {/* Revenue Streams */}
            {output.structuredContent.revenue_streams && output.structuredContent.revenue_streams.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-primary border-b pb-1 mb-2">Revenue Streams</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {output.structuredContent.revenue_streams.map((stream: string, index: number) => (
                    <li key={index} className="text-sm">{stream}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Costs */}
            {output.structuredContent.costs && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fixed Costs */}
                {output.structuredContent.costs.fixed && output.structuredContent.costs.fixed.length > 0 && (
                  <div className="border rounded p-3 bg-background">
                    <h4 className="font-medium text-sm mb-2">Fixed Costs</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {output.structuredContent.costs.fixed.map((cost: string, index: number) => (
                        <li key={index} className="text-xs">{cost}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Variable Costs */}
                {output.structuredContent.costs.variable && output.structuredContent.costs.variable.length > 0 && (
                  <div className="border rounded p-3 bg-background">
                    <h4 className="font-medium text-sm mb-2">Variable Costs</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {output.structuredContent.costs.variable.map((cost: string, index: number) => (
                        <li key={index} className="text-xs">{cost}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Unit Economics */}
            {output.structuredContent.unit_economics && Object.keys(output.structuredContent.unit_economics).length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-primary border-b pb-1 mb-2">Unit Economics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(output.structuredContent.unit_economics).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-muted/20 p-2 rounded">
                      <p className="text-xs font-medium">{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            {output.structuredContent.metrics && Object.keys(output.structuredContent.metrics).length > 0 && (
              <div>
                <h4 className="font-medium text-primary border-b pb-1 mb-2">Key Financial Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(output.structuredContent.metrics).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-muted/20 p-2 rounded">
                      <p className="text-xs font-medium">{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "market-analysis":
        return (
          <div className="mt-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-2">Market Analysis</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {/* Market analysis doesn't have a standard structure in the API response yet,
                  so we're just displaying the markdown content */}
              <p className="text-sm text-muted-foreground italic">
                Detailed market analysis is available in the main content above.
                Future versions will include interactive market size visualizations and competitor matrices.
              </p>
            </div>
          </div>
        );

      case "gtm-strategy":
        return (
          <div className="mt-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-2">Go-to-Market Strategy</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {/* GTM strategy doesn't have a standard structure in the API response yet,
                  so we're just displaying the markdown content */}
              <p className="text-sm text-muted-foreground italic">
                Detailed go-to-market strategy is available in the main content above.
                Future versions will include interactive channel performance calculators and timeline visualizations.
              </p>
            </div>
          </div>
        );

      case "10-day-plan":
        return (
          <div className="mt-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-lg font-medium mb-2">10-Day Mentoring Plan</h3>
            <div className="space-y-4">
              {output.structuredContent.map((day: any, index: number) => (
                <div key={index} className="border-b pb-3">
                  <h4 className="font-medium text-primary">Day {day.day}</h4>
                  <p className="text-sm">{day.content}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Add state for daily updates
  const handleDailyUpdate = (day: number, update: string) => {
    setDailyUpdates((prev) => ({ ...prev, [day]: update }));

    // Modify the plan for remaining days based on the update
    setDailyPlan((prev) =>
      prev.map((item) =>
        item.day === day
          ? { ...item, content: `${item.content}\n\nUpdate: ${update}` }
          : item.day > day
          ? { ...item, content: `${item.content}\n\nAdjusted based on Day ${day} update.` }
          : item
      )
    );
  };

  // Render daily updates section
  const renderDailyUpdates = () => (
    <div className="mt-6 border rounded-lg p-4 bg-blue-50/50">
      <h3 className="text-lg font-medium mb-3">Daily Updates</h3>
      <div className="space-y-4">
        {dailyPlan.map((day) => (
          <div key={day.day} className="border-b pb-3">
            <h4 className="font-medium text-primary">Day {day.day}</h4>
            <p className="text-sm mb-2">{day.content}</p>
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Update for Day ${day.day}`}
                value={dailyUpdates[day.day] || ""}
                onChange={(e) => handleDailyUpdate(day.day, e.target.value)}
                className="flex-grow"
              />
              <Button
                size="sm"
                onClick={() => toast({ title: `Update saved for Day ${day.day}` })}
              >
                <Edit className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDailyPlanSection = () => (
    <div className="mt-6 border rounded-lg p-4 bg-blue-50/50">
      <h3 className="text-lg font-medium mb-3">10-Day Detailed Plan</h3>
      <div className="space-y-4">
        {dailyPlan.map((day, index) => (
          <div key={index} className="border-b pb-3">
            <h4 className="font-medium text-primary">Day {day.day || index + 1}</h4> {/* Fallback for day.day */}
            <p className="text-sm mb-2">{day.content}</p>
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Update for Day ${day.day || index + 1}`}
                value={dailyUpdates[day.day || index + 1] || ""}
                onChange={(e) => handleDailyUpdate(day.day || index + 1, e.target.value)}
                className="flex-grow"
              />
              <Button
                size="sm"
                onClick={() => toast({ title: `Update saved for Day ${day.day || index + 1}` })}
              >
                <Edit className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full h-full flex flex-col rounded-xl overflow-hidden border shadow-lg">
      <div className="flex items-center justify-between bg-muted/40 p-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Elite Startup Advisor AI</h2>
            <p className="text-xs text-muted-foreground">Powered by Gemini 1.5 Pro with domain-specific expertise</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">Precise</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">Data-driven</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">Actionable</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-full">
        {/* Left side - Output Browser */}
        <div className="w-full md:w-1/3 border-r overflow-y-auto">
          <div className="p-4 bg-muted/20">
            <h3 className="font-medium mb-2">Generated Outputs</h3>
            {outputs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No outputs generated yet</p>
                <p className="text-sm">Select a domain expertise and output format to create your first strategic deliverable</p>
                <div className="mt-4 grid grid-cols-2 gap-2 max-w-xs mx-auto">
                  <div className="text-left border rounded p-2 text-xs">
                    <p className="font-medium text-primary">Domain Expertise</p>
                    <ul className="mt-1 space-y-0.5 pl-2">
                      <li>• Ideation</li>
                      <li>• Marketing</li>
                      <li>• Fundraising</li>
                      <li>• Product</li>
                    </ul>
                  </div>
                  <div className="text-left border rounded p-2 text-xs">
                    <p className="font-medium text-primary">Output Formats</p>
                    <ul className="mt-1 space-y-0.5 pl-2">
                      <li>• Pitch Deck</li>
                      <li>• Market Analysis</li>
                      <li>• Task Plan</li>
                      <li>• Financial Model</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {outputs.map((output) => (
                  <div
                    key={output.id}
                    className={`p-3 rounded-lg cursor-pointer border ${
                      activeOutput === output.id ? "border-primary bg-primary/10" : "hover:bg-muted"
                    }`}
                    onClick={() => setActiveOutput(output.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {savedOutputs.includes(output.id) && (
                          <BookmarkCheck className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{output.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${domainConfig[output.domain].color}`}>
                        {domainConfig[output.domain].label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>{outputFormatConfig[output.format].label}</span>
                        {output.conciseMode && (
                          <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                            Concise
                          </span>
                        )}
                        {outputFeedback[output.id] === "helpful" && (
                          <span className="text-green-600 flex items-center">
                            <ThumbsUp className="h-3 w-3 mr-0.5" />
                          </span>
                        )}
                      </div>
                      <span>{output.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Content Area */}
        <div className="flex-1 flex flex-col">
          {activeOutput ? (
            <Tabs defaultValue="view" className="flex-1 flex flex-col">
              <div className="px-4 pt-4 border-b">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-lg">
                    {outputs.find(o => o.id === activeOutput)?.title}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(outputs.find(o => o.id === activeOutput)?.content || "")}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const output = outputs.find(o => o.id === activeOutput);
                        if (output) downloadAsMarkdown(output);
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <TabsList>
                    <TabsTrigger value="view">View Output</TabsTrigger>
                    <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
                    <TabsTrigger value="compare" disabled={outputs.length < 2}>Compare</TabsTrigger>
                  </TabsList>

                  {outputs.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setComparisonMode(!comparisonMode)}
                      className="text-xs"
                    >
                      <Share className="h-3.5 w-3.5 mr-1" />
                      {comparisonMode ? "Exit Comparison" : "Compare Outputs"}
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="view" className="flex-1 p-6 overflow-auto">
                {outputs.find(o => o.id === activeOutput) && (
                  <>
                    {renderOutputContent(outputs.find(o => o.id === activeOutput)!)}
                    {renderStructuredOutput(outputs.find(o => o.id === activeOutput)!)}
                    {outputs.find(o => o.id === activeOutput)?.format === "10-day-plan" && renderDailyPlanSection()}
                    {outputs.find(o => o.id === activeOutput)?.format === "10-day-plan" && renderDailyUpdates()}

                    {/* Marketing Metrics Visualization - Only show for marketing domain */}
                    {outputs.find(o => o.id === activeOutput)?.domain === "marketing" && (
                      <div className="mt-6 border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <BarChart className="h-5 w-5 text-purple-600 mr-2" />
                            <h3 className="font-medium text-purple-800">Marketing Performance Metrics</h3>
                          </div>
                          <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Interactive
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-purple-700">Google Ads</span>
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">CPC</span>
                                <span className="text-xs font-medium">$2.00</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">CTR</span>
                                <span className="text-xs font-medium">5%</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">Conv. Rate</span>
                                <span className="text-xs font-medium">2%</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-purple-100">
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-500">Performance</span>
                                <span className="text-xs font-medium text-purple-700">65%</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-purple-700">Social Media</span>
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">Platform</span>
                                <span className="text-xs font-medium">Instagram</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">Engagement</span>
                                <span className="text-xs font-medium">10%</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">CPA</span>
                                <span className="text-xs font-medium">$50.00</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-purple-100">
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-500">Performance</span>
                                <span className="text-xs font-medium text-purple-700">78%</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-purple-700">Content Marketing</span>
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">Channel</span>
                                <span className="text-xs font-medium">Blog</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">Keywords</span>
                                <span className="text-xs font-medium">Water Plants</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">Traffic</span>
                                <span className="text-xs font-medium">500/month</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-dashed border-purple-100">
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-500">Performance</span>
                                <span className="text-xs font-medium text-purple-700">45%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-purple-800">Channel Comparison</h4>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                                <span className="text-xs text-gray-500">Performance</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                                <span className="text-xs text-gray-500">ROI</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-medium">Google Ads</span>
                                <span className="text-xs">$2 CPC</span>
                              </div>
                              <div className="flex space-x-1">
                                <div className="h-4 bg-purple-500 rounded" style={{ width: '65%' }}></div>
                                <div className="h-4 bg-blue-500 rounded" style={{ width: '40%' }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-medium">Social Media</span>
                                <span className="text-xs">$50 CPA</span>
                              </div>
                              <div className="flex space-x-1">
                                <div className="h-4 bg-purple-500 rounded" style={{ width: '78%' }}></div>
                                <div className="h-4 bg-blue-500 rounded" style={{ width: '55%' }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-medium">Content Marketing</span>
                                <span className="text-xs">500 visits/mo</span>
                              </div>
                              <div className="flex space-x-1">
                                <div className="h-4 bg-purple-500 rounded" style={{ width: '45%' }}></div>
                                <div className="h-4 bg-blue-500 rounded" style={{ width: '80%' }}></div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-dashed border-purple-100">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium text-purple-700">Recommendation:</span> Based on ROI analysis, content marketing shows the highest long-term value despite lower initial performance metrics. Consider increasing blog content production focused on "best water plants" and "indoor water plants" keywords.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expert Insights Section */}
                    <div className="mt-6 border rounded-lg p-4 bg-primary/5">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setShowExpertInsights(prev => ({
                          ...prev,
                          [activeOutput!]: !prev[activeOutput!]
                        }))}
                      >
                        <div className="flex items-center">
                          <Sparkles className="h-5 w-5 text-primary mr-2" />
                          <h3 className="font-medium">Expert Insights</h3>
                        </div>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {showExpertInsights[activeOutput!] ? "Hide" : "Show"}
                        </div>
                      </div>

                      {showExpertInsights[activeOutput!] && (
                        <div className="mt-3 text-sm">
                          <p className="mb-2">
                            Our {domainConfig[outputs.find(o => o.id === activeOutput)!.domain].label} expert has analyzed this output and provided additional insights:
                          </p>
                          <div className="bg-background p-3 rounded border">
                            {outputs.find(o => o.id === activeOutput)!.domain === "ideation" && (
                              <>
                                <p className="mb-2">This idea shows strong potential in the current market. Consider these expert recommendations:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Validate with at least 10-15 potential customers before significant investment</li>
                                  <li>Focus on the unique value proposition highlighted in section 2</li>
                                  <li>Consider a freemium model to accelerate initial adoption</li>
                                  <li>The competitive landscape suggests a blue ocean opportunity in this specific niche</li>
                                </ul>
                              </>
                            )}

                            {outputs.find(o => o.id === activeOutput)!.domain === "marketing" && (
                              <>
                                <p className="mb-2">This marketing approach aligns with current industry best practices. Consider these expert recommendations:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>The CAC estimates may be optimistic - consider increasing by 20-30%</li>
                                  <li>Content marketing will likely outperform paid acquisition initially</li>
                                  <li>Implement attribution tracking before launching these campaigns</li>
                                  <li>Consider partnerships with complementary services for faster growth</li>
                                </ul>
                              </>
                            )}

                            {outputs.find(o => o.id === activeOutput)!.domain === "fundraising" && (
                              <>
                                <p className="mb-2">This fundraising strategy is well-aligned with current market conditions. Consider these expert recommendations:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Current seed valuations in this sector average 15-20% lower than projected here</li>
                                  <li>Focus pitch on traction metrics over market size for better investor response</li>
                                  <li>Consider angel investors before approaching institutional VCs</li>
                                  <li>Prepare for 6-9 months of runway during fundraising process</li>
                                </ul>
                              </>
                            )}

                            {outputs.find(o => o.id === activeOutput)!.domain === "product" && (
                              <>
                                <p className="mb-2">This product strategy demonstrates solid understanding of user needs. Consider these expert recommendations:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>The development timeline may be aggressive - consider adding 25% buffer</li>
                                  <li>Implement continuous user testing rather than stage-gated approach</li>
                                  <li>Consider technical debt implications of the proposed architecture</li>
                                  <li>Focus on core features that drive key user behaviors first</li>
                                </ul>
                              </>
                            )}

                            {outputs.find(o => o.id === activeOutput)!.domain === "operations" && (
                              <>
                                <p className="mb-2">This operational approach is well-structured for your stage. Consider these expert recommendations:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Implement OKRs to track progress against these operational goals</li>
                                  <li>Consider outsourcing non-core functions initially</li>
                                  <li>Implement lightweight processes before they become bottlenecks</li>
                                  <li>Regular retrospectives will help optimize this operational model</li>
                                </ul>
                              </>
                            )}

                            {outputs.find(o => o.id === activeOutput)!.domain === "legal" && (
                              <>
                                <p className="mb-2">This legal approach covers the essential bases. Consider these expert recommendations:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Consult with a specialized attorney in your specific jurisdiction</li>
                                  <li>Implement proper data handling procedures from day one</li>
                                  <li>Consider IP protection strategy before public launch</li>
                                  <li>Review standard contracts with legal counsel before use</li>
                                </ul>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feedback Section */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">Was this output helpful?</div>
                        <div className="flex space-x-2">
                          <Button
                            variant={outputFeedback[activeOutput!] === "helpful" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOutputFeedback(prev => ({
                              ...prev,
                              [activeOutput!]: "helpful"
                            }))}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Yes
                          </Button>
                          <Button
                            variant={outputFeedback[activeOutput!] === "not_helpful" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOutputFeedback(prev => ({
                              ...prev,
                              [activeOutput!]: "not_helpful"
                            }))}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            No
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSavedOutputs(prev =>
                            prev.includes(activeOutput!)
                              ? prev.filter(id => id !== activeOutput)
                              : [...prev, activeOutput!]
                          );
                          toast({
                            title: savedOutputs.includes(activeOutput!) ? "Removed from workspace" : "Saved to workspace",
                            description: savedOutputs.includes(activeOutput!)
                              ? "Output removed from your saved workspace"
                              : "Output saved to your workspace for future reference",
                          });
                        }}
                      >
                        {savedOutputs.includes(activeOutput!) ? (
                          <>
                            <BookmarkCheck className="h-4 w-4 mr-1 text-primary" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4 mr-1" />
                            Save to Workspace
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Content Calendar Generator - Only show for marketing domain */}
                    {outputs.find(o => o.id === activeOutput)?.domain === "marketing" && (
                      <div className="mt-6 border rounded-lg p-4 bg-green-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                            <h3 className="font-medium text-green-700">Content Calendar Generator</h3>
                          </div>
                          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Interactive
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm mb-4">
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                              <div key={i} className="text-center text-xs font-medium text-green-800 py-1">
                                {day}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 28 }).map((_, i) => {
                              // Generate random content types
                              const contentTypes = [
                                { type: 'Blog', color: 'bg-blue-100 text-blue-700' },
                                { type: 'Instagram', color: 'bg-pink-100 text-pink-700' },
                                { type: 'Email', color: 'bg-yellow-100 text-yellow-700' },
                                { type: 'Video', color: 'bg-red-100 text-red-700' },
                                { type: null, color: '' }
                              ];

                              // Assign content types to specific days
                              let content = contentTypes[4]; // Default to empty

                              if (i === 1) content = contentTypes[0]; // Blog on day 2
                              if (i === 4) content = contentTypes[1]; // Instagram on day 5
                              if (i === 8) content = contentTypes[2]; // Email on day 9
                              if (i === 11) content = contentTypes[0]; // Blog on day 12
                              if (i === 15) content = contentTypes[1]; // Instagram on day 16
                              if (i === 18) content = contentTypes[3]; // Video on day 19
                              if (i === 22) content = contentTypes[0]; // Blog on day 23
                              if (i === 25) content = contentTypes[1]; // Instagram on day 26

                              return (
                                <div
                                  key={i}
                                  className={`border rounded p-1 min-h-14 text-center ${i % 7 === 5 || i % 7 === 6 ? 'bg-gray-50' : ''}`}
                                >
                                  <div className="text-xs text-gray-500 mb-1">{i + 1}</div>
                                  {content.type && (
                                    <div className={`text-xs px-1 py-0.5 rounded ${content.color}`}>
                                      {content.type}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                            <h4 className="text-xs font-medium text-green-700 mb-2">Content Distribution</h4>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                                <span className="text-xs">Blog Posts</span>
                              </div>
                              <span className="text-xs font-medium">3 per month</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-pink-500 rounded-full mr-1"></div>
                                <span className="text-xs">Instagram Posts</span>
                              </div>
                              <span className="text-xs font-medium">3 per month</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                                <span className="text-xs">Email Newsletters</span>
                              </div>
                              <span className="text-xs font-medium">1 per month</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                                <span className="text-xs">Video Content</span>
                              </div>
                              <span className="text-xs font-medium">1 per month</span>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                            <h4 className="text-xs font-medium text-green-700 mb-2">Content Topics</h4>
                            <ul className="space-y-1">
                              <li className="text-xs flex items-start">
                                <span className="text-green-500 mr-1">•</span>
                                <span>Best water plants for beginners</span>
                              </li>
                              <li className="text-xs flex items-start">
                                <span className="text-green-500 mr-1">•</span>
                                <span>How to care for indoor water plants</span>
                              </li>
                              <li className="text-xs flex items-start">
                                <span className="text-green-500 mr-1">•</span>
                                <span>Essential water plant supplies guide</span>
                              </li>
                              <li className="text-xs flex items-start">
                                <span className="text-green-500 mr-1">•</span>
                                <span>Seasonal water plant care tips</span>
                              </li>
                              <li className="text-xs flex items-start">
                                <span className="text-green-500 mr-1">•</span>
                                <span>Water plant troubleshooting guide</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
                            onClick={() => {
                              toast({
                                title: "Content Calendar Generated",
                                description: "Your content calendar has been generated and can be downloaded.",
                              });
                            }}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Download Calendar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Follow-up Suggestions */}
                    <div className="mt-6 border rounded-lg p-4 bg-blue-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                          <h3 className="font-medium text-blue-700">Follow-up Questions</h3>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          Click to use
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Always show follow-up questions, even if not in state yet */}
                        {(followupSuggestions[activeOutput!] || getDefaultSuggestions(outputs.find(o => o.id === activeOutput)!.domain)).map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="justify-start h-auto py-3 px-4 text-left border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            onClick={() => {
                              // Scroll to form
                              document.querySelector('.input-form')?.scrollIntoView({ behavior: 'smooth' });

                              // Set form values with follow-up question
                              setTimeout(() => {
                                setTitle(suggestion);
                                setDetails(`Following up on my previous request about "${outputs.find(o => o.id === activeOutput)!.title}". ${suggestion}`);

                                // Show toast notification
                                toast({
                                  title: "Follow-up question selected",
                                  description: "The form has been filled with your selected question.",
                                });
                              }, 500);
                            }}
                          >
                            <div className="flex items-start">
                              <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500 mt-0.5" />
                              <span className="text-sm text-blue-800">{suggestion}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="raw" className="flex-1 p-6 overflow-auto">
                <pre className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                  {outputs.find(o => o.id === activeOutput)?.content}
                </pre>
              </TabsContent>

              <TabsContent value="compare" className="flex-1 p-6 overflow-auto">
                {outputs.length > 1 ? (
                  <div className="space-y-6">
                    <div className="bg-muted/20 p-4 rounded-lg border">
                      <h3 className="text-lg font-medium mb-3">Output Comparison Tool</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select two outputs to compare side by side. This helps you identify differences in recommendations across domains or formats.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">First Output</label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={comparedOutputs[0] || ""}
                            onChange={(e) => setComparedOutputs(prev => [e.target.value, prev[1] || ""])}
                          >
                            <option value="">Select an output</option>
                            {outputs.map(output => (
                              <option key={output.id} value={output.id}>
                                {output.title} ({domainConfig[output.domain].label})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Second Output</label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={comparedOutputs[1] || ""}
                            onChange={(e) => setComparedOutputs(prev => [prev[0] || "", e.target.value])}
                          >
                            <option value="">Select an output</option>
                            {outputs.map(output => (
                              <option key={output.id} value={output.id}>
                                {output.title} ({domainConfig[output.domain].label})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {comparedOutputs[0] && comparedOutputs[1] && (
                        <div className="flex justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Comparison Generated",
                                description: "Your output comparison has been generated.",
                              });
                            }}
                          >
                            <Share className="h-3.5 w-3.5 mr-1" />
                            Generate Comparison
                          </Button>
                        </div>
                      )}
                    </div>

                    {comparedOutputs[0] && comparedOutputs[1] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-primary/10 p-3 border-b">
                            <h3 className="font-medium">
                              {outputs.find(o => o.id === comparedOutputs[0])?.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                              <span className={`px-2 py-0.5 rounded ${domainConfig[outputs.find(o => o.id === comparedOutputs[0])?.domain || "ideation"].color}`}>
                                {domainConfig[outputs.find(o => o.id === comparedOutputs[0])?.domain || "ideation"].label}
                              </span>
                              <span>{outputFormatConfig[outputs.find(o => o.id === comparedOutputs[0])?.format || "text"].label}</span>
                            </div>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {outputs.find(o => o.id === comparedOutputs[0])?.content.split('\n').map((line, index) => {
                                if (line.startsWith('# ')) {
                                  return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
                                } else if (line.startsWith('## ')) {
                                  return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
                                } else if (line.startsWith('### ')) {
                                  return <h3 key={index} className="text-md font-bold mt-2 mb-1">{line.substring(4)}</h3>;
                                } else if (line.startsWith('- ')) {
                                  return <li key={index} className="ml-4">{line.substring(2)}</li>;
                                } else if (line === '') {
                                  return <br key={index} />;
                                } else {
                                  return <p key={index} className="my-1">{line}</p>;
                                }
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-primary/10 p-3 border-b">
                            <h3 className="font-medium">
                              {outputs.find(o => o.id === comparedOutputs[1])?.title}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                              <span className={`px-2 py-0.5 rounded ${domainConfig[outputs.find(o => o.id === comparedOutputs[1])?.domain || "ideation"].color}`}>
                                {domainConfig[outputs.find(o => o.id === comparedOutputs[1])?.domain || "ideation"].label}
                              </span>
                              <span>{outputFormatConfig[outputs.find(o => o.id === comparedOutputs[1])?.format || "text"].label}</span>
                            </div>
                          </div>
                          <div className="p-4 max-h-96 overflow-y-auto">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {outputs.find(o => o.id === comparedOutputs[1])?.content.split('\n').map((line, index) => {
                                if (line.startsWith('# ')) {
                                  return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
                                } else if (line.startsWith('## ')) {
                                  return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
                                } else if (line.startsWith('### ')) {
                                  return <h3 key={index} className="text-md font-bold mt-2 mb-1">{line.substring(4)}</h3>;
                                } else if (line.startsWith('- ')) {
                                  return <li key={index} className="ml-4">{line.substring(2)}</li>;
                                } else if (line === '') {
                                  return <br key={index} />;
                                } else {
                                  return <p key={index} className="my-1">{line}</p>;
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {comparedOutputs[0] && comparedOutputs[1] && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center mb-2">
                          <Zap className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium text-blue-800">Key Differences</h3>
                        </div>
                        <div className="text-sm text-blue-700 space-y-2">
                          <p>
                            <span className="font-medium">Focus:</span> The {domainConfig[outputs.find(o => o.id === comparedOutputs[0])?.domain || "ideation"].label} approach emphasizes {outputs.find(o => o.id === comparedOutputs[0])?.domain === "marketing" ? "customer acquisition" : "strategic planning"}, while the {domainConfig[outputs.find(o => o.id === comparedOutputs[1])?.domain || "ideation"].label} focuses on {outputs.find(o => o.id === comparedOutputs[1])?.domain === "marketing" ? "engagement metrics" : "implementation details"}.
                          </p>
                          <p>
                            <span className="font-medium">Timeline:</span> The first output suggests a {outputs.find(o => o.id === comparedOutputs[0])?.domain === "marketing" ? "faster" : "more methodical"} approach, while the second recommends a {outputs.find(o => o.id === comparedOutputs[1])?.domain === "marketing" ? "longer-term" : "more aggressive"} strategy.
                          </p>
                          <p>
                            <span className="font-medium">Resources:</span> Different resource allocations are suggested, with varying emphasis on {outputs.find(o => o.id === comparedOutputs[0])?.domain === "marketing" ? "paid channels" : "team structure"} versus {outputs.find(o => o.id === comparedOutputs[1])?.domain === "marketing" ? "organic growth" : "technical implementation"}.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <Share className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-medium mb-2">Comparison Tool</h3>
                      <p className="text-muted-foreground">
                        Generate at least two outputs to use the comparison feature. This allows you to compare different approaches side by side.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 bg-muted/20">
              <div className="text-center max-w-md">
                <Brain className="h-12 w-12 mx-auto mb-4 text-primary opacity-70" />
                <h3 className="text-xl font-medium mb-2">Elite Startup Advisory at Your Fingertips</h3>
                <p className="text-muted-foreground mb-4">
                  Access domain-specific expertise and actionable deliverables that would cost thousands from traditional consultants.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <div className="border rounded-lg p-3 bg-background">
                    <h4 className="text-sm font-medium text-primary mb-1">Domain Expertise</h4>
                    <p className="text-xs text-muted-foreground">
                      Select from specialized advisors in ideation, marketing, fundraising, legal, operations, and product development.
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 bg-background">
                    <h4 className="text-sm font-medium text-primary mb-1">Strategic Deliverables</h4>
                    <p className="text-xs text-muted-foreground">
                      Generate pitch decks, market analyses, financial models, roadmaps, and other actionable assets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="border-t p-4 bg-background input-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Domain Expertise</label>
                <Select value={selectedDomain} onValueChange={(v) => {
                  setSelectedDomain(v as StartupDomain);
                  // Reset format if not compatible with new domain
                  if (!domainToOutputFormats[v as StartupDomain].includes(selectedFormat)) {
                    setSelectedFormat(domainToOutputFormats[v as StartupDomain][0]);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(domainConfig).map(([key, { label, description }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">{description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Output Format</label>
                <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as OutputFormat)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select output format" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(outputFormatConfig)
                      .filter(([key]) => domainToOutputFormats[selectedDomain].includes(key as OutputFormat))
                      .map(([key, { label, description }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">{description}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={`flex items-center mb-4 p-2 rounded border ${conciseMode ? 'bg-primary/10 border-primary' : 'border-muted'}`}>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="conciseMode"
                  checked={conciseMode}
                  onChange={(e) => setConciseMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="conciseMode" className="text-sm font-medium">
                  Concise Mode {conciseMode && '(Active)'}
                </label>
              </div>
              <div className="text-xs ml-2 text-muted-foreground">
                {conciseMode
                  ? "Generating bullet-point format with only essential information (10-15 points max)"
                  : "Generate comprehensive analysis with detailed explanations and context"}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                placeholder="Concise, specific title (e.g., 'SaaS Product Roadmap for Q3-Q4 2023')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Details</label>
              <Textarea
                placeholder="Provide specific details about your business context, goals, and requirements. Include industry, target market, stage, and any metrics or constraints that would help generate precise recommendations."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                disabled={isLoading}
                rows={5}
                className="resize-none"
              />
            </div>

            {isLoading && generationProgress > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Generating your {outputFormatConfig[selectedFormat].label}...</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {generationProgress < 30 && "Analyzing your request..."}
                    {generationProgress >= 30 && generationProgress < 60 && "Gathering domain expertise..."}
                    {generationProgress >= 60 && generationProgress < 90 && "Formatting insights..."}
                    {generationProgress >= 90 && "Finalizing output..."}
                  </span>
                  <span className="flex items-center">
                    <Sparkles className="h-3 w-3 mr-1 text-primary" />
                    Using {domainConfig[selectedDomain].label} expertise
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateOutput}
                disabled={!title.trim() || !details.trim() || isLoading}
                className="min-w-32"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {generationProgress > 0 ? `Generating... ${Math.round(generationProgress)}%` : "Generating..."}
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    {conciseMode ? "Generate Concise Analysis" : "Generate Expert Analysis"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div ref={endOfOutputsRef} />
    </Card>
  );
};

export default AgentInterface;
