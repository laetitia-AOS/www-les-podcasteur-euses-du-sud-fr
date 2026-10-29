import { useEffect } from "react";
import { DEFAULT_SHARE_IMAGE, SITE_URL } from "@/lib/seo";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown> | (Record<string, unknown> | null | undefined)[] | null;
  /** Pages privées (espace membre, administration, connexion) : jamais dans les moteurs de recherche. */
  noindex?: boolean;
}

const setMeta = (attr: string, key: string, content: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const SEOHead = ({ title, description, path = "/", image, type = "website", jsonLd, noindex = false }: SEOHeadProps) => {
  const ldKey = JSON.stringify(jsonLd ?? null);

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = "fr";

    const url = `${SITE_URL}${path}`;
    const img = image || DEFAULT_SHARE_IMAGE;

    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", img);
    setMeta("property", "og:type", type);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", img);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    document.querySelectorAll('script[data-seo-head="true"]').forEach((s) => s.remove());
    const items = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).filter(Boolean) as Record<string, unknown>[];
    items.forEach((item) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-head", "true");
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-head="true"]').forEach((s) => s.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, ldKey, noindex]);

  return null;
};

export default SEOHead;
