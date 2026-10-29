import { getT } from '@gitroom/react/translation/get.translation.service.backend';

export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Toaster } from '@gitroom/react/toaster/toaster';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getT();

  return (
    <MantineWrapper>
      <Toaster />
      <div className="bg-[#0E0E0E] flex flex-1 p-[12px] gap-[12px] min-h-screen w-screen text-white">
        {/*<style>{`html, body {overflow-x: hidden;}`}</style>*/}
        <ReturnUrlComponent />
        <div className="flex flex-col py-[40px] px-[20px] flex-1 lg:w-[600px] lg:flex-none rounded-[12px] text-white p-[12px] bg-[#1A1919]">
          <div className="w-full max-w-[440px] mx-auto justify-center gap-[20px] h-full flex flex-col text-white">
            <LogoTextComponent />
            <div className="flex">{children}</div>
          </div>
        </div>
        <div className="text-[36px] flex-1 pt-[88px] hidden lg:flex flex-col items-center">
          <div className="text-center">
            <span className="font-bold">ZIZI</span>
            <span className="font-bold text-[#B0122C]">POST</span> by ZIZIAB
            <br />
            Plan once. Post everywhere.
            <div className="text-[16px] mt-[16px] text-[#aaa]">
              Powered by open-source Postiz
            </div>
          </div>
          <ul className="mt-[48px] text-[18px] text-[#ddd] flex flex-col gap-[16px] max-w-[460px]">
            <li>Schedule posts to Facebook, Instagram, LinkedIn, YouTube, Pinterest and X from one place</li>
            <li>See every planned post on one calendar</li>
            <li>Made in India for creators and small businesses</li>
          </ul>
        </div>
      </div>
    </MantineWrapper>
  );
}
