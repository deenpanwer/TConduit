// src/app/test4/page.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils'; // Assuming this utility exists

const schema = {
  "profile": {
    "page_url": "https://www.fiverr.com/webtechbd1",
    "profile_image_url": "https://fiverr-res.cloudinary.com/image/upload/f_auto,q_auto,t_profile_original/v1/attachments/profile/photo/cae22dc07b3de50d59364ad00cb904e7-1733032799131/57124dfb-dcde-43e7-bf4f-ddbaed230ad9.png",
    "name": "Ibrahim",
    "username": "webtechbd1",
    "rating": 4.9,
    "num_reviews": 369,
    "headline": "Make Your Dream Come True with a Professional Website Developer!",
    "country": "Bangladesh",
    "languages": [
      "English"
    ],
    "about_me": "Looking for a high-performing Website Development service that will truly represent your brand? I’m a professional Full Stack Website Developer with years of experience crafting modern, scalable websites that not only look great but perform flawlessly across all devices. Here’s what I offer in Website Development: -Full Frontend & Backend Development -Mobile-Friendly, Responsive Website Design -SEO Optimization to Boost Online Visibility -Custom Features & Smart Functionality  Let’s build a powerful digital presence for your business with expert Website Development tailored to your goals",
    "skills": [
      "Custom Websites",
      "Full stack web development",
      "MEAN stack",
      "Express.js",
      "Web developer",
      "Website copywriter",
      "Website analytics expert",
      "Website migration expert",
      "Website consultant",
      "Website editor",
      "Custom website developer",
      "Website designer",
      "Website developer",
      "Full stack web developer",
      "Front-end web developer",
      "Back-end developer",
      "Node.js expert",
      "Express.js expert",
      "MongoDB expert",
      "Next.js developer",
      "PHP Laravel developer",
      "PHP developer",
      "Laravel developer",
      "MySQL database developer",
      "React expert",
      "Dashboards developer",
      "MEAN stack expert",
      "Web designer",
      "JavaScript ES6 developer",
      "Html5 expert"
    ],
    "seller_level": "Level 2",
    "average_response_time": "Average response time: 1 hour",
    "review_breakdown": {
      "5_star": 355,
      "4_star": 7,
      "3_star": 3,
      "2_star": 1,
      "1_star": 3
    },
    "num_projects": 10,
    "phone_number": "+880 776 7274 769",
    "email": "ibrahim2005@gmail.com"
  },
  "competence_score": 81.15,
  "agency_score": 62.26
};

const ProfileCard = () => {
  const { profile, competence_score, agency_score } = schema;

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="flex flex-col items-center text-center p-6">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={profile.profile_image_url} alt={profile.name} />
          <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl">{profile.name}</CardTitle>
        <CardDescription className="text-md text-muted-foreground">
          @{profile.username} - {profile.headline}
        </CardDescription>
        <div className="flex items-center text-sm text-gray-500 mt-2">
          <span className="flex items-center mr-2">
            ⭐ {profile.rating} ({profile.num_reviews} reviews)
          </span>
          <span>
            From {profile.country}
          </span>
        </div>
        <a href={profile.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm mt-1">
          View Profile
        </a>
      </CardHeader>
      <CardContent className="p-6 grid gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">About Me</h3>
          <p className="text-sm text-muted-foreground">{profile.about_me}</p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Details</h3>
            <p className="text-sm text-muted-foreground">
              <strong>Seller Level:</strong> <Badge variant="secondary">{profile.seller_level}</Badge>
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Avg. Response Time:</strong> {profile.average_response_time}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Projects Completed:</strong> {profile.num_projects}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Languages:</strong> {profile.languages.join(', ')}
            </p>
            {profile.email && (
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {profile.email}
              </p>
            )}
            {profile.phone_number && (
              <p className="text-sm text-muted-foreground">
                <strong>Phone:</strong> {profile.phone_number}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Scores</h3>
            <p className="text-sm text-muted-foreground">
              <strong>Competence Score:</strong> <Badge variant="outline">{competence_score}</Badge>
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Agency Score:</strong> <Badge variant="outline">{agency_score}</Badge>
            </p>
            <h3 className="text-lg font-semibold mt-4 mb-2">Review Breakdown</h3>
            {Object.entries(profile.review_breakdown).map(([star, count]) => (
              <p key={star} className="text-sm text-muted-foreground">
                <strong>{star.replace('_star', '')} Star:</strong> {count}
              </p>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <Badge key={index} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Test4Page = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-24 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">User Profile Dashboard</h1>
      <ProfileCard />
    </div>
  );
};

export default Test4Page;
