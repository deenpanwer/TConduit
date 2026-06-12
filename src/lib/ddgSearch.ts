function cleanHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchDDG(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo Search HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    
    // Split HTML by search result divs
    const parts = html.split('<div class="result results_links results_links_deep web-result ">');
    
    // The first part is the header, discard it
    for (let i = 1; i < parts.length && results.length < 10; i++) {
      const part = parts[i];
      
      // Extract title & href from result__a
      const titleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
      const titleMatch = titleRegex.exec(part);
      
      // Extract snippet from result__snippet
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i;
      const snippetMatch = snippetRegex.exec(part);
      
      if (titleMatch) {
        const rawUrl = titleMatch[1];
        const title = cleanHtml(titleMatch[2]);
        const snippet = snippetMatch ? cleanHtml(snippetMatch[1]) : '';
        
        let cleanUrl = rawUrl;
        const uddgMatch = /uddg=([^&]+)/.exec(rawUrl);
        if (uddgMatch) {
          try {
            cleanUrl = decodeURIComponent(uddgMatch[1]);
          } catch (e) {}
        } else if (rawUrl.startsWith('//')) {
          cleanUrl = 'https:' + rawUrl;
        }
        
        results.push({
          title,
          url: cleanUrl,
          snippet
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('[ddgSearch] Failed to search DuckDuckGo:', error);
    return [];
  }
}
