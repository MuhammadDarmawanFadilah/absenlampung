import { getApiUrl } from './config';

interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export class ApiClient {
  private static async makeRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<Response> {
    const token = localStorage.getItem('auth_token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const requestOptions = {
      method: 'GET',
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let response = await fetch(getApiUrl(endpoint), requestOptions);

    // If unauthorized, try to refresh token
    if (response.status === 401 && token) {
      console.log('Token expired, attempting refresh...');
      
      try {
        const refreshResponse = await fetch(getApiUrl('api/auth/refresh'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('auth_token', refreshData.token);
          localStorage.setItem('auth_user', JSON.stringify(refreshData.user));

          // Retry original request with new token
          const retryOptions = {
            ...requestOptions,
            headers: {
              ...requestOptions.headers,
              'Authorization': `Bearer ${refreshData.token}`,
            },
          };

          response = await fetch(getApiUrl(endpoint), retryOptions);
          
          if (response.ok) {
            console.log('Request successful after token refresh');
          }
        } else {
          // Refresh failed, redirect to login
          console.error('Token refresh failed, redirecting to login');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Error during token refresh:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        throw error;
      }
    }

    return response;
  }

  static async get(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, { method: 'GET', headers });
  }

  static async post(endpoint: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  static async put(endpoint: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  static async delete(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, { method: 'DELETE', headers });
  }
}
