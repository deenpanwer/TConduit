
"use client";

import ProfileCard from "@/components/ProfileCard";
import { StarryBackground } from '@/components/StarryBackground';

// Mock data for the new profile card design
const mockProfile = {
  name: "Jane Doe",
  title: "Senior Full-Stack Engineer & AI Specialist",
  description: "Creative and detail-oriented Full-Stack Engineer with 8+ years of experience building and scaling web applications. Passionate about leveraging AI to create innovative user experiences.",
  imageUrl: "https://fiverr-res.cloudinary.com/t_profile_original,q_auto,f_auto/attachments/profile/photo/43cfb52d2f6d634e022f674519f56475-1683721245719/73e21544-23f7-4180-b744-8c886105c317.jpg",
  skills: [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Python",
    "LangChain",
    "UI/UX Design",
    "Vector Databases",
    "Supabase",
  ],
  rating: 4.9,
  numReviews: 132,
  sellerLevel: "Top Rated Seller",
  averageResponseTime: "1 Hour",
  email: "jane.doe@example.com",
  phone: "+1 (555) 123-4567",
  competence_score: 92,
  agency_score: 88,
};

export default function Test5Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-4">
        <StarryBackground />
        <ProfileCard
            name={mockProfile.name}
            title={mockProfile.title}
            description={mockProfile.description}
            imageUrl={mockProfile.imageUrl}
            skills={mockProfile.skills}
            rating={mockProfile.rating}
            numReviews={mockProfile.numReviews}
            sellerLevel={mockProfile.sellerLevel}
            averageResponseTime={mockProfile.averageResponseTime}
            email={mockProfile.email}
            phone={mockProfile.phone}
            competencyScore={mockProfile.competence_score}
            agencyScore={mockProfile.agency_score}
        />
    </div>
  );
}
