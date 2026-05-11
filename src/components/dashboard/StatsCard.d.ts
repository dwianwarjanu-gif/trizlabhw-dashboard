import React from 'react';
interface StatsCardProps {
    title: string;
    value: number;
    previousValue?: number;
    growth?: number;
    icon: React.ComponentType<{
        className?: string;
    }>;
    color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
    format?: 'number' | 'currency' | 'percentage';
    alert?: boolean;
}
declare const StatsCard: React.FC<StatsCardProps>;
export default StatsCard;
//# sourceMappingURL=StatsCard.d.ts.map