import { useState, useEffect } from 'react';
import { fetchIncidents } from '../services/api.js';

export function useIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchIncidents()
      .then(data => {
        if (isMounted) {
          setIncidents(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  return { incidents, loading, error };
}
