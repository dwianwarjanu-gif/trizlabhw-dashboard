import React from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Props {
  logs: any[]
  isLoading?: boolean
}

const SyncLogsTable: React.FC<Props> = ({
  logs,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500">
          Memuat log sinkronisasi...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          Riwayat Sinkronisasi
        </h3>
      </div>

      {logs.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Belum ada riwayat sinkronisasi
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => {
            const success =
              (log.successCount || 0) > 0

            return (
              <div
                key={log.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div>
                    {success ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-500" />
                    )}
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">
                      {log.marketplaceAccount?.marketplace?.name || '-'}
                    </div>

                    <div className="text-sm text-gray-500">
                      Success: {log.successCount || 0}
                      {' • '}
                      Failed: {log.failureCount || 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-1" />

                  {new Date(log.syncedAt).toLocaleString('id-ID')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SyncLogsTable