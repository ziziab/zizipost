import React from 'react';

// ZiziPost branding: icon + two-tone wordmark
export const LogoTextComponent = () => {
  return (
    <div className="flex items-center gap-[10px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/zizipost-icon.png" alt="" width={40} height={40} />
      <span className="text-[28px] font-[700] tracking-[0.5px]">
        <span className="text-white">ZIZI</span>
        <span className="text-[#B0122C]">POST</span>
      </span>
    </div>
  );
};
