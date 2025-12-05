
// src/lib/scoring.ts

interface Profile {
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

interface Scores {
  competence_score: number;
  agency_score: number;
}

/**
 * Converts seller level string to a numerical value for scoring.
 * Higher values indicate higher levels.
 */
const getSellerLevelNumericValue = (level: string | null | undefined): number => {
  if (level === undefined) return 0; // Treat undefined as no level
  switch (level) {
    case 'Top Rated Seller':
      return 4;
    case 'Level 2 Seller':
      return 3;
    case 'Level 1 Seller':
      return 2;
    case 'New Seller':
      return 1;
    default:
      return 0; // No level or unknown level
  }
};

/**
 * Converts average response time string to a numerical value.
 * Lower times (faster responses) should result in higher numerical values for scoring.
 */
const getResponseTimeNumericValue = (responseTime: string | null | undefined): number => {
  if (!responseTime) return 0;
  if (responseTime.includes('hour')) return 3; // Within an hour/few hours
  if (responseTime.includes('24 hours')) return 2;
  if (responseTime.includes('few days')) return 1;
  return 0; // More than a few days or unknown
};

/**
 * Calculates competence and agency scores based on a Fiverr profile.
 * Weights are placeholders and should be tuned based on desired ranking logic.
 */
export const calculateScores = (profile: Profile): Scores => {
  let competence_score = 0;
  let agency_score = 0;

  // --- Competence Score Calculation ---
  const W_RATING = 0.4;
  const W_NUM_REVIEWS = 0.15;
  const W_SKILLS = 0.1;
  const W_SELLER_LEVEL_COMPETENCE = 0.2;
  const W_5_STAR_RATIO = 0.1;
  const W_NUM_PROJECTS_COMPETENCE = 0.05;

  competence_score += W_RATING * ((profile.rating ?? 0) / 5); // Normalize rating to 0-1
  competence_score += W_NUM_REVIEWS * (Math.log((profile.num_reviews ?? 0) + 1) / Math.log(100)); // Logarithmic scale for reviews
  if (profile.skills && profile.skills.length > 0) {
    competence_score += W_SKILLS * Math.min(profile.skills.length / 10, 1); // Max 10 skills for scaling example
  }
  const sellerLevelNumericCompetence = getSellerLevelNumericValue(profile.seller_level);
  competence_score += W_SELLER_LEVEL_COMPETENCE * (sellerLevelNumericCompetence / 4); // Max 4 for Top Rated

  if (profile.review_breakdown && (profile.num_reviews ?? 0) > 0) {
    const fiveStarCount = profile.review_breakdown['5_star'] ?? 0;
    competence_score += W_5_STAR_RATIO * (fiveStarCount / (profile.num_reviews ?? 1)); // Avoid division by zero
  }
  competence_score += W_NUM_PROJECTS_COMPETENCE * (Math.log((profile.num_projects ?? 0) + 1) / Math.log(50)); // Max 50 projects for scaling example

  // --- Agency Score Calculation ---
  const W_RESPONSE_TIME = 0.5;
  const W_SELLER_LEVEL_AGENCY = 0.3;
  const W_NUM_PROJECTS_AGENCY = 0.2;

  const responseTimeNumeric = getResponseTimeNumericValue(profile.average_response_time);
  agency_score += W_RESPONSE_TIME * (responseTimeNumeric / 3); // Max 3 for fastest response

  const sellerLevelNumericAgency = getSellerLevelNumericValue(profile.seller_level);
  agency_score += W_SELLER_LEVEL_AGENCY * (sellerLevelNumericAgency / 4); // Max 4 for Top Rated

  agency_score += W_NUM_PROJECTS_AGENCY * (Math.log((profile.num_projects ?? 0) + 1) / Math.log(50)); // Max 50 projects for scaling example
  
  // Ensure scores are within a reasonable range, e.g., 0-100 or 0-1. 
  // For now, let's just cap at 1.0 (or sum of weights) and multiply by 100 to get a percentage.
  competence_score = Math.min(competence_score, 1.0) * 100;
  agency_score = Math.min(agency_score, 1.0) * 100;


  return {
    competence_score: parseFloat(competence_score.toFixed(2)),
    agency_score: parseFloat(agency_score.toFixed(2)),
  };
};

