export interface Product {
    id: string;
    name: string;
    name_ka?: string;
    name_ru?: string;
    description: string;
    description_ka?: string;
    description_ru?: string;
    price: number;
    category: string;
    image?: string;
    images?: string;
    videoUrl?: string;
    sortOrder?: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
    id: string;
    customerName: string;
    email: string;
    phone: string;
    date: string;
    dateISO?: string;
    completedDate?: string | null;
    completedDateISO?: string | null;
    status: BookingStatus;
    totalAmount: number;
    items: {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    message?: string;
}

export interface DashboardStats {
    totalProducts: number;
    activeRentals: number;
    totalCustomers: number;
    monthlyRevenue: number;
    chartData: { date: string; count: number }[];
    popularItems?: { name: string; count: number; revenue: number }[];
}

// API Response types for consistent error handling
export interface ApiErrorResponse {
    error: string;
    details?: string;
}

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data?: T;
}
