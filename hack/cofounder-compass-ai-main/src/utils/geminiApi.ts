interface GeminiResponse {
  response: string;
  structuredOutput?: any;
}

export type StartupDomain =
  | "ideation"
  | "marketing"
  | "fundraising"
  | "legal"
  | "operations"
  | "product";

export type OutputFormat =
  | "text"
  | "pitch-deck"
  | "market-analysis"
  | "gtm-strategy"
  | "product-roadmap"
  | "task-plan"
  | "financial-model"
  | "10-day-plan"; // Added new format

/**
 * Makes a request to the Gemini 1.5 Flash API
 */
export async function getGeminiResponse(
  query: string,
  domain: StartupDomain,
  outputFormat: OutputFormat = "text",
  conciseMode: boolean = false
): Promise<GeminiResponse> {
  try {
    const API_KEY = "AIzaSyC5kCXT4A6fkmY0k6VD9ukCnZIXyJ3nN5c";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // Combine system prompt and user query into a single user message
    const systemPrompt = getSystemPromptForDomain(domain, outputFormat, conciseMode);
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${query}` }]
        }
      ],
      generationConfig: {
        temperature: conciseMode ? 0.3 : 0.7,
        topK: conciseMode ? 10 : 40,
        topP: conciseMode ? 0.7 : 0.95,
        maxOutputTokens: conciseMode ? 2048 : 8192,
      }
    };

    console.log("Sending request to Gemini API:", {
      domain,
      outputFormat,
      conciseMode,
      temperature: conciseMode ? 0.3 : 0.7,
      topK: conciseMode ? 10 : 40,
      topP: conciseMode ? 0.7 : 0.95,
      maxTokens: conciseMode ? 2048 : 8192
    });
    console.log("Payload:", JSON.stringify(payload));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error("Authentication failed. Please check your API key.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else {
        console.error("Gemini API error response:", errorData);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log("Gemini API response received:", JSON.stringify(data));

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("Unexpected Gemini API response structure:", data);
      throw new Error("Received empty or invalid response from Gemini API");
    }

    const textResponse = data.candidates[0].content.parts[0].text || "";
    let structuredOutput = null;
    let cleanedResponse = textResponse;

    try {
      // Look for JSON blocks in the response
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          structuredOutput = JSON.parse(jsonMatch[1]);

          // Remove the JSON block from the displayed response for cleaner output
          cleanedResponse = textResponse.replace(/```json\n[\s\S]*?\n```/, '');
        } catch (jsonError) {
          console.warn("Failed to parse JSON output:", jsonError);
        }
      }

      // If no JSON block found but output format requires structured data,
      // attempt to extract structured data from markdown sections
      if (!structuredOutput && outputFormat !== "text") {
        structuredOutput = extractStructuredDataFromMarkdown(textResponse, outputFormat);
      }

      // Post-process the structured output based on format type
      if (structuredOutput) {
        structuredOutput = validateAndEnhanceStructuredOutput(structuredOutput, outputFormat);
      }
    } catch (error) {
      console.warn("Failed to process structured output:", error);
    }

    return {
      response: cleanedResponse.trim(),
      structuredOutput
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    throw error;
  }
}

/**
 * Creates an appropriate system prompt based on domain and output format
 */
function getSystemPromptForDomain(domain: StartupDomain, outputFormat: OutputFormat, conciseMode: boolean = false): string {
  // Base system prompt for all domains
  let prompt = "You are an elite-tier startup advisor with deep expertise in helping founders succeed. Your responses must be precise, data-driven, and immediately actionable. ";

  // Add domain-specific context
  switch (domain) {
    case "ideation":
      prompt += "You are a world-class business ideation expert with experience validating thousands of startup concepts. ";
      prompt += "Analyze market dynamics with precision, identifying specific user pain points and quantifiable market gaps. ";
      prompt += "Provide concrete validation methodologies with exact steps, metrics, and benchmarks. ";
      prompt += "Reference relevant industry case studies and success patterns that apply to this specific context. ";
      prompt += "Focus on innovative business models with clear monetization strategies and defensible competitive advantages. ";
      break;
    case "marketing":
      prompt += "You are a data-driven CMO with expertise across B2B, B2C, and marketplace business models. ";
      prompt += "Deliver precise customer acquisition strategies with specific channels, messaging frameworks, and conversion metrics. ";
      prompt += "Provide exact budget allocations, expected CAC ranges, and ROI calculations based on industry benchmarks. ";
      prompt += "Include tactical execution plans with timeline, resource requirements, and success metrics. ";
      prompt += "Tailor recommendations to the company's specific growth stage, market position, and competitive landscape. ";
      break;
    case "fundraising":
      prompt += "You are an experienced venture capitalist who has evaluated thousands of pitches and helped startups raise $500M+. ";
      prompt += "Provide precise valuation frameworks with specific multiples and comparable company analyses. ";
      prompt += "Outline exact investor targeting strategies with named funds and partners that match this business model and stage. ";
      prompt += "Deliver pitch narratives that address the exact criteria investors use in their decision-making process. ";
      prompt += "Include specific traction metrics, KPIs, and financial projections that will resonate with the right investor profiles. ";
      break;
    case "legal":
      prompt += "You are a specialized startup attorney with expertise across corporate, IP, and regulatory domains. ";
      prompt += "Provide precise legal frameworks and compliance requirements specific to this business model and jurisdiction. ";
      prompt += "Outline exact IP protection strategies with specific filing processes, timelines, and cost considerations. ";
      prompt += "Deliver concrete risk mitigation approaches with prioritized action items and resource requirements. ";
      prompt += "Include specific contract structures, terms, and clauses that address the unique needs of this business context. ";
      break;
    case "operations":
      prompt += "You are a seasoned COO who has scaled multiple startups from founding to exit. ";
      prompt += "Provide precise operational frameworks with specific processes, tools, and resource allocation models. ";
      prompt += "Outline exact team structures with roles, responsibilities, and hiring timelines appropriate for this growth stage. ";
      prompt += "Deliver concrete efficiency metrics, KPIs, and optimization strategies tailored to this business model. ";
      prompt += "Include specific automation opportunities with tool recommendations, implementation timelines, and expected ROI. ";
      break;
    case "product":
      prompt += "You are an elite product leader who has built and scaled multiple successful products from concept to market leadership. ";
      prompt += "Provide precise product development methodologies with specific sprint structures, team compositions, and delivery timelines. ";
      prompt += "Outline exact feature prioritization frameworks with scoring criteria tailored to this product category and user base. ";
      prompt += "Deliver concrete technical architecture recommendations with specific technology choices and scalability considerations. ";
      prompt += "Include detailed user experience flows with key interaction points and success metrics for core user journeys. ";
      break;
    default:
      prompt += "You provide comprehensive business advice across all startup domains, with precision and specificity that demonstrates deep domain expertise. ";
  }

  // Add output format instructions with more specific structure requirements
  switch (outputFormat) {
    case "pitch-deck":
      prompt += "Create a detailed pitch deck outline with exactly 12 slides following the proven VC-backed structure. Format as a structured JSON array of slides with 'title', 'content', and 'key_metrics' fields for each slide. Include these specific slides: 1) Vision & Problem, 2) Solution & Value Proposition, 3) Market Size (TAM/SAM/SOM), 4) Business Model with Unit Economics, 5) Go-to-Market Strategy, 6) Competitive Landscape with Positioning Matrix, 7) Traction with Specific Metrics, 8) Product Roadmap with Timeline, 9) Team with Relevant Experience, 10) Financial Projections (3-5 years), 11) Funding Ask with Use of Funds, 12) Vision & Contact. The content must include specific metrics, data points, and industry-specific insights that demonstrate deep domain knowledge.";
      break;
    case "market-analysis":
      prompt += "Deliver a comprehensive market analysis with these specific sections: 1) Market Definition & Segmentation, 2) Market Size with TAM/SAM/SOM calculations, 3) Growth Projections with CAGR by segment, 4) Competitive Landscape with detailed competitor profiles, 5) Market Trends with supporting data, 6) Customer Analysis with detailed personas, 7) Entry Barriers & Regulatory Factors, 8) Market Opportunities with prioritization framework. Include specific market sizes, growth rates, competitor market shares, and customer acquisition costs relevant to this specific industry. Support all claims with data points and sources where possible.";
      break;
    case "gtm-strategy":
      prompt += "Create a detailed go-to-market strategy with these specific sections: 1) Target Market Definition with detailed ICP, 2) Value Proposition & Messaging Framework, 3) Channel Strategy with specific platforms and tactics, 4) Pricing Strategy with tier structure, 5) Sales Process & Conversion Funnel, 6) Marketing Budget Allocation by channel, 7) Launch Timeline with specific milestones, 8) Success Metrics & KPIs. Include specific CAC estimates, conversion rate benchmarks, and channel performance metrics based on industry standards. Provide exact messaging examples and tactical execution steps for each channel.";
      break;
    case "product-roadmap":
      prompt += "Develop a quarterly product roadmap for the next 12 months. Structure as a JSON object with quarters as keys and arrays of features as values. For each feature include: 'name', 'description', 'priority' (P0/P1/P2), 'effort' (story points), 'impact' (high/medium/low), 'dependencies', and 'success_metrics'. Group features into themes (acquisition, activation, retention, revenue, referral) and ensure alignment with business objectives. Include specific technical considerations, resource requirements, and risk factors for each development phase.";
      break;
    case "task-plan":
      prompt += "Create an actionable task plan with specific steps organized in these sections: 1) Immediate Actions (0-30 days), 2) Short-term Initiatives (30-90 days), 3) Medium-term Projects (90-180 days). Format as a JSON array of tasks with 'title', 'description', 'owner_role', 'timeline', 'priority' (high/medium/low), 'dependencies', 'resources_needed', and 'success_criteria' fields. Include specific deliverables, deadlines, and measurable outcomes for each task. Ensure tasks are sequenced logically with clear dependencies and resource allocations.";
      break;
    case "financial-model":
      prompt += "Generate a detailed financial projection with these specific components: 1) Revenue Forecast by stream for 3 years (monthly for Y1, quarterly for Y2-3), 2) Cost Structure with fixed vs. variable breakdown, 3) Unit Economics with CAC, LTV, and payback period, 4) Cash Flow Projection, 5) Break-even Analysis, 6) Funding Requirements, 7) Key Financial Metrics (gross margin, burn rate, runway). Base all projections on specific industry benchmarks and comparable company data. Include sensitivity analysis for key variables and assumptions table with specific growth rates, conversion metrics, and pricing assumptions.";
      break;
    case "10-day-plan":
      prompt += "Create a detailed 10-day plan with specific tasks for each day. Format as a structured JSON array of days with 'day' and 'content' fields for each day. Include specific tasks, timelines, and success metrics for each day. Ensure tasks are actionable and aligned with the overall business objectives.";
      break;
    default:
      prompt += "Provide extremely specific, actionable advice with exact steps, metrics, and timelines. Your response must include: 1) Executive Summary with key recommendations, 2) Detailed Analysis of the specific situation, 3) Strategic Recommendations with prioritization, 4) Tactical Implementation Steps with timeline and resources, 5) Success Metrics & KPIs to track progress. Avoid generalities - every recommendation must include specific actions, tools, metrics, or frameworks that apply precisely to this situation.";
  }

  // Add concise mode instructions if enabled
  if (conciseMode) {
    // Clear previous prompt and set a completely different style for concise mode
    prompt = "You are a direct, no-nonsense startup advisor who provides only essential information. ";

    // Add domain-specific context for concise mode
    switch (domain) {
      case "ideation":
        prompt += "Focus only on the most viable business concept and 3-5 validation steps. ";
        break;
      case "marketing":
        prompt += "Focus only on top 3 customer acquisition channels and their metrics. ";
        break;
      case "fundraising":
        prompt += "Focus only on funding strategy, valuation, and key investor targets. ";
        break;
      case "legal":
        prompt += "Focus only on critical legal requirements and immediate compliance steps. ";
        break;
      case "operations":
        prompt += "Focus only on critical operational bottlenecks and immediate solutions. ";
        break;
      case "product":
        prompt += "Focus only on core features, development priorities, and technical requirements. ";
        break;
    }

    prompt += "CRITICAL INSTRUCTIONS: Your response must be extremely brief and direct. Use only bullet points. Maximum 10-15 bullet points total. No introductions, no explanations, no context, no conclusions. Each bullet point must be under 15 words. Focus only on actionable insights and specific data points. Include exact numbers whenever possible. Format all output as a simple bullet list with no sections or headings.";

    // Add format-specific instructions for concise mode
    if (outputFormat !== "text") {
      prompt += " For structured data, provide only the JSON with minimal content in each field. Keep all text fields under 25 words.";
    }
  } else {
    prompt += " Your output must demonstrate elite domain expertise through: 1) Precision - use exact numbers, metrics, and benchmarks rather than ranges or generalities, 2) Specificity - tailor every recommendation to the exact business context, stage, and industry, 3) Actionability - provide concrete next steps that can be implemented immediately, 4) Insight - demonstrate pattern recognition from relevant case studies and industry knowledge. Avoid obvious or generic recommendations that could apply to any business. Your response should read as if written by a top-tier consultant or advisor who charges $1000/hour for their expertise.";
  }

  return prompt;
}

/**
 * Attempts to extract structured data from markdown text when JSON parsing fails
 */
function extractStructuredDataFromMarkdown(text: string, format: OutputFormat): any {
  switch (format) {
    case "pitch-deck":
      return extractPitchDeckFromMarkdown(text);
    case "product-roadmap":
      return extractRoadmapFromMarkdown(text);
    case "task-plan":
      return extractTaskPlanFromMarkdown(text);
    case "financial-model":
      return extractFinancialModelFromMarkdown(text);
    case "10-day-plan":
      return extract10DayPlanFromMarkdown(text); // Handle 10-day-plan
    default:
      return null;
  }
}

/**
 * Extracts pitch deck slides from markdown headings and content
 */
function extractPitchDeckFromMarkdown(text: string): any[] {
  const slides: any[] = [];
  const slideRegex = /##\s*(.*?)\s*\n([\s\S]*?)(?=##|$)/g;

  let match;
  while ((match = slideRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();

    // Extract key metrics if they exist (often in bullet points)
    const metricsMatch = content.match(/Key Metrics:?\s*([\s\S]*?)(?=\n\n|$)/i);
    const keyMetrics = metricsMatch ?
      metricsMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s*/, '').trim()) :
      [];

    slides.push({
      title,
      content,
      key_metrics: keyMetrics
    });
  }

  return slides.length > 0 ? slides : null;
}

/**
 * Extracts product roadmap from markdown headings and lists
 */
function extractRoadmapFromMarkdown(text: string): any {
  const roadmap: Record<string, any[]> = {};
  const quarterRegex = /##\s*(Q\d\s+\d{4}|Quarter\s+\d\s+\d{4})\s*\n([\s\S]*?)(?=##|$)/g;

  let match;
  while ((match = quarterRegex.exec(text)) !== null) {
    const quarter = match[1].trim();
    const content = match[2].trim();

    // Extract features from bullet points
    const features = content.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => {
        const featureText = line.replace(/^[-*]\s*/, '').trim();

        // Try to extract priority, effort, etc. if they're in parentheses
        const metaMatch = featureText.match(/(.*?)\s*\((.*?)\)/);
        if (metaMatch) {
          const name = metaMatch[1].trim();
          const meta = metaMatch[2].trim();

          const priorityMatch = meta.match(/P(\d)/i);
          const effortMatch = meta.match(/(\d+)\s*points?/i);
          const impactMatch = meta.match(/(high|medium|low)\s*impact/i);

          return {
            name,
            description: name,
            priority: priorityMatch ? `P${priorityMatch[1]}` : "P1",
            effort: effortMatch ? parseInt(effortMatch[1]) : 3,
            impact: impactMatch ? impactMatch[1].toLowerCase() : "medium",
            dependencies: [],
            success_metrics: []
          };
        }

        return {
          name: featureText,
          description: featureText,
          priority: "P1",
          effort: 3,
          impact: "medium",
          dependencies: [],
          success_metrics: []
        };
      });

    roadmap[quarter] = features;
  }

  return Object.keys(roadmap).length > 0 ? roadmap : null;
}

/**
 * Extracts task plan from markdown headings and lists
 */
function extractTaskPlanFromMarkdown(text: string): any[] {
  const tasks: any[] = [];
  const sectionRegex = /##\s*(.*?)\s*\n([\s\S]*?)(?=##|$)/g;

  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    const sectionTitle = match[1].trim();
    const content = match[2].trim();

    // Determine timeline based on section title
    let timeline = "30-90 days"; // default to short-term
    if (sectionTitle.toLowerCase().includes("immediate") || sectionTitle.toLowerCase().includes("0-30")) {
      timeline = "0-30 days";
    } else if (sectionTitle.toLowerCase().includes("medium") || sectionTitle.toLowerCase().includes("90-180")) {
      timeline = "90-180 days";
    }

    // Extract tasks from bullet points
    const sectionTasks = content.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => {
        const taskText = line.replace(/^[-*]\s*/, '').trim();

        // Try to extract priority if it's in brackets or parentheses
        const priorityMatch = taskText.match(/\[(high|medium|low)\]|\((high|medium|low)\)/i);
        const priority = priorityMatch ? priorityMatch[1].toLowerCase() : "medium";

        // Clean up the title
        const title = taskText.replace(/\[(high|medium|low)\]|\((high|medium|low)\)/i, '').trim();

        return {
          title,
          description: title,
          timeline,
          priority,
          owner_role: "Founder",
          dependencies: [],
          resources_needed: [],
          success_criteria: []
        };
      });

    tasks.push(...sectionTasks);
  }

  return tasks.length > 0 ? tasks : null;
}

/**
 * Extracts financial model from markdown tables and lists
 */
function extractFinancialModelFromMarkdown(text: string): any {
  // This is a simplified extraction - a real implementation would be more complex
  const model: any = {
    revenue_streams: [],
    costs: { fixed: [], variable: [] },
    unit_economics: {},
    projections: {}
  };

  // Extract revenue streams from bullet points under Revenue section
  const revenueMatch = text.match(/##\s*Revenue.*?\n([\s\S]*?)(?=##|$)/i);
  if (revenueMatch) {
    model.revenue_streams = revenueMatch[1].split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim());
  }

  // Extract costs from bullet points under Costs section
  const costsMatch = text.match(/##\s*Costs.*?\n([\s\S]*?)(?=##|$)/i);
  if (costsMatch) {
    const costLines = costsMatch[1].split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim());

    costLines.forEach(cost => {
      if (cost.toLowerCase().includes("fixed")) {
        model.costs.fixed.push(cost);
      } else {
        model.costs.variable.push(cost);
      }
    });
  }

  // Extract unit economics metrics
  const unitEconomicsMatch = text.match(/##\s*Unit Economics.*?\n([\s\S]*?)(?=##|$)/i);
  if (unitEconomicsMatch) {
    const metrics = unitEconomicsMatch[1].split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [key, value] = line.split(':').map(part => part.trim());
        return { key: key.toLowerCase().replace(/\s+/g, '_'), value };
      });

    metrics.forEach(({ key, value }) => {
      model.unit_economics[key] = value;
    });
  }

  return Object.keys(model.revenue_streams).length > 0 ||
         Object.keys(model.costs.fixed).length > 0 ||
         Object.keys(model.unit_economics).length > 0 ? model : null;
}

/**
 * Extracts a 10-day plan from markdown text
 */
function extract10DayPlanFromMarkdown(text: string): any[] {
  const days: any[] = [];
  const dayRegex = /##\s*Day\s*(\d+)\s*\n([\s\S]*?)(?=##|$)/g;

  let match;
  while ((match = dayRegex.exec(text)) !== null) {
    const day = parseInt(match[1].trim(), 10);
    const content = match[2].trim();

    days.push({
      day,
      content,
    });
  }

  return days.length > 0 ? days : null;
}

/**
 * Validates and enhances structured output to ensure it meets the expected format
 */
function validateAndEnhanceStructuredOutput(data: any, format: OutputFormat): any {
  switch (format) {
    case "pitch-deck":
      return validatePitchDeck(data);
    case "product-roadmap":
      return validateProductRoadmap(data);
    case "task-plan":
      return validateTaskPlan(data);
    case "financial-model":
      return validateFinancialModel(data);
    default:
      return data;
  }
}

/**
 * Validates and enhances pitch deck data
 */
function validatePitchDeck(data: any[]): any[] {
  if (!Array.isArray(data)) return [];

  // Ensure all slides have the required fields
  return data.map(slide => ({
    title: slide.title || "Untitled Slide",
    content: slide.content || "",
    key_metrics: Array.isArray(slide.key_metrics) ? slide.key_metrics :
                (slide.key_metrics ? [slide.key_metrics] : [])
  }));
}

/**
 * Validates and enhances product roadmap data
 */
function validateProductRoadmap(data: any): any {
  if (typeof data !== 'object' || data === null) return {};

  const validatedRoadmap: Record<string, any[]> = {};

  // Process each quarter
  Object.entries(data).forEach(([quarter, features]) => {
    if (!Array.isArray(features)) return;

    validatedRoadmap[quarter] = features.map((feature: any) => ({
      name: feature.name || "Unnamed Feature",
      description: feature.description || feature.name || "",
      priority: feature.priority || "P1",
      effort: feature.effort || 3,
      impact: feature.impact || "medium",
      dependencies: Array.isArray(feature.dependencies) ? feature.dependencies : [],
      success_metrics: Array.isArray(feature.success_metrics) ? feature.success_metrics : []
    }));
  });

  return validatedRoadmap;
}

/**
 * Validates and enhances task plan data
 */
function validateTaskPlan(data: any[]): any[] {
  if (!Array.isArray(data)) return [];

  return data.map(task => ({
    title: task.title || "Untitled Task",
    description: task.description || task.title || "",
    owner_role: task.owner_role || "Founder",
    timeline: task.timeline || "30-90 days",
    priority: task.priority || "medium",
    dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    resources_needed: Array.isArray(task.resources_needed) ? task.resources_needed : [],
    success_criteria: Array.isArray(task.success_criteria) ? task.success_criteria : []
  }));
}

/**
 * Validates and enhances financial model data
 */
function validateFinancialModel(data: any): any {
  if (typeof data !== 'object' || data === null) return {};

  return {
    revenue_streams: Array.isArray(data.revenue_streams) ? data.revenue_streams : [],
    costs: {
      fixed: Array.isArray(data.costs?.fixed) ? data.costs.fixed : [],
      variable: Array.isArray(data.costs?.variable) ? data.costs.variable : []
    },
    unit_economics: typeof data.unit_economics === 'object' ? data.unit_economics : {},
    projections: typeof data.projections === 'object' ? data.projections : {},
    metrics: typeof data.metrics === 'object' ? data.metrics : {}
  };
}
