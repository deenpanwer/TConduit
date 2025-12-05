
'use client';

import React, { useState } from 'react';
import { Check, Copy, Send } from 'lucide-react';
import { calculateScores } from '@/lib/scoring';
import { createClient } from '@supabase/supabase-js';
import { embedText } from '@/app/actions'; // Import the Server Action

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const countryCodes: { [key: string]: string } = {
  "United States": "1",
  "Canada": "1",
  "United Kingdom": "44",
  "Australia": "61",
  "Germany": "49",
  "France": "33",
  "India": "91",
  "Bangladesh": "880",
  "Afghanistan": "93",
  "Albania": "355",
  "Algeria": "213",
  "Andorra": "376",
  "Angola": "244",
  "Argentina": "54",
  "Armenia": "374",
  "Austria": "43",
  "Azerbaijan": "994",
  "Bahamas": "1",
  "Bahrain": "973",
  "Belarus": "375",
  "Belgium": "32",
  "Bolivia": "591",
  "Bosnia and Herzegovina": "387",
  "Brazil": "55",
  "Bulgaria": "359",
  "Cambodia": "855",
  "Cameroon": "237",
  "Chile": "56",
  "China": "86",
  "Colombia": "57",
  "Costa Rica": "506",
  "Croatia": "385",
  "Cuba": "53",
  "Cyprus": "357",
  "Czech Republic": "420",
  "Denmark": "45",
  "Dominican Republic": "1",
  "Ecuador": "593",
  "Egypt": "20",
  "El Salvador": "503",
  "Estonia": "372",
  "Ethiopia": "251",
  "Finland": "358",
  "Georgia": "995",
  "Ghana": "233",
  "Greece": "30",
  "Guatemala": "502",
  "Honduras": "504",
  "Hong Kong": "852",
  "Hungary": "36",
  "Iceland": "354",
  "Indonesia": "62",
  "Iran": "98",
  "Iraq": "964",
  "Ireland": "353",
  "Israel": "972",
  "Italy": "39",
  "Jamaica": "1",
  "Japan": "81",
  "Jordan": "962",
  "Kazakhstan": "7",
  "Kenya": "254",
  "Kuwait": "965",
  "Latvia": "371",
  "Lebanon": "961",
  "Libya": "218",
  "Lithuania": "370",
  "Luxembourg": "352",
  "Malaysia": "60",
  "Malta": "356",
  "Mexico": "52",
  "Moldova": "373",
  "Monaco": "377",
  "Mongolia": "976",
  "Montenegro": "382",
  "Morocco": "212",
  "Nepal": "977",
  "Netherlands": "31",
  "New Zealand": "64",
  "Nicaragua": "505",
  "Nigeria": "234",
  "North Korea": "850",
  "North Macedonia": "389",
  "Norway": "47",
  "Oman": "968",
  "Pakistan": "92",
  "Panama": "507",
  "Paraguay": "595",
  "Peru": "51",
  "Philippines": "63",
  "Poland": "48",
  "Portugal": "351",
  "Qatar": "974",
  "Romania": "40",
  "Russia": "7",
  "San Marino": "378",
  "Saudi Arabia": "966",
  "Serbia": "381",
  "Singapore": "65",
  "Slovakia": "421",
  "Slovenia": "386",
  "South Africa": "27",
  "South Korea": "82",
  "Spain": "34",
  "Sri Lanka": "94",
  "Sweden": "46",
  "Switzerland": "41",
  "Syria": "963",
  "Taiwan": "886",
  "Tanzania": "255",
  "Thailand": "66",
  "Tunisia": "216",
  "Turkey": "90",
  "Uganda": "256",
  "Ukraine": "380",
  "United Arab Emirates": "971",
  "Uruguay": "598",
  "Venezuela": "58",
  "Vietnam": "84",
  "Yemen": "967",
  "Zambia": "260",
  "Zimbabwe": "263",
  // More countries can be added as needed
};

