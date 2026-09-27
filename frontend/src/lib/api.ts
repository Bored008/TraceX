import { ChaosScenario, RootCauseResult, ServiceGraph } from '@/types';
import { API_BASE_URL } from './constants';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get the service dependency graph
  async getServiceGraph(): Promise<ServiceGraph> {
    return this.request<ServiceGraph>('/api/graph');
  }

  // Get all services with current status
  async getServices() {
    return this.request('/api/services');
  }

  // Get metrics history for a service
  async getServiceMetrics(serviceId: string) {
    return this.request(`/api/services/${serviceId}/metrics`);
  }

  // Get all incidents
  async getIncidents(): Promise<RootCauseResult[]> {
    return this.request<RootCauseResult[]>('/api/incidents');
  }

  // Get a specific incident RCA
  async getIncident(id: string): Promise<RootCauseResult> {
    return this.request<RootCauseResult>(`/api/incidents/${id}`);
  }

  // Inject a chaos scenario
  async injectChaos(scenario: ChaosScenario): Promise<{ status: string; scenario: string; activeScenarios?: string[] }> {
    return this.request('/api/chaos/inject', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
  }

  // Stop/remove a specific chaos scenario while keeping others running
  async stopChaos(scenario: ChaosScenario): Promise<{ status: string; scenario: string; activeScenarios?: string[] }> {
    return this.request('/api/chaos/stop', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
  }

  // Get list of active chaos scenarios
  async getActiveChaos(): Promise<{ active: boolean; activeScenarios: string[] }> {
    return this.request('/api/chaos/active');
  }

  // Reset all services to healthy
  async resetChaos(): Promise<{ status: string }> {
    return this.request('/api/chaos/reset', { method: 'POST' });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/api/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
