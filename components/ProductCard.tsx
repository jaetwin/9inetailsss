import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/CartContext';
import { formatPrice } from '@/lib/shopify';
import type { Product } from '@/hooks/useShopify';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { addToCart, loading } = useCart();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const variants = product.variants.edges.map(e => e.node);
  const selected = variants[selectedIdx];
  const images = product.images.edges.map(e => e.node);
  const primaryImage = images[0];
  const hoverImage = images[1] ?? images[0];

  const price = selected
    ? formatPrice(selected.price.amount, selected.price.currencyCode)
    : formatPrice(
        product.priceRange.minVariantPrice.amount,
        product.priceRange.minVariantPrice.currencyCode,
      );

  // Determine if this product has size/colour options worth showing
  const hasOptions = variants.length > 1;

  return (
    <article className="group flex flex-col bg-black border border-white/10 rounded-sm hover:border-white/30 transition-all duration-300">
      {/* Image */}
      <div
        className="relative aspect-[3/4] overflow-hidden cursor-pointer"
        onClick={() => navigate(`/product/${product.handle}`)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {primaryImage ? (
          <>
            <img
              src={primaryImage.url}
              alt={primaryImage.altText ?? product.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                hovered && hoverImage !== primaryImage ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {hoverImage && hoverImage !== primaryImage && (
              <img
                src={hoverImage.url}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  hovered ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-xs tracking-widest">
            NO IMAGE
          </div>
        )}

        {/* Sold out badge */}
        {selected && !selected.availableForSale && (
          <div className="absolute top-3 left-3 bg-black/80 text-white/60 text-[10px] font-cinzel tracking-widest px-2 py-1 border border-white/20">
            SOLD OUT
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3
            className="font-cinzel text-white text-sm tracking-wide cursor-pointer hover:text-white/70 transition-colors leading-snug"
            onClick={() => navigate(`/product/${product.handle}`)}
          >
            {product.title}
          </h3>
          <p className="font-mono text-white/60 text-sm mt-1">{price}</p>
        </div>

        {/* Variant selector */}
        {hasOptions && (
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedIdx(i)}
                disabled={!v.availableForSale}
                title={v.title}
                className={`px-2 py-1 text-[10px] font-cinzel tracking-wider border rounded-sm transition-all ${
                  i === selectedIdx
                    ? 'border-white bg-white text-black'
                    : 'border-white/20 text-white/50 hover:border-white/50 hover:text-white'
                } disabled:opacity-25 disabled:cursor-not-allowed disabled:line-through`}
              >
                {v.title}
              </button>
            ))}
          </div>
        )}

        {/* Add to cart */}
        <button
          onClick={() => selected && addToCart(selected.id)}
          disabled={loading || !selected?.availableForSale}
          className="mt-auto flex items-center justify-center gap-2 py-2.5 border border-white/20 text-white/70 text-xs font-cinzel tracking-[0.15em] hover:bg-white hover:text-black hover:border-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={13} />
          {!selected?.availableForSale ? 'SOLD OUT' : loading ? '...' : 'ADD TO CART'}
        </button>
      </div>
    </article>
  );
}
