import { useState, useCallback, useEffect } from 'react';
import { Order } from '../App';
import { updateOrderInSheet } from '../utils/sheetsOperations';

interface QueueItem {
  id: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const useSyncQueue = (orders: Order[]) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const addToQueue = useCallback((orderId: string) => {
    setQueue(prev => [...prev, { 
      id: orderId, 
      timestamp: Date.now(),
      retryCount: 0
    }]);
  }, []);

  const processQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const currentItem = queue[0];
    const order = orders.find(o => o.id === currentItem.id);

    if (!order) {
      setQueue(prev => prev.slice(1));
      setIsSyncing(false);
      return;
    }

    try {
      await updateOrderInSheet(order);
      setSyncStatus('Changes synced successfully');
      setTimeout(() => setSyncStatus(''), 2000);
      setQueue(prev => prev.slice(1));
    } catch (error) {
      console.error('Sync failed:', error);
      
      if (currentItem.retryCount >= MAX_RETRIES) {
        console.error('Sync failed permanently:', { item: currentItem, error });
        setSyncStatus(`Sync failed after maximum retries`);
        setTimeout(() => setSyncStatus(''), 3000);
        setQueue(prev => prev.slice(1));
      } else {
        setQueue(prev => [
          { 
            ...currentItem, 
            retryCount: currentItem.retryCount + 1,
            lastError: error.message
          },
          ...prev.slice(1)
        ]);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    } finally {
      setIsSyncing(false);
    }
  }, [queue, orders, isSyncing]);

  useEffect(() => {
    if (queue.length > 0) {
      processQueue();
    }
  }, [queue, processQueue]);

  return { addToQueue, syncStatus };
};

export default useSyncQueue;