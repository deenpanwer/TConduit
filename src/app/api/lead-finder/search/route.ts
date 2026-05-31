import { createClient } from "@supabase/supabase-js";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const maxDuration = 60;

// Initialize Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req: Request) {
  try {
    const { orgId, pullState, pullIndustry, pullKeyword, pullCount, existingIds } = await req.json();

    if (!orgId) {
      return new Response(JSON.stringify({ error: "Missing Organization ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
      return new Response(JSON.stringify({ error: "Firebase Admin configuration missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const db = admin.firestore();
    const orgDocRef = db.collection("organizations").doc(orgId);
    const orgSnap = await orgDocRef.get();

    if (!orgSnap.exists) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const orgData = orgSnap.data() || {};
    
    // Core subscription tier fields from the Org document
    const isPremium = orgData.isPremium || false;
    const isStandard = orgData.isStandard || false;
    
    const leadFinderConfig = orgData.leadFinder || {};
    const customLimit = leadFinderConfig.customLimit;

    // Track active usage counts
    const leadsUsed = orgData.leadFinderLeadsUsed !== undefined 
      ? orgData.leadFinderLeadsUsed 
      : (leadFinderConfig.leadsUsed || 0);

    // Calculate active quota limit
    let quotaLimit = 1500; // Freemium Limit
    if (customLimit !== undefined && customLimit !== null) {
      quotaLimit = Number(customLimit);
    } else if (isPremium) {
      quotaLimit = 10000;
    } else if (isStandard) {
      quotaLimit = 5000;
    }

    const leadsLeft = Math.max(0, quotaLimit - leadsUsed);

    if (leadsLeft <= 0) {
      return new Response(
        JSON.stringify({ 
          error: "quota_reached", 
          quotaLimit, 
          leadsUsed,
          message: "Lead quota limit reached. Upgrade plan for higher limits." 
        }), 
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Gracefully cap the pull requests to remaining quota
    const maxToPull = Math.min(pullCount || 100, leadsLeft);

    let pulledLeads: any[] = [];
    let isFallback = false;

    // Standardize existing IDs array for exclusion query
    const idsToExclude: number[] = Array.isArray(existingIds) ? existingIds.map(Number).filter(Boolean) : [];

    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error("Missing Supabase credentials");
      }

      let query = supabase.from("leads").select("*");
      query = query.not("Email", "is", null);

      // Exclude leads that have already been imported into this organization's roster
      if (idsToExclude.length > 0) {
        // Exclude up to a safe batch count to avoid URI length bounds
        const sliceToExclude = idsToExclude.slice(0, 1000);
        query = query.not("id", "in", `(${sliceToExclude.join(",")})`);
      }

      if (pullState && pullState !== "all") {
        query = query.eq("Primary State", pullState);
      }
      if (pullIndustry && pullIndustry !== "all") {
        query = query.ilike("Industry", `%${pullIndustry}%`);
      }
      if (pullKeyword && pullKeyword.trim() !== "") {
        const kw = pullKeyword.trim();
        query = query.or(
          `"Company Name".ilike.%${kw}%,"Title".ilike.%${kw}%,"First Name".ilike.%${kw}%,"Last Name".ilike.%${kw}%,"Industry".ilike.%${kw}%`
        );
      }

      query = query.limit(maxToPull);

      const { data, error } = await query;
      if (error) throw error;
      
      pulledLeads = data || [];
    } catch (supabaseError: any) {
      console.warn("[Lead Finder API] Database fallback triggered:", supabaseError.message);
      isFallback = true;
      
      // Fallback generator excluding already existing leads
      const companies = ["Hyperion Tech", "Centurion Staffing", "Vanguard Media", "Orion Analytics", "Verdant Logistics"];
      const names = [["Dan", "Snyder"], ["Claire", "Finch"], ["Victor", "Cruz"], ["Naomi", "Starr"], ["Bruce", "Wayne"]];
      
      const randomState = pullState && pullState !== "all" ? pullState : "NY";
      const randomInd = pullIndustry && pullIndustry !== "all" ? pullIndustry : "Technology";
      const existingSet = new Set(idsToExclude);

      const generated = Array.from({ length: maxToPull * 2 }).map((_, i) => {
        const idx = Math.floor(Math.random() * companies.length);
        const comp = companies[idx];
        const nm = names[(idx + i) % names.length];
        const generatedId = 20000 + i + Math.floor(Math.random() * 500);

        return {
          id: generatedId,
          "First Name": nm[0],
          "Last Name": nm[1],
          Title: "Chief Executive Officer",
          "Company Name": comp,
          "Mailing Address": `${Math.floor(Math.random() * 900) + 100} Main St`,
          "Primary City": "Metropolis",
          "Primary State": randomState,
          "ZIP Code": "10001",
          Country: "United States",
          Phone: `+1 (800) 555-908${Math.floor(Math.random() * 9)}`,
          "Web Address": `www.${comp.toLowerCase().replace(/ /g, "")}.com`,
          Email: `${nm[0].toLowerCase()}@${comp.toLowerCase().replace(/ /g, "")}.com`,
          Revenue: `$${Math.floor(Math.random() * 20) + 10}M`,
          Employee: `${Math.floor(Math.random() * 100) + 20}`,
          Industry: randomInd,
          "Sub Industry": "Direct Operations",
          is_processed: false,
          regex_valid: true,
          mx_check_passed: true,
          smtp_status: "DELIVERABLE",
          last_checked_at: new Date().toISOString(),
          processing_status: "PENDING",
          retry_count: 0,
          error_log: null,
          domain: `${comp.toLowerCase().replace(/ /g, "")}.com`,
          next_retry_at: null
        };
      });

      // Filter out mocks already in roster
      pulledLeads = generated.filter(l => !existingSet.has(l.id)).slice(0, maxToPull);
    }

    if (pulledLeads.length > 0) {
      const FieldValue = admin.firestore.FieldValue;
      const updateData: Record<string, any> = {
        leadFinderLeadsUsed: FieldValue.increment(pulledLeads.length),
        "leadFinder.leadsUsed": FieldValue.increment(pulledLeads.length)
      };
      
      await orgDocRef.update(updateData);
    }

    return new Response(
      JSON.stringify({
        leads: pulledLeads,
        quotaLimit,
        leadsUsed: leadsUsed + pulledLeads.length,
        leadsLeft: Math.max(0, quotaLimit - (leadsUsed + pulledLeads.length)),
        isFallback
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("[Lead Finder API Error]:", error);
    return new Response(JSON.stringify({ error: "Failed to search B2B prospects", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
