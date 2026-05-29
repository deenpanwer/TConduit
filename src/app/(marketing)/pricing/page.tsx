import { headers } from "next/headers";
import { PricingContent } from "./pricing-content";

export default async function PricingPage() {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country") || "DEFAULT";

  return <PricingContent country={country} />;
}