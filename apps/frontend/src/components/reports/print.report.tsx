'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@gitroom/react/form/button';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import {
  ReportDocument,
  reportPeriods,
} from '@gitroom/frontend/components/reports/report.document';

export const PrintReport = () => {
  const t = useT();
  const search = useSearchParams();
  const brandId = search.get('brand') || '';
  const days = reportPeriods.includes(+search.get('days')!)
    ? +search.get('days')!
    : 30;
  const [ready, setReady] = useState(false);

  // Open the browser "Save as PDF" window once all numbers are loaded,
  // leaving a moment for the charts to finish drawing
  const printed = useRef(false);
  const onReady = useCallback(() => {
    setReady(true);
    if (printed.current) {
      return;
    }
    printed.current = true;
    setTimeout(() => window.print(), 1200);
  }, []);

  // A slow channel should not block the download forever
  useEffect(() => {
    const timeout = setTimeout(onReady, 30000);
    return () => clearTimeout(timeout);
  }, [onReady]);

  return (
    <div className="max-w-[900px] mx-auto p-[24px] print:p-0 print:max-w-none">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, html body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="flex items-center gap-[12px] mb-[16px] print:hidden">
        <div className="flex-1 text-[14px] text-[#6B6B6B]">
          {ready
            ? t(
                'report_print_hint',
                'In the print window, choose "Save as PDF" as the printer.'
              )
            : t('report_loading', 'Loading the report...')}
        </div>
        <Button disabled={!ready} onClick={() => window.print()}>
          {t('download_pdf', 'Download PDF')}
        </Button>
      </div>
      <ReportDocument brandId={brandId} days={days} onReady={onReady} />
    </div>
  );
};
