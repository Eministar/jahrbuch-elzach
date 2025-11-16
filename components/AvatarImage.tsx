"use client";

import { BookOpen } from "lucide-react";

type AvatarImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
};

export default function AvatarImage({ src, alt, className = "", fallbackIcon }: AvatarImageProps) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#d97757] to-[#c96846] text-white ${className}`}>
        {fallbackIcon || <BookOpen className="h-4 w-4" />}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`object-cover ${className}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextElementSibling) {
            (target.nextElementSibling as HTMLElement).style.display = 'flex';
          }
        }}
      />
      <div
        className={`items-center justify-center bg-gradient-to-br from-[#d97757] to-[#c96846] text-white ${className}`}
        style={{ display: 'none' }}
      >
        {fallbackIcon || <BookOpen className="h-4 w-4" />}
      </div>
    </>
  );
}

