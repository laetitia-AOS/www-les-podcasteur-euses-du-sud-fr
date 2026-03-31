/**
 * Append UTM parameters to an external URL so destination sites
 * can identify traffic coming from les-podcasteur-euses-du-sud.fr.
 *
 * Internal links (same domain, mailto:, tel:) are returned unchanged.
 */
export const withUtm = (
  url: string,
  campaign: string = "annuaire",
  medium: string = "fiche"
): string => {
  if (!url) return url;

  // Skip non-http links
  if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) return url;

  try {
    const u = new URL(url);
    // Skip if already has utm params
    if (u.searchParams.has("utm_source")) return url;

    u.searchParams.set("utm_source", "podcasteurs-du-sud");
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
};
