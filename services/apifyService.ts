import { SearchParams, LinkedInProfile } from "../types";

const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN;
const ACTOR_ID = "apify~google-search-scraper"; // Official Google Search Scraper

export interface ScrapeResponse {
  success: boolean;
  total: number;
  profiles: LinkedInProfile[];
}

// MOCK DATA GENERATOR
export const getMockProfiles = (): LinkedInProfile[] => {
  return [
    {
      id: "mock-1",
      fullName: "Layla Al-Sharif",
      firstName: "Layla",
      lastName: "Al-Sharif",
      title: "HR Manager | Talent Acquisition",
      location: "Amman, Jordan",
      profileUrl: "https://linkedin.com/in/mock-layla",
      profilePicUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      description: "Experienced HR Manager with 8+ years in the Banking sector. Specialized in technical recruitment and organizational development.",
      yearsOfExperience: 8,
      skills: ["Recruitment", "HR Strategy", "Employee Relations", "Performance Management"],
      experienceHistory: [],
      educationHistory: []
    },
    {
      id: "mock-2",
      fullName: "Omar Khalil",
      firstName: "Omar",
      lastName: "Khalil",
      title: "Senior Technical Recruiter",
      location: "Amman, Jordan",
      profileUrl: "https://linkedin.com/in/mock-omar",
      profilePicUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      description: "Helping tech companies scale. Passionate about finding the right talent for the right role. Currently at Zain Jordan.",
      yearsOfExperience: 5,
      skills: ["Technical Recruiting", "Sourcing", "LinkedIn Recruiter", "Employer Branding"],
      experienceHistory: [],
      educationHistory: []
    },
    {
      id: "mock-3",
      fullName: "Rania Abdullah",
      firstName: "Rania",
      lastName: "Abdullah",
      title: "Head of People & Culture",
      location: "Amman, Jordan",
      profileUrl: "https://linkedin.com/in/mock-rania",
      profilePicUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      description: "Strategic HR leader focused on culture transformation and talent retention. CIPD Level 7 certified.",
      yearsOfExperience: 12,
      skills: ["Culture Building", "Leadership Development", "HR Policies", "Succession Planning"],
      experienceHistory: [],
      educationHistory: []
    },
    {
      id: "mock-4",
      fullName: "Tareq Mansour",
      firstName: "Tareq",
      lastName: "Mansour",
      title: "HR Business Partner",
      location: "Amman Governorate, Jordan",
      profileUrl: "https://linkedin.com/in/mock-tareq",
      profilePicUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      description: "Bridging the gap between business objectives and people management. Expert in compensations and benefits.",
      yearsOfExperience: 6,
      skills: ["HRBP", "Compensation & Benefits", "Labor Law", "Conflict Resolution"],
      experienceHistory: [],
      educationHistory: []
    },
    {
      id: "mock-5",
      fullName: "Nour Al-Deen",
      firstName: "Nour",
      lastName: "Al-Deen",
      title: "Talent Acquisition Specialist",
      location: "Amman, Jordan",
      profileUrl: "https://linkedin.com/in/mock-nour",
      profilePicUrl: "https://images.unsplash.com/photo-1598550874175-4d7112ee7f1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      description: "Recruitment specialist with a focus on fintech and startups. Digital native with a passion for AI in HR.",
      yearsOfExperience: 3,
      skills: ["High Volume Hiring", "Social Media Recruitment", "ATS Management"],
      experienceHistory: [],
      educationHistory: []
    }
  ];
};

