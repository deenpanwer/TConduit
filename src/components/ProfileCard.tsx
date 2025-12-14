"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Star } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileCardProps {
  name?: string | null;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  skills?: string[] | null;
  rating?: number | null;
  numReviews?: number | null;
  sellerLevel?: string | null;
  averageResponseTime?: string | null;
  email?: string | null;
  phone?: string | null;
}

const MAX_SKILLS_DISPLAY = 7;

const ProfileCard = ({
  name,
  title,
  description,
  imageUrl,
  skills,
  rating,
  numReviews,
  sellerLevel,
  averageResponseTime,
  email,
  phone,
}: ProfileCardProps) => {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const router = useRouter();

  const handleWrongHire = () => {
    router.push('/');
  };

  const safeSkills = skills ?? [];
  const displayedSkills = showAllSkills ? safeSkills : safeSkills.slice(0, MAX_SKILLS_DISPLAY);
  const hasMoreSkills = safeSkills.length > MAX_SKILLS_DISPLAY;

  const renderStars = (ratingValue: number) => {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400 opacity-50" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border rounded-lg p-6 flex flex-col items-center text-center shadow-lg h-full max-w-lg mx-auto relative overflow-hidden"
    >
      <Image
        src={imageUrl ?? '/default-avatar.png'} // Provide a default image
        alt={name ?? 'Profile picture'}
        width={96}
        height={96}
        className="rounded-full mb-4 object-cover"
      />
      <h3 className="text-2xl font-bold text-card-foreground mb-1">{name ?? 'Unknown Name'}</h3>
      <p className="text-md text-muted-foreground mb-2 px-4">{title ?? 'No title provided'}</p>
      <div className="flex items-center mb-2">
        {renderStars(rating ?? 0)}
        <span className="ml-2 text-sm text-gray-500">({numReviews ?? 0} reviews)</span>
      </div>
      <p className="text-sm text-gray-500 mb-2">{sellerLevel ?? 'N/A'}</p>
      <p className="text-sm text-gray-500 mb-4">{averageResponseTime ?? 'N/A'}</p>
      <p className="text-sm text-gray-500 mb-4 flex-grow">{description ?? 'No description.'}</p>

      {/* Skills Section */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {displayedSkills.map((skill, index) => (
          <span
            key={index}
            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium"
          >
            {skill}
          </span>
        ))}
        {hasMoreSkills && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllSkills(!showAllSkills)}
            className="text-xs text-blue-500 hover:underline"
          >
            {showAllSkills ? "Show Less" : "Show More"}
          </Button>
        )}
      </div>

      {/* Contact Info */}
      {showContact && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-4"
        >
          <p><strong>Email:</strong> {email ?? 'Not available'}</p>
          <p><strong>Phone:</strong> {phone ?? 'Not available'}</p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-auto w-full justify-center">
        <Button variant="default" onClick={() => setShowContact(!showContact)}>
          {showContact ? "Hide Contact" : "Contact Him"}
        </Button>
        <Button variant="outline" onClick={handleWrongHire} className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-500">
          Wrong Hire
        </Button>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
