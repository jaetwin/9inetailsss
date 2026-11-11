// The catalogue seed. The server copies this into the database on first boot;
// after that the database (and /admin) is the source of truth. The types and
// shipping rules here are also imported by the API and the admin screen.

export type Category = 'tees' | 'hoodies' | 'outerwear' | 'bottoms' | 'accessories'

export const CATEGORY_KEYS: Category[] = ['tees', 'hoodies', 'outerwear', 'bottoms', 'accessories']

export const CATEGORY_LABELS: Record<Category, string> = {
  tees: 'Tees',
  hoodies: 'Hoodies',
  outerwear: 'Outerwear',
  bottoms: 'Bottoms',
  accessories: 'Accessories',
}

export const SHIPPING_COUNTRIES = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'JP']

export interface Product {
  slug: string
  name: string
  price: number
  compareAt?: number
  category: Category
  image: string
  badge?: 'New' | 'Bestseller' | 'Low stock'
  short: string
  description: string
  details: string[]
  materials: string
  options?: { name: string; values: string[] }
  defaultOption?: string
  featured?: boolean
  published?: boolean
}

const sizes = ['S', 'M', 'L', 'XL', 'XXL']

export const products: Product[] = [
  {
    slug: 'crown-of-thorns-hoodie',
    name: 'Crown of Thorns hoodie',
    price: 64,
    category: 'hoodies',
    image: '',
    badge: 'Bestseller',
    short: 'Heavyweight fleece',
    description:
      'The weight of the crown, worn. Heavyweight fleece with a double-lined hood and the mark printed small at the chest.',
    details: ['450 gsm brushed fleece', 'Double-lined hood', 'Made to order, ships in 5 to 10 days'],
    materials: 'Cotton and recycled polyester fleece. Cold wash, dry low.',
    options: { name: 'Size', values: sizes },
    defaultOption: 'M',
    featured: true,
  },
  {
    slug: 'rekoe-tee',
    name: 'R.E.K.O.E. tee',
    price: 25,
    category: 'tees',
    image: '',
    short: 'Heavyweight cotton',
    description:
      'Boxy heavyweight tee with a ribbed collar that holds its shape. The wordmark sits small, front and centre.',
    details: ['240 gsm combed cotton', 'Boxy fit, dropped shoulder', 'Made to order, ships in 5 to 10 days'],
    materials: '100% combed cotton. Cold wash inside out, hang dry.',
    options: { name: 'Size', values: sizes },
    defaultOption: 'M',
    featured: true,
  },
  {
    slug: 'dry-bones-thermal',
    name: 'Dry Bones thermal',
    price: 60,
    category: 'tees',
    image: '',
    short: 'Waffle knit',
    description:
      'A waffle-knit thermal cut close enough to layer and long enough to wear alone. Ribbed cuffs at the wrist.',
    details: ['Waffle knit cotton blend', 'Ribbed cuffs', 'Made to order, ships in 5 to 10 days'],
    materials: 'Cotton and elastane waffle knit. Machine wash cold.',
    options: { name: 'Size', values: sizes },
    defaultOption: 'M',
  },
  {
    slug: 'endure',
    name: 'Endure',
    price: 45,
    category: 'tees',
    image: '',
    short: 'Oversized tee',
    description: 'Endure. A wide-cut tee with the word set across the back. Built for the long walk.',
    details: ['240 gsm combed cotton', 'Oversized fit', 'Made to order, ships in 5 to 10 days'],
    materials: '100% combed cotton. Cold wash inside out.',
    options: { name: 'Size', values: sizes },
    defaultOption: 'M',
  },
]

export const FREE_SHIPPING_AT = 100
export const SHIPPING_FLAT = 7
