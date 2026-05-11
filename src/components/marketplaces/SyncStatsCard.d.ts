import React from 'react';
interface SyncStatsCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{
        className?: string;
    }>;
    color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
    trend?: {
        value: number;
        isPositive: boolean;
    };
}
declare const SyncStatsCard: React.FC<SyncStatsCardProps>;
export default SyncStatsCard;
//# sourceMappingURL=SyncStatsCard.d.ts.map