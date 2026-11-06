export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { PrintReport } from '@gitroom/frontend/components/reports/print.report';

export const metadata: Metadata = {
  title: 'Social media report',
  description: '',
};

export default async function Index() {
  return <PrintReport />;
}
