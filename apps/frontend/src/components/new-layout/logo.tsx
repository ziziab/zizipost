'use client';

// ZiziPost branding: burgundy Z icon (file in public/zizipost-icon.png)
export const Logo = () => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/zizipost-icon.png"
      alt="ZiziPost"
      width={60}
      height={60}
      className="mt-[8px] min-w-[60px] min-h-[60px] object-contain"
    />
  );
};
