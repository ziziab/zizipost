'use client';

import { useCallback, useState } from 'react';
import { Select } from '@gitroom/react/form/select';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useBrands } from '@gitroom/frontend/components/brands/brands.component';
import { ReportDocument } from '@gitroom/frontend/components/reports/report.document';

export const reportPeriods = [7, 30];

export const ReportsComponent = () => {
  const t = useT();
  const { data: brands } = useBrands();
  const [brandId, setBrandId] = useState('');
  const [days, setDays] = useState(30);

  const download = useCallback(() => {
    const params = new URLSearchParams({
      days: String(days),
      ...(brandId ? { brand: brandId } : {}),
    });
    window.open(`/print-report?${params.toString()}`, '_blank');
  }, [brandId, days]);

  return (
    <div className="bg-newBgColorInner flex-1 flex flex-col p-[20px] mobile:p-[12px] gap-[16px]">
      <div className="flex flex-wrap items-end gap-[12px]">
        <div className="flex flex-col gap-[6px]">
          <div className="text-[14px]">{t('brand', 'Brand')}</div>
          <div className="min-w-[220px]">
            <Select
              label=""
              name="brand"
              disableForm={true}
              hideErrors={true}
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">{t('all_channels', 'All channels')}</option>
              {(brands || []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-[6px]">
          <div className="text-[14px]">{t('period', 'Period')}</div>
          <div className="min-w-[160px]">
            <Select
              label=""
              name="days"
              disableForm={true}
              hideErrors={true}
              value={days}
              onChange={(e) => setDays(+e.target.value)}
            >
              {reportPeriods.map((period) => (
                <option key={period} value={period}>
                  {t('report_last_days', 'Last {{days}} days', {
                    days: period,
                  })}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex-1" />
        <Button onClick={download}>
          {t('download_pdf', 'Download PDF')}
        </Button>
      </div>
      <div className="max-w-[900px] w-full mx-auto">
        <ReportDocument key={`${brandId}-${days}`} brandId={brandId} days={days} />
      </div>
    </div>
  );
};
