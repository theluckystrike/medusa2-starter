import cachified from '@epic-web/cachified';
import { sdk, sdkCache } from '@libs/util/server/client.server';
import { HttpTypes } from '@medusajs/types';
import { MILLIS } from './cache-builder.server';
import { getSelectedRegion } from './data/regions.server';

// Same page size the Medusa store API uses when no limit is sent.
export const PRODUCTS_PAGE_SIZE = 50;

// Reads the `page` search param written by the pagination links and turns it into limit/offset.
export const getProductsPaginationParams = (request: Request, limit = PRODUCTS_PAGE_SIZE) => {
  const page = Number.parseInt(new URL(request.url).searchParams.get('page') ?? '', 10);
  const offset = Number.isInteger(page) && page > 1 ? (page - 1) * limit : 0;

  return { limit, offset };
};

export const fetchProducts = async (request: Request, { ...query }: HttpTypes.StoreProductListParams = {}) => {
  const region = await getSelectedRegion(request.headers);

  return await cachified({
    key: `products-${JSON.stringify(query)}`,
    cache: sdkCache,
    staleWhileRevalidate: MILLIS.ONE_HOUR,
    ttl: MILLIS.TEN_SECONDS,
    async getFreshValue() {
      return await sdk.store.product.list({
        ...query,
        region_id: region.id,
      });
    },
  });
};
