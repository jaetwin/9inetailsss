const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

export const isShopifyConfigured = Boolean(domain && token);

const endpoint = `https://${domain}/api/2024-10/graphql.json`;

async function shopifyFetch(query: string, variables = {}) {
  if (!isShopifyConfigured) return null;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await res.json();

  if (data.errors) {
    console.error('Shopify error:', data.errors);
    throw new Error('Shopify API error');
  }

  return data.data;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  images: {
    edges: { node: { url: string; altText: string | null } }[];
  };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: { amount: string; currencyCode: string };
        selectedOptions: { name: string; value: string }[];
      };
    }[];
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

const GET_ALL_PRODUCTS = `
  query GetAllProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 5) {
            edges { node { url altText } }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                price { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_CREATE = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors { field message }
    }
  }
`;

// ─── Exports ────────────────────────────────────────────────────────────────

export async function fetchProducts(count = 6): Promise<ShopifyProduct[]> {
  try {
    const data = await shopifyFetch(GET_ALL_PRODUCTS, { first: count });
    if (!data) return [];
    return data.products.edges.map((e: { node: ShopifyProduct }) => e.node);
  } catch {
    return [];
  }
}

export async function createShopifyCheckout(
  lines: { variantId: string; quantity: number }[],
): Promise<string | null> {
  try {
    const data = await shopifyFetch(CART_CREATE, {
      input: { lines: lines.map(l => ({ merchandiseId: l.variantId, quantity: l.quantity })) },
    });
    if (!data) return null;
    const { cart, userErrors } = data.cartCreate;
    if (userErrors?.length) {
      console.error('Shopify cart errors:', userErrors);
      return null;
    }
    return cart?.checkoutUrl ?? null;
  } catch {
    return null;
  }
}
