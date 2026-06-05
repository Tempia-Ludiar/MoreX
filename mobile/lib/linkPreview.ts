export const LINK_PREVIEW_TYPES = ['X', 'YouTube', 'note', 'Web記事', 'AI回答'] as const;
export type LinkPreviewType = (typeof LINK_PREVIEW_TYPES)[number];

export type LinkPreview = {
  url: string;
  type: LinkPreviewType;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  source: 'youtube' | 'server' | 'fallback';
};

type ServerLinkPreview = Partial<Omit<LinkPreview, 'source'>> & {
  url?: string;
  type?: LinkPreviewType;
};

const PREVIEW_ENDPOINT = process.env.EXPO_PUBLIC_LINK_PREVIEW_ENDPOINT || '/api/link-preview';

export function normalizeUrl(input: string): string | null {
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

export function detectLinkPreviewType(input: string): LinkPreviewType {
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

export function getYouTubeVideoId(input: string): string | null {
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

export function getYouTubeThumbnail(input: string): string | undefined {
  const videoId = getYouTubeVideoId(input);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;
}

function buildFallback(input: string): LinkPreview {
  return {
    url: normalizeUrl(input) || input.trim(),
    type: detectLinkPreviewType(input),
    image: getYouTubeThumbnail(input),
    source: getYouTubeThumbnail(input) ? 'youtube' : 'fallback',
  };
}

export async function fetchLinkPreview(input: string): Promise<LinkPreview> {
  const normalizedUrl = normalizeUrl(input);
  if (!normalizedUrl) return buildFallback(input);

  const type = detectLinkPreviewType(normalizedUrl);
  const youtubeImage = getYouTubeThumbnail(normalizedUrl);
  if (youtubeImage) {
    return {
      url: normalizedUrl,
      type: 'YouTube',
      image: youtubeImage,
      siteName: 'YouTube',
      source: 'youtube',
    };
  }

  try {
    const endpoint = `${PREVIEW_ENDPOINT}?url=${encodeURIComponent(normalizedUrl)}`;
    const response = await fetch(endpoint);
    if (!response.ok) return buildFallback(normalizedUrl);

    const data = (await response.json()) as ServerLinkPreview;
    return {
      url: data.url || normalizedUrl,
      type: data.type || type,
      title: data.title,
      description: data.description,
      image: data.image,
      siteName: data.siteName,
      source: 'server',
    };
  } catch {
    return buildFallback(normalizedUrl);
  }
}
