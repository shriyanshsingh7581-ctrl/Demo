import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { CLOUDINARY_ASSETS, resolveWorkingImageUrl } from '../config/edenRosesImages';

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
  const resolvedPrimarySrc = resolveWorkingImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string>(resolvedPrimarySrc);
  const [triedBackup, setTriedBackup] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextUrl = resolveWorkingImageUrl(src);
    setCurrentSrc(nextUrl);
    setTriedBackup(false);
    setHasError(false);
  }, [src]);

  if (hasError || !currentSrc) {
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
      src={currentSrc}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!triedBackup && currentSrc !== CLOUDINARY_ASSETS.bridalHd) {
          setTriedBackup(true);
          setCurrentSrc(CLOUDINARY_ASSETS.bridalHd);
        } else {
          setHasError(true);
        }
      }}
      className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
      {...props}
    />
  );
};
