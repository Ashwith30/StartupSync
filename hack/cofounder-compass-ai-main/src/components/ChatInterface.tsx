import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Brain } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getGeminiResponse, StartupDomain } from "../utils/geminiApi";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  domain?: StartupDomain;
  conciseMode?: boolean; // Whether this message was generated in concise mode
}

const domainConfig: Record<StartupDomain, { color: string; label: string }> = {
  ideation: { color: "bg-primary text-primary-foreground", label: "Ideation Expert" },
  marketing: { color: "bg-marketing text-white", label: "Marketing Expert" },
  fundraising: { color: "bg-fundraising text-white", label: "Fundraising Expert" },
  legal: { color: "bg-legal text-white", label: "Legal Expert" },
  operations: { color: "bg-operations text-white", label: "Operations Expert" },
  product: { color: "bg-product text-white", label: "Product Expert" },
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi there! I'm your AI co-founder powered by Gemini 1.5 Flash. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
      domain: "ideation",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<StartupDomain>("ideation");
  const [conciseMode, setConciseMode] = useState(false);
  const [conversationPhase, setConversationPhase] = useState<"greeting" | "problem" | "response">("greeting");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadConversationHistory = async () => {
      try {
      } catch (error) {
        console.error("Error loading conversation history:", error);
      }
    };

    loadConversationHistory();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      let assistantResponse = "";

      // Validate if the query matches the selected domain
      const domainKeywords: Record<StartupDomain, string[]> = {
        ideation: [
          "idea", "concept", "validation", "business model", "brainstorming", "innovation", "prototype", "design thinking",
          "market research", "feasibility", "startup", "entrepreneurship", "ideation process", "value proposition",
          "customer discovery", "problem-solving", "creative solutions", "disruption", "scalability", "vision",
          "mission", "goals", "strategy", "pivot", "iteration", "product-market fit", "blue ocean", "lean startup",
          "MVP", "proof of concept", "business canvas", "SWOT analysis", "competitive analysis", "target audience",
          "early adopters", "user feedback", "pain points", "opportunity", "growth potential", "differentiation",
          "branding", "positioning", "customer journey", "persona", "value chain", "ecosystem", "collaboration",
          "partnerships", "networking", "pitching", "storytelling", "fundamentals", "execution", "team building",
          "resources", "mentorship", "incubation", "acceleration", "seed funding", "venture capital", "angel investors",
          "bootstrapping", "scaling", "roadmap", "milestones", "success metrics", "KPIs", "traction", "sustainability",
          "long-term vision", "discovery phase", "ideation workshop", "creative process", "problem statement",
          "solution design", "business opportunities"
        ],
        marketing: [
          "marketing", "growth", "customer", "acquisition", "campaign", "branding", "SEO", "content marketing",
          "social media", "advertising", "email marketing", "lead generation", "conversion", "analytics", "metrics",
          "KPIs", "target audience", "customer journey", "persona", "engagement", "retention", "loyalty", "referrals",
          "word of mouth", "influencer marketing", "partnerships", "collaboration", "events", "webinars", "PR",
          "public relations", "media", "outreach", "storytelling", "narrative", "value proposition", "differentiation",
          "positioning", "competitive analysis", "market research", "trends", "insights", "data-driven", "A/B testing",
          "optimization", "ROI", "budgeting", "resources", "tools", "automation", "CRM", "customer relationship",
          "personalization", "customization", "user experience", "UX", "design", "visuals", "branding guidelines",
          "messaging", "tone", "voice", "strategy", "planning", "execution", "timing", "seasonality", "growth hacking",
          "viral marketing", "network effects", "scalability", "sustainability", "long-term growth", "retargeting",
          "remarketing", "funnels", "sales pipeline", "customer acquisition cost", "lifetime value", "churn rate"
        ],
        fundraising: [
          "fundraising", "investor", "pitch", "valuation", "financial", "capital", "seed funding", "series A", "series B",
          "venture capital", "angel investors", "equity", "debt", "crowdfunding", "grants", "bootstrapping", "ROI",
          "financial projections", "business plan", "pitch deck", "storytelling", "narrative", "value proposition",
          "traction", "KPIs", "metrics", "growth", "scalability", "market size", "opportunity", "competitive analysis",
          "SWOT analysis", "team", "founders", "advisors", "mentorship", "networking", "partnerships", "collaboration",
          "due diligence", "legal", "compliance", "contracts", "term sheet", "cap table", "ownership", "shares",
          "vesting", "cliff", "exit strategy", "IPO", "acquisition", "merger", "valuation methods", "DCF", "multiples",
          "market comparables", "funding rounds", "milestones", "success metrics", "investor relations", "updates",
          "communication", "transparency", "trust", "negotiation", "deal terms", "funding strategy", "resources",
          "tools", "platforms", "fundraising events", "demo day", "roadshow", "pitch practice", "feedback", "iteration",
          "refinement", "confidence", "presentation skills", "storytelling techniques"
        ],
        legal: [
          "legal", "compliance", "contract", "ip", "regulation", "intellectual property", "trademark", "patent",
          "copyright", "licensing", "agreements", "terms", "conditions", "privacy", "policy", "GDPR", "data protection",
          "cybersecurity", "liability", "risk", "dispute", "resolution", "arbitration", "mediation", "litigation",
          "lawsuit", "jurisdiction", "governance", "corporate", "structure", "bylaws", "articles", "incorporation",
          "LLC", "C-corp", "S-corp", "partnership", "sole proprietorship", "taxation", "employment law", "labor law",
          "contracts", "agreements", "NDAs", "non-compete", "non-solicitation", "confidentiality", "IP assignment",
          "ownership", "vesting", "cliff", "equity", "shares", "stock options", "cap table", "fundraising", "term sheet",
          "due diligence", "compliance checklist", "regulatory requirements", "industry standards", "certifications",
          "licensing agreements", "disclosures", "reporting", "audits", "penalties", "fines", "legal risks", "mitigation",
          "insurance", "liability coverage", "legal counsel", "advisors", "resources", "tools", "templates", "guidelines",
          "best practices", "case studies", "precedents", "legal updates", "trends", "insights", "legal strategy"
        ],
        operations: [
          "operations", "workflow", "efficiency", "resources", "team", "management", "process", "optimization",
          "automation", "tools", "software", "systems", "scalability", "growth", "sustainability", "cost", "budgeting",
          "planning", "execution", "timing", "deadlines", "milestones", "KPIs", "metrics", "performance", "evaluation",
          "feedback", "iteration", "improvement", "collaboration", "communication", "coordination", "alignment",
          "prioritization", "decision-making", "problem-solving", "risk management", "contingency planning",
          "crisis management", "resources", "allocation", "utilization", "capacity", "scheduling", "time management",
          "productivity", "efficiency", "quality", "standards", "compliance", "regulations", "safety", "security",
          "cybersecurity", "data protection", "privacy", "confidentiality", "documentation", "reporting", "audits",
          "reviews", "inspections", "certifications", "training", "development", "mentorship", "leadership",
          "team building", "culture", "engagement", "motivation", "retention", "recruitment", "onboarding", "offboarding",
          "succession planning", "knowledge transfer", "best practices", "case studies", "trends", "insights",
          "innovation", "disruption", "competitive advantage", "value chain", "supply chain", "logistics", "inventory",
          "procurement", "vendor management", "partnerships", "collaboration", "networking", "ecosystem"
        ],
        product: [
          "product", "feature", "roadmap", "ux", "development", "design", "prototyping", "MVP", "iteration", "feedback",
          "user testing", "usability", "accessibility", "scalability", "performance", "optimization", "quality",
          "standards", "compliance", "regulations", "safety", "security", "cybersecurity", "data protection", "privacy",
          "confidentiality", "documentation", "reporting", "audits", "reviews", "inspections", "certifications",
          "training", "development", "mentorship", "leadership", "team building", "culture", "engagement", "motivation",
          "retention", "recruitment", "onboarding", "offboarding", "succession planning", "knowledge transfer",
          "best practices", "case studies", "trends", "insights", "innovation", "disruption", "competitive advantage",
          "value chain", "supply chain", "logistics", "inventory", "procurement", "vendor management", "partnerships",
          "collaboration", "networking", "ecosystem", "branding", "positioning", "differentiation", "value proposition",
          "customer journey", "persona", "engagement", "retention", "loyalty", "referrals", "word of mouth",
          "influencer marketing", "partnerships", "collaboration", "events", "webinars", "PR", "public relations",
          "media", "outreach", "storytelling", "narrative", "value proposition", "differentiation", "positioning"
        ],
      };

      const keywords = domainKeywords[selectedDomain];
      const isRelatedToDomain = keywords.some((keyword) =>
        inputValue.toLowerCase().includes(keyword)
      );

      if (!isRelatedToDomain) {
        assistantResponse = `Your query seems unrelated to the selected domain (${domainConfig[selectedDomain].label}). Please switch the domain and try again.`;
      } else {
        const domainInstruction = `You are an expert in ${domainConfig[selectedDomain].label}. Provide detailed and helpful information in a conversational tone.`;
        const conversationContext = messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
          .join("\n");
        const query = `${domainInstruction}\n\nConversation so far:\n${conversationContext}\n\nUser: ${inputValue}\nAssistant:`;

        const { response } = await getGeminiResponse(query, selectedDomain, "text", conciseMode);
        assistantResponse = response;
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: assistantResponse,
        role: "assistant",
        timestamp: new Date(),
        domain: selectedDomain,
        conciseMode: conciseMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      toast({
        title: `${domainConfig[selectedDomain].label} responded`,
        description: "New insights are available in your chat.",
      });
    } catch (error) {
      console.error("Error processing message:", error);

      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content: "I'm having trouble processing your request right now. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
        domain: selectedDomain,
      };

      setMessages((prev) => [...prev, fallbackMessage]);

      toast({
        title: "Connection Issue",
        description: "Could not connect to AI services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMarkdown = (content: string, isConcise: boolean = false) => {
    const lines = content.split("\n");

    // Reformat bullet points into Roman numerals or numbered lists
    const formattedLines = lines.map((line, index) => {
      if (line.trim().startsWith("- ")) {
        return `${index + 1}. ${line.substring(2)}`; // Numbered list
      } else if (line.trim().startsWith("* ")) {
        return `${String.fromCharCode(65 + index)}. ${line.substring(2)}`; // Alphabetical list
      } else {
        return line; // Keep other lines as is
      }
    });

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {formattedLines.map((line, index) => {
          if (line.startsWith("# ")) {
            return <h1 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
          } else if (line.startsWith("## ")) {
            return <h2 key={index} className="text-lg font-bold mt-3 mb-2">{line.substring(3)}</h2>;
          } else if (line.startsWith("### ")) {
            return <h3 key={index} className="text-md font-bold mt-2 mb-1">{line.substring(4)}</h3>;
          } else if (/^\d+\./.test(line)) {
            return <li key={index} className="ml-4">{line}</li>;
          } else if (/^[A-Z]\./.test(line)) {
            return <li key={index} className="ml-4">{line}</li>;
          } else if (line === "") {
            return <br key={index} />;
          } else {
            return <p key={index} className="my-1 leading-relaxed">{line}</p>;
          }
        })}
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col rounded-xl overflow-hidden border shadow-lg">
      <div className="flex items-center justify-between bg-muted/40 p-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">AI Co-Founder Chat</h2>
            <p className="text-xs text-muted-foreground">Powered by Gemini 1.5 with domain-specific expertise</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conciseMode && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs hidden sm:inline-block">
              Concise Mode Active
            </span>
          )}
          <Select value={selectedDomain} onValueChange={(v) => setSelectedDomain(v as StartupDomain)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(domainConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto message-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-4 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : message.domain
                  ? `${domainConfig[message.domain].color} rounded-tl-none`
                  : "bg-muted rounded-tl-none"
              }`}
            >
              {message.domain && message.role === "assistant" && (
                <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                  <span>{domainConfig[message.domain].label}</span>
                  {message.conciseMode && (
                    <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-full text-xs">
                      Concise
                    </span>
                  )}
                </div>
              )}
              <div>{message.role === "assistant" ? renderMarkdown(message.content, message.conciseMode) : message.content}</div>
              <div className="text-xs opacity-70 mt-1 text-right">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[80%] p-3 rounded-lg bg-muted rounded-tl-none flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Consulting Gemini 1.5 Flash...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 border-t bg-background">
        <div className={`flex items-center mb-2 p-2 rounded border ${conciseMode ? 'bg-primary/10 border-primary' : 'border-muted'}`}>
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
              ? "Generating bullet-point format with only essential information"
              : "Generate comprehensive responses with detailed explanations"}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={conciseMode ? "Ask for concise bullet points..." : "Ask your AI co-founder..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-grow"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;
