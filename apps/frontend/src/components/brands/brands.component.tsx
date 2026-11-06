'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { groupBy, orderBy, uniqBy } from 'lodash';
import clsx from 'clsx';
import { useClickOutside } from '@mantine/hooks';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import ImageWithFallback from '@gitroom/react/helpers/image.with.fallback';
import SafeImage from '@gitroom/react/helpers/safe.image';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { showMediaBox } from '@gitroom/frontend/components/media/media.component';
import { useAddProvider } from '@gitroom/frontend/components/launches/add.provider.component';
import { DropdownArrowIcon } from '@gitroom/frontend/components/ui/icons';
import { BrandLogo } from '@gitroom/frontend/components/brands/brand.logo';
import {
  forgetBrandForNewChannel,
  rememberBrandForNewChannel,
} from '@gitroom/frontend/components/brands/use.assign.pending.brand';

export interface Brand {
  id: string;
  name: string;
  picture?: string | null;
}

export const useBrands = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/integrations/customers')).json();
  }, []);
  return useSWR<Brand[]>('/customers', load, { fallbackData: [] });
};

const useProviders = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/integrations')).json();
  }, []);
  return useSWR<{ social: { identifier: string; name: string }[] }>(
    '/integrations-providers',
    load
  );
};

const PlatformIcons: FC<{ channels: any[] }> = ({ channels }) => {
  const identifiers = uniqBy(channels, 'identifier').map((p) => p.identifier);
  if (!identifiers.length) {
    return null;
  }
  return (
    <div className="flex gap-[4px]">
      {identifiers.map((identifier) => (
        <img
          key={identifier}
          src={`/icons/platforms/${identifier}.png`}
          alt={identifier}
          className="w-[16px] h-[16px] rounded-[4px]"
        />
      ))}
    </div>
  );
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

const showSaveError = async (
  response: Response,
  toaster: ReturnType<typeof useToaster>,
  fallback: string
) => {
  const { message } = await response.json().catch(() => ({} as any));
  toaster.show(
    (Array.isArray(message) ? message[0] : message) || fallback,
    'warning'
  );
};

const NewBrandModal: FC<{
  close: () => void;
  onCreated: (brand: Brand) => void;
}> = ({ close, onCreated }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!name.trim() || saving) {
      return;
    }
    setSaving(true);
    const response = await fetch('/integrations/customers', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!response.ok) {
      await showSaveError(
        response,
        toaster,
        t('could_not_save_group', 'Could not save the brand.')
      );
      return;
    }
    toaster.show(t('brand_created', 'Brand created'), 'success');
    onCreated(await response.json());
    close();
  }, [name, saving, onCreated, close]);

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <label htmlFor="new-brand-name" className="text-[14px]">
          {t('group_name', 'Brand name')}
        </label>
        <input
          id="new-brand-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder={t('brand_name_example', 'For example: Meera Yoga')}
          autoComplete="off"
          className="bg-newBgColorInner h-[42px] border-newTableBorder border rounded-[8px] text-textColor placeholder-textColor px-[16px] text-[14px] outline-none"
        />
        <div className="text-[13px] text-textItemBlur">
          {t(
            'brand_new_next',
            'Next you can add a logo and connect its channels.'
          )}
        </div>
      </div>
      <div>
        <Button onClick={save} disabled={!name.trim()} loading={saving}>
          {t('brand_create_button', 'Create brand')}
        </Button>
      </div>
    </div>
  );
};

