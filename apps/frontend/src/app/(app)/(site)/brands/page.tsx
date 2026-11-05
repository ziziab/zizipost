export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { BrandsComponent } from '@gitroom/frontend/components/brands/brands.component';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'ZiziPost' : 'Gitroom'} Brands`,
  description: '',
};
export default async function Index() {
  return <BrandsComponent />;
}
