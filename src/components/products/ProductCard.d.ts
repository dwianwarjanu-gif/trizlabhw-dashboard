import React from 'react';
interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    images?: string[];
    isActive: boolean;
    category?: {
        name: string;
    };
    inventory?: {
        stockQuantity: number;
        minStockLevel: number;
    };
    marketplaceProducts?: Array<{
        marketplace: {
            name: string;
            code: string;
        };
        syncStatus: string;
    }>;
    _count?: {
        variants: number;
    };
}
interface ProductCardProps {
    product: Product;
}
declare const ProductCard: React.FC<ProductCardProps>;
export default ProductCard;
//# sourceMappingURL=ProductCard.d.ts.map