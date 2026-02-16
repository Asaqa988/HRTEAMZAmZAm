
import { SearchParams, LinkedInProfile } from "../types";

export interface ScrapeResponse {
  success: boolean;
  total: number;
  profiles: LinkedInProfile[];
}

// Data merging detailed profiles with the original 20-candidate list
const RAW_DEMO_DATA = [
  // Detailed candidates first
  {
    "id": "nazem-khair",
    "linkedinUrl": "https://www.linkedin.com/in/nazem-khair-852a33158",
    "firstName": "Nazem",
    "lastName": "Khair",
    "headline": "Human Resources Officer at Rotana Hotels & Resorts",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQEaj9m_3RWDJw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1731333489986?e=1772668800&v=beta&t=LUcb4OHQ0vwvTmhmcw9rVxuEavK_ZKm0KKCfiFGs664",
    "experience": [
      { "position": "Human Resources Officer", "companyName": "Rotana Hotels & Resorts", "duration": "6 mos", "description": "Current Role" },
      { "position": "Assistant Human Resources Manager", "companyName": "Kerten Hospitality", "duration": "11 mos" },
      { "position": "Human Resource Coordinator", "companyName": "Kerten Hospitality", "duration": "1 yr 4 mos", "description": "Structural set up of HR including Policies and Procedures." },
      { "position": "Golf Operation", "companyName": "Ayla Oasis", "duration": "11 mos" },
      { "position": "Aircraft Maintenance B1 Engineer", "companyName": "Joramco", "duration": "2 yrs 7 mos" }
    ],
    "education": [
      { "schoolName": "Joramco Academy Amman-Jordan", "degree": "Diploma", "fieldOfStudy": "Aircraft Maintenance Technology", "period": "2015 - 2019" }
    ],
    "skills": ["Solution Orientated", "Leadership", "Teamwork", "Planning", "Aircraft Maintenance"]
  },
  {
    "id": "alaa-hamdan",
    "linkedinUrl": "https://www.linkedin.com/in/alaa-hamdan-ba3964115",
    "firstName": "Alaa",
    "lastName": "Hamdan",
    "headline": "Human Resources Section head at SmartBuy™",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQEmYUhTGx9jDw/profile-displayphoto-crop_800_800/B4DZtu0QssKAAI-/0/1767090754286?e=1772668800&v=beta&t=nRmp5jQSGD23vi_mkHVlhPD-6OxSGX9s_qDOH_zc6lc",
    "about": "Human Resources Section head at SmartBuy™. Menaitec Certificated \"MPAY-CP®\"",
    "experience": [
      { "position": "Human Resources Section head", "companyName": "SmartBuy™", "duration": "5 yrs 3 mos" },
      { "position": "Senior Human Resources Officer", "companyName": "SmartBuy™", "duration": "3 yrs 1 mo" },
      { "position": "Human Resource Officer", "companyName": "Combaj International", "duration": "5 mos" },
      { "position": "Human Resource Officer", "companyName": "Al-Moasron Company", "duration": "1 yr 3 mos" }
    ],
    "education": [
      { "schoolName": "The Hashemite University", "degree": "Bachelor's degree", "fieldOfStudy": "Business Administration and Management", "period": "2008 - 2011" }
    ],
    "skills": ["Menaitech", "Management", "Human Resources", "Negotiation", "Team Building"]
  },
  {
    "id": "dania-msallam",
    "linkedinUrl": "https://www.linkedin.com/in/dania-msallam-1a0b631ab",
    "firstName": "Dania",
    "lastName": "Msallam",
    "headline": "PwC | HC Regional | HC Shared Services",
    "location": "Amman, Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQG5U90Qc-1umw/profile-displayphoto-crop_800_800/B4DZrFI.xsH4AM-/0/1764244059450?e=1772668800&v=beta&t=fVzUgGDS4RQSUU-S-k9rxPJXroxzCn5YFo29k2SAtcU",
    "experience": [
      { "position": "Human Resource Operations", "companyName": "PwC", "duration": "10 mos" },
      { "position": "Human Resources Officer", "companyName": "Sheraton Amman Al Nabil Hotel", "duration": "1 yr 8 mos" },
      { "position": "Content Moderator", "companyName": "Webhelp", "duration": "1 yr 10 mos" },
      { "position": "Salesperson", "companyName": "Modern Systems & Computer Trade", "duration": "1 yr 6 mos" }
    ],
    "education": [
      { "schoolName": "University of Jordan", "degree": "Bachelor of Business Administration", "fieldOfStudy": "Business Administration and Management", "period": "2016 - 2020" }
    ],
    "skills": ["Teamwork", "Analytical Skills", "Strategic Planning", "Time Management", "Business Planning"]
  },
  // Original candidates with basic info
  {
    "id": "nadeen-awadallah",
    "firstName": "Nadeen",
    "lastName": "Awadallah",
    "headline": "Senior Human Resources Specialist at Inspire",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQE6nmCFoFXEUw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1704140259437?e=1772668800&v=beta&t=eEJsr1cpuNz9hhPVVbGnaGP4d-QhezjjOrNWnz1dKKI",
    "experience": [{ "position": "Senior Human Resources Specialist", "companyName": "Inspire for Solutions Development", "duration": "3 yrs" }],
    "education": [{ "schoolName": "University of Jordan", "degree": "Bachelor", "fieldOfStudy": "Human Resources", "period": "2014 - 2018" }],
    "skills": ["Technical Recruitment", "Management", "Strategy"]
  },
  {
    "id": "rajaa-asfour",
    "firstName": "Rajaa",
    "lastName": "Asfour",
    "headline": "Human Resources Specialist at JODDB",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4E03AQFawrN-hVlaBw/profile-displayphoto-crop_800_800/B4EZjVod73GwAI-/0/1755930814504?e=1772668800&v=beta&t=El82YmvIdnseqyv0wbxfjhA0M5PkLASHCOsH9WYJMX4",
    "experience": [{ "position": "Human Resources Specialist", "companyName": "JODDB", "duration": "4 yrs" }],
    "education": [{ "schoolName": "Jordan University of Science and Technology", "degree": "Bachelor", "fieldOfStudy": "Industrial Engineering", "period": "2012 - 2017" }],
    "skills": ["HRIS", "Compensation", "Training"]
  },
  {
    "id": "aya-elayyan",
    "firstName": "Aya",
    "lastName": "Elayyan",
    "headline": "Head of Recruitment at kalamntina",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/C4D03AQHiWNnopVHK2A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1612358779854?e=1772668800&v=beta&t=Ihca2xcdivTasRtk4bk5-sZm5gIfEoJ_rj7x8TW2D7c",
    "experience": [{ "position": "Head of Recruitment and Outsourcing", "companyName": "kalamntina", "duration": "5 yrs" }],
    "education": [{ "schoolName": "Amman Arab University", "degree": "Master", "fieldOfStudy": "HR Management", "period": "2018 - 2020" }],
    "skills": ["Recruitment", "Talent Acquisition", "Outsourcing"]
  },
  {
    "id": "samer-melhem",
    "firstName": "Samer",
    "lastName": "Melhem",
    "headline": "Senior Human Resources Officer at Nabil Foods",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQEVl6w4uw7MxA/profile-displayphoto-crop_800_800/B4DZkEuHy5GsAM-/0/1756720826518?e=1772668800&v=beta&t=kSMZRjpXmOcCYmaP7VBezX6JTA99rKs8bkKl6ky6iG8",
    "experience": [{ "position": "Senior Human Resources Officer", "companyName": "Nabil Foods", "duration": "6 yrs" }],
    "education": [{ "schoolName": "Al-Balqa Applied University", "degree": "Bachelor", "fieldOfStudy": "Accounting", "period": "2010 - 2014" }],
    "skills": ["Payroll", "Social Security", "Benefits"]
  },
  {
    "id": "christine-akroush",
    "firstName": "Christine",
    "lastName": "Akroush, CHRM",
    "headline": "Human Resources Coordinator at Jabal Amman Publishers",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQF8coEqwVBdTA/profile-displayphoto-crop_800_800/B4DZv41mnhKUAM-/0/1769406361647?e=1772668800&v=beta&t=y5DcWdjgAS12eBBZUWdU8Qyy33fxiFVmhDuOp4j3KaY",
    "experience": [{ "position": "Human Resources Coordinator", "companyName": "Jabal Amman Publishers", "duration": "2 yrs" }],
    "education": [{ "schoolName": "Princess Sumaya University for Technology", "degree": "MBA", "fieldOfStudy": "Business", "period": "2019 - 2021" }],
    "skills": ["Coordination", "CHRM", "Administration"]
  },
  {
    "id": "linda-haddad",
    "firstName": "Linda",
    "lastName": "Haddad",
    "headline": "Human Resources & Admin Manager at Habitat for Humanity",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQFr1Iw7_wt8Zg/profile-displayphoto-crop_800_800/B4DZulMYM2JkAI-/0/1768003049585?e=1772668800&v=beta&t=2ZsF-emxEnRiDdj6rxKpfhSvcHXDQ53i0odeA8KWxmU",
    "experience": [{ "position": "Human Resources & Admin Manager", "companyName": "Habitat for Humanity", "duration": "8 yrs" }],
    "education": [{ "schoolName": "German Jordanian University", "degree": "Bachelor", "fieldOfStudy": "Business", "period": "2010 - 2014" }],
    "skills": ["Leadership", "NGO", "Administration"]
  },
  {
    "id": "ghassan-azzam",
    "firstName": "Ghassan",
    "lastName": "Azzam (HRM)®",
    "headline": "Human Resources Generalist at ICRC",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQFyz7PwS7YH8Q/profile-displayphoto-crop_800_800/B4DZqYgH.GIgAI-/0/1763495150955?e=1772668800&v=beta&t=2PTTLl7x78wLIwmxCadoC_3j4J83t2mkFvLit6PUx64",
    "experience": [{ "position": "Human Resources Generalist", "companyName": "ICRC", "duration": "10 yrs" }],
    "education": [{ "schoolName": "University of Jordan", "degree": "Master", "fieldOfStudy": "HRM", "period": "2012 - 2014" }],
    "skills": ["International Relations", "Compliance", "HR Strategy"]
  },
  {
    "id": "batool-smadi",
    "firstName": "Batool Smadi",
    "lastName": ",HRMD",
    "headline": "Human Resources Specialist at Nader Group",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQF-PRvZmooT4w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1711835317302?e=1772668800&v=beta&t=ayyhB3HsyCEQMbZJ0PRbiBHFqlHwOrnQf2gEMizr-gw",
    "experience": [{ "position": "Human Resources Specialist", "companyName": "Nader Group", "duration": "4 yrs" }],
    "education": [{ "schoolName": "Yarmouk University", "degree": "Bachelor", "fieldOfStudy": "Translation", "period": "2015 - 2019" }],
    "skills": ["Communication", "Recruitment", "Onboarding"]
  },
  {
    "id": "safaa-tahhan",
    "firstName": "Safaa",
    "lastName": "Tahhan",
    "headline": "Senior Talent Acquisition Specialist at Delta Partners",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/C4E03AQFraH6yIll7kg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1599978184907?e=1772668800&v=beta&t=I3p_sb_SYhtPLwacZMyJ4n3JipC9vgLiQpyRdbMbG7U",
    "experience": [{ "position": "Senior Talent Acquisition Specialist", "companyName": "Delta Partners", "duration": "7 yrs" }],
    "education": [{ "schoolName": "Petra University", "degree": "Bachelor", "fieldOfStudy": "Literature", "period": "2011 - 2015" }],
    "skills": ["Sourcing", "Executive Search", "Hiring"]
  },
  {
    "id": "odai-masaadeh",
    "firstName": "Odai Masaadeh",
    "lastName": "CHRM",
    "headline": "Regional Human Resources Section Head at Al-Faiha",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4E03AQHqzpe7iy03Gw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1666204656933?e=1772668800&v=beta&t=m4MXrzknn30X4E9x8yIOYpL17p8g_0bsR_DUDUj6kI0",
    "experience": [{ "position": "Regional Human Resources Section Head", "companyName": "Al-Faiha for Engineering Products", "duration": "9 yrs" }],
    "education": [{ "schoolName": "Mu'tah University", "degree": "Bachelor", "fieldOfStudy": "Law", "period": "2009 - 2013" }],
    "skills": ["Regional HR", "Labor Law", "Policy"]
  },
  {
    "id": "mohamed-jadallah",
    "firstName": "Mohamed",
    "lastName": "Jadallah",
    "headline": "Senior Human Resources Officer at AlBandar Group",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQHVkGT6GFjQuw/profile-displayphoto-crop_800_800/B4DZuM3m60IAAI-/0/1767594952720?e=1772668800&v=beta&t=GGjmwAe60zFMyEDMw7-vchuRPdn2NlcijeECc3CsxrY",
    "experience": [{ "position": "Senior Human Resources Officer", "companyName": "AlBandar Group", "duration": "5 yrs" }],
    "education": [{ "schoolName": "Zarqa University", "degree": "Bachelor", "fieldOfStudy": "Finance", "period": "2013 - 2017" }],
    "skills": ["Operations", "Retail HR", "Compliance"]
  },
  {
    "id": "ahmad-al-rjoub",
    "firstName": "Ahmad",
    "lastName": "Al rjoub",
    "headline": "Head of Human Resource planning at National Aid Fund",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4E03AQFP7gB9gQw3tg/profile-displayphoto-shrink_800_800/B4EZTndQ6PHUAc-/0/1739049997604?e=1772668800&v=beta&t=XjJufvDE_RbyVaJHb4FtrchD9HNXzliXUZa-I_Bv9bc",
    "experience": [{ "position": "Head of Human Resource planning", "companyName": "National Aid Fund", "duration": "12 yrs" }],
    "education": [{ "schoolName": "University of Jordan", "degree": "PhD", "fieldOfStudy": "Strategic Management", "period": "2018 - 2022" }],
    "skills": ["Government HR", "Planning", "Budgeting"]
  },
  {
    "id": "mohammad-alrawashdeh",
    "firstName": "Mohammad Al-Rawashdeh",
    "lastName": "HRM,HRMD",
    "headline": "Human Resources Supervisor at Alnuah Foods",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4E03AQH1FebpJPA0ww/profile-displayphoto-shrink_800_800/B4EZgu41t5GUAg-/0/1753133310175?e=1772668800&v=beta&t=VSiDrcQGLP_eLBBnFU_A0H2UKnJzhHr72Mn39cKKqpU",
    "experience": [{ "position": "Human Resources Supervisor - Section Head", "companyName": "Alnuah Foods", "duration": "6 yrs" }],
    "education": [{ "schoolName": "Jerash University", "degree": "Bachelor", "fieldOfStudy": "Business", "period": "2012 - 2016" }],
    "skills": ["Supervision", "Employee Relations", "Food Industry"]
  },
  {
    "id": "alhasan-ahmad",
    "firstName": "Alhasan",
    "lastName": "Ahmad , MBA",
    "headline": "Senior HR & Talent Acquisition Officer at Jo Academy",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4E03AQF2Rrn00Cwnag/profile-displayphoto-shrink_800_800/B4EZRM45bCGcAk-/0/1736456773978?e=1772668800&v=beta&t=1dDwmam1qMS5rDb3BZTaMoyHKVLFUMQLsD2aOZ4_Lxw",
    "experience": [{ "position": "Senior Human Resources & Talent Acquisition Officer", "companyName": "Jo Academy", "duration": "4 yrs" }],
    "education": [{ "schoolName": "Princess Sumaya University", "degree": "MBA", "fieldOfStudy": "Marketing", "period": "2020 - 2022" }],
    "skills": ["EdTech", "Hiring", "Employer Branding"]
  },
  {
    "id": "bayan-hazaymeh",
    "firstName": "Dr. Bayan",
    "lastName": "Hazaymeh",
    "headline": "Senior Human Resource - HRBP at Deloitte",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQHxMy54Eufg0A/profile-displayphoto-crop_800_800/B4DZw95WNkJ8AI-/0/1770564969950?e=1772668800&v=beta&t=ysmAWra0k2nUA8HU-JzBEQ-LqTWPb-OTO6Spkq6Xwpk",
    "experience": [{ "position": "Senior Human Resource - HRBP", "companyName": "Deloitte", "duration": "10 yrs" }],
    "education": [{ "schoolName": "University of Jordan", "degree": "PhD", "fieldOfStudy": "HRM", "period": "2015 - 2019" }],
    "skills": ["Consulting", "HRBP", "Strategy"]
  },
  {
    "id": "zakarya-murar",
    "firstName": "Zakarya",
    "lastName": "Murar",
    "headline": "Human Resources Director at ArabWork",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4E03AQFQiRJ5Uvq2tw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1724757990476?e=1772668800&v=beta&t=Z2Aaa0KBArcsV7Vt5Nw0Tskhn-bZgrAC5M9UtX3vjo0",
    "experience": [{ "position": "Human Resources Director", "companyName": "ArabWork", "duration": "15 yrs" }],
    "education": [{ "schoolName": "Hashemite University", "degree": "Master", "fieldOfStudy": "Business", "period": "2005 - 2007" }],
    "skills": ["Director", "Executive Leadership", "Transformation"]
  },
  {
    "id": "noura-alhamzeh",
    "firstName": "Noura",
    "lastName": "Al-Hamzeh, MSc FRM, CHRM",
    "headline": "Human Resources Officer at AL TAS-HEELAT",
    "location": "Amman, Jordan",
    "photo": "https://media.licdn.com/dms/image/v2/D4D03AQFnQvkdtmgzxQ/profile-displayphoto-crop_800_800/B4DZtq7_DwI8AI-/0/1767025669231?e=1772668800&v=beta&t=QgeNb_5z0nDS7wAD_hghaPBnLQysmU2SriA8-cAQyLs",
    "experience": [{ "position": "Human Resources Officer", "companyName": "AL TAS-HEELAT", "duration": "5 yrs" }],
    "education": [{ "schoolName": "Cardiff University", "degree": "MSc", "fieldOfStudy": "Finance", "period": "2018 - 2019" }],
    "skills": ["FRM", "CHRM", "Finance HR"]
  }
];

