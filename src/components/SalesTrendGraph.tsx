import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Order } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface SalesTrendGraphProps {
  orders: Order[],
  startDate: string,
  endDate: string
}

const SalesTrendGraph: React.FC<SalesTrendGraphProps> = ({ orders, startDate, endDate }) => {
  const salesData = useMemo(() => {
    // Create a map to store daily totals
    const dailyTotals = new Map<string, { revenue: number; count: number }>();
    
    // Initialize all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyTotals.set(dateKey, { revenue: 0, count: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate orders by date
    orders.forEach(order => {
      const orderDate = new Date(order.timestamp);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      if (dailyTotals.has(dateKey)) {
        const current = dailyTotals.get(dateKey)!;
        dailyTotals.set(dateKey, {
          revenue: current.revenue + order.totalPrice,
          count: current.count + 1
        });
      }
    });

    // Convert to arrays for Chart.js
    const dates = Array.from(dailyTotals.keys()).sort();
    const revenues = dates.map(date => dailyTotals.get(date)!.revenue);
    const counts = dates.map(date => dailyTotals.get(date)!.count);

    return { dates, revenues, counts };
  }, [orders, startDate, endDate]);

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Sales Trend',
      },
    },
    scales: {
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue (₱)'
        }
      },
      y2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Number of Orders'
        }
      },
    },
  };

  const data = {
    labels: salesData.dates.map(date => new Date(date).toLocaleDateString()),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.revenues,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y1',
      },
      {
        label: 'Orders',
        data: salesData.counts,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y2',
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Line options={options} data={data} />
    </div>
  );
};

export default SalesTrendGraph;