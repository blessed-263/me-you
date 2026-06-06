import { useEffect } from 'react';
import {
  DEFAULT_OG_IMAGE,
  SITE_KEYWORDS,
  SITE_NAME,
  absoluteUrl,
  getRouteSeo,
  normalizePathname,
} from '../lib/seo.ts';

function upsertMeta(name: string, content: string, property = false): void {
  const attr = property ? 'property' : 'name';
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | undefined): void {
  const id = 'seo-jsonld';
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

type SeoHeadProps = {
  pathname?: string;
};

export default function SeoHead({ pathname = window.location.pathname }: SeoHeadProps) {
  useEffect(() => {
    const path = normalizePathname(pathname);
    const seo = getRouteSeo(path);
    const canonical = absoluteUrl(seo.path);
    const image = absoluteUrl(DEFAULT_OG_IMAGE);

    document.title = seo.title;
    upsertMeta('description', seo.description);
    upsertMeta('keywords', SITE_KEYWORDS);
    upsertMeta('robots', seo.robots ?? 'index,follow');
    upsertMeta('author', SITE_NAME);
    upsertMeta('geo.region', 'ZA-GP');
    upsertMeta('geo.placename', 'Sandton');

    upsertLink('canonical', canonical);

    upsertMeta('og:title', seo.title, true);
    upsertMeta('og:description', seo.description, true);
    upsertMeta('og:url', canonical, true);
    upsertMeta('og:site_name', SITE_NAME, true);
    upsertMeta('og:type', seo.ogType ?? 'website', true);
    upsertMeta('og:locale', 'en_ZA', true);
    upsertMeta('og:image', image, true);
    upsertMeta('og:image:alt', `${SITE_NAME} cultural gathering in Sandton`, true);

    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', seo.title);
    upsertMeta('twitter:description', seo.description);
    upsertMeta('twitter:image', image);

    const verification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
    if (verification) {
      upsertMeta('google-site-verification', verification);
    }

    upsertJsonLd(seo.jsonLd);
  }, [pathname]);

  return null;
}
