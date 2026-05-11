import React, { ReactNode } from 'react';
import { Socket } from 'socket.io-client';
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    emit: (event: string, data?: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback?: (data: any) => void) => void;
}
interface SocketProviderProps {
    children: ReactNode;
}
export declare const SocketProvider: React.FC<SocketProviderProps>;
export declare const useSocket: () => SocketContextType;
export {};
//# sourceMappingURL=SocketContext.d.ts.map