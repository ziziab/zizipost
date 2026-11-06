'use client';

import { uniqBy } from 'lodash';
import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import { Integrations } from '@gitroom/frontend/components/launches/calendar.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import clsx from 'clsx';
import { useClickOutside } from '@mantine/hooks';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useLaunchStore } from '@gitroom/frontend/components/new-launch/store';
import { useShallow } from 'zustand/react/shallow';
import { UserIcon, DropdownArrowIcon } from '@gitroom/frontend/components/ui/icons';
import { BrandLogo } from '@gitroom/frontend/components/brands/brand.logo';

export const SelectCustomer: FC<{
  onChange: (value: string) => void;
  integrations: Integrations[];
  customer?: string;
  list?: boolean;
  // calendar filter: always show once a brand exists, with an "All brands" choice
  allOption?: boolean;
}> = (props) => {
  const {
    onChange,
    integrations,
    customer: currentCustomer,
    list,
    allOption,
  } = props;
  const { setCurrent } = useLaunchStore(
    useShallow((state) => ({
      setCurrent: state.setCurrent,
    }))
  );
  const toaster = useToaster();
  const t = useT();
  const [customer, setCustomer] = useState(currentCustomer || '');
  const [pos, setPos] = useState<any>({});
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => {
    if (open) {
      setOpen(false);
    }
  });

  const openClose = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }

    const { x, y, width, height } = ref.current?.getBoundingClientRect();
    setPos({ top: y + height, left: x });
    setOpen(true);
  }, [open]);

  const totalCustomers = useMemo(() => {
    return uniqBy(integrations, (i) => i?.customer?.id).length;
  }, [integrations]);

  const selectCustomer = useCallback(
    (id: string) => () => {
      toaster.show(
        t('customer_socials_selected', 'Brand selected'),
        'success'
      );
      setCustomer(id);
      onChange(id);
      setOpen(false);
      setCurrent('global');
    },
    [onChange]
  );

  const customers = uniqBy(integrations, (u) => u?.customer?.name).filter(
    (f) => f.customer?.name
  );

  if (allOption ? !customers.length : totalCustomers <= 1) {
    return null;
  }

  const selectedCustomer = customers.find(
    (p) => p.customer?.id === customer
  )?.customer;

  const options = [
    ...(allOption
      ? [{ id: '', name: t('brand_all', 'All brands'), picture: '' }]
      : []),
    ...customers.map((p) => ({
      id: p.customer?.id || '',
      name: p.customer?.name || '',
      picture: p.customer?.picture || '',
    })),
  ];

  if (list) {
    return (
      <div className="flex flex-col gap-[8px] pb-[16px]">
        <div className="text-[14px] font-[600] text-textItemBlur">
          {t('customers', 'Brands')}
        </div>
        {options.map((p) => {
          const selected = (customer || '') === p.id;
          return (
            <div
              onClick={selectCustomer(p.id)}
              key={p.id || 'all'}
              className="min-h-[48px] flex items-center justify-between gap-[12px] cursor-pointer select-none"
            >
              <div className="flex items-center gap-[8px] min-w-0">
                {!!p.id && (
                  <BrandLogo name={p.name} picture={p.picture} size={24} />
                )}
                <div className="text-[14px] font-[600] truncate">{p.name}</div>
              </div>
              <div
                className={clsx(
                  'w-[24px] h-[24px] min-w-[24px] rounded-full border-[1.5px] flex justify-center items-center',
                  selected ? 'border-[#FC69FF]' : 'border-newTextColor/20'
                )}
              >
                {selected && (
                  <div className="w-[12px] h-[12px] rounded-full bg-[#FC69FF]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative select-none z-[500]" ref={ref}>
      <div
        data-tooltip-id="tooltip"
        data-tooltip-content={t('select_customer_tooltip', 'Select brand')}
        onClick={openClose}
        className={clsx(
          'relative z-[20] cursor-pointer h-[42px] rounded-[8px] pl-[16px] pr-[12px] gap-[8px] border flex items-center',
          open ? 'border-[#612BD3]' : 'border-newColColor'
        )}
      >
        {selectedCustomer ? (
          <div className="flex items-center gap-[8px] max-w-[180px]">
            <BrandLogo
              name={selectedCustomer.name || ''}
              picture={selectedCustomer.picture}
              size={24}
            />
            <div className="text-[14px] truncate">{selectedCustomer.name}</div>
          </div>
        ) : allOption ? (
          <div className="flex items-center gap-[8px]">
            <UserIcon />
            <div className="text-[14px]">{t('brand_all', 'All brands')}</div>
          </div>
        ) : (
          <div>
            <UserIcon />
          </div>
        )}
        <div>
          <DropdownArrowIcon rotated={open} />
        </div>
      </div>
      {open && (
        <div
          style={pos}
          className="flex flex-col fixed pt-[12px] bg-newBgColorInner menu-shadow min-w-[250px]"
        >
          <div className="text-[14px] font-[600] px-[12px] mb-[5px]">
            {t('customers', 'Brands')}
          </div>
          {options.map((p) => (
            <div
              onClick={selectCustomer(p.id)}
              key={p.id || 'all'}
              className="p-[12px] hover:bg-newBgColor text-[14px] font-[500] min-h-[44px] flex items-center gap-[8px]"
            >
              {!!p.id && (
                <BrandLogo name={p.name} picture={p.picture} size={24} />
              )}
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
