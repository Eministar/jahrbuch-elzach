"use client";

type BannerImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  onLoad?: () => void;
};

export default function BannerImage({ src, alt, className = "", onLoad }: BannerImageProps) {
  if (!src) return null;

  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          const parent = target.parentElement;
          if (parent?.parentElement) {
            parent.parentElement.style.display = 'none';
          }
        }}
        onLoad={onLoad}
      />
    </div>
  );
}

