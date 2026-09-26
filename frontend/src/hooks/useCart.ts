'use client';

import { useState, useCallback, useMemo } from 'react';
import { FoodItem, CartItem, OrderOutcome } from '@/types/store';
import { API_BASE_URL } from '@/lib/constants';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderOutcome, setOrderOutcome] = useState<OrderOutcome | null>(null);

  const addToCart = useCallback((item: FoodItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
    } else {
      setCartItems((prev) =>
        prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity } : ci))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const itemCount = useMemo(() => {
    return cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0);
  }, [cartItems]);

  const deliveryFee = useMemo(() => (subtotal > 0 ? (subtotal > 35 ? 0 : 2.99) : 0), [subtotal]);
  const tax = useMemo(() => Math.round(subtotal * 0.0825 * 100) / 100, [subtotal]);
  const total = useMemo(() => Math.round((subtotal + deliveryFee + tax) * 100) / 100, [subtotal, deliveryFee, tax]);

  // Submit order to backend microservice flow
  const placeOrder = useCallback(
    async (simulateFault?: string) => {
      if (cartItems.length === 0) return;

      setIsSubmittingOrder(true);
      const traceId = `tr-${Math.random().toString(36).substring(2, 9)}`;
      const orderId = `TB-${Math.floor(100000 + Math.random() * 900000)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const res = await fetch(`${API_BASE_URL}/api/order/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            items: cartItems.map((ci) => ({ id: ci.item.id, quantity: ci.quantity, price: ci.item.price })),
            customerName: 'Alex Mercer',
            deliveryAddress: '742 Evergreen Terrace, Springfield',
            paymentMethod: 'credit_card',
            simulateFaultScenario: simulateFault || undefined,
            traceId,
          }),
        });

        clearTimeout(timeoutId);
        const data = await res.json();

        if (res.ok && data.status === 'confirmed') {
          setOrderOutcome({
            orderId,
            status: 'confirmed',
            timestamp: Date.now(),
            totalAmount: total,
            traceId,
            deliveryMinutes: 24,
          });
          clearCart();
        } else {
          // Microservice failure response
          setOrderOutcome({
            orderId,
            status: 'failed',
            timestamp: Date.now(),
            totalAmount: total,
            traceId: data.traceId || traceId,
            failureDetails: {
              service: data.failedService || (simulateFault === 'db_overload' ? 'postgres-db' : 'payment-service'),
              statusCode: data.statusCode || 504,
              errorType: data.errorType || 'Service Unavailable',
              userMessage: data.userMessage || 'We were unable to process your order at this time.',
              technicalMessage: data.technicalMessage || 'Connection pool timeout to downstream storage.',
            },
          });
        }
      } catch (err) {
        clearTimeout(timeoutId);
        // Fallback simulation if backend endpoint is unavailable or timed out
        if (simulateFault) {
          const scenarioDetails: Record<string, { service: string; type: string; msg: string }> = {
            db_overload: {
              service: 'postgres-db',
              type: 'Connection Pool Timeout',
              msg: 'Database pool saturated; transaction rolled back.',
            },
            payment_crash: {
              service: 'payment-service',
              type: 'Bad Gateway',
              msg: 'Payment gateway unresponsive; socket disconnected.',
            },
            network_partition: {
              service: 'payment-service',
              type: 'Payment Gateway Unreachable',
              msg: 'Network partition between order service and payment gateway; socket timed out.',
            },
            auth_crash: {
              service: 'auth-service',
              type: 'Authentication Service Failure',
              msg: 'User authorization token validation failed.',
            },
          };
          const info = scenarioDetails[simulateFault] || {
            service: 'postgres-db',
            type: 'Cascading Dependency Timeout',
            msg: 'Downstream microservice failed health check threshold.',
          };

          setOrderOutcome({
            orderId,
            status: 'failed',
            timestamp: Date.now(),
            totalAmount: total,
            traceId,
            failureDetails: {
              service: info.service,
              statusCode: 504,
              errorType: info.type,
              userMessage: 'Your transaction could not be processed due to a temporary system disruption.',
              technicalMessage: info.msg,
            },
          });
        } else {
          // Success fallback
          setOrderOutcome({
            orderId,
            status: 'confirmed',
            timestamp: Date.now(),
            totalAmount: total,
            traceId,
            deliveryMinutes: 25,
          });
          clearCart();
        }
      } finally {
        setIsSubmittingOrder(false);
        setIsCheckoutModalOpen(false);
      }
    },
    [cartItems, total, clearCart]
  );

  return {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    isSubmittingOrder,
    orderOutcome,
    setOrderOutcome,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    deliveryFee,
    tax,
    total,
    placeOrder,
  };
}
