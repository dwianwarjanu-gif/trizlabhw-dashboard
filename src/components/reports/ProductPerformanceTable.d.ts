import React from 'react';
interface Product {
    productId: string;
    productName: string;
    sku: string;
    quantitySold: number;
    revenue: number;
    orderCount: number;
}
interface ProductPerformanceTableProps {
    products: Product[];
}
declare const ProductPerformanceTable: React.FC<ProductPerformanceTableProps>;
export default ProductPerformanceTable;
//# sourceMappingURL=ProductPerformanceTable.d.ts.map