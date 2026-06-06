import { Helmet } from "react-helmet-async";

// Drop-in <NoIndex /> for auth-gated pages. Ensures crawlers that reach
// the URL via manual access or referrals still see noindex + nofollow.
const NoIndex = () => (
  <Helmet>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="googlebot" content="noindex, nofollow" />
  </Helmet>
);

export default NoIndex;
