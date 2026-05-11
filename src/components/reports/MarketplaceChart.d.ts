import React from 'react';
interface MarketplaceChartProps {
    data: Array<{
        marketplaceAccountId: string;
        marketplace: {
            name: string;
            code: string;
        };
        _sum: {
            totalAmount: number;
        };
        _count: {
            id: number;
        };
    }>;
    height?: number;
}
declare const MarketplaceChart: React.FC<MarketplaceChartProps>;
export default MarketplaceChart;
//# sourceMappingURL=MarketplaceChart.d.ts.map