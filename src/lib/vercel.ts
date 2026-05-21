export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: string;
  target?: string;
  creator: {
    username: string;
  };
  meta: {
    githubCommitMessage?: string;
    githubCommitRef?: string;
    githubCommitSha?: string;
    githubCommitOrg?: string;
    githubCommitRepo?: string;
  };
}

export async function getDeployments(limit: number = 20, until?: string, since?: string) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    console.error("Missing Vercel credentials");
    return { deployments: [], pagination: null };
  }

  const url = new URL(`https://api.vercel.com/v6/deployments`);
  url.searchParams.append("projectId", projectId);
  if (teamId) {
    url.searchParams.append("teamId", teamId);
  }
  url.searchParams.append("limit", limit.toString());
  if (until) {
    url.searchParams.append("until", until);
  }
  if (since) {
    url.searchParams.append("since", since);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Vercel API error:", errorData);
    return { deployments: [], pagination: null };
  }

  const data = await response.json();
  return { 
    deployments: data.deployments as VercelDeployment[],
    pagination: data.pagination
  };
}

export async function getTotalDeploymentsCount() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) return 0;

  try {
    const url = new URL(`https://api.vercel.com/v6/deployments`);
    url.searchParams.append("projectId", projectId);
    if (teamId) url.searchParams.append("teamId", teamId);
    url.searchParams.append("limit", "1"); // We only need pagination info

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }, // Cache for an hour
    });

    if (!response.ok) return 0;
    
    // Vercel doesn't give a total count in a single field easily without paginating,
    // but some older API versions or project endpoints might.
    // As a fallback, we'll return a placeholder or handle it in the UI.
    // For now, let's try to fetch a larger limit to at least show "X+"
    return 0; // Placeholder until we decide on the best estimation method
  } catch (error) {
    return 0;
  }
}