const generatePhoneNumber = (country: string | null): string | null => {
  if (!country) return null;

  const code = countryCodes[country] || "00"; // Default to "00"

  let nationalNumber: string;
  let formattedNumber: string;

  switch (country) {
    case "United States":
    case "Canada": // North American Numbering Plan
      // Total 10 digits: (Area Code 3) Subscriber (3) (4)
      nationalNumber = String(Math.floor(1000000000 + Math.random() * 9000000000)).substring(0, 10);
      formattedNumber = `(${nationalNumber.substring(0, 3)}) ${nationalNumber.substring(3, 6)}-${nationalNumber.substring(6, 10)}`;
      break;
    case "United Kingdom":
      // Mobile 10 digits (after leading 0): 7XXX XXXXXX
      nationalNumber = `7${String(Math.floor(100000000 + Math.random() * 900000000)).substring(0, 9)}`; // Start with 7, then 9 random
      formattedNumber = `${nationalNumber.substring(0, 4)} ${nationalNumber.substring(4, 7)} ${nationalNumber.substring(7, 10)}`;
      break;
    case "India":
      // Mobile 10 digits: XXXXX XXXXX
      nationalNumber = String(Math.floor(1000000000 + Math.random() * 9000000000)).substring(0, 10);
      formattedNumber = `${nationalNumber.substring(0, 5)} ${nationalNumber.substring(5, 10)}`;
      break;
    case "Bangladesh":
      // Mobile 10 digits: XXX XXXX XXX
      nationalNumber = String(Math.floor(1000000000 + Math.random() * 9000000000)).substring(0, 10);
      formattedNumber = `${nationalNumber.substring(0, 3)} ${nationalNumber.substring(3, 7)} ${nationalNumber.substring(7, 10)}`;
      break;
    case "Germany":
      // Mobile 10 digits: XXXX XXXXXX
      nationalNumber = String(Math.floor(1000000000 + Math.random() * 9000000000)).substring(0, 10);
      formattedNumber = `${nationalNumber.substring(0, 4)} ${nationalNumber.substring(4, 10)}`;
      break;
    default:
      // Generic format for other countries: 9-10 random digits
      const genericLength = Math.floor(9 + Math.random() * 2); // 9 or 10 digits
      nationalNumber = String(Math.floor(Math.pow(10, genericLength -1) + Math.random() * Math.pow(10, genericLength -1) * 9));
      // Simple grouping for readability
      formattedNumber = nationalNumber.replace(/(\d{3})(?=\d)/g, '$1 ');
      break;
  }
  return `+${code} ${formattedNumber}`;
};

const generateEmailAddress = (name: string | null): string | null => {
  if (!name) return null;

  // Sanitize name: lowercase, replace non-alphanumeric with dot, handle multiple dots
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.') // Replace non-alphanumeric with dot
    .replace(/^\.+|\.+$/g, '')   // Remove leading/trailing dots
    .replace(/\.{2,}/g, '.');    // Replace multiple dots with single dot

  // Generate a 4-digit random number
  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  return `${sanitizedName}${randomNumber}@gmail.com`;
};

const cleanString = (inputString: string | null | undefined): string | null => {
  if (inputString === null || inputString === undefined) return null;
  let cleaned = inputString.replace(/\n/g, ' '); // Replace newlines with spaces
  // This regex attempts to match a broad range of Unicode emoji and symbols.
  // It's not exhaustive but covers many common cases.
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}]/gu, '');
  return cleaned.trim();
};

interface ProfileData {
  page_url: string | null | undefined;
  profile_image_url: string | null | undefined;
  name: string | null | undefined;
  username: string | null | undefined;
  rating: number | null | undefined;
  num_reviews: number | null | undefined;
  headline: string | null | undefined;
  country: string | null | undefined;
  languages: string[] | null | undefined;
  about_me: string | null | undefined;
  skills: string[] | null | undefined;
  seller_level: string | null | undefined;
  average_response_time: string | null | undefined;
  review_breakdown: { [key: string]: number } | null | undefined;
  num_projects: number | null | undefined;
  phone_number: string | null | undefined;
  email: string | null | undefined;
}

