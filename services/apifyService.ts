import { SearchParams, LinkedInProfile } from "../types";

const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN;
const GOOGLE_ACTOR_ID = "apify~google-search-scraper";
const ENRICHMENT_ACTOR_ID = "2SyF0bVxmgGr8IVCZ"; // Fresh LinkedIn Profile Scraper

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
      title: "HR Manager | Talent Acquisition",
      location: "Amman, Jordan",
      profileUrl: "https://linkedin.com/in/mock-layla",
      profilePicUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?v=1",
      description: "Experienced HR Manager with 8+ years in the Banking sector."
    },
    {
      id: "mock-2",
      fullName: "Omar Khalil",
      title: "Senior Technical Recruiter",
      location: "Amman, Jordan",
      profileUrl: "https://linkedin.com/in/mock-omar",
      profilePicUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?v=1",
      description: "Helping tech companies scale. Passionate about finding the right talent."
    }
  ];
};

// Job Title Expansion Dictionary (Professional Grade)
const TITLE_EXPANSIONS: Record<string, string[]> = {
  'finance manager': ['Finance Manager', 'Finance Lead', 'Finance Supervisor', 'Head of Finance'],
  'software quality assurance': ['QA Engineer', 'Quality Assurance Engineer', 'Software Tester', 'Test Automation Engineer'],
  'qa engineer': ['QA Engineer', 'Quality Assurance Engineer', 'Software Tester', 'Test Automation Engineer'],
  'recruiter': ['Recruiter', 'Talent Acquisition', 'Headhunter', 'Technical Recruiter'],
  'software engineer': ['Software Engineer', 'Software Developer', 'Full Stack Developer', 'Backend Engineer'],
  'marketing manager': ['Marketing Manager', 'Marketing Lead', 'Growth Manager', 'Digital Marketing Manager'],
  'project manager': ['Project Manager', 'Program Manager', 'Delivery Manager'],
  'data scientist': ['Data Scientist', 'Machine Learning Engineer', 'Data Analyst', 'AI Engineer']
};

