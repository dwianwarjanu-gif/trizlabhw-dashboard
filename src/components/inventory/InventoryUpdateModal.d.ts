import React from 'react';
import { z } from 'zod';
declare const updateSchema: z.ZodObject<{
    stockQuantity: z.ZodNumber;
    minStockLevel: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    stockQuantity: number;
    minStockLevel: number;
    reason: string;
}, {
    stockQuantity: number;
    minStockLevel: number;
    reason: string;
}>;
type UpdateFormData = z.infer<typeof updateSchema>;
interface InventoryUpdateModalProps {
    item: {
        productId: string;
        variantId?: string;
        stockQuantity: number;
        minStockLevel: number;
        product: {
            name: string;
            sku: string;
        };
        variant?: {
            variantName: string;
            sku: string;
        };
    };
    onClose: () => void;
    onSubmit: (data: UpdateFormData) => void;
    isLoading: boolean;
}
declare const InventoryUpdateModal: React.FC<InventoryUpdateModalProps>;
export default InventoryUpdateModal;
//# sourceMappingURL=InventoryUpdateModal.d.ts.map