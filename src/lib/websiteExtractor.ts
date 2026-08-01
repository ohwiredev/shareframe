export type ExtractedLink = {
  url: string;
  path: string;
  title: string;
  description?: string;
};

export type ExtractedMetadata = {
  url: string;
  domain: string;
  title: string;
  description: string;
  logoUrl: string | null;
  themeColor: string | null;
  ogImage: string | null;
  links: ExtractedLink[];
  isFallback?: boolean;
};

export function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch {
    return trimmed;
  }
}

export function isMainPagePath(path: string): boolean {
  const cleanPath = path.replace(/^\//, "").replace(/\/$/, "");
  if (!cleanPath) return true; // Home

  const segments = cleanPath.split("/").filter(Boolean);

  // Strictly enforce top-level main pages only (1 level deep)
  // Excludes subpages like /advertising-solutions/display-boards or /blog/post-slug
  if (segments.length > 1) {
    return false;
  }

  const segment = segments[0];

  // Exclude numeric IDs or long article slugs
  if (/^\d+$/.test(segment)) return false;
  if ((segment.match(/-/g) || []).length >= 4) return false;

  return true;
}

export function extractMetadataFromHtml(html: string, pageUrl: string): ExtractedMetadata {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(pageUrl);
  } catch {
    parsedUrl = new URL("https://example.com");
  }

  const domain = parsedUrl.hostname.replace(/^www\./, "");
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const getMeta = (selector: string): string | null => {
    const el = doc.querySelector(selector);
    if (!el) return null;
    const content = el.getAttribute("content") || el.getAttribute("value");
    return content ? content.trim() : null;
  };

  // Title extraction: og:title -> twitter:title -> <title> -> h1
  const ogTitle = getMeta('meta[property="og:title"]') || getMeta('meta[name="og:title"]');
  const twitterTitle = getMeta('meta[name="twitter:title"]');
  const tagTitle = doc.querySelector("title")?.textContent?.trim() || null;
  const h1Title = doc.querySelector("h1")?.textContent?.trim() || null;

  const rawTitle = ogTitle || twitterTitle || tagTitle || h1Title || domain;
  // Clean title suffix like " | My Brand" or " - My Brand" if too long
  const title = rawTitle.replace(/\s*[-|•]\s*[^|•\-\n]{2,25}$/i, "").trim() || rawTitle;

  // Description extraction: meta description -> og:description -> twitter:description -> first <p>
  const metaDesc = getMeta('meta[name="description"]');
  const ogDesc =
    getMeta('meta[property="og:description"]') || getMeta('meta[name="og:description"]');
  const twitterDesc = getMeta('meta[name="twitter:description"]');
  const pDesc = doc.querySelector("p")?.textContent?.trim() || null;

  const description =
    metaDesc || ogDesc || twitterDesc || pDesc || `Official website and updates for ${domain}.`;

  // Theme color extraction
  const themeColor = getMeta('meta[name="theme-color"]');

  // OG Image extraction
  const ogImageRaw = getMeta('meta[property="og:image"]') || getMeta('meta[name="twitter:image"]');
  let ogImage: string | null = null;
  if (ogImageRaw) {
    try {
      ogImage = new URL(ogImageRaw, pageUrl).href;
    } catch {
      ogImage = ogImageRaw;
    }
  }

  // Favicon / Icon extraction
  const appleIcon = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href");
  const icon = doc.querySelector('link[rel~="icon"]')?.getAttribute("href");

  let logoUrl: string | null = null;
  const rawIcon = appleIcon || icon;
  if (rawIcon) {
    try {
      logoUrl = new URL(rawIcon, pageUrl).href;
    } catch {
      logoUrl = null;
    }
  }

  // Fallback logo URL to high-res Google Favicon API
  if (!logoUrl) {
    logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`;
  }

  // Discover sub-pages / links for batch workflow (main navigation & site pages)
  // Query navigation containers and all site links
  const navElements = Array.from(
    doc.querySelectorAll(
      "header a[href], nav a[href], footer a[href], [role='navigation'] a[href], [class*='nav'] a[href], [class*='menu'] a[href], [class*='header'] a[href], [class*='footer'] a[href]",
    ),
  );
  const allElements = Array.from(doc.querySelectorAll("a[href]"));
  const linkElements = [...navElements, ...allElements];

  const linkMap = new Map<string, ExtractedLink>();

  // Always include Home as first link
  linkMap.set("/", {
    url: parsedUrl.origin,
    path: "/",
    title: "Home",
    description,
  });

  for (const anchor of linkElements) {
    const href = anchor.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:")
    ) {
      continue;
    }

    try {
      const linkUrl = new URL(href, pageUrl);
      if (linkUrl.hostname.replace(/^www\./, "") !== domain) continue;

      const path = linkUrl.pathname.replace(/\/$/, "");
      if (!path || path === "" || path === "/") continue;

      // Ignore asset files
      if (/\.(png|jpg|jpeg|gif|svg|pdf|zip|css|js|woff2?)$/i.test(path)) continue;

      // Only include main pages (exclude single blog posts, articles, numeric IDs)
      if (!isMainPagePath(path)) continue;

      if (!linkMap.has(path) && linkMap.size < 30) {
        let linkTitle = anchor.textContent?.trim() || "";
        if (!linkTitle || linkTitle.length < 2 || linkTitle.length > 35) {
          // Format path to Title Case (e.g., /about-us -> About Us)
          linkTitle = path
            .substring(1)
            .split(/[/\-_]/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        linkMap.set(path, {
          url: linkUrl.href,
          path: path || "/",
          title: linkTitle,
          description: `Learn more about ${linkTitle} at ${domain}`,
        });
      }
    } catch {
      // Invalid URL syntax
    }
  }

  return {
    url: pageUrl,
    domain,
    title,
    description,
    logoUrl,
    themeColor,
    ogImage,
    links: Array.from(linkMap.values()),
  };
}
