import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/config";

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** Primary navigation, shared by the header, mobile menu and footer. */
export function buildNavigation(locale: Locale, t: Dictionary): NavGroup[] {
  const n = t.nav;
  const l = (path: string) => href(locale, path);
  return [
    {
      id: "about",
      label: n.about,
      items: [
        { label: n.aboutOverview, href: l("/about"), description: n.aboutOverviewDesc },
        { label: n.leadership, href: l("/leadership"), description: n.leadershipDesc },
        { label: n.contact, href: l("/contact"), description: n.contactDesc },
      ],
    },
    {
      id: "industry",
      label: n.industry,
      items: [
        { label: n.statistics, href: l("/industry"), description: n.statisticsDesc },
        { label: n.vessels, href: l("/vessels"), description: n.vesselsDesc },
        { label: n.yards, href: l("/yards"), description: n.yardsDesc },
        { label: n.tides, href: l("/tides"), description: n.tidesDesc },
      ],
    },
    {
      id: "sustainability",
      label: n.sustainability,
      items: [
        { label: n.compliance, href: l("/compliance"), description: n.complianceDesc },
        { label: n.ourCompliances, href: l("/compliance/our-compliances"), description: n.ourCompliancesDesc },
        { label: n.waste, href: l("/waste-management"), description: n.wasteDesc },
        { label: n.safety, href: l("/safety"), description: n.safetyDesc },
        { label: n.labour, href: l("/labour"), description: n.labourDesc },
        { label: n.csr, href: l("/csr"), description: n.csrDesc },
      ],
    },
    {
      id: "newsroom",
      label: n.newsroom,
      items: [
        { label: n.news, href: l("/news"), description: n.newsDesc },
        { label: n.press, href: l("/press"), description: n.pressDesc },
        { label: n.international, href: l("/international"), description: n.internationalDesc },
        { label: n.gallery, href: l("/gallery"), description: n.galleryDesc },
      ],
    },
    {
      id: "resources",
      label: n.resources,
      items: [
        { label: n.publications, href: l("/publications"), description: n.publicationsDesc },
        { label: n.links, href: l("/links"), description: n.linksDesc },
        { label: n.search, href: l("/search"), description: t.search.hint },
      ],
    },
  ];
}
