import { useState, useEffect } from 'react';
import { listenTransactionLogs } from '../core/api';

export function useTransactionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenTransactionLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    
    // In api.js, listenTransactionLogs currently does not handle errors well in the callback.
    // If it did, we could catch it here.
    return () => unsubscribe();
  }, []);

  const refreshLogs = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return {
    logs,
    loading,
    error,
    refreshLogs
  };
}
