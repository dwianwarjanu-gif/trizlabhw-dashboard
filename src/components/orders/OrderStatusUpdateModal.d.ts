import React from 'react';
import { z } from 'zod';
declare const updateSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]>;
    reason: z.ZodString;
    updateMarketplace: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
    reason: string;
    updateMarketplace: boolean;
}, {
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
    reason: string;
    updateMarketplace?: boolean | undefined;
}>;
type UpdateFormData = z.infer<typeof updateSchema>;
interface OrderStatusUpdateModalProps {
    order: {
        id: string;
        orderNumber: string;
        status: string;
        marketplaceAccount: {
            marketplace: {
                name: string;
            };
        };
    };
    onClose: () => void;
    onSubmit: (data: UpdateFormData) => void;
    isLoading: boolean;
}
declare const OrderStatusUpdateModal: React.FC<OrderStatusUpdateModalProps>;
export default OrderStatusUpdateModal;
//# sourceMappingURL=OrderStatusUpdateModal.d.ts.map