const processFiverrProfile = (htmlContent: string) => {
  if (!htmlContent) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const profile: ProfileData = { // Use the defined interface here
    page_url: null,
    profile_image_url: null,
    name: null,
    username: null,
    rating: null,
    num_reviews: null,
    headline: null,
    country: null,
    languages: null,
    about_me: null,
    skills: null,
    seller_level: null,
    average_response_time: null,
    review_breakdown: null,
    num_projects: null,
    phone_number: null,
    email: null,
  };

  // 1. Page URL
  const canonicalLink = doc.querySelector('link[rel="canonical"]');
  profile.page_url = canonicalLink ? canonicalLink.getAttribute('href') : null;

  // 2. Profile Image URL (Will be provided by user input)
  profile.profile_image_url = null;

  // 3. Name
  const nameElement = doc.querySelector('h1[aria-label="Public Name"]');
  profile.name = nameElement ? nameElement.textContent?.trim() : null;

  // 4. Username
  const usernameElement = doc.querySelector('div[aria-label="Username"]');
  profile.username = usernameElement ? usernameElement.textContent?.replace('@', '').trim() : null;

  // 5. Ratings and Number of Reviews
  const ratingElement = doc.querySelector('strong.rating-score');
  profile.rating = ratingElement ? parseFloat(ratingElement.textContent || '0') : null;

  const numReviewsElement = doc.querySelector('span.ratings-count .rating-count-number');
  profile.num_reviews = numReviewsElement ? parseInt(numReviewsElement.textContent || '0', 10) : null;

  // 6. Headline (Tagline)
  // This is the <p> tag that directly follows the div containing name/username/rating
  const headlineElement = doc.querySelector('div.flex.flex-items-center.flex-start p[data-track-tag="text"]');
  profile.headline = cleanString(headlineElement ? headlineElement.textContent?.trim() : null);
  // Fallback/alternative: check og:description if headline is not found
  if (!profile.headline) {
    const ogDescriptionMeta = doc.querySelector('meta[property="og:description"]');
    if (ogDescriptionMeta) {
      const content = ogDescriptionMeta.getAttribute('content');
      if (content) {
        profile.headline = cleanString(content.trim());
      }
    }
  }


  // 7. Country
  // Find the div containing location, which has an SVG and a span
  const countryContainer = doc.querySelector('div.u46yhn0.u46yhn11o.u46yhn1ap.u46yhn1cs'); // flex container for location icon + text
  if (countryContainer) {
    const countrySpan = countryContainer.querySelector('svg[viewBox="0 0 13 16"] + span');
    profile.country = countrySpan ? countrySpan.textContent?.trim() : null;
  }
  
  // 8. Languages
  // Find the div containing language, which has an SVG and a div containing spans
  const languageContainer = doc.querySelector('div.u46yhn0.u46yhn11o.u46yhn1ap.u46yhn1cs:nth-of-type(2)'); // The second flex container for a similar icon+text pattern
  let languages: string[] = [];
  if (languageContainer) {
    const langSpan = languageContainer.querySelector('span.u46yhn1gt');
    if (langSpan && langSpan.textContent) {
      languages = langSpan.textContent.split(',').map(lang => lang.trim());
    }
  }
  profile.languages = languages.length > 0 ? languages : null;


  // 9. About Me
  // Find the 'About me' heading and get the content of the following div/span
  const aboutMeHeading = doc.querySelector('div._77b9b8.m-b-8.text-semi-bold.co-text-darkest');
  if (aboutMeHeading && aboutMeHeading.textContent?.trim() === 'About me') {
    const aboutMeContentElement = aboutMeHeading.nextElementSibling?.querySelector('span[width="0"]');
    if (aboutMeContentElement) {
      let aboutMeText = aboutMeContentElement.textContent?.trim() || '';
      // Remove "... Read more" artifact
      aboutMeText = aboutMeText.replace(/\.\.\.\s*Read more/g, '').trim();
      profile.about_me = cleanString(aboutMeText);
    }
  }

  // 10. Skills
  const skillsListElement = doc.querySelector('ul.u46yhn1a');
  const skills: string[] = [];
  if (skillsListElement) {
    skillsListElement.querySelectorAll('li a').forEach(a => {
      const skill = a.getAttribute('aria-label');
      if (skill) {
        skills.push(skill);
      }
    });
  }
  profile.skills = skills.length > 0 ? skills : null;

  // NEW: Seller Level
  const sellerLevelElement = doc.querySelector('div[aria-label="Seller Level Badge"] p[data-track-tag="typography"]');
  profile.seller_level = sellerLevelElement ? sellerLevelElement.textContent?.trim() : null;

  // NEW: Average Response Time
  const avgResponseTimeElement = doc.querySelector('div.responds-info span');
  profile.average_response_time = avgResponseTimeElement ? avgResponseTimeElement.textContent?.trim() : null;

  // NEW: Review Breakdown
  const reviewBreakdown: { [key: string]: number } = {};
  const starsCountersTable = doc.querySelector('table.stars-counters');
  if (starsCountersTable) {
    starsCountersTable.querySelectorAll('tbody tr').forEach(row => {
      const starTextElement = row.querySelector('.stars-filter');
      const numElement = row.querySelector('.star-num');

      if (starTextElement && numElement) {
        const starText = starTextElement.textContent?.trim();
        const numReviewsMatch = numElement.textContent?.match(/\((\d+)\)/);

        if (starText && numReviewsMatch) {
          const stars = starText.split(' ')[0]; // "5" from "5 Stars"
          const count = parseInt(numReviewsMatch[1], 10);
          reviewBreakdown[`${stars}_star`] = count;
        }
      }
    });
  }
  profile.review_breakdown = Object.keys(reviewBreakdown).length > 0 ? reviewBreakdown : null;

  // NEW: Number of Projects - REVISED APPROACH
  const projectsTextSpan = Array.from(doc.querySelectorAll('span[data-track-tag="text"]')).find(
    span => span.textContent?.trim() === 'Projects'
  );

  if (projectsTextSpan) {
    const projectsCountSpan = projectsTextSpan.previousElementSibling;
    if (projectsCountSpan && projectsCountSpan.matches('span[data-track-tag="text"]')) {
      const projectsCountMatch = projectsCountSpan.textContent?.trim().match(/\+(\d+)/);
      if (projectsCountMatch) {
        profile.num_projects = parseInt(projectsCountMatch[1], 10);
      }
    }
  }

  // NEW: Generate Phone Number and Email
  profile.phone_number = generatePhoneNumber(profile.country ?? null);
  profile.email = generateEmailAddress(profile.name ?? null);
  // Calculate Competence and Agency Scores
  const { competence_score, agency_score } = calculateScores(profile);


  return {
    profile: profile,
    competence_score,
    agency_score,
  };
};

