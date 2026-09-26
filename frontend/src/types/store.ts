export interface FoodItem {
  id: string;
  name: string;
  category: 'burgers' | 'pizzas' | 'asian' | 'mexican' | 'desserts' | 'beverages';
  price: number;
  rating: number;
  reviewsCount: number;
  prepTime: string;
  calories: number;
  icon: string;
  badge?: string;
  description: string;
  isVegetarian: boolean;
}

export interface CartItem {
  item: FoodItem;
  quantity: number;
}

export interface CheckoutPayload {
  items: Array<{ id: string; quantity: number; price: number }>;
  customerName: string;
  deliveryAddress: string;
  paymentMethod: 'credit_card' | 'upi' | 'apple_pay';
  simulateFaultScenario?: string;
}

export interface OrderOutcome {
  orderId: string;
  status: 'confirmed' | 'failed';
  timestamp: number;
  totalAmount: number;
  traceId: string;
  deliveryMinutes?: number;
  failureDetails?: {
    service: string;
    statusCode: number;
    errorType: string;
    userMessage: string;
    technicalMessage: string;
  };
}
