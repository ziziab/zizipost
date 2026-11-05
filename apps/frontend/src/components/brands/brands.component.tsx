'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { orderBy } from 'lodash';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import SafeImage from '@gitroom/react/helpers/safe.image';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

interface Brand {
  id: string;
  name: string;
}

const useBrands = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/integrations/customers')).json();
  }, []);
  return useSWR<Brand[]>('/customers', load, { fallbackData: [] });
};

const ChannelAvatar: FC<{ integration: any }> = ({ integration }) => {
  return (
    <div
      className={clsx(
        'relative rounded-full flex justify-center items-center min-w-[36px]',
        integration.disabled && 'opacity-50'
      )}
    >
      <ImageWithFallback
        fallbackSrc={`/icons/platforms/${integration.identifier}.png`}
        src={integration.picture}
        className="rounded-[8px]"
        alt={integration.identifier}
        width={36}
        height={36}
      />
      <SafeImage
        src={`/icons/platforms/${integration.identifier}.png`}
        className="rounded-[8px] absolute z-10 bottom-[-5px] -end-[5px] border border-fifth"
        alt={integration.identifier}
        width={18.41}
        height={18.41}
      />
    </div>
  );
};

const BrandCard: FC<{
  brand: Brand;
  channels: any[];
  onSaved: () => void;
}> = ({ brand, channels, onSaved }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);

  const save = useCallback(async () => {
    if (!name.trim()) {
      return;
    }
    const response = await fetch(`/integrations/customers/${brand.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!response.ok) {
      const { message } = await response.json().catch(() => ({} as any));
      toaster.show(
        (Array.isArray(message) ? message[0] : message) ||
          t('could_not_save_group', 'Could not save the brand.'),
        'warning'
      );
      return;
    }
    toaster.show(t('group_updated', 'Brand updated'), 'success');
    setEditing(false);
    onSaved();
  }, [name, brand.id, onSaved]);

  return (
    <div className="bg-newBgColorInner border border-newTableBorder rounded-[8px] p-[16px] flex flex-col gap-[12px]">
      <div className="flex items-center gap-[8px]">
        {editing ? (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-newBgColorInner h-[42px] border-newTableBorder border rounded-[8px] text-textColor px-[16px] text-[14px] outline-none"
            />
            <Button onClick={save} disabled={!name.trim()}>
              {t('save', 'Save')}
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 text-[16px] font-[600] truncate">
              {brand.name}
            </div>
            <div
              onClick={() => setEditing(true)}
              className="text-[13px] text-textItemBlur hover:text-textColor cursor-pointer"
            >
              {t('brand_rename', 'Rename')}
            </div>
          </>
        )}
      </div>
      {channels.length ? (
        <div className="flex flex-wrap gap-[12px]">
          {channels.map((integration) => (
            <div key={integration.id} className="flex items-center gap-[8px]">
              <ChannelAvatar integration={integration} />
              <div className="text-[14px] max-w-[140px] truncate">
                {integration.name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-textItemBlur">
          {t('brand_no_channels', 'No channels in this brand yet.')}
        </div>
      )}
    </div>
  );
};

const ChannelRow: FC<{
  integration: any;
  onSaved: () => void;
}> = ({ integration, onSaved }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const [brand, setBrand] = useState<string>(
    integration.customer?.name || ''
  );
  const changed = brand.trim() !== (integration.customer?.name || '');

  const save = useCallback(async () => {
    const response = await fetch(
      `/integrations/${integration.id}/customer-name`,
      {
        method: 'PUT',
        body: JSON.stringify({ name: brand.trim() }),
      }
    );
    if (!response.ok) {
      toaster.show(
        t('could_not_save_group', 'Could not save the brand.'),
        'warning'
      );
      return;
    }
    toaster.show(t('customer_updated', 'Brand updated'), 'success');
    onSaved();
  }, [brand, integration.id, onSaved]);

  return (
    <div className="flex items-center gap-[12px] py-[10px] border-b border-newTableBorder last:border-b-0">
      <ChannelAvatar integration={integration} />
      <div className="flex-1 min-w-0 text-[14px] truncate">
        {integration.name}
      </div>
      <input
        list="brand-name-options"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder={t('brand_none', 'No brand')}
        autoComplete="off"
        className="w-[220px] max-w-[45%] bg-newBgColorInner h-[42px] border-newTableBorder border rounded-[8px] text-textColor placeholder-textColor px-[16px] text-[14px] outline-none"
      />
      <Button onClick={save} disabled={!changed}>
        {t('save', 'Save')}
      </Button>
    </div>
  );
};

export const BrandsComponent = () => {
  const t = useT();
  const { data: integrations, isLoading, mutate } = useIntegrationList();
  const { data: brands, mutate: mutateBrands } = useBrands();

  const refresh = useCallback(() => {
    mutate();
    mutateBrands();
  }, [mutate, mutateBrands]);

  const channels = useMemo(
    () => orderBy(integrations || [], ['identifier', 'name'], ['asc', 'asc']),
    [integrations]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[24px] overflow-auto">
      <div className="flex flex-col gap-[6px]">
        <h3 className="text-[20px] font-[600]">{t('customers', 'Brands')}</h3>
        <div className="text-[14px] text-textItemBlur max-w-[720px]">
          {t(
            'brands_page_help',
            'A brand keeps one business\'s channels together. To create a brand, type a new brand name next to a channel below and click Save. Once you have two or more brands, switch between them with the brand picker at the top of the calendar.'
          )}
        </div>
      </div>

      {!!brands?.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px]">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id + brand.name}
              brand={brand}
              channels={channels.filter(
                (p: any) => p.customer?.id === brand.id
              )}
              onSaved={refresh}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-[6px]">
        <h3 className="text-[16px] font-[600]">
          {t('brand_channels_title', 'Channels and their brand')}
        </h3>
        {!channels.length ? (
          <div className="text-[14px] text-textItemBlur">
            {t(
              'brand_add_channel_first',
              'Add a channel from the calendar first, then come back to put it in a brand.'
            )}
          </div>
        ) : (
          <div className="border border-newTableBorder rounded-[8px] px-[16px]">
            {channels.map((integration: any) => (
              <ChannelRow
                key={integration.id + (integration.customer?.name || '')}
                integration={integration}
                onSaved={refresh}
              />
            ))}
          </div>
        )}
        <datalist id="brand-name-options">
          {(brands || []).map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
      </div>
    </div>
  );
};
