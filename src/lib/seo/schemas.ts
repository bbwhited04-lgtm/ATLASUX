/**
 * JSON-LD structured data generators for SEO.
 * Each function returns a plain object suitable for JSON.stringify().
 */

const SITE_URL = "https://atlasux.cloud";
const SITE_NAME = "Atlas UX";
const LOGO_URL = `${SITE_URL}/icon.svg`;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    description:
      "AI-powered employee platform with autonomous agents for CRM, marketing, finance, HR, and executive operations.",
    founder: {
      "@type": "Person",
      name: "Billy Whited",
      jobTitle: "Founder & CEO",
    },
    sameAs: [
      "https://www.instagram.com/atlas.ux/",
      "https://www.instagram.com/deadapppro/",
      "https://www.linkedin.com/in/ruralcowboy/",
      "https://www.linkedin.com/company/109020222",
      "https://www.linkedin.com/company/111775077",
      "https://www.reddit.com/user/Buffaloherde/",
      "https://www.facebook.com/billy.whited",
      "https://x.com/atlas_ux",
      "https://x.com/buffaloherde",
      "https://threads.com/@atlas.ux",
      "https://www.tiktok.com/@viraldeadengine",
      "https://www.youtube.com/@billywhited4442",
      "https://www.youtube.com/@viraldeadengine",
      "https://www.pinterest.com/bbwhited",
      "https://twitch.tv/buffaloherde",
      "https://buffaloherde.tumblr.com",
    ],
  };
}

export function productSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows, macOS, Linux, Web",
    description:
      "Standalone AI employee platform — autonomous agents that handle CRM, marketing, finance, HR, and executive operations for small businesses.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "99",
      offerCount: "4",
    },
    featureList: [
      "30+ autonomous AI agents",
      "Decision memos with human approval",
      "Full audit trail",
      "Microsoft 365 integration",
      "CRM, marketing, finance automation",
      "Cross-platform desktop app",
    ],
  };
}

export function blogPostSchema(post: {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: `${SITE_URL}/#/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.date,
    description: post.excerpt,
    image: post.coverImage.startsWith("http")
      ? post.coverImage
      : `${SITE_URL}${post.coverImage}`,
    author: {
      "@type": "Person",
      name: post.author || "Billy Whited",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}/#${item.path}`,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function webPageSchema(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: SITE_URL,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}
