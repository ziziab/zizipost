'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

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
