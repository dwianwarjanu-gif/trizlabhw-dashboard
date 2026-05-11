import React from 'react';
interface ReportCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<{
        className?: string;
    }>;
    color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
    subtitle?: string;
}
declare const ReportCard: React.FC<ReportCardProps>;
export default ReportCard;
//# sourceMappingURL=ReportCard.d.ts.map