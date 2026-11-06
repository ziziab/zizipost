'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { groupBy, orderBy, uniqBy } from 'lodash';
import { expandPosts } from '@gitroom/helpers/utils/posts.list.minify';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { stripHtmlValidation } from '@gitroom/helpers/utils/strip.html.validation';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import { useBrands } from '@gitroom/frontend/components/brands/use.brands';
import { BrandLogo } from '@gitroom/frontend/components/brands/brand.logo';
import { allowedIntegrations } from '@gitroom/frontend/components/platform-analytics/platform.analytics';
import {
  AnalyticsDataItem,
  analyticsTotal,
  TrendIndicator,
} from '@gitroom/frontend/components/platform-analytics/render.analytics';
import { ChartSocial } from '@gitroom/frontend/components/analytics/chart-social';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

dayjs.extend(utc);

export const reportPeriods = [7, 30];

interface ReportPost {
  id: string;
  content: string;
  publishDate: string;
  releaseURL?: string | null;
  state: string;
  integration: {
    id: string;
    providerIdentifier: string;
    name: string;
    picture?: string | null;
  };
}

const useReportPosts = (
  brandId: string,
  startDate: string,
  endDate: string
) => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(brandId ? { customer: brandId } : {}),
    });
    const response = await fetch(`/posts?${params.toString()}`);
    if (!response.ok) {
      return [];
    }
    return expandPosts(await response.json()).posts || [];
  }, [brandId, startDate, endDate]);
  return useSWR<ReportPost[]>(
    `report-posts-${brandId}-${startDate}-${endDate}`,
    load,
    { revalidateOnFocus: false }
  );
};

const useChannelAnalytics = (integrationId: string, days: number) => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    const response = await fetch(
      `/analytics/${integrationId}?date=${days}`
    );
    if (!response.ok) {
      return [];
    }
    return response.json();
  }, [integrationId, days]);
  return useSWR<AnalyticsDataItem[]>(
    `report-analytics-${integrationId}-${days}`,
    load,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );
};

