import { useState, useEffect } from 'react';
import http from '../../../core/http/http';
import type { Quotation } from '../types/quotation';

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await http.get('/quotations');
      setQuotations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const getById = async (id: number): Promise<Quotation> => {
    const { data } = await http.get(`/quotations/${id}`);
    return data;
  };

  const create = async (payload: unknown) => {
    const { data } = await http.post('/quotations', payload);
    await fetch();
    return data;
  };

  const updateStatus = async (id: number, status: string) => {
    await http.patch(`/quotations/${id}/status`, { status });
    await fetch();
  };

  const convertToSale = async (id: number, paymentMethod: string) => {
    const { data } = await http.post(`/quotations/${id}/convert`, { paymentMethod });
    await fetch();
    return data;
  };

  return { quotations, loading, create, updateStatus, convertToSale, getById, refresh: fetch };
}

export function useQuotationDetail(id: number) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await http.get(`/quotations/${id}`);
      setQuotation(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [id]);

  return { quotation, loading, refresh: fetch };
}