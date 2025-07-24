import { apiService } from './api';

export interface ApiSharedStep {
  id: string;
  type: string;
  attributes: {
    id: number;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  relationships: {
    project: {
      data: { type: string; id: string };
    };
    creator: {
      data: { type: string; id: string };
    };
    stepResults?: {
      data: Array<{ type: string; id: string }>;
    };
    testCases?: {
      data: Array<{ type: string; id: string }>;
    };
  };
}

export interface ApiCreator {
  id: string;
  type: string;
  attributes: {
    id: number;
    name: string;
    login: string;
    email: string;
  };
}

export interface SharedStepsApiResponse {
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
  data: ApiSharedStep[];
  included?: ApiCreator[];
}

export interface CreateSharedStepRequest {
  data: {
    type: "SharedStep";
    attributes: {
      title: string;
      description: string;
    };
    relationships: {
      project: {
        data: { type: string; id: string };
      };
    };
  };
}

export interface UpdateSharedStepRequest {
  data: {
    type: "SharedStep";
    attributes: {
      title: string;
      description: string;
    };
  };
}

export interface CreateSharedStepResponse {
  data: ApiSharedStep;
}

export interface UpdateSharedStepResponse {
  data: ApiSharedStep;
}

export interface SharedStep {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  stepsCount: number;
  usedInCount: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

class SharedStepsApiService {
  public getDefaultSharedStepsResponse(): SharedStepsApiResponse {
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
      data: [],
      included: []
    };
  }

  async getSharedSteps(projectId: string, page: number = 1, itemsPerPage: number = 30): Promise<SharedStepsApiResponse> {
    const response = await apiService.authenticatedRequest(`/shared_steps?project=${projectId}&include=creator&page=${page}&itemsPerPage=${itemsPerPage}`);
    return response || this.getDefaultSharedStepsResponse();
  }

  async searchSharedSteps(searchTerm: string, projectId: string, page: number = 1, itemsPerPage: number = 30): Promise<SharedStepsApiResponse> {
    const isNumeric = /^\d+$/.test(searchTerm.trim());
    const searchParam = isNumeric ? `id=${encodeURIComponent(searchTerm)}` : `title=${encodeURIComponent(searchTerm)}`;
    
    const response = await apiService.authenticatedRequest(`/shared_steps?project=${projectId}&include=creator&${searchParam}&page=${page}&itemsPerPage=${itemsPerPage}`);
    return response || this.getDefaultSharedStepsResponse();
  }

  async getSharedStep(id: string): Promise<{ data: ApiSharedStep }> {
    return apiService.authenticatedRequest(`/shared_steps/${id}?include=creator`);
  }

  async createSharedStep(sharedStepData: {
    title: string;
    description: string;
    projectId: string;
  }): Promise<CreateSharedStepResponse> {
    const requestBody: CreateSharedStepRequest = {
      data: {
        type: "SharedStep",
        attributes: {
          title: sharedStepData.title,
          description: sharedStepData.description
        },
        relationships: {
          project: {
            data: { type: "Project", id: sharedStepData.projectId }
          }
        }
      }
    };

    const response = await apiService.authenticatedRequest('/shared_steps', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  async updateSharedStep(id: string, sharedStepData: {
    title: string;
    description: string;
  }): Promise<UpdateSharedStepResponse> {
    const requestBody: UpdateSharedStepRequest = {
      data: {
        type: "SharedStep",
        attributes: {
          title: sharedStepData.title,
          description: sharedStepData.description
        }
      }
    };

    const response = await apiService.authenticatedRequest(`/shared_steps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  async deleteSharedStep(id: string): Promise<void> {
    await apiService.authenticatedRequest(`/shared_steps/${id}`, {
      method: 'DELETE',
    });
  }

  // Helper method to find creator in included data
  private findCreatorInIncluded(creatorId: string, included: ApiCreator[] = []): ApiCreator | null {
    return included.find(item => 
      item.type === 'User' && item.attributes.id.toString() === creatorId
    ) || null;
  }

  // Helper method to transform API shared step to our internal format
  transformApiSharedStep(apiSharedStep: ApiSharedStep, included: ApiCreator[] = []): SharedStep {
    // Extract project ID from the relationship URL
    const projectId = apiSharedStep.relationships.project.data.id.split('/').pop() || '';
    
    // Extract creator ID from the relationship URL
    const creatorId = apiSharedStep.relationships.creator.data.id.split('/').pop() || '';
    
    // Find creator details in included data
    const creator = this.findCreatorInIncluded(creatorId, included);
    
    // Count steps and results
    const stepsCount = apiSharedStep.relationships.stepResults?.data?.length || 0;
    
    // Count test cases using this shared step
    const usedInCount = apiSharedStep.relationships.testCases?.data?.length || 0;

    return {
      id: apiSharedStep.attributes.id.toString(),
      title: apiSharedStep.attributes.title,
      description: apiSharedStep.attributes.description,
      projectId: projectId,
      stepsCount: stepsCount,
      usedInCount: usedInCount,
      createdBy: {
        id: creatorId,
        name: creator?.attributes.name || 'Unknown User',
        email: creator?.attributes.email || ''
      },
      createdAt: new Date(apiSharedStep.attributes.createdAt),
      updatedAt: new Date(apiSharedStep.attributes.updatedAt)
    };
  }
}

export const sharedStepsApiService = new SharedStepsApiService();