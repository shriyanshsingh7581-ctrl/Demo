import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fit?: 'cover' | 'contain';
  fallbackLabel?: string;
  eager?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fit = 'cover',
  fallbackLabel,
  eager = false,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F6DDE2] via-[#FFF8EF] to-[#D6B77A]/30 text-[#321E1E] p-4 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-10 h-10 rounded-full bg-[#B76E79]/15 flex items-center justify-center mb-2 text-[#B76E79]">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-display text-sm font-semibold tracking-wide text-[#321E1E] line-clamp-2">
          {fallbackLabel || alt || 'Eden Roses Makeover'}
        </span>
        <span className="text-[11px] text-[#321E1E]/60 mt-0.5">By Subba Lakshmi</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
      {...props}
    />
  );
};
