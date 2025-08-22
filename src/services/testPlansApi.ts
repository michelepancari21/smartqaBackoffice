import { apiService } from './api';

export interface ApiTestPlan {
  id?: number | string;
  type?: string;
  attributes?: {
    id?: number;
    title?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  relationships?: {
    project?: {
      data?: {
        type?: string;
        id?: string;
      };
    };
    creator?: {
      data?: {
        type?: string;
        id?: string;
      };
    };
    editor?: {
      data?: {
        type?: string;
        id?: string;
      };
    };
    testRuns?: {
      data?: Array<{
        type?: string;
        id?: string;
      }>;
    };
  };
  // Fallback properties for non-JSON:API format
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  projectId?: number | string;
  creatorId?: number | string;
  editorId?: number | string;
}

export interface CreateTestPlanApiTestPlan {
  id?: number | string;
  type?: string;
  attributes?: {
    id?: number;
    title?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  relationships: {
    project: {
      data: { type: string; id: string };
    };
    creator: {
      data: { type: string; id: string };
    };
    editor: {
      data: { type: string; id: string };
    };
  };
}

export interface TestPlansApiResponse {
  links: {
    self: string;
    first: string;
    last: string;
    next?: string;
    prev?: string;
  };
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
  };
  data: ApiTestPlan[];
  included?: any[];
}

export interface CreateTestPlanRequest {
  data: {
    type: "TestPlan";
    attributes: {
      title: string;
    };
    relationships: {
      user: {
        data: { type: string; id: string };
      };
    };
  };
}

export interface UpdateTestPlanRequest {
  data: {
    type: "TestPlan";
    attributes: {
      title: string;
    };
    relationships: {
      test_runs: {
        data: any[];
      };
    };
  };
}

export interface CreateTestPlanResponse {
  data: ApiTestPlan;
}

export interface UpdateTestPlanResponse {
  data: ApiTestPlan;
}

export interface TestPlan {
  id: string;
  title: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

class TestPlansApiService {
  public getDefaultTestPlansResponse(): TestPlansApiResponse {
    return {
      links: {
        self: '',
        first: '',
        last: ''
      },
      meta: {
        totalItems: 0,
        itemsPerPage: 30,
        currentPage: 1
      },
      data: []
    };
  }

  async getTestPlans(projectId?: string, page: number = 1, itemsPerPage: number = 30): Promise<TestPlansApiResponse> {
    try {
      const url = `/test_plans?page=${page}&itemsPerPage=${itemsPerPage}&order[createdAt]=desc`;
      
      const response = await apiService.authenticatedRequest(url);
      return response || this.getDefaultTestPlansResponse();
    } catch (error) {
      console.error('Error fetching test plans:', error);
      return this.getDefaultTestPlansResponse();
    }
  }

  async searchTestPlans(searchTerm: string, projectId?: string, page: number = 1, itemsPerPage: number = 30): Promise<TestPlansApiResponse> {
    try {
      const isNumeric = /^\d+$/.test(searchTerm.trim());
      const searchParam = isNumeric ? `id=${encodeURIComponent(searchTerm)}` : `title=${encodeURIComponent(searchTerm)}`;
      const url = `/test_plans?${searchParam}&page=${page}&itemsPerPage=${itemsPerPage}&order[createdAt]=desc`;
      
      const response = await apiService.authenticatedRequest(url);
      return response || this.getDefaultTestPlansResponse();
    } catch (error) {
      console.error('Error searching test plans:', error);
      return this.getDefaultTestPlansResponse();
    }
  }

  async getTestPlan(id: string): Promise<{ data: ApiTestPlan }> {
    return apiService.authenticatedRequest(`/test_plans/${id}`);
  }

  async createTestPlan(testPlanData: {
    title: string;
    creatorId: string;
  }): Promise<CreateTestPlanResponse> {
    const requestBody: CreateTestPlanRequest = {
      data: {
        type: "TestPlan",
        attributes: {
          title: testPlanData.title
        },
        relationships: {
          user: {
            data: { type: "User", id: `/api/users/${testPlanData.creatorId}` }
          },
          test_runs: {
            data: []
          }
        }
      }
    };

    const response = await apiService.authenticatedRequest('/test_plans', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  async updateTestPlan(id: string, testPlanData: {
    title: string;
  }): Promise<UpdateTestPlanResponse> {
    const requestBody: UpdateTestPlanRequest = {
      data: {
        type: "TestPlan",
        attributes: {
          title: testPlanData.title
        },
        relationships: {
          test_runs: {
            data: []
          }
        }
      }
    };

    const response = await apiService.authenticatedRequest(`/test_plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  async deleteTestPlan(id: string): Promise<void> {
    await apiService.authenticatedRequest(`/test_plans/${id}`, {
      method: 'DELETE',
    });
  }

  // Helper method to transform API test plan to our internal format
  transformApiTestPlan(apiTestPlan: ApiTestPlan): TestPlan {
    return {
      id: apiTestPlan.attributes.id.toString(),
      title: apiTestPlan.attributes.title,
      projectId: '',
      createdAt: new Date(apiTestPlan.attributes.createdAt),
      updatedAt: new Date(apiTestPlan.attributes.updatedAt)
    };
  }
}

export const testPlansApiService = new TestPlansApiService();