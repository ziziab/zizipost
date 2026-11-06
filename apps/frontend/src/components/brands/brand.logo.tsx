'use client';

import { FC } from 'react';

export const BrandLogo: FC<{
  name: string;
  picture?: string | null;
  size?: number;
}> = ({ name, picture, size = 40 }) => {
  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        style={{ width: size, height: size, minWidth: size }}
        className="rounded-full object-cover bg-white"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, minWidth: size }}
      className="rounded-full bg-[#612BD3] text-white flex items-center justify-center font-[600] uppercase"
    >
      {(name || '?').trim().charAt(0)}
    </div>
  );
};
