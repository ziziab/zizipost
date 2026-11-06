'use client';

import { useEffect, useRef } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// "Connect a new channel" on the Brands page: the channel connects through
// the provider's sign-in and comes back to the calendar, so we remember the
// brand here and put the new channel in it when it arrives.
const PENDING_BRAND_KEY = 'pending_brand_for_new_channel';
const PENDING_BRAND_TTL = 15 * 60 * 1000;

interface PendingBrand {
  brandId: string;
  knownIds: string[];
  at: number;
}

export const rememberBrandForNewChannel = (
  brandId: string,
  knownIds: string[]
) => {
  try {
    localStorage.setItem(
      PENDING_BRAND_KEY,
      JSON.stringify({ brandId, knownIds, at: Date.now() })
    );
  } catch (e) {
    // no storage: the channel just stays without a brand
  }
};

export const forgetBrandForNewChannel = () => {
  try {
    localStorage.removeItem(PENDING_BRAND_KEY);
  } catch (e) {
    // nothing to clear
  }
};

const readPendingBrand = (): PendingBrand | null => {
  try {
    const pending = JSON.parse(
      localStorage.getItem(PENDING_BRAND_KEY) || 'null'
    );
    if (!pending?.brandId || Date.now() - pending.at > PENDING_BRAND_TTL) {
      forgetBrandForNewChannel();
      return null;
    }
    return pending;
  } catch (e) {
    return null;
  }
};

export const useAssignPendingBrand = (
  integrations: any[] | undefined,
  addedProvider: string | null,
  mutate: () => void
) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const running = useRef(false);

  useEffect(() => {
    // a popup closes itself right away, the main window handles it
    if (
      !addedProvider ||
      !integrations?.length ||
      running.current ||
      (typeof window !== 'undefined' && window.opener)
    ) {
      return;
    }
    const pending = readPendingBrand();
    if (!pending) {
      return;
    }
    const fresh = integrations.filter(
      (p) =>
        p.identifier === addedProvider &&
        !pending.knownIds.includes(p.id) &&
        !p.customer?.id
    );
    if (!fresh.length) {
      return;
    }
    running.current = true;
    (async () => {
      let saved = 0;
      for (const integration of fresh) {
        const response = await fetch(`/integrations/${integration.id}/group`, {
          method: 'PUT',
          body: JSON.stringify({ group: pending.brandId }),
        });
        if (response.ok) {
          saved++;
        }
      }
      forgetBrandForNewChannel();
      running.current = false;
      if (!saved) {
        toaster.show(
          t('could_not_save_group', 'Could not save the brand.'),
          'warning'
        );
        return;
      }
      toaster.show(
        t('brand_channel_added', 'New channel added to your brand'),
        'success'
      );
      mutate();
    })();
  }, [integrations, addedProvider, mutate]);
};
