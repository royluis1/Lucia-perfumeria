import Image from 'next/image';

export function SmartImage({
  src,
  alt,
  className = 'object-cover',
  sizes = '100vw',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src.startsWith('data:')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={`absolute inset-0 h-full w-full ${className}`}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }

  return <Image className={className} src={src} alt={alt} fill sizes={sizes} priority={priority} />;
}
