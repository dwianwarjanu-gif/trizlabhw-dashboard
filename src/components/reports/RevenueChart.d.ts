import React from 'react';
interface RevenueChartProps {
    data: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
    height?: number;
}
declare const RevenueChart: React.FC<RevenueChartProps>;
export default RevenueChart;
//# sourceMappingURL=RevenueChart.d.ts.map