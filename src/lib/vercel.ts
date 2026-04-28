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
  };
}

export async function getDeployments(limit: number = 20, until?: string) {
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
