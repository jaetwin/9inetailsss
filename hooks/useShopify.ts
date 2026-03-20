import { useState, useEffect } from 'react';
import { shopifyClient, GET_ALL_PRODUCTS, GET_PRODUCT_BY_HANDLE } from '@/lib/shopify';

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  images: { edges: { node: { url: string; altText: string | null } }[] };
  variants: { edges: { node: ProductVariant }[] };
}

export function useProducts(count = 24) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    shopifyClient
      .request(GET_ALL_PRODUCTS, { variables: { first: count } })
      .then(({ data, errors }) => {
        if (errors) throw new Error(errors.message);
        setProducts(data.products.edges.map((e: { node: Product }) => e.node));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [count]);

  return { products, loading, error };
}

export function useProduct(handle: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    shopifyClient
      .request(GET_PRODUCT_BY_HANDLE, { variables: { handle } })
      .then(({ data, errors }) => {
        if (errors) throw new Error(errors.message);
        setProduct(data.productByHandle);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [handle]);

  return { product, loading, error };
}
