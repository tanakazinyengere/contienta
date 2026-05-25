import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
}

const SITE = "ClippedIn";
const DEFAULT_IMG = "/og-image.png";

const SEO = ({ title, description = "Post better. Grow faster. ClippedIn helps you build LinkedIn authority with AI.", canonical, image = DEFAULT_IMG }: SEOProps) => {
  const fullTitle = title.includes(SITE) ? title : `${title} – ${SITE}`;
  const url = canonical || (typeof window !== "undefined" ? window.location.href : "https://clippedin.lovable.app");
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE} />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
