"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ImageSize = "sm" | "md" | "lg" | "xl";

interface RoundImageProps {
  /** Image URL to display */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Size variant affecting max height */
  size?: ImageSize;
  /** Whether to wrap in a Card component (player view) */
  withCard?: boolean;
  /** Additional class name */
  className?: string;
}

const sizeConfig: Record<ImageSize, string> = {
  sm: "max-h-[30vh]",
  md: "max-h-[40vh]",
  lg: "max-h-[50vh]",
  xl: "max-h-[60vh]",
};

/**
 * Displays a round image with consistent styling.
 * Used in both player and moderator/beamer views.
 */
export function RoundImage({
  src,
  alt = "Zu erratender Ort",
  size = "lg",
  withCard = false,
  className,
}: RoundImageProps): React.ReactElement {
  // Using <img> instead of next/image because images come from Convex storage
  // with dynamic URLs that aren't configured in next.config.js
  const imageElement = (
    // biome-ignore lint/performance/noImgElement: External images from Convex storage
    <img
      src={src}
      alt={alt}
      className={cn(
        "w-full h-auto object-contain",
        sizeConfig[size],
        !withCard && "rounded-xl shadow-2xl",
        className,
      )}
    />
  );

  if (withCard) {
    return (
      <Card className="w-full max-w-2xl overflow-hidden">{imageElement}</Card>
    );
  }

  return <div className="flex justify-center">{imageElement}</div>;
}
