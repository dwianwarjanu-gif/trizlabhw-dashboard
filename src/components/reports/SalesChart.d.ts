import React from 'react';
interface SalesChartProps {
    data: Array<{
        period: string;
        revenue: number;
        orders: number;
        avgOrderValue: number;
    }>;
    height?: number;
}
declare const SalesChart: React.FC<SalesChartProps>;
export default SalesChart;
//# sourceMappingURL=SalesChart.d.ts.map