export const startScrapingRun = async (params: SearchParams): Promise<string> => {
  if (!APIFY_API_TOKEN) {
    throw new Error("Apify API Token is missing. Please check your .env file.");
  }

  const getCountryCode = (loc: string) => {
    const map: any = { 'jordan': 'jo', 'uae': 'ae', 'egypt': 'eg', 'usa': 'us', 'uk': 'gb' };
    const match = loc.match(/\b(Jordan|UAE|Egypt|USA|UK)\b/i);
    return match ? map[match[0].toLowerCase()] : '';
  };

  const countryCode = getCountryCode(params.location);

  // Dynamic Title Expansion
  let expandedTitle = `"${params.title}"`;
  if (params.smartExpansion) {
    const key = params.title.toLowerCase().trim();
    if (TITLE_EXPANSIONS[key]) {
      expandedTitle = `(${TITLE_EXPANSIONS[key].map(t => `"${t}"`).join(" OR ")})`;
    }
  }

  // Dynamic Location Expansion (City OR Country)
  let expandedLocation = `"${params.location}"`;
  if (params.location.includes(" ")) {
    const parts = params.location.split(" ").map(p => `"${p.trim()}"`);
    if (parts.length >= 2) {
      expandedLocation = `(${parts.join(" OR ")})`;
    }
  }

  // Construct Professional Google X-Ray Search Query
  const siteOperator = countryCode
    ? `site:${countryCode}.linkedin.com/in/ OR site:${countryCode}.linkedin.com/pub/`
    : `site:linkedin.com/in/ OR site:linkedin.com/pub/`;

  const keywords = [
    `+${expandedTitle}`,
    `+${expandedLocation}`,
    params.keywordsIncludes ? `+"${params.keywordsIncludes}"` : "",
    params.education ? `"${params.education}"` : "",
    params.currentEmployer ? `("${params.currentEmployer}")` : "",
    params.skills?.mandatory?.map(s => `+"${s}"`).join(" "),
    `-intitle:"profiles" -inurl:"dir/"`,
    params.excludeSeniors ? `-"senior" -"lead" -"manager" -"director" -"head"` : "",
    params.keywordsExcludes
      ? params.keywordsExcludes.split(/OR|,/).map(k => `-"${k.trim()}"`).join(" ")
      : ""
  ].filter(Boolean).join(" ");

  const query = `${keywords} ${siteOperator}`;

  const input = {
    queries: query,
    maxPagesPerQuery: 10,
    resultsPerPage: 10,
    mobileResults: false,
    includeUnfilteredResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
  };

  const response = await fetch(`/apify-api/v2/acts/${GOOGLE_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[Apify] Non-OK response startScrapingRun:', text);
    try {
      const errorData = JSON.parse(text);
      throw new Error(`Failed to start Apify run: ${errorData.data?.message || response.statusText}`);
    } catch (e) {
      throw new Error(`Failed to start Apify run (${response.status}): ${text.slice(0, 100)}...`);
    }
  }

  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data.data.id;
  } catch (e) {
    console.error('[Apify] JSON Parse Error startScrapingRun:', text);
    throw new Error(`Invalid JSON response from server: ${text.slice(0, 100)}...`);
  }
};

export const pollRunStatus = async (runId: string): Promise<string> => {
  if (!APIFY_API_TOKEN) throw new Error("Apify API Token is missing.");
  const response = await fetch(`/apify-api/v2/acts/${GOOGLE_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`);
  if (!response.ok) return 'UNKNOWN';
  const data = await response.json();
  return data.data.status;
};

export const getRunResults = async (runId: string, targetLocation: string): Promise<ScrapeResponse> => {
  if (!APIFY_API_TOKEN) throw new Error("Apify API Token is missing.");

  const runResponse = await fetch(`/apify-api/v2/acts/${GOOGLE_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`);
  if (!runResponse.ok) throw new Error("Failed to retrieve run details.");
  const runText = await runResponse.text();
  let runData;
  try {
    runData = JSON.parse(runText);
  } catch (e) {
    console.error('[Apify] JSON Parse Error getRunResults (run):', runText);
    throw new Error(`Invalid JSON for run details: ${runText.slice(0, 100)}...`);
  }

  if (runData.data.status === 'FAILED' || runData.data.status === 'ABORTED') {
    throw new Error(`Apify Run finished with status: ${runData.data.status}`);
  }

  const datasetId = runData.data.defaultDatasetId;
  const response = await fetch(`/apify-api/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`);
  if (!response.ok) throw new Error("Failed to fetch results.");

  const datasetText = await response.text();
  let rawData;
  try {
    rawData = JSON.parse(datasetText);
  } catch (e) {
    console.error('[Apify] JSON Parse Error getRunResults (dataset):', datasetText);
    throw new Error(`Invalid JSON for dataset items: ${datasetText.slice(0, 100)}...`);
  }
  const mappedProfiles: LinkedInProfile[] = [];

  rawData.forEach((page: any) => {
    if (page.organicResults) {
      page.organicResults.forEach((item: any) => {
        const titleParts = item.title.split(" - ");
        const fullName = titleParts[0] || "LinkedIn User";
        const headline = titleParts[1] || "";
        const cleanUrl = item.url ? item.url.split('?')[0].replace(/\/$/, '') : item.url;

        mappedProfiles.push({
          id: cleanUrl,
          fullName: fullName,
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ").slice(1).join(" "),
          title: headline,
          location: targetLocation || "Unknown",
          profileUrl: cleanUrl,
          profilePicUrl: item.pagemap?.cse_image?.[0]?.src || "https://picsum.photos/200",
          description: item.description,
          yearsOfExperience: 5,
          skills: [],
          experienceHistory: [],
          educationHistory: []
        });
      });
    }
  });

  const uniqueProfiles = new Map<string, LinkedInProfile>();
  mappedProfiles.forEach(p => {
    if (!uniqueProfiles.has(p.profileUrl)) uniqueProfiles.set(p.profileUrl, p);
  });

  return {
    success: true,
    total: uniqueProfiles.size,
    profiles: Array.from(uniqueProfiles.values()).slice(0, 100)
  };
};

export const enrichProfiles = async (profileUrls: string[]): Promise<any[]> => {
  if (!APIFY_API_TOKEN) throw new Error("Apify API Token is missing.");
  const BATCH_SIZE = 5;
  const allEnrichedProfiles: any[] = [];
  const cleanUrls = profileUrls.map(url => url.split('?')[0].replace(/\/$/, ''));

  for (let i = 0; i < cleanUrls.length; i += BATCH_SIZE) {
    const batch = cleanUrls.slice(i, i + BATCH_SIZE);
    const batchResults = await processBatch(batch);
    allEnrichedProfiles.push(...batchResults);
  }
  return allEnrichedProfiles;
};

const processBatch = async (batchUrls: string[]) => {
  const input = { profileUrls: batchUrls };
  try {
    const runResponse = await fetch(`/apify-api/v2/acts/${ENRICHMENT_ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!runResponse.ok) return [];
    const runData = await runResponse.json();
    const runId = runData.data.id;

    let status = 'RUNNING';
    while (status === 'RUNNING' || status === 'READY') {
      await new Promise(r => setTimeout(r, 3000));
      const sRes = await fetch(`/apify-api/v2/acts/${ENRICHMENT_ACTOR_ID}/runs/${runId}?token=${APIFY_API_TOKEN}`);
      const sData = await sRes.json();
      status = sData.data.status;
    }

    if (status !== 'SUCCEEDED') return [];
    const dId = runData.data.defaultDatasetId;
    const dRes = await fetch(`/apify-api/v2/datasets/${dId}/items?token=${APIFY_API_TOKEN}`);
    const items = await dRes.json();

    return items.map((item: any) => ({
      ...item,
      linkedinUrl: item.linkedinUrl || item.url,
      fullName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Profile',
      profilePic: item.profilePic || item.profilePicHighQuality || '',
    }));
  } catch (e) {
    return [];
  }
};
