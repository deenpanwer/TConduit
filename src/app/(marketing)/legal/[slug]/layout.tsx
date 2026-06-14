import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  const name = slug ? slug.toUpperCase() : "Document";
  return {
    title: `${name} | Legal & Compliance Documents | TRAC AI`,
    description: `Read the official TRAC AI ${name} agreement. Learn about our data protection standards, client privacy commitments, and regulatory compliance protocols.`,
  };
}

export default function LegalDocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
