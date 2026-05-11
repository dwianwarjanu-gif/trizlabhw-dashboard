import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import { analyticsApi } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
const SalesChart = () => {
    const { data: salesData, isLoading } = useQuery({
        queryKey: ['sales-analytics', 'last-30-days'],
        queryFn: () => analyticsApi.getSalesReport({
            startDate: subDays(new Date(), 30).toISOString(),
            endDate: new Date().toISOString(),
            groupBy: 'day'
        }),
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    });
    if (isLoading) {
        return (_jsx("div", { className: "h-64 flex items-center justify-center", children: _jsx(LoadingSpinner, { size: "md", text: "Memuat data penjualan..." }) }));
    }
    const chartData = salesData?.data?.salesData || [];
    // Generate labels for the last 30 days
    const labels = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return format(date, 'dd MMM');
    });
    // Map data to chart format
    const revenueData = labels.map(label => {
        const dataPoint = chartData.find(item => {
            const itemDate = new Date(item.period);
            return format(itemDate, 'dd MMM') === label;
        });
        return dataPoint?.total_revenue || 0;
    });
    const orderData = labels.map(label => {
        const dataPoint = chartData.find(item => {
            const itemDate = new Date(item.period);
            return format(itemDate, 'dd MMM') === label;
        });
        return dataPoint?.order_count || 0;
    });
    const data = {
        labels,
        datasets: [
            {
                label: 'Pendapatan (Rp)',
                data: revenueData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Jumlah Pesanan',
                data: orderData,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.datasetIndex === 0) {
                            label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                        }
                        else {
                            label += context.parsed.y.toLocaleString('id-ID') + ' pesanan';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                ticks: {
                    callback: function (value) {
                        return 'Rp ' + value.toLocaleString('id-ID');
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false,
                }
            }
        }
    };
    return (_jsx("div", { className: "h-64", children: _jsx(Line, { data: data, options: options }) }));
};
export default SalesChart;
//# sourceMappingURL=SalesChart.js.map