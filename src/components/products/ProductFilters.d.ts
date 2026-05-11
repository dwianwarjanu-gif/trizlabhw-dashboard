import React from 'react';
interface ProductFiltersProps {
    filters: {
        categoryId: string;
        isActive: string;
        sortBy: string;
        sortOrder: string;
    };
    onFilterChange: (filters: any) => void;
}
declare const ProductFilters: React.FC<ProductFiltersProps>;
export default ProductFilters;
//# sourceMappingURL=ProductFilters.d.ts.map