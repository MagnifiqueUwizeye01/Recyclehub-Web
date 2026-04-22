import { useState, useCallback } from 'react';
import { getBuyerOrders, getSellerOrders, getOrderById, applySellerOrderAction, cancelOrder } from '../api/orders.api';
import { getPagedItems } from '../utils/pagedResponse';
import toast from 'react-hot-toast';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBuyerOrders = useCallback(async (params) => {
    try {
      setLoading(true);
      const res = await getBuyerOrders(params);
      const { items, totalPages: tp } = getPagedItems(res);
      setOrders(items.map((o) => ({ ...o, id: o.orderId ?? o.id })));
      setTotalPages(tp || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellerOrders = useCallback(async (params) => {
    try {
      setLoading(true);
      const res = await getSellerOrders(params);
      const { items, totalPages: tp } = getPagedItems(res);
      setOrders(items.map((o) => ({ ...o, id: o.orderId ?? o.id })));
      setTotalPages(tp || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrder = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await getOrderById(id);
      setOrder(res.data);
    } catch (err) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, []);

  const changeStatus = useCallback(async (id, data) => {
    await applySellerOrderAction(id, data.status, data.sellerNote);
    toast.success('Order updated');
  }, []);

  const cancel = useCallback(async (id) => {
    await cancelOrder(id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success('Order cancelled');
  }, []);

  return { orders, order, loading, totalPages, fetchBuyerOrders, fetchSellerOrders, fetchOrder, changeStatus, cancel };
};

export default useOrders;
