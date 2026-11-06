import { internalFetch } from '@gitroom/helpers/utils/internal.fetch';
import { sanitizePostContent } from '@gitroom/helpers/utils/sanitize.post.content';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { VideoOrImage } from '@gitroom/react/helpers/video.or.image';
import { getT } from '@gitroom/react/translation/get.translation.service.backend';
import { RenderPreviewDateClient } from '@gitroom/frontend/components/preview/render.preview.date.client';
import { BrandLogo } from '@gitroom/frontend/components/brands/brand.logo';
import { ApprovalActions } from '@gitroom/frontend/components/approvals/approval.actions';

export const metadata: Metadata = {
  title: 'Post approval',
  description: '',
};

export default async function ApprovePage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const t = await getT();
  const response = await internalFetch(
    `/public/approvals/${encodeURIComponent(token)}`
  );
  const data = response.ok ? await response.json() : null;

  if (!data?.posts?.length) {
    return (
      <div className="text-newTextColor fixed start-0 top-0 w-full h-full flex justify-center items-center text-[20px] px-[20px] text-center">
        {data?.status === 'EXPIRED'
          ? t(
              'approval_expired',
              'This link has expired. Ask the team for a new one.'
            )
          : t('approval_not_found', 'This approval link does not exist.')}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] p-[12px] flex flex-col gap-[12px] text-newTextColor">
      <div className="flex bg-newBgColorInner rounded-[12px] px-[20px] py-[16px] items-center gap-[16px] flex-wrap">
        {!!data.brand && (
          <BrandLogo
            name={data.brand.name}
            picture={data.brand.picture}
            size={48}
          />
        )}
        <div className="flex-1 min-w-[200px]">
          <div className="text-[18px] font-[600]">
            {data.brand?.name
              ? data.brand.name +
                ': ' +
                t('approval_title', 'post for your approval')
              : t('approval_title_plain', 'Post for your approval')}
          </div>
          <div className="text-[13px] text-textItemBlur">
            {t(
              'approval_subtitle',
              'Check the post below for each channel, then approve it or ask for changes.'
            )}
          </div>
        </div>
      </div>

      {data.posts.map((p: any) => (
        <div
          key={p.group}
          className="bg-newBgColorInner border border-newTableBorder rounded-[12px] p-[20px] flex flex-col gap-[14px]"
        >
          <div className="flex items-center gap-[12px]">
            <div className="relative w-[44px] h-[44px] shrink-0">
              <img
                className="w-full h-full bg-newBgColor rounded-full"
                alt={p.integration.name}
                src={p.integration.picture || '/no-picture.jpg'}
              />
              <img
                className="absolute -end-[4px] -bottom-[4px] w-[20px] h-[20px] rounded-full"
                alt={p.integration.providerIdentifier}
                src={`/icons/platforms/${p.integration.providerIdentifier}.png`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-[600] truncate">
                {p.integration.name}
              </div>
              <div className="text-[13px] text-textItemBlur">
                <RenderPreviewDateClient date={p.publishDate} />
              </div>
            </div>
          </div>
          {p.values.map((value: any, index: number) => (
            <div
              key={index}
              className={
                index
                  ? 'border-t border-newTableBorder pt-[14px] flex flex-col gap-[12px]'
                  : 'flex flex-col gap-[12px]'
              }
            >
              <div
                className="text-[14px] whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: sanitizePostContent(value.content),
                }}
              />
              {!!value.image.length && (
                <div className="flex w-full gap-[10px] flex-wrap">
                  {value.image.map((media: any) => (
                    <div
                      key={media.path}
                      className="flex-1 min-w-[200px] rounded-[10px] max-h-[500px] overflow-hidden"
                    >
                      <VideoOrImage
                        isContain={true}
                        autoplay={false}
                        src={media.path}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <ApprovalActions
        token={token}
        status={data.status}
        decidedBy={data.decidedBy}
        expiresAt={data.expiresAt}
      />
    </div>
  );
}
