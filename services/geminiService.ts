import OpenAI from 'openai';
import { LinkedInProfile, CandidateInsight, ParsedResume, InterviewQuestion } from "../types";

// Simple persistent cache
const CACHE_KEYS = {
  TRENDS: 'zamzam_hr_trends_cache',
  ANALYSIS: 'zamzam_hr_analysis_cache'
};

const getCache = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    // Safety check: if data is a simple string that's not JSON (doesn't start with { or [), return empty
    if (data && !data.startsWith('{') && !data.startsWith('[')) {
      localStorage.removeItem(key);
      return {};
    }
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.warn(`Corrupted cache for ${key}, clearing it.`);
    localStorage.removeItem(key);
    return {};
  }
};

const setCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Cache write failed", e);
  }
};

const getOpenAIClient = () => new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_API_KEY,
  dangerouslyAllowBrowser: true // Enabling client-side usage as requested
});

const handleAIError = (error: any, fallbackMessage: string) => {
  console.error(error);
  return `${fallbackMessage}: ${error.message || JSON.stringify(error)}`;
};

export const analyzeCandidate = async (profile: LinkedInProfile, roleDescription: string, advancedParams?: any): Promise<CandidateInsight> => {
  const cacheKey = `${profile.id}-${roleDescription}-${JSON.stringify(advancedParams || {})}`;
  const analysisCache = getCache(CACHE_KEYS.ANALYSIS);
  if (analysisCache[cacheKey]) return analysisCache[cacheKey];

  const openai = getOpenAIClient();

  const advancedContext = advancedParams ? `
  Advanced Requirements:
  - Target Level: ${advancedParams.positionLevel || 'Any'}
  - Industry: ${advancedParams.targetIndustry || 'Any'}
  - Core Function: ${advancedParams.coreFunction || 'Any'}
  - Specialization: ${advancedParams.subSpecialization || 'Any'}
  - Skills (Mandatory): ${advancedParams.skills?.mandatory?.join(', ') || 'None'}
  - Skills (Preferred): ${advancedParams.skills?.preferred?.join(', ') || 'None'}
  - Target Companies: ${advancedParams.companyMapping?.target?.join(', ') || 'None'}
  - Excluded Companies: ${advancedParams.companyMapping?.excluded?.join(', ') || 'None'}
  ` : '';

  const prompt = `Analyze this LinkedIn profile for the role: "${roleDescription}".
  ${advancedContext}
  
  Profile Details:
  Name: ${profile.fullName}
  Current Title: ${profile.title}
  Location: ${profile.location}
  Description: ${profile.description || "N/A"}
  Experience: ${JSON.stringify(profile.experienceHistory)}
  Education: ${JSON.stringify(profile.educationHistory)}
  Skills: ${profile.skills?.join(", ") || "N/A"}
  
  Perform a deep holistic analysis and return a JSON response with:
  1. matchScore (0-100): Strict evaluation against requirements.
  2. availabilityScore (0-100): Estimate based on tenure (long tenure = lower score), lack of recent promo, etc.
  3. redFlags (string[]): Detect gaps (>6 months), title inflation, short tenures (<1 yr), regressive moves.
  4. pros (string[]): Key strengths aligned with requirements.
  5. cons (string[]): Missing skills or experience gaps.
  6. geographicFlexibility (string): "High" if worked in multiple countries, else "Low".
  7. currentLevel (string): Estimated level (Manager, Director, VP, etc.).
  8. outreachDraft (string): Personalized cold outreach email.
  9. summary (string): Professional executive summary.
  
  Be critical. High match scores should be reserved for perfect fits.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}") as CandidateInsight;
    // Backwards compatibility for 'score'
    result.score = result.matchScore;

    analysisCache[cacheKey] = result;
    setCache(CACHE_KEYS.ANALYSIS, analysisCache);
    return result;
  } catch (error) {
    throw new Error(handleAIError(error, "Analysis failed"));
  }
};

export const parseResume = async (fileBase64: string, mimeType: string): Promise<ParsedResume> => {
  const openai = getOpenAIClient();
  const prompt = `Extract all details from this resume image.
  Return JSON with: fullName, email, phone, location, title, summary, experience (array of {title, company, duration, description}), education (array of {school, degree, field, period}), skills (array of strings), languages (array of strings).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}") as ParsedResume;
  } catch (error) {
    throw new Error(handleAIError(error, "CV Parsing failed"));
  }
};

export const generateInterviewQuestions = async (title: string, level: string, jobDescription?: string): Promise<InterviewQuestion[]> => {
  const openai = getOpenAIClient();
  const prompt = `Generate 8-10 interview questions for a ${level} ${title}. ${jobDescription ? `Context: ${jobDescription}` : ''}
  Return a JSON object with a key "questions" containing an array of objects with: category, question, whatToLookFor.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");
    return data.questions || [];
  } catch (error) {
    throw new Error(handleAIError(error, "Generation failed"));
  }
};

export const generateResume = async (profile: LinkedInProfile): Promise<string> => {
  const openai = getOpenAIClient();
  const prompt = `Create a professional HTML resume for ${profile.fullName} (${profile.title}).
  Experience: ${profile.experienceHistory?.map(e => `${e.title} at ${e.company} (${e.duration})`).join("; ")}.
  Education: ${profile.educationHistory?.map(e => `${e.degree} from ${e.school}`).join("; ")}.
  Skills: ${profile.skills?.join(", ")}.
  Return ONLY the HTML string.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content || "Failed to generate resume.";
  } catch (error) {
    throw new Error(handleAIError(error, "Resume generation failed"));
  }
};

export const generateJobOffer = async (profile: LinkedInProfile, targetRole: string): Promise<string> => {
  const openai = getOpenAIClient();
  const prompt = `Write a personalized job offer email for ${profile.fullName} for the role of ${targetRole} at Zamzam Exchange.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content || "Failed to generate job offer.";
  } catch (error) {
    throw new Error(handleAIError(error, "Job offer generation failed"));
  }
};

export const getMarketTrends = async (title: string, location: string): Promise<string> => {
  const cacheKey = `${title}-${location}`;
  const trendsCache = getCache(CACHE_KEYS.TRENDS);
  if (trendsCache[cacheKey]) return trendsCache[cacheKey];

  const openai = getOpenAIClient();
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: `Briefly analyze the talent market for ${title} in ${location}. Focus on demand and skills.` }]
    });
    const result = response.choices[0].message.content || "No insights available.";
    trendsCache[cacheKey] = result;
    setCache(CACHE_KEYS.TRENDS, trendsCache);
    return result;
  } catch (error) {
    throw new Error(handleAIError(error, "Market analysis unavailable"));
  }
};

export const measureKPIPerformance = async (fileBase64: string, mimeType: string, userInput: any): Promise<string> => {
  const openai = getOpenAIClient();
  const prompt = `Act as a senior Strategy Consultant. Analyze the provided image of a KPI Report and compare it with the user's input.

  User Input Data:
  ${JSON.stringify(userInput, null, 2)}

  Task:
  1. Locate the specific KPI in the image (Category: ${userInput.category}, KPI: ${userInput.kpi}).
  2. Compare "2025 Actual" and "2026 Target" against the benchmarks in the image.
  3. Provide a status (On Track/Off Track), Gap Analysis, and Strategic Recommendation.
  
  Output in clear Markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${fileBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ]
    });
    return response.choices[0].message.content || "Failed to analyze KPI performance.";
  } catch (error) {
    throw new Error(handleAIError(error, "KPI Measurement failed"));
  }
};
export const chatWithAI = async (messages: { role: 'user' | 'assistant' | 'system', content: string }[], talentContext: string): Promise<string> => {
  const openai = getOpenAIClient();

  const systemPrompt = `You are the "Zamzam Brain", an advanced AI recruitment assistant for Zamzam Exchange.
  You have access to the user's talent pools and enriched LinkedIn profiles.
  
  CURRENT TALENT DATA CONTEXT:
  ${talentContext}
  
  INSTRUCTIONS:
  1. Use the provided context to answer questions about candidates.
  2. If the user asks for a LinkedIn link or profile URL, ALWAYS provide the URL from the context.
  3. If asked to rank candidates, provide a clear, justified ranking based on experience, skills, and fit.
  4. Be professional, concise, and helpful.
  5. If the information isn't in the context, clearly state that you don't have that specific data but offer to analyze what is available.
  6. Format your responses in clean Markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    return response.choices[0].message.content || "I couldn't process that request.";
  } catch (error) {
    throw new Error(handleAIError(error, "Chat failed"));
  }
};
