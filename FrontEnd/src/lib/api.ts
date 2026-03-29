import { useAuthStore } from '@/stores/useAuthStore';

export const API_BASE_URL = import.meta.env.VITE_API_URL;

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

export async function apiRequest(endpoint: string, options: RequestOptions = {}) {
    const token = useAuthStore.getState().token;

    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
    } as Record<string, string>;

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text || `Request failed with status ${response.status}` };
        }

        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}
