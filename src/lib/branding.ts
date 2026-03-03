/**
 * TRAC AI - Centralized Branding & Logo Engine
 * -----------------------------------------
 * Maps raw application process names to their professional identities.
 */

export interface AppMeta {
  bg: string;
  domain: string;
  cleanName: string;
  icon: string | null;
}

const BRAND_MAPPING: Record<string, { bg: string; domain: string; cleanName: string }> = {
  'google chrome': { bg: 'bg-[#0084ff]', domain: 'google.com', cleanName: 'Chrome' },
  'visual studio code': { bg: 'bg-[#6366f1]', domain: 'visualstudio.com', cleanName: 'VS Code' },
  'slack': { bg: 'bg-[#4a154b]', domain: 'slack.com', cleanName: 'Slack' },
  'figma': { bg: 'bg-[#f24e1e]', domain: 'figma.com', cleanName: 'Figma' },
  'zoom': { bg: 'bg-[#2d8cff]', domain: 'zoom.us', cleanName: 'Zoom' },
  'spotify': { bg: 'bg-[#1db954]', domain: 'spotify.com', cleanName: 'Spotify' },
  'notion': { bg: 'bg-[#000000]', domain: 'notion.so', cleanName: 'Notion' },
  'whatsapp': { bg: 'bg-[#25d366]', domain: 'whatsapp.com', cleanName: 'WhatsApp' },
  'github': { bg: 'bg-[#181717]', domain: 'github.com', cleanName: 'GitHub' },
  'arc': { bg: 'bg-[#ff5100]', domain: 'arc.net', cleanName: 'Arc Browser' },
  'cursor': { bg: 'bg-[#10b981]', domain: 'cursor.sh', cleanName: 'Cursor' },
  'discord': { bg: 'bg-[#5865f2]', domain: 'discord.com', cleanName: 'Discord' },
  'canva': { bg: 'bg-[#00c4cc]', domain: 'canva.com', cleanName: 'Canva' },
  'trello': { bg: 'bg-[#0079bf]', domain: 'trello.com', cleanName: 'Trello' },
  'linear': { bg: 'bg-[#5e6ad2]', domain: 'linear.app', cleanName: 'Linear' },
  'idle': { bg: 'bg-[#6b7280]', domain: '', cleanName: 'Idle' },
};

export const getAppMeta = (rawName: string): AppMeta => {
  const name = (rawName || 'Unknown').toLowerCase();
  
  // Find match or use default
  const matchedKey = Object.keys(BRAND_MAPPING).find(k => name.includes(k));
  
  if (matchedKey) {
    const meta = BRAND_MAPPING[matchedKey];
    return {
      ...meta,
      icon: meta.domain ? `https://www.google.com/s2/favicons?domain=${meta.domain}&sz=64` : null
    };
  }

  // Generic fallback: Don't guess domains for system processes
  const cleanName = rawName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    bg: 'bg-[#10b981]',
    domain: name.includes('.') ? name : '', 
    cleanName: cleanName,
    icon: name.includes('.') ? `https://www.google.com/s2/favicons?domain=${name}&sz=64` : null
  };
};