const ChannelSection: FC<{
  integration: any;
  days: number;
  postsCount: number;
  onLoaded: (id: string) => void;
}> = ({ integration, days, postsCount, onLoaded }) => {
  const t = useT();
  const { data, isLoading } = useChannelAnalytics(integration.id, days);

  useEffect(() => {
    if (!isLoading) {
      onLoaded(integration.id);
    }
  }, [isLoading, integration.id, onLoaded]);

  return (
    <div className="flex flex-col gap-[12px] border border-[#E5E5E5] rounded-[12px] p-[16px] break-inside-avoid">
      <div className="flex items-center gap-[12px]">
        <div className="relative">
          <ImageWithFallback
            fallbackSrc={`/icons/platforms/${integration.identifier}.png`}
            src={integration.picture}
            className="rounded-[8px]"
            alt={integration.identifier}
            width={36}
            height={36}
          />
          <img
            src={`/icons/platforms/${integration.identifier}.png`}
            className="rounded-[4px] absolute bottom-[-4px] -end-[4px] w-[16px] h-[16px] border border-white"
            alt=""
          />
        </div>
        <div className="flex-1">
          <div className="text-[16px] font-[600]">{integration.name}</div>
          <div className="text-[13px] text-[#6B6B6B]">
            {t('report_posts_published_count', '{{total}} posts published', {
              total: postsCount,
            })}
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-[16px]">
          <LoadingComponent />
        </div>
      ) : !data?.length ? (
        <div className="text-[14px] text-[#6B6B6B]">
          {t(
            'report_no_numbers',
            'No numbers from this channel for this period. If this keeps happening, reconnect the channel.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[10px]">
          {data.map((item, index) => (
            <div
              key={item.label}
              className="flex flex-col border border-[#EFEFEF] rounded-[8px] px-[12px] py-[10px] gap-[4px]"
            >
              <div className="flex items-center justify-between gap-[6px]">
                <div className="text-[12px] text-[#6B6B6B]">{item.label}</div>
                {item.percentageChange !== undefined && (
                  <TrendIndicator
                    value={item.percentageChange}
                    average={item.average}
                  />
                )}
              </div>
              <div className="text-[22px] font-[600]">
                {analyticsTotal(item)}
              </div>
              {item.data.length > 1 && (
                <div className="h-[40px]">
                  <ChartSocial
                    data={item.data}
                    color={(['purple', 'green', 'blue'] as const)[index % 3]}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ReportDocument: FC<{
  brandId: string;
  days: number;
  onReady?: () => void;
}> = ({ brandId, days, onReady }) => {
  const t = useT();
  const { disableXAnalytics } = useVariables();
  const { data: brands } = useBrands();
  const { data: integrations, isLoading: integrationsLoading } =
    useIntegrationList();

  const { startDate, endDate } = useMemo(() => {
    const end = dayjs.utc().startOf('minute');
    return {
      startDate: end.subtract(days, 'day').toISOString(),
      endDate: end.toISOString(),
    };
  }, [days]);

  const { data: allPosts, isLoading: postsLoading } = useReportPosts(
    brandId,
    startDate,
    endDate
  );

  const brand = useMemo(
    () => (brands || []).find((p) => p.id === brandId),
    [brands, brandId]
  );

  const channels = useMemo(() => {
    return orderBy(
      (integrations || []).filter((p: any) => {
        if (p.disabled || p.refreshNeeded || p.inBetweenSteps) {
          return false;
        }
        if (!allowedIntegrations.includes(p.identifier)) {
          return false;
        }
        if (p.identifier === 'x' && disableXAnalytics) {
          return false;
        }
        return !brandId || p.customer?.id === brandId;
      }),
      ['identifier', 'name'],
      ['asc', 'asc']
    );
  }, [integrations, brandId, disableXAnalytics]);

  const posts = useMemo(() => {
    // Repeating posts come back once per repeat, keep each post once
    return orderBy(
      uniqBy(allPosts || [], 'id').filter(
        (p) =>
          p.state === 'PUBLISHED' &&
          dayjs.utc(p.publishDate).isAfter(startDate) &&
          dayjs.utc(p.publishDate).isBefore(endDate)
      ),
      ['publishDate'],
      ['desc']
    );
  }, [allPosts, startDate, endDate]);

  const postsByChannel = useMemo(
    () => groupBy(posts, (p) => p.integration.id),
    [posts]
  );

  // Tell the print page when every number is on screen
  const [loaded, setLoaded] = useState<string[]>([]);
  const markLoaded = useCallback((id: string) => {
    setLoaded((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);
  const readySent = useRef(false);
  useEffect(() => {
    if (
      readySent.current ||
      !onReady ||
      integrationsLoading ||
      postsLoading ||
      channels.some((p: any) => !loaded.includes(p.id))
    ) {
      return;
    }
    readySent.current = true;
    onReady();
  }, [onReady, integrationsLoading, postsLoading, channels, loaded]);

  const title = brand?.name || t('all_channels', 'All channels');

  return (
    <div className="bg-white text-[#0C0C0C] flex flex-col gap-[24px] p-[32px] rounded-[12px] print:p-0 print:rounded-none">
      <div className="flex items-center gap-[16px] border-b border-[#E5E5E5] pb-[20px]">
        <BrandLogo name={title} picture={brand?.picture} size={56} />
        <div className="flex-1">
          <div className="text-[24px] font-[600]">{title}</div>
          <div className="text-[14px] text-[#6B6B6B]">
            {t('social_media_report', 'Social media report')}
            {' · '}
            {t('report_last_days', 'Last {{days}} days', { days })}
            {' · '}
            {dayjs(startDate).format('D MMM YYYY')} -{' '}
            {dayjs(endDate).format('D MMM YYYY')}
          </div>
        </div>
        <div className="text-[18px] font-[700] tracking-[1px]">
          ZIZI<span className="text-[#B0122C]">POST</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[12px]">
        <div className="border border-[#E5E5E5] rounded-[12px] p-[16px]">
          <div className="text-[13px] text-[#6B6B6B]">
            {t('channels', 'Channels')}
          </div>
          <div className="text-[28px] font-[600]">{channels.length}</div>
        </div>
        <div className="border border-[#E5E5E5] rounded-[12px] p-[16px]">
          <div className="text-[13px] text-[#6B6B6B]">
            {t('report_posts_published', 'Posts published')}
          </div>
          <div className="text-[28px] font-[600]">
            {postsLoading ? '…' : posts.length}
          </div>
        </div>
      </div>

      {integrationsLoading ? (
        <div className="flex justify-center py-[24px]">
          <LoadingComponent />
        </div>
      ) : !channels.length ? (
        <div className="text-[14px] text-[#6B6B6B]">
          {t(
            'report_no_channels',
            'This brand has no connected channels with analytics yet.'
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-[16px]">
          <div className="text-[18px] font-[600]">
            {t('report_results_by_channel', 'Results by channel')}
          </div>
          {channels.map((integration: any) => (
            <ChannelSection
              key={integration.id}
              integration={integration}
              days={days}
              postsCount={postsByChannel[integration.id]?.length || 0}
              onLoaded={markLoaded}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-[12px]">
        <div className="text-[18px] font-[600]">
          {t('report_published_posts', 'Published posts')}
        </div>
        {postsLoading ? (
          <div className="flex justify-center py-[16px]">
            <LoadingComponent />
          </div>
        ) : !posts.length ? (
          <div className="text-[14px] text-[#6B6B6B]">
            {t(
              'report_no_posts',
              'No posts were published in this period.'
            )}
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-start text-[#6B6B6B] border-b border-[#E5E5E5]">
                <th className="text-start font-[500] py-[8px] pe-[12px] whitespace-nowrap">
                  {t('date', 'Date')}
                </th>
                <th className="text-start font-[500] py-[8px] pe-[12px]">
                  {t('channel', 'Channel')}
                </th>
                <th className="text-start font-[500] py-[8px] pe-[12px]">
                  {t('post', 'Post')}
                </th>
                <th className="text-start font-[500] py-[8px]" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const text = stripHtmlValidation('none', post.content || '');
                return (
                  <tr
                    key={post.id}
                    className="border-b border-[#EFEFEF] break-inside-avoid align-top"
                  >
                    <td className="py-[8px] pe-[12px] whitespace-nowrap">
                      {dayjs.utc(post.publishDate).local().format('D MMM, h:mm A')}
                    </td>
                    <td className="py-[8px] pe-[12px]">
                      <div className="flex items-center gap-[6px]">
                        <img
                          src={`/icons/platforms/${post.integration.providerIdentifier}.png`}
                          className="w-[16px] h-[16px] rounded-[4px]"
                          alt=""
                        />
                        <span className="whitespace-nowrap">
                          {post.integration.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-[8px] pe-[12px] break-words">
                      {text.length > 160 ? text.slice(0, 160) + '…' : text}
                    </td>
                    <td className="py-[8px] whitespace-nowrap">
                      {!!post.releaseURL && (
                        <a
                          href={post.releaseURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#612BD3] underline"
                        >
                          {t('view_post', 'View post')}
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-[12px] text-[#9C9C9C] border-t border-[#E5E5E5] pt-[12px]">
        {t('report_made_on', 'Report made on {{date}}', {
          date: dayjs().format('D MMM YYYY, h:mm A'),
        })}
      </div>
    </div>
  );
};
