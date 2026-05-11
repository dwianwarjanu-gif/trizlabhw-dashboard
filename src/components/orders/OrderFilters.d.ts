import React from 'react';
interface OrderFiltersProps {
    filters: {
        status: string;
        marketplaceAccountId: string;
        startDate: string;
        endDate: string;
        sortBy: string;
        sortOrder: string;
    };
    onFilterChange: (filters: any) => void;
}
declare const OrderFilters: React.FC<OrderFiltersProps>;
export default OrderFilters;
//# sourceMappingURL=OrderFilters.d.ts.map