export const startScrapingRun = async (params: SearchParams): Promise<string> => {
  if (!APIFY_API_TOKEN) {
    throw new Error("Apify API Token is missing. Please check your .env file.");
  }

  // Simple Country Code Mapping
  const getCountryCode = (location: string): string => {
    const loc = location.toLowerCase();
    if (loc.includes('jordan') || loc.includes('amman')) return 'jo';
    if (loc.includes('saudi') || loc.includes('ksa') || loc.includes('riyadh')) return 'sa';
    if (loc.includes('uae') || loc.includes('dubai') || loc.includes('abu dhabi')) return 'ae';
    if (loc.includes('usa') || loc.includes('united states')) return 'us';
    if (loc.includes('uk') || loc.includes('united kingdom')) return 'gb';
    return ''; // Default to global/US if unknown
  };

  const countryCode = getCountryCode(params.location);

  // Construct Google X-Ray Search Query matching recruitin.net style
  // Base Site Operator with Country Subdomain if available
  const siteOperator = countryCode
    ? `site:${countryCode}.linkedin.com/in/ OR site:${countryCode}.linkedin.com/pub/`
    : `site:linkedin.com/in/ OR site:linkedin.com/pub/`;

  const keywords = [
    // Job Title - Strict
    `"${params.title}"`,

    // Location - Strict
    `"${params.location}"`,

    // Advanced Includes
    params.keywordsIncludes ? `(${params.keywordsIncludes})` : "",

    // Education
    params.education ? `(${params.education})` : "",

    // Current Employer
    params.currentEmployer ? `("Current * at ${params.currentEmployer}")` : "",

    // Skills
    params.skills?.mandatory?.join(" "),

    // Standard Exclusions + User Exclusions
    `-intitle:"profiles" -inurl:"dir/"`,
    params.keywordsExcludes ? `-${params.keywordsExcludes.split(" OR ").map(k => `"${k.trim()}"`).join(" -")}` : ""
  ].filter(Boolean).join(" ");

  const query = `${siteOperator} ${keywords}`;

  // Input for apify/google-search-scraper
  const input = {
    queries: query,
    resultsPerPage: params.limit || 10,
    maxPagesPerQuery: 2, // Fetch up to 2 pages as requested
    countryCode: countryCode,
  };

  const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to start Apify run: ${errorData.data?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data.id;
};

export const pollRunStatus = async (runId: string): Promise<string> => {
  if (!APIFY_API_TOKEN) throw new Error("Apify API Token is missing.");

  const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`);

  if (!response.ok) return 'UNKNOWN';

  const data = await response.json();
  return data.data.status;
};

export const getRunResults = async (runId: string, targetLocation: string): Promise<ScrapeResponse> => {
  if (!APIFY_API_TOKEN) throw new Error("Apify API Token is missing.");

  // 1. Get Run Details first to find the defaultDatasetId
  const runResponse = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`);
  if (!runResponse.ok) throw new Error("Failed to retrieve run details.");
  const runData = await runResponse.json();

  const status = runData.data.status;
  if (status === 'FAILED' || status === 'ABORTED') {
    throw new Error(`Apify Run finished with status: ${status}`);
  }

  const datasetId = runData.data.defaultDatasetId;
  if (!datasetId) throw new Error("No dataset produced by this run.");

  // 2. Fetch Items from the Dataset
  const response = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`);

  if (!response.ok) {
    throw new Error("Failed to fetch dataset results from Apify.");
  }

  const rawData = await response.json();

  // Map Google SERP results to LinkedInProfile
  // rawData structure is usually: { organicResults: [ { title, url, description, ... } ] }
  const mappedProfiles: LinkedInProfile[] = [];

  rawData.forEach((page: any) => {
    if (page.organicResults) {
      page.organicResults.forEach((item: any) => {
        // Extract basic info from SERP
        const titleParts = item.title.split(" - ");
        const fullName = titleParts[0] || "LinkedIn User";
        const headline = titleParts[1] || "";

        // Attempt to find an image in rich snippets or pagemap
        let profilePic = "https://picsum.photos/200";
        if (item.pagemap?.cse_image?.[0]?.src) {
          profilePic = item.pagemap.cse_image[0].src;
        } else if (item.pagemap?.metatags?.[0]?.['og:image']) {
          profilePic = item.pagemap.metatags[0]['og:image'];
        }

        // Clean URL - Remove query parameters like ?originalSubdomain=jo
        const cleanUrl = item.url ? item.url.split('?')[0] : item.url;

        mappedProfiles.push({
          id: cleanUrl, // Using URL as ID
          fullName: fullName,
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ").slice(1).join(" "),
          title: headline,
          location: targetLocation || "Unknown", // Use the passed location
          profileUrl: cleanUrl,
          profilePicUrl: profilePic,
          description: item.description,
          yearsOfExperience: 5,
          skills: [],
          experienceHistory: [],
          educationHistory: []
        });
      });
    }
  });

  // Deduplicate profiles based on URL
  const uniqueProfiles = new Map<string, LinkedInProfile>();
  mappedProfiles.forEach(profile => {
    if (!uniqueProfiles.has(profile.profileUrl)) {
      uniqueProfiles.set(profile.profileUrl, profile);
    }
  });

  return {
    success: true,
    total: uniqueProfiles.size,
    profiles: Array.from(uniqueProfiles.values())
  };
};

// --- LinkedIn Enrichment Types ---

export interface EnrichedProfile {
  linkedinUrl: string;
  fullName: string;
  headline: string;
  connections: number;
  followers: number;
  email: string | null;
  mobileNumber: string | null;
  about: string;
  location: string;
  skills: { title: string }[];
  experiences: {
    title: string;
    companyName: string;
    jobLocation: string | null;
    jobDescription: string | null;
    jobStartedOn: string | null;
    jobEndedOn: string | null;
    jobStillWorking: boolean;
    companyId?: string | null;
    companyUrn?: string | null;
    companyLink1?: string | null;
    logo?: string | null;
    jobLocationCountry?: string | null;
    employmentType?: string | null;
    companyIndustry?: string | null;
    companySize?: string | null;
  }[];
  educations: {
    title: string;
    subtitle: string;
    period: { startedOn: { year: number }; endedOn: { year: number } } | null;
  }[];
  languages: { name: string; proficiency: string }[];
  profilePic: string | null;
}

const ENRICHMENT_ACTOR_ID = '2SyF0bVxmgGr8IVCZ'; // Fresh LinkedIn Profile Scraper

export const enrichProfiles = async (profileUrls: string[]): Promise<EnrichedProfile[]> => {
  if (!APIFY_API_TOKEN) throw new Error("Apify API Token is missing.");

  const BATCH_SIZE = 5;
  const allEnrichedProfiles: EnrichedProfile[] = [];

  // Process in batches (with cleaned URLs)
  const cleanUrls = profileUrls.map(url => {
    try {
      // Remove query parameters like ?originalSubdomain=jo
      return url.split('?')[0];
    } catch (e) {
      return url;
    }
  });

  for (let i = 0; i < cleanUrls.length; i += BATCH_SIZE) {
    const batch = cleanUrls.slice(i, i + BATCH_SIZE);
    console.log(`Processing enrichment batch ${i / BATCH_SIZE + 1} with URLs:`, batch);
    const batchResults = await processBatch(batch);
    allEnrichedProfiles.push(...batchResults);
  }

  return allEnrichedProfiles;
};


// Helper to process a single batch
const processBatch = async (batchUrls: string[]) => {
  // Input format for 'Fresh LinkedIn Profile Scraper' - User confirmed format is { "profileUrls": [...] }
  const input = {
    profileUrls: batchUrls,
  };

  try {
    // Start Run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${ENRICHMENT_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!runResponse.ok) {
      throw new Error(`Failed to start enrichment run: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Poll for completion
    let status = 'RUNNING';
    while (status === 'RUNNING' || status === 'READY') {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3s
      const statusRes = await fetch(`https://api.apify.com/v2/acts/${ENRICHMENT_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`);
      const statusData = await statusRes.json();
      status = statusData.data.status;
    }

    if (status !== 'SUCCEEDED') {
      console.warn(`Enrichment run ${runId} failed or timed out.`);
      return [];
    }

    // Fetch Dataset
    const datasetId = runData.data.defaultDatasetId || (await (await fetch(`https://api.apify.com/v2/acts/${ENRICHMENT_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`)).json()).data.defaultDatasetId;
    const dataResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`);
    const items = await dataResponse.json();

    // Return FULL profile data but exclude specific fields as requested
    return items.map((item: any) => {
      const { peopleAlsoViewed, recommendations, recommendationsReceived, ...rest } = item;
      return {
        ...rest,
        // Ensure these key fields are always present for the UI even if they come from different props
        linkedinUrl: item.linkedinUrl || item.url,
        fullName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Profile',
        headline: item.headline || '',
        location: item.addressCountryOnly || item.addressWithCountry || item.location || '',
        profilePic: item.profilePic || item.profilePicHighQuality || '',
        connections: item.connections || 0,
        followers: item.followers || 0
      };
    });

  } catch (error) {
    console.error("Error ensuring batch:", error);
    return [];
  }
};

// ENRICHMENT: Fetch detailed profile data
// Uses a specialized LinkedIn Scraper (higher cost)
const PROFILE_ACTOR_ID = "epctex/linkedin-profile-scraper";

export const enrichProfile = async (profileUrl: string): Promise<LinkedInProfile | null> => {
  if (!APIFY_API_TOKEN) throw new Error("Apify API Token is missing.");

  const input = {
    urls: [profileUrl],
    minDelay: 2,
    maxDelay: 10,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"]
    }
  };

  try {
    const response = await fetch(`https://api.apify.com/v2/acts/${PROFILE_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) return null;

    const runData = await response.json();
    const runId = runData.data.id;

    // Poll for completion
    let status = 'RUNNING';
    let retries = 0;
    while (status === 'RUNNING' && retries < 30) {
      await new Promise(r => setTimeout(r, 2000));
      status = await pollRunStatus(runId);
      retries++;
    }

    if (status !== 'SUCCEEDED') return null;

    // Get Results
    const datasetId = runData.data.defaultDatasetId;
    const dataResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`);
    const items = await dataResponse.json();

    if (items.length === 0) return null;

    const richData = items[0];

    // Map rich data to our schema
    return {
      id: profileUrl,
      fullName: richData.fullName || richData.name,
      title: richData.headline || richData.jobTitle,
      location: richData.location,
      profileUrl: profileUrl,
      profilePicUrl: richData.profilePicUrl || richData.image,
      description: richData.about || richData.summary,
      // Map experience and education slightly differently based on actor output
      experienceHistory: richData.experience?.map((exp: any) => ({
        title: exp.title,
        company: exp.companyName || exp.company,
        duration: exp.duration || exp.dateRange,
        description: exp.description
      })) || [],
      educationHistory: richData.education?.map((edu: any) => ({
        school: edu.schoolName || edu.school,
        degree: edu.degreeName || edu.degree,
        field: edu.fieldOfStudy,
        period: edu.dateRange
      })) || [],
      skills: richData.skills?.map((s: any) => s.name || s) || [],
      certifications: richData.certifications?.map((c: any) => c.name || c) || []
    } as LinkedInProfile;

  } catch (error) {
    console.error("Enrichment failed:", error);
    return null;
  }
};
