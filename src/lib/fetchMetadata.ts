import {
  type ExtractedLink,
  type ExtractedMetadata,
  extractMetadataFromHtml,
  normalizeUrl,
} from "./websiteExtractor";

type MicrolinkData = {
  title?: string;
  description?: string;
  logo?: { url?: string };
  image?: { url?: string };
  url?: string;
};

async function fetchFromMicrolink(url: string): Promise<MicrolinkData | null> {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.status === "success" && json?.data) {
        return json.data as MicrolinkData;
      }
    }
  } catch {
    // Network or timeout
  }
  return null;
}

const PROXIES = [
  async (url: string): Promise<string> => {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      return json?.contents || "";
    }
    return "";
  },
  async (url: string): Promise<string> => {
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return await res.text();
    return "";
  },
  async (url: string): Promise<string> => {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return await res.text();
    return "";
  },
  async (url: string): Promise<string> => {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return await res.text();
    return "";
  },
];

function defaultNavigationLinks(
  parsedUrl: URL,
  capitalizedDomain: string,
  domainDesc?: string,
): ExtractedLink[] {
  return [
    {
      url: parsedUrl.origin,
      path: "/",
      title: "Home",
      description: domainDesc || `Official home of ${capitalizedDomain}`,
    },
    {
      url: `${parsedUrl.origin}/about`,
      path: "/about",
      title: "About",
      description: `About ${capitalizedDomain}`,
    },
    {
      url: `${parsedUrl.origin}/services`,
      path: "/services",
      title: "Services",
      description: `Explore services offered by ${capitalizedDomain}`,
    },
    {
      url: `${parsedUrl.origin}/features`,
      path: "/features",
      title: "Features",
      description: `Explore features of ${capitalizedDomain}`,
    },
    {
      url: `${parsedUrl.origin}/contact`,
      path: "/contact",
      title: "Contact",
      description: `Get in touch with ${capitalizedDomain}`,
    },
    {
      url: `${parsedUrl.origin}/pricing`,
      path: "/pricing",
      title: "Pricing",
      description: `Plans and pricing for ${capitalizedDomain}`,
    },
  ];
}