export default function Test3Page() {
  const [rawInput, setRawInput] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [transformedOutput, setTransformedOutput] = useState<{
    profile: ProfileData | null;
    competence_score: number;
    agency_score: number;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleCopy = () => {
    if (transformedOutput) {
      navigator.clipboard.writeText(JSON.stringify(transformedOutput, null, 2)).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy JSON: ', err);
      });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = event.target.value;
    setRawInput(inputText);
    const processedData = processFiverrProfile(inputText);
    if (processedData && processedData.profile) { // Check if profile exists before assigning
      processedData.profile.profile_image_url = imageUrlInput || null;
    }
    setTransformedOutput(processedData);
    setUploadMessage(null); // Clear previous messages
  };

  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const urlText = event.target.value;
    setImageUrlInput(urlText);
    // Re-process with current rawInput and new image URL
    const processedData = processFiverrProfile(rawInput);
    if (processedData && processedData.profile) { // Check if profile exists before assigning
      processedData.profile.profile_image_url = urlText || null;
    }
    setTransformedOutput(processedData);
    setUploadMessage(null); // Clear previous messages
  };

  const handleSendToSupabase = async () => {
    if (!transformedOutput || !transformedOutput.profile || !transformedOutput.profile.username) {
      setUploadMessage("Error: No transformed data or username available to send.");
      return;
    }

    setIsLoading(true);
    setUploadMessage(null);

    try {
      const { profile, competence_score, agency_score } = transformedOutput;

      // Prepare text for embedding
      const textToEmbed = [
        profile.headline,
        profile.about_me,
        ...(profile.skills || []),
      ].filter(Boolean).join('. ');

      let embedding: number[] | null = null;
      if (textToEmbed) {
        embedding = await embedText(textToEmbed); // Call the Server Action
      }

      if (!embedding) {
        setUploadMessage("Error: Failed to generate embedding.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('fiverr_profiles')
        .upsert(
          {
            page_url: profile.page_url,
            profile_image_url: profile.profile_image_url,
            name: profile.name,
            username: profile.username,
            rating: profile.rating,
            num_reviews: profile.num_reviews,
            headline: profile.headline,
            country: profile.country,
            languages: profile.languages,
            about_me: profile.about_me,
            skills: profile.skills,
            seller_level: profile.seller_level,
            average_response_time: profile.average_response_time,
            review_breakdown: profile.review_breakdown,
            num_projects: profile.num_projects,
            phone_number: profile.phone_number,
            email: profile.email,
            competence_score: competence_score,
            agency_score: agency_score,
            embedding: embedding, // Add the generated embedding
          },
          { onConflict: 'username' } // Use username as the conflict key for upsert
        );

      if (error) {
        console.error('Error uploading to Supabase:', error);
        setUploadMessage(`Error uploading profile: ${error.message}`);
      } else {
        setUploadMessage("Profile uploaded/updated successfully!");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setUploadMessage(`An unexpected error occurred: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-800">
      {/* Left Panel: Raw Input */}
      <div className="w-1/2 p-4 border-r border-gray-700 flex flex-col">
        <div className="mb-4">
          <label htmlFor="imageUrl" className="block text-gray-300 text-sm font-bold mb-2">
            Profile Image URL
          </label>
          <input
            type="text"
            id="imageUrl"
            className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-700 text-gray-100 placeholder-gray-400"
            placeholder="Paste profile image URL here (optional)"
            value={imageUrlInput}
            onChange={handleImageUrlChange}
          />
        </div>
        <h2 className="text-xl font-bold mb-4 text-white">Raw Fiverr Profile HTML</h2>
        <textarea
          className="flex-grow p-2 border border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-700 text-gray-100 placeholder-gray-400"
          placeholder="Paste raw Fiverr HTML here..."
          value={rawInput}
          onChange={handleInputChange}
        />
      </div>

      {/* Right Panel: Transformed Output */}
      <div className="w-1/2 p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-white">Transformed Data (Ready for Load)</h2>
        <div className="relative flex-grow bg-gray-700 p-2 border border-gray-600 rounded-md overflow-auto font-mono text-sm">
          {transformedOutput ? (
            <>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white transition-colors z-10"
                title="Copy to clipboard"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <pre className="whitespace-pre-wrap text-gray-100">{JSON.stringify(transformedOutput, null, 2)}</pre>
            </>
          ) : (
            <p className="text-gray-400">Paste raw HTML on the left to see transformed data here.</p>
          )}
        </div>
        <button
          onClick={handleSendToSupabase}
          disabled={isLoading || !transformedOutput || !transformedOutput.profile?.username}
          className={`mt-4 px-4 py-2 rounded-md font-bold text-white transition-colors
            ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
            flex items-center justify-center`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Send to Supabase
            </>
          )}
        </button>
        {uploadMessage && (
          <p className="mt-2 text-sm text-white">
            {uploadMessage.startsWith("Error") ? <span className="text-red-400">{uploadMessage}</span> : <span className="text-green-400">{uploadMessage}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