const BrandDropdown: FC<{
  brands: Brand[];
  channels: any[];
  selected: Brand;
  onSelect: (id: string) => void;
}> = ({ brands, channels, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const row = (brand: Brand) => (
    <div className="flex items-center gap-[12px] min-w-0">
      <BrandLogo name={brand.name} picture={brand.picture} size={40} />
      <div className="flex flex-col gap-[4px] min-w-0">
        <div className="text-[14px] font-[600] truncate">{brand.name}</div>
        <PlatformIcons
          channels={channels.filter((p) => p.customer?.id === brand.id)}
        />
      </div>
    </div>
  );

  return (
    <div className="relative w-[420px] max-w-full select-none" ref={ref}>
      <div
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center justify-between gap-[12px] px-[16px] py-[10px] rounded-[8px] border cursor-pointer bg-newBgColorInner',
          open ? 'border-[#612BD3]' : 'border-newTableBorder'
        )}
      >
        {row(selected)}
        <DropdownArrowIcon rotated={open} />
      </div>
      {open && (
        <div className="absolute z-[50] top-[100%] mt-[4px] start-0 w-full bg-newBgColorInner border border-newTableBorder rounded-[8px] menu-shadow max-h-[360px] overflow-auto">
          {brands.map((brand) => (
            <div
              key={brand.id}
              onClick={() => {
                onSelect(brand.id);
                setOpen(false);
              }}
              className={clsx(
                'px-[16px] py-[10px] cursor-pointer hover:bg-newBgColor',
                brand.id === selected.id && 'bg-newBgColor'
              )}
            >
              {row(brand)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BrandSettingsTab: FC<{
  brand: Brand;
  channels: any[];
  onSaved: () => void;
}> = ({ brand, channels, onSaved }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const [name, setName] = useState(brand.name);
  const [picture, setPicture] = useState<string>(brand.picture || '');
  const [saving, setSaving] = useState(false);
  const changed =
    name.trim() !== brand.name || picture !== (brand.picture || '');

  const channelPictures = useMemo(
    () =>
      uniqBy(
        channels.filter(
          (p) => p.picture && !p.picture.includes('no-picture')
        ),
        'picture'
      ).map((p) => p.picture as string),
    [channels]
  );

  const upload = useCallback(() => {
    showMediaBox((media) => {
      if (media?.path) {
        setPicture(media.path);
      }
    });
  }, []);

  const save = useCallback(async () => {
    if (!name.trim()) {
      return;
    }
    setSaving(true);
    const response = await fetch(`/integrations/customers/${brand.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: name.trim(), picture }),
    });
    setSaving(false);
    if (!response.ok) {
      await showSaveError(
        response,
        toaster,
        t('could_not_save_group', 'Could not save the brand.')
      );
      return;
    }
    toaster.show(t('group_updated', 'Brand updated'), 'success');
    onSaved();
  }, [name, picture, brand.id, onSaved]);

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[4px]">
        <div className="text-[16px] font-[600]">
          {t('brand_identity', 'Brand identity')}
        </div>
        <div className="text-[13px] text-textItemBlur">
          {t(
            'brand_identity_help',
            'The name and logo that show this brand everywhere in ZIZIPOST.'
          )}
        </div>
      </div>
      <div className="flex flex-col gap-[6px] max-w-[460px]">
        <label htmlFor="brand-name" className="text-[14px]">
          {t('group_name', 'Brand name')}
        </label>
        <input
          id="brand-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          className="bg-newBgColorInner h-[42px] border-newTableBorder border rounded-[8px] text-textColor px-[16px] text-[14px] outline-none"
        />
      </div>
      <div className="flex flex-col gap-[12px] border border-newTableBorder rounded-[8px] p-[16px]">
        <div className="flex items-center gap-[16px] flex-wrap">
          <BrandLogo name={name} picture={picture} size={64} />
          <Button secondary={true} onClick={upload}>
            {t('brand_upload_image', 'Upload image')}
          </Button>
          {!!picture && (
            <div
              onClick={() => setPicture('')}
              className="text-[13px] text-textItemBlur hover:text-textColor cursor-pointer"
            >
              {t('brand_remove_logo', 'Remove')}
            </div>
          )}
        </div>
        {!!channelPictures.length && (
          <div className="flex flex-col gap-[8px]">
            <div className="text-[13px] text-textItemBlur">
              {t(
                'brand_pick_from_channels',
                'Or use the picture from one of its channels'
              )}
            </div>
            <div className="flex gap-[8px] flex-wrap">
              {channelPictures.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  onClick={() => setPicture(src)}
                  className={clsx(
                    'w-[40px] h-[40px] rounded-full object-cover cursor-pointer border-2',
                    picture === src ? 'border-[#612BD3]' : 'border-transparent'
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div>
        <Button
          onClick={save}
          disabled={!changed || !name.trim()}
          loading={saving}
        >
          {t('brand_save_changes', 'Save changes')}
        </Button>
      </div>
    </div>
  );
};

const ConnectionsTab: FC<{
  brand: Brand;
  channels: any[];
  onSaved: () => void;
}> = ({ brand, channels, onSaved }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const { data: providers } = useProviders();
  const addProvider = useAddProvider(onSaved);

  const providerName = useCallback(
    (identifier: string) =>
      providers?.social?.find((p) => p.identifier === identifier)?.name ||
      identifier,
    [providers]
  );

  const byPlatform = useMemo(
    () =>
      orderBy(
        Object.entries(groupBy(channels, 'identifier')),
        [([identifier]) => identifier],
        ['asc']
      ),
    [channels]
  );

  const setBrand = useCallback(
    (integration: any, group: string) => async () => {
      const response = await fetch(`/integrations/${integration.id}/group`, {
        method: 'PUT',
        body: JSON.stringify({ group }),
      });
      if (!response.ok) {
        toaster.show(
          t('could_not_save_group', 'Could not save the brand.'),
          'warning'
        );
        return;
      }
      toaster.show(t('customer_updated', 'Brand updated'), 'success');
      onSaved();
    },
    [onSaved]
  );

  const connectNew = useCallback(() => {
    rememberBrandForNewChannel(
      brand.id,
      channels.map((p) => p.id)
    );
    addProvider();
  }, [brand, channels, addProvider]);

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[16px] flex-wrap">
        <div className="flex-1 text-[13px] text-textItemBlur min-w-[240px]">
          {t(
            'brand_connections_help',
            'Channels in this brand. Add a channel you already connected, or connect a new one and it goes straight into this brand.'
          )}
        </div>
        <Button onClick={connectNew}>
          {t('brand_connect_new', '+ Connect a new channel')}
        </Button>
      </div>
      {!byPlatform.length ? (
        <div className="text-[14px] text-textItemBlur">
          {t(
            'brand_add_channel_first',
            'Add a channel from the calendar first, then come back to put it in a brand.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px]">
          {byPlatform.map(([identifier, list]) => (
            <div
              key={identifier}
              className="border border-newTableBorder rounded-[8px] p-[16px] flex flex-col gap-[12px]"
            >
              <div className="flex items-center gap-[8px]">
                <img
                  src={`/icons/platforms/${identifier}.png`}
                  alt={identifier}
                  className="w-[20px] h-[20px] rounded-[4px]"
                />
                <div className="text-[14px] font-[600]">
                  {providerName(identifier)}
                </div>
              </div>
              {list.map((integration: any) => {
                const inBrand = integration.customer?.id === brand.id;
                return (
                  <div
                    key={integration.id}
                    className={clsx(
                      'flex items-center gap-[10px] rounded-[8px] px-[12px] py-[8px] border',
                      inBrand
                        ? 'border-newTableBorder'
                        : 'border-dashed border-newTableBorder opacity-80'
                    )}
                  >
                    <ChannelAvatar integration={integration} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] truncate">
                        {integration.name}
                      </div>
                      {!inBrand && (
                        <div className="text-[12px] text-textItemBlur truncate">
                          {integration.customer?.name
                            ? t('brand_now_in', 'Now in') +
                              ' ' +
                              integration.customer.name
                            : t('brand_none', 'No brand')}
                        </div>
                      )}
                    </div>
                    {inBrand ? (
                      <div
                        onClick={setBrand(integration, '')}
                        data-tooltip-id="tooltip"
                        data-tooltip-content={t(
                          'remove_from_customer',
                          'Remove from brand'
                        )}
                        className="text-[18px] leading-none px-[6px] text-textItemBlur hover:text-textColor cursor-pointer"
                      >
                        ×
                      </div>
                    ) : (
                      <div
                        onClick={setBrand(integration, brand.id)}
                        className="text-[13px] font-[600] text-[#612BD3] hover:opacity-80 cursor-pointer whitespace-nowrap"
                      >
                        {t('brand_add_here', '+ Add')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const BrandsComponent = () => {
  const t = useT();
  const modals = useModals();
  const { data: integrations, isLoading, mutate } = useIntegrationList();
  const { data: brands, mutate: mutateBrands } = useBrands();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'settings' | 'connections'>('connections');

  // back on this page without finishing a connection: drop the old request
  useEffect(() => {
    forgetBrandForNewChannel();
  }, []);

  const refresh = useCallback(() => {
    mutate();
    mutateBrands();
  }, [mutate, mutateBrands]);

  const channels = useMemo(
    () => orderBy(integrations || [], ['identifier', 'name'], ['asc', 'asc']),
    [integrations]
  );

  const sortedBrands = useMemo(
    () => orderBy(brands || [], [(p) => p.name.toLowerCase()], ['asc']),
    [brands]
  );

  const selected =
    sortedBrands.find((p) => p.id === selectedId) || sortedBrands[0];

  const newBrand = useCallback(() => {
    modals.openModal({
      title: t('brand_new', 'New brand'),
      children: (close) => (
        <NewBrandModal
          close={close}
          onCreated={(brand) => {
            setSelectedId(brand.id);
            setTab('connections');
            mutateBrands();
          }}
        />
      ),
    });
  }, [mutateBrands]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="bg-newBgColorInner p-[20px] flex flex-1 flex-col gap-[20px] overflow-auto">
      <div className="flex flex-col gap-[6px]">
        <h3 className="text-[20px] font-[600]">{t('customers', 'Brands')}</h3>
        <div className="text-[14px] text-textItemBlur max-w-[720px]">
          {t(
            'brands_page_help_v2',
            "A brand keeps one business's channels together, like the Facebook, Instagram and YouTube of the same shop. Switch between brands at the top of the calendar."
          )}
        </div>
      </div>

      <div className="border border-newTableBorder rounded-[8px] p-[16px] flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <div className="text-[16px] font-[600]">{t('customers', 'Brands')}</div>
          <div className="text-[13px] text-textItemBlur">
            {sortedBrands.length}
          </div>
          <div className="flex-1" />
          <Button onClick={newBrand}>
            {t('brand_new_button', '+ New brand')}
          </Button>
        </div>
        {!selected ? (
          <div className="text-[14px] text-textItemBlur">
            {t(
              'brand_empty_text',
              'No brands yet. Create your first brand, for example your business name, then put its channels in it.'
            )}
          </div>
        ) : (
          <BrandDropdown
            brands={sortedBrands}
            channels={channels}
            selected={selected}
            onSelect={setSelectedId}
          />
        )}
      </div>

      {!!selected && (
        <>
          <div className="flex gap-[24px] border-b border-newTableBorder">
            {(
              [
                ['connections', t('brand_tab_connections', 'Connections')],
                ['settings', t('brand_tab_settings', 'Brand settings')],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                onClick={() => setTab(key)}
                className={clsx(
                  'pb-[10px] text-[14px] cursor-pointer -mb-[1px] border-b-2',
                  tab === key
                    ? 'border-[#612BD3] font-[600]'
                    : 'border-transparent text-textItemBlur hover:text-textColor'
                )}
              >
                {label}
              </div>
            ))}
          </div>
          {tab === 'settings' ? (
            <BrandSettingsTab
              key={selected.id + selected.name + (selected.picture || '')}
              brand={selected}
              channels={channels.filter(
                (p: any) => p.customer?.id === selected.id
              )}
              onSaved={refresh}
            />
          ) : (
            <ConnectionsTab
              brand={selected}
              channels={channels}
              onSaved={refresh}
            />
          )}
        </>
      )}
    </div>
  );
};
