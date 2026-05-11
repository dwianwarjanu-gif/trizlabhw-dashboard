import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
const SalesChart = ({ data, height = 300 }) => {
    if (!data || data.length === 0) {
        return (_jsx("div", { className: "flex items-center justify-center h-64 text-gray-500", children: "Tidak ada data untuk ditampilkan" }));
    }
    const chartData = {
        labels: data.map(item => {
            // Format period based on the format (YYYY-MM-DD, YYYY-MM, etc.)
            const period = item.period;
            if (period.includes('-') && period.length === 10) {
                // Daily format: YYYY-MM-DD
                return new Date(period).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short'
                });
            }
            else if (period.includes('-') && period.length === 7) {
                // Monthly format: YYYY-MM
                const [year, month] = period.split('-');
                return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', {
                    month: 'short',
                    year: 'numeric'
                });
            }
            else if (period.includes('W')) {
                // Weekly format: YYYY-WWW
                return `Week ${period.split('W')[1]}`;
            }
            return period;
        }),
        datasets: [
            {
                label: 'Revenue (Rp)',
                data: data.map(item => item.revenue),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Jumlah Pesanan',
                data: data.map(item => item.orders),
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
            title: {
                display: false,
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
                            // Revenue formatting
                            label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                        }
                        else {
                            // Orders formatting
                            label += context.parsed.y.toLocaleString('id-ID') + ' pesanan';
                        }
                        return label;
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Periode'
                },
                grid: {
                    display: false
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Revenue (Rp)'
                },
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
                title: {
                    display: true,
                    text: 'Jumlah Pesanan'
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString('id-ID');
                    }
                }
            }
        }
    };
    return (_jsx("div", { style: { height: `${height}px` }, children: _jsx(Line, { data: chartData, options: options }) }));
};
export default SalesChart;
//# sourceMappingURL=SalesChart.js.map