import React from 'react';
interface MarketplaceAccount {
    id: string;
    storeName: string;
    isConnected: boolean;
    lastSynced?: string;
    marketplace: {
        name: string;
        code: string;
        logo?: string;
    };
    _count?: {
        marketplaceProducts: number;
    };
    connectionStatus?: 'ACTIVE' | 'ERROR' | 'PENDING';
}
interface MarketplaceCardProps {
    account: MarketplaceAccount;
    onTestConnection: () => void;
    onSyncProducts: () => void;
    onViewDetails: () => void;
    isTestingConnection?: boolean;
    isSyncingProducts?: boolean;
}
declare const MarketplaceCard: React.FC<MarketplaceCardProps>;
export default MarketplaceCard;
//# sourceMappingURL=MarketplaceCard.d.ts.map