import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const USER_AGENT =
  'Mozilla/5.0 (compatible; MoreXLinkPreview/1.0; +https://morex.app)';

type LinkPreviewType = 'X' | 'YouTube' | 'note' | 'Web記事' | 'AI回答';

type LinkPreviewResponse = {
  url: string;
  type: LinkPreviewType;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

function normalizeUrl(input: string): string | null {
  const rawUrl = input.trim();
  if (!rawUrl) return null;

  try {
    const normalizedUrl = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const url = new URL(normalizedUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
}

async function assertPublicUrl(urlString: string): Promise<void> {
  const url = new URL(urlString);
  const hostname = url.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error('Blocked private hostname');
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 4 && isPrivateIpv4(hostname)) throw new Error('Blocked private IPv4 address');
  if (ipVersion === 6 && isPrivateIpv6(hostname)) throw new Error('Blocked private IPv6 address');

  if (ipVersion === 0) {
    const results = await lookup(hostname, { all: true, verbatim: true });
    if (results.some((result) => (
      result.family === 4
        ? isPrivateIpv4(result.address)
        : isPrivateIpv6(result.address)
    ))) {
      throw new Error('Blocked private DNS result');
    }
  }
}

function detectType(input: string): LinkPreviewType {
  const normalizedUrl = normalizeUrl(input);
  if (!normalizedUrl) return 'Web記事';

  try {
    const hostname = new URL(normalizedUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'x.com' || hostname.endsWith('.x.com') || hostname === 'twitter.com' || hostname.endsWith('.twitter.com')) {
      return 'X';
    }
    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') {
      return 'YouTube';
    }
    if (hostname === 'note.com' || hostname.endsWith('.note.com')) return 'note';
  } catch {
    return 'Web記事';
  }

  return 'Web記事';
}

function getYouTubeVideoId(input: string): string | null {
  const normalizedUrl = normalizeUrl(input);
  if (!normalizedUrl) return null;

  try {
    const url = new URL(normalizedUrl);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAttr(tag: string, attrName: string): string | undefined {
  const attrPattern = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, 'i');
  return tag.match(attrPattern)?.[1];
}

function findMeta(html: string, names: string[]): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const property = getAttr(tag, 'property')?.toLowerCase();
    const name = getAttr(tag, 'name')?.toLowerCase();
    if (names.some((target) => property === target || name === target)) {
      const content = getAttr(tag, 'content');
      if (content) return decodeHtml(content);
    }
  }
  return undefined;
}

function findTitle(html: string): string | undefined {
  const ogTitle = findMeta(html, ['og:title', 'twitter:title']);
  if (ogTitle) return ogTitle;

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? decodeHtml(title.replace(/<[^>]+>/g, '')) : undefined;
}

function resolveImage(image: string | undefined, pageUrl: string): string | undefined {
  if (!image) return undefined;
  try {
    return new URL(image, pageUrl).href;
  } catch {
    return image;
  }
}

async function fetchHtml(url: string, redirectCount = 0): Promise<string> {
  await assertPublicUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': USER_AGENT,
      },
      redirect: 'manual',
      signal: controller.signal,
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const nextUrl = response.headers.get('location');
      if (!nextUrl || redirectCount >= 3) throw new Error('Unsupported redirect');
      return fetchHtml(new URL(nextUrl, url).href, redirectCount + 1);
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function sendJson(res: any, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, {});
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const urlParam = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;
  const normalizedUrl = typeof urlParam === 'string' ? normalizeUrl(urlParam) : null;
  if (!normalizedUrl) {
    sendJson(res, 400, { error: 'Invalid URL' });
    return;
  }

  const type = detectType(normalizedUrl);
  const youtubeVideoId = getYouTubeVideoId(normalizedUrl);
  if (youtubeVideoId) {
    const response: LinkPreviewResponse = {
      url: normalizedUrl,
      type: 'YouTube',
      image: `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
      siteName: 'YouTube',
    };
    sendJson(res, 200, response);
    return;
  }

  try {
    const html = await fetchHtml(normalizedUrl);
    const image = resolveImage(findMeta(html, ['og:image', 'twitter:image', 'twitter:image:src']), normalizedUrl);
    const response: LinkPreviewResponse = {
      url: normalizedUrl,
      type,
      title: findTitle(html),
      description: findMeta(html, ['og:description', 'twitter:description', 'description']),
      image,
      siteName: findMeta(html, ['og:site_name']),
    };

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    sendJson(res, 200, response);
  } catch {
    sendJson(res, 200, {
      url: normalizedUrl,
      type,
      siteName: type,
    } satisfies LinkPreviewResponse);
  }
}
