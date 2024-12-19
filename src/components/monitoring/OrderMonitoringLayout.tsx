import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import OrderList from './OrderList';
import MetricsPanel from './MetricsPanel';

const OrderMonitoringLayout: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
          <div className="container mx-auto px-4 py-6">
            <MetricsPanel />
            <OrderList />
          </div>
        </div>

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderMonitoringLayout;