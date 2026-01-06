import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    const { query, limit = 10 } = await req.json();
    if (!query) return NextResponse.json({ success: false, error: "Query required" }, { status: 400 });

    log(`🚀 DISCOVERY: "${query}"`);

    // 1. Parallel Discovery
    const [mRes, dRes, sRes] = await Promise.all([
      fetch(`https://huggingface.co/api/models?search=${encodeURIComponent(query)}&sort=likes&direction=-1&limit=${limit}`),
      fetch(`https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&sort=likes&direction=-1&limit=${limit}`),
      fetch(`https://huggingface.co/api/spaces?search=${encodeURIComponent(query)}&sort=likes&direction=-1&limit=${limit}`)
    ]);

    const models = mRes.ok ? await mRes.json() : [];
    const datasets = dRes.ok ? await dRes.json() : [];
    const spaces = sRes.ok ? await sRes.json() : [];

    log(`📦 ASSETS: ${models.length} Models, ${datasets.length} Datasets, ${spaces.length} Spaces`);

    // 2. Author Extraction
    const authorMap = new Map<string, string[]>();
    const processItems = (items: any[], type: string) => items.forEach(item => {
      const author = item.author || (item.id?.includes('/') ? item.id.split('/')[0] : null);
      if (author) {
        if (!authorMap.has(author)) authorMap.set(author, []);
        if (!authorMap.get(author)!.includes(type)) authorMap.get(author)!.push(type);
      }
    });

    processItems(models, 'Model');
    processItems(datasets, 'Dataset');
    processItems(spaces, 'Space');

    // 3. Deep Profile Enrichment
    const profiles: any[] = [];
    const processedAuthors = new Set<string>();
    const queue = Array.from(authorMap.keys());

    while (queue.length > 0) {
      const name = queue.shift()!;
      if (processedAuthors.has(name)) continue;
      processedAuthors.add(name);

      const scoutedFrom = authorMap.get(name) || ['Discovery'];
      try {
        const uRes = await fetch(`https://huggingface.co/api/users/${name}/overview`, { cache: 'no-store' });
        if (uRes.ok) {
          const data = await uRes.json();
          log(`✅ VERIFIED: User "${name}"`);
          
          profiles.push({ 
            ...data, 
            user: name, 
            bio: data.details || data.bio,
            _type: 'user', 
            scoutedFrom 
          });
          continue;
        }

        const oRes = await fetch(`https://huggingface.co/api/organizations/${name}/overview`, { cache: 'no-store' });
        if (oRes.ok) {
          const data = await oRes.json();
          log(`🏢 VERIFIED: Org "${name}"`);
          profiles.push({ 
            ...data, 
            user: name, 
            fullname: data.fullname || data.name, 
            avatarUrl: data.avatarUrl, 
            bio: data.details || data.description, 
            isOrg: true, 
            _type: 'org',
            scoutedFrom 
          });

          // Deep Discovery: Fetch Org Members to find individual talent
          const mRes = await fetch(`https://huggingface.co/api/organizations/${name}/members`, { cache: 'no-store' });
          if (mRes.ok) {
            const members = await mRes.json();
            log(`👥 DISCOVERED: ${members.length} members in "${name}"`);
            members.slice(0, 5).forEach((m: any) => { // Limit to top 5 members to avoid bloat
              if (!processedAuthors.has(m.user)) {
                queue.push(m.user);
                if (!authorMap.has(m.user)) authorMap.set(m.user, [`Member of ${name}`]);
              }
            });
          }
          continue;
        }
        log(`⚠️ UNRESOLVED: "${name}" (U:${uRes.status}/O:${oRes.status})`);
        profiles.push({ user: name, scoutedFrom, error: true, status: { user: uRes.status, org: oRes.status } });
      } catch (e: any) {
        log(`❌ FAILED: ${name} (${e.message})`);
        profiles.push({ user: name, scoutedFrom, error: true, message: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      logs,
      results: { models, datasets, spaces, profiles }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}