export const startScrapingRun = async (
  params: SearchParams
): Promise<string> => {
  return `demo-run-${Date.now()}`;
};

export const pollRunStatus = async (runId: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return 'SUCCEEDED';
};

export const getRunResults = async (runId: string): Promise<ScrapeResponse> => {
  const mappedProfiles: LinkedInProfile[] = RAW_DEMO_DATA.map((item) => {
    return {
      id: item.id,
      fullName: `${item.firstName} ${item.lastName}`,
      firstName: item.firstName,
      lastName: item.lastName,
      title: item.experience[0].position,
      company: item.experience[0].companyName,
      location: item.location,
      profileUrl: (item as any).linkedinUrl || `https://linkedin.com/in/${item.id}`,
      profilePicUrl: item.photo,
      description: (item as any).about || (item as any).headline || "",
      yearsOfExperience: item.experience.length > 1 ? item.experience.length * 2 : 5,
      skills: item.skills,
      experienceHistory: item.experience.map(exp => ({
        title: exp.position,
        company: exp.companyName,
        duration: exp.duration,
        description: (exp as any).description
      })),
      educationHistory: item.education.map(edu => ({
        school: edu.schoolName,
        degree: edu.degree,
        field: edu.fieldOfStudy,
        period: edu.period
      }))
    };
  });

  return {
    success: true,
    total: mappedProfiles.length,
    profiles: mappedProfiles
  };
};
