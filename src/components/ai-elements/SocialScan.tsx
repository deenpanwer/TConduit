"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const SocialScan = () => {
  const [githubCount, setGithubCount] = useState(0);
  const [linkedinCount, setLinkedinCount] = useState(0);
  const [twitterCount, setTwitterCount] = useState(0);

  useEffect(() => {
    const animateCount = (
      setter: React.Dispatch<React.SetStateAction<number>>,
      target: number,
      duration: number
    ) => {
      let start = 0;
      const increment = target / (duration / 50);
      const interval = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(interval);
        } else {
          setter(Math.ceil(start));
        }
      }, 50);
    };

    animateCount(setGithubCount, 234, 2000);
    animateCount(setLinkedinCount, 345, 2500);
    animateCount(setTwitterCount, 178, 3000);
  }, []);

  const iconVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-8">
        {[
          { src: "/github.svg", count: githubCount, name: "GitHub" },
          { src: "/linkedin.svg", count: linkedinCount, name: "LinkedIn" },
          { src: "/twitter.svg", count: twitterCount, name: "Twitter" },
        ].map((social, i) => (
          <motion.div
            key={social.name}
            className="flex flex-col items-center gap-2"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={iconVariants}
          >
            <Image
              src={social.src}
              alt={`${social.name} logo`}
              width={40}
              height={40}
              className="rounded-full"
            />
            <p className="text-2xl font-bold">{social.count}</p>
            <p className="text-muted-foreground">{social.name} Profiles</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Scanning for top-tier candidates across the web...
      </p>
    </div>
  );
};

export default SocialScan;
