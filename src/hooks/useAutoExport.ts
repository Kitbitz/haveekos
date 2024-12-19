import { useState, useEffect, useCallback } from 'react';
import { Order } from '../types/order';
import { exportOrders } from '../services/exportService';
import { withRetry } from '../utils/retryStrategy';

interface AutoExportSettings {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string;
  lastExport?: number;
}

export const useAutoExport = (orders: Order[]) => {
  const [settings, setSettings] = useState<AutoExportSettings>(() => {
    const savedSettings = localStorage.getItem('autoExportSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      enabled: false,
      schedule: 'daily',
      time: '00:00',
      lastExport: undefined
    };
  });

  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSettings = useCallback((newSettings: Partial<AutoExportSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('autoExportSettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getOrdersForPeriod = useCallback(() => {
    const now = new Date();
    const startDate = new Date(now);

    switch (settings.schedule) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth(), 1);
        break;
    }

    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= startDate && orderDate <= now;
    });
  }, [orders, settings.schedule]);

  const performExport = useCallback(async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setError(null);

      const ordersToExport = getOrdersForPeriod();
      
      if (ordersToExport.length === 0) {
        console.log('No orders to export for the current period');
        return;
      }

      await withRetry(
        () => exportOrders(ordersToExport),
        {
          maxAttempts: 3,
          delay: 2000,
          backoff: 2,
          shouldRetry: (error) => {
            return error.message.includes('network') || 
                   error.message.includes('timeout') ||
                   error.message.includes('rate limit');
          }
        }
      );
      
      saveSettings({
        lastExport: Date.now()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform auto export';
      setError(errorMessage);
      console.error('Auto export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, getOrdersForPeriod, saveSettings]);

  useEffect(() => {
    if (!settings.enabled) return;

    const scheduleNextExport = () => {
      const now = new Date();
      const [hours, minutes] = settings.time.split(':').map(Number);
      const nextExport = new Date(now);
      nextExport.setHours(hours, minutes, 0, 0);

      if (nextExport <= now) {
        switch (settings.schedule) {
          case 'daily':
            nextExport.setDate(nextExport.getDate() + 1);
            break;
          case 'weekly':
            nextExport.setDate(nextExport.getDate() + 7);
            break;
          case 'monthly':
            nextExport.setMonth(nextExport.getMonth() + 1);
            nextExport.setDate(1);
            break;
        }
      }

      const timeUntilExport = nextExport.getTime() - now.getTime();
      console.log(`Next export scheduled for: ${nextExport.toLocaleString()}`);

      // Check if immediate export is needed
      const shouldExportImmediately = !settings.lastExport || 
        (new Date(settings.lastExport).getDate() !== now.getDate());

      if (shouldExportImmediately) {
        console.log('Performing immediate export...');
        performExport();
      }

      return setTimeout(() => {
        performExport().finally(() => {
          scheduleNextExport();
        });
      }, timeUntilExport);
    };

    const timeoutId = scheduleNextExport();
    return () => clearTimeout(timeoutId);
  }, [settings.enabled, settings.time, settings.schedule, settings.lastExport, performExport]);

  return {
    settings,
    updateSettings: saveSettings,
    isExporting,
    error,
    clearError: () => setError(null),
    performExport
  };
};

export default useAutoExport;