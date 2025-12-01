"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const CardAction = ({ className, ...props }: ComponentProps<"div">) => (
    <div className={cn(className)} {...props} />
);

export {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
};
