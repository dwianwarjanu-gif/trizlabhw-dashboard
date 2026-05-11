import React from 'react';
interface MarketplaceData {
    marketplaceAccountId: string;
    _count: {
        _all: number;
    };
    _sum: {
        totalAmount: number;
    };
    marketplace?: {
        name: string;
        code: string;
    };
}
interface MarketplacePerformanceProps {
    data: MarketplaceData[];
}
declare const MarketplacePerformance: React.FC<MarketplacePerformanceProps>;
export default MarketplacePerformance;
//# sourceMappingURL=MarketplacePerformance.d.ts.map