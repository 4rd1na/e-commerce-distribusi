export type UserLevel = 'distributor' | 'agen' | 'sub_agen' | 'reseller' | 'konsumen';
export type UserCategory = 'pelanggan' | 'internal';
export type ProductType = 'barang' | 'jasa';

export interface Profile {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    level: UserLevel;
    category: UserCategory;
    is_internal: boolean;
    created_at?: string;
}

export interface Product {
    id: string;
    name: string;
    type: ProductType;
    sku: string;
    barcode: string | null;
    base_price: number;
    image_url: string | null;
    description: string | null;
    is_active: boolean;
    category_name?: string; // Tambahan dinamis hasil format client-side
    total_stock?: number;   // Tambahan dinamis hasil .reduce() stok gudang

    // Sinkronisasi nama relasi sesuai database Supabase (Snake Case / Plural)
    product_categories?: { name: string } | null;
    product_tier_prices?: ProductTierPrice[];
    product_variants?: ProductVariant[];
    bulk_discounts?: ProductBulkDiscount[];
    inventory_stocks?: InventoryStock[];
}

export interface ProductTierPrice {
    product_id: string;
    level: UserLevel;
    price: number;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    variant_name: string; // Ubah dari 'name' ke 'variant_name' sesuai SQL kamu
    additional_price: number;
    sku_variant?: string;
}

export interface ProductBulkDiscount {
    product_id: string;
    min_qty: number;
    discount_price: number;
}

export interface Warehouse {
    id: string;
    name: string;
    location: string;
}

export interface InventoryStock {
    product_id: string;
    variant_id: string | null;
    warehouse_id: string;
    qty: number;
}

export interface Cart {
    id: string;
    user_id: string;
    created_at: string;
}

export interface CartItem {
    id: string;
    cart_id: string;
    product_id: string;
    variant_id: string | null;
    qty: number;
    products?: Product;
    product_variants?: ProductVariant;
}

export interface Address {
    id: string;
    user_id: string;
    recipient_name: string;
    phone: string;
    province: string | null;
    city: string | null;
    district: string | null;
    village: string | null;
    address_detail: string | null;
    is_default: boolean;
}