async function fetchSinglePageMeta(
  pageUrl: string,
): Promise<{ title?: string; description?: string }> {
  let isSameOrigin = false;
  try {
    const parsed = new URL(pageUrl);
    isSameOrigin = typeof window !== "undefined" && window.location.origin === parsed.origin;
  } catch {
    // Ignore invalid URL
  }

  let html = "";
  if (isSameOrigin) {
    try {
      const res = await fetch(pageUrl, {
        headers: { Accept: "text/html" },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        html = await res.text();
      }
    } catch {
      // Ignore network error
    }
  }

  if (!html) {
    const micro = await fetchFromMicrolink(pageUrl);
    if (micro && (micro.title || micro.description)) {
      return { title: micro.title, description: micro.description };
    }

    for (const fetchProxy of PROXIES) {
      try {
        html = await fetchProxy(pageUrl);
        if (html && html.trim().length > 0) break;
      } catch {
        // Continue to next proxy
      }
    }
  }

  if (!html) return {};

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const getMeta = (selector: string): string | null => {
    const el = doc.querySelector(selector);
    if (!el) return null;
    const content = el.getAttribute("content") || el.getAttribute("value");
    return content ? content.trim() : null;
  };

  const metaDesc = getMeta('meta[name="description"]');
  const ogDesc =
    getMeta('meta[property="og:description"]') || getMeta('meta[name="og:description"]');
  const twitterDesc = getMeta('meta[name="twitter:description"]');
  const pDesc = doc.querySelector("p")?.textContent?.trim() || undefined;
  const description = metaDesc || ogDesc || twitterDesc || pDesc || undefined;

  const ogTitle = getMeta('meta[property="og:title"]') || getMeta('meta[name="og:title"]');
  const twitterTitle = getMeta('meta[name="twitter:title"]');
  const tagTitle = doc.querySelector("title")?.textContent?.trim() || undefined;
  const h1Title = doc.querySelector("h1")?.textContent?.trim() || undefined;

  let title = ogTitle || twitterTitle || tagTitle || h1Title;
  if (title) {
    title = title.replace(/\s*[-|•]\s*[^|•\-\n]{2,30}$/i, "").trim() || title;
  }

  return { title, description };
}

async function enrichLinksWithMeta(links: ExtractedLink[]): Promise<ExtractedLink[]> {
  const results: ExtractedLink[] = [...links];
  const poolSize = 3;
  let index = 0;

  const worker = async () => {
    while (index < links.length) {
      const currentIndex = index++;
      const link = links[currentIndex];
      if (link.path === "/") continue; // Home already has top-level metadata
      try {
        const meta = await fetchSinglePageMeta(link.url);
        results[currentIndex] = {
          ...link,
          title: meta.title || link.title,
          description: meta.description || link.description,
        };
      } catch {
        // keep default link
      }
    }
  };

  const workers = Array.from({ length: Math.min(poolSize, links.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function fetchWebsiteMetadata(inputUrl: string): Promise<ExtractedMetadata> {
  const url = normalizeUrl(inputUrl);
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL provided. Please enter a valid web link.");
  }

  const domain = parsedUrl.hostname.replace(/^www\./, "");
  const capitalizedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
  const isSameOrigin = typeof window !== "undefined" && window.location.origin === parsedUrl.origin;

  // Strategy 1: Try direct HTML fetch only if same-origin (to avoid console CORS errors)
  if (isSameOrigin) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "text/html" },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const html = await res.text();
        if (html && html.trim().length > 0) {
          const metadata = extractMetadataFromHtml(html, url);
          metadata.links = await enrichLinksWithMeta(metadata.links);
          return metadata;
        }
      }
    } catch {
      // Proceed to cross-origin strategies
    }
  }

  // Strategy 2: Query Microlink API (reliable CORS-friendly metadata API)
  const microlink = await fetchFromMicrolink(url);

  // Try to fetch HTML from CORS proxies to discover site links
  let html = "";
  for (const fetchProxy of PROXIES) {
    try {
      const resHtml = await fetchProxy(url);
      if (resHtml && resHtml.trim().length > 0) {
        html = resHtml;
        break;
      }
    } catch {
      // Continue to next proxy
    }
  }

  if (html) {
    const metadata = extractMetadataFromHtml(html, url);
    if (microlink) {
      if (microlink.title && (!metadata.title || metadata.title === domain)) {
        metadata.title = microlink.title;
      }
      if (microlink.description && !metadata.description) {
        metadata.description = microlink.description;
      }
      if (microlink.logo?.url) {
        metadata.logoUrl = microlink.logo.url;
      }
      if (microlink.image?.url) {
        metadata.ogImage = microlink.image.url;
      }
    }
    metadata.links = await enrichLinksWithMeta(metadata.links);
    return metadata;
  }

  // If HTML proxies were blocked by Cloudflare/Netlify but Microlink succeeded
  if (microlink && (microlink.title || microlink.logo?.url || microlink.description)) {
    const desc =
      microlink.description || `Official website and resources for ${capitalizedDomain}.`;
    return {
      url,
      domain,
      title: microlink.title || capitalizedDomain,
      description: desc,
      logoUrl:
        microlink.logo?.url ||
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`,
      themeColor: null,
      ogImage: microlink.image?.url || null,
      links: defaultNavigationLinks(parsedUrl, capitalizedDomain, desc),
    };
  }

  // Fallback: Return clean metadata based on hostname & Google favicon API
  return {
    url,
    domain,
    title: capitalizedDomain,
    description: `Official website and resources for ${capitalizedDomain}.`,
    logoUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`,
    themeColor: null,
    ogImage: null,
    links: defaultNavigationLinks(parsedUrl, capitalizedDomain),
    isFallback: true,
  };
}
