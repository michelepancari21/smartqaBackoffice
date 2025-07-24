import { apiService } from './api';

import { Tag } from './tagsApi';

export interface CreateStepResultRequest {
  data: {
    type: "StepResult";
    attributes: {
      step: string;
      result: string;
    };
    relationships: {
      user: {
        data: {
          type: "User";
          id: string;
        };
      };
    };
  };
}

export interface CreateStepResultResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      id: number;
      step: string;
      result: string;
    };
  };
}

export interface ApiTestCase {
  id: string;
  type: string;
  attributes: {
    id: number;
    title: string;
    description: string;
    priority: number; // L'API utilise des nombres pour priority
    type: number; // L'API utilise des nombres pour type
    state: number; // L'API utilise state au lieu de status
    automation: 1 | 2 | 3 | 4 | 5; // Le bon nom du champ dans l'API
    estimatedDuration?: number;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    template?: number;
    preconditions?: string;
  };
  relationships: {
    project: {
      data: { type: string; id: string };
    };
    folder?: {
      data: { type: string; id: string };
    };
    tags?: {
      data: Array<{ type: string; id: string }>;
    };
    testRuns?: {
      data: Array<{ type: string; id: string }>;
    };
    creator: {
      data: { type: string; id: string };
    };
    editor: {
      data: { type: string; id: string };
    };
    stepResults?: {
      data: Array<{ type: string; id: string }>;
    };
  };
}

export interface TestCasesApiResponse {
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
  data: ApiTestCase[];
  included?: Array<{
    id: string;
    type: string;
    attributes: {
      id: number;
      label: string;
    };
  }>;
}

export interface CreateTestCaseRequest {
  data: {
    type: "TestCase";
    attributes: {
      title: string;
      description: string;
      priority: number; // Convertir en nombre pour l'API
      type: number; // Convertir en nombre pour l'API
      state: number; // Utiliser state au lieu de status
      automation: 1 | 2 | 3 | 4 | 5;
      template: number;
      preconditions: string;
    };
    relationships: {
      project: {
        data: { type: string; id: string };
      };
      folder?: {
        data: { type: string; id: string };
      };
      tags?: {
        data: Array<{ type: string; id: string }>;
      };
      user: {
        data: { type: string; id: string };
      };
      step_results?: {
        data: Array<{
          type: string;
          id: string;
          meta: {
            order: number;
          };
        }>;
      };
    }
  }
}

export interface UpdateTestCaseRequest {
  data: {
    type: "TestCase";
    attributes: {
      title: string;
      description: string;
      priority: number;
      type: number;
      state: number;
      automation: 1 | 2 | 3 | 4 | 5;
      template: number;
      preconditions: string;
    };
    relationships?: {
      tags?: {
        data: Array<{ type: string; id: string }>;
      };
      step_results?: {
        data: Array<{
          type: string;
          id: string;
          meta: {
            order: number;
          };
        }>;
      };
    };
  };
}

export interface CreateTestCaseResponse {
  data: ApiTestCase;
}

export interface UpdateTestCaseResponse {
  data: ApiTestCase;
}

class TestCasesApiService {
  // Mappings pour convertir entre notre format et l'API
  private priorityToApi = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };

  private priorityFromApi = {
    1: 'low' as const,
    2: 'medium' as const,
    3: 'high' as const,
    4: 'critical' as const
  };

  private typeToApi = {
    'functional': 1,
    'regression': 2,
    'smoke': 3,
    'integration': 4,
    'performance': 5
  };

  private typeFromApi = {
    1: 'functional' as const,
    2: 'regression' as const,
    3: 'smoke' as const,
    4: 'integration' as const,
    5: 'performance' as const
  };

  private statusToApi = {
    'active': 1,
    'draft': 2,
    'in_review': 3,
    'outdated': 4,
    'rejected': 5,
    'deprecated': 4
  };

  private statusFromApi = {
    1: 'active' as const,
    2: 'draft' as const,
    3: 'in_review' as const,
    4: 'outdated' as const,
    5: 'rejected' as const
  };

  public getDefaultTestCasesResponse(): TestCasesApiResponse {
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

  async getTestCases(page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string): Promise<TestCasesApiResponse> {
    let url = `/test_cases?page=${page}&itemsPerPage=${itemsPerPage}&order[createdAt]=desc`;
    
    if (projectId) {
      url += `&project=${projectId}`;
    }
    
    if (folderId) {
      url += `&folder=${folderId}`;
    }
    
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }

  async searchTestCases(searchTerm: string, page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string, include?: string): Promise<TestCasesApiResponse> {
    const isNumeric = /^\d+$/.test(searchTerm.trim());
    const searchParam = isNumeric ? `id=${encodeURIComponent(searchTerm)}` : `title=${encodeURIComponent(searchTerm)}`;
    
    let url = `/test_cases?${searchParam}&page=${page}&itemsPerPage=${itemsPerPage}`;
    
    if (projectId) {
      url += `&project=${projectId}`;
    }
    
    if (folderId) {
      url += `&folder=${folderId}`;
    }
    
    if (include) {
      url += `&${include}`;
    }
    
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }

  async filterTestCasesByAutomation(automationStatus: 1 | 2 | 3 | 4 | 5, page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string): Promise<TestCasesApiResponse> {
    let url = `/test_cases?automation=${automationStatus}&page=${page}&itemsPerPage=${itemsPerPage}`;
    
    if (projectId) {
      url += `&project=${projectId}`;
    }
    
    if (folderId) {
      url += `&folder=${folderId}`;
    }
    
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }

  async filterTestCasesByPriority(priority: number, page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string): Promise<TestCasesApiResponse> {
    let url = `/test_cases?priority=${priority}&page=${page}&itemsPerPage=${itemsPerPage}`;
    
    if (projectId) {
      url += `&project=${projectId}`;
    }
    
    if (folderId) {
      url += `&folder=${folderId}`;
    }
    
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }

  async filterTestCasesByType(type: number, page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string): Promise<TestCasesApiResponse> {
    let url = `/test_cases?type=${type}&page=${page}&itemsPerPage=${itemsPerPage}`;
    
    if (projectId) {
      url += `&project=${projectId}`;
    }
    
    if (folderId) {
      url += `&folder=${folderId}`;
    }
    
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }

  async filterTestCasesByState(state: number, page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string): Promise<TestCasesApiResponse> {
    let url = `/test_cases?state=${state}&page=${page}&itemsPerPage=${itemsPerPage}`;
    
    if (projectId) {
      url += `&project=${projectId}`;
    }
    
    if (folderId) {
      url += `&folder=${folderId}`;
    }
    
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }
  async filterTestCasesByTags(tagIds: string[], page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string): Promise<TestCasesApiResponse> {
    const tagsParam = tagIds.join(',');
    let url = `/test_cases?tags=${tagsParam}&page=${page}&itemsPerPage=${itemsPerPage}`;
    
    if (projectId) {
      url += `&project=${projectId}`;
    }
    
    if (folderId) {
      url += `&folder=${folderId}`;
    }
    
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }

  async filterTestCasesWithMultipleFilters(filters: {
    automationStatus?: 1 | 2 | 3 | 4 | 5;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    type?: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance';
    tagIds?: string[];
  }, page: number = 1, itemsPerPage: number = 30, projectId?: string, folderId?: string): Promise<TestCasesApiResponse> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('itemsPerPage', itemsPerPage.toString());
    
    if (projectId) {
      params.set('project', projectId);
    }
    
    if (folderId) {
      params.set('folder', folderId);
    }
    
    if (filters.automationStatus) {
      params.set('automation', filters.automationStatus.toString());
    }
    
    if (filters.priority) {
      const priorityValue = this.priorityToApi[filters.priority];
      params.set('priority', priorityValue.toString());
    }
    
    if (filters.type) {
      const typeValue = this.typeToApi[filters.type];
      params.set('type', typeValue.toString());
    }
    
    if (filters.tagIds && filters.tagIds.length > 0) {
      params.set('tags', filters.tagIds.join(','));
    }
    
    const url = `/test_cases?${params.toString()}`;
    const response = await apiService.authenticatedRequest(url);
    return response || this.getDefaultTestCasesResponse();
  }

  async createStepResult(stepData: {
    step: string;
    result: string;
    userId: string;
  }): Promise<CreateStepResultResponse> {
    const requestBody: CreateStepResultRequest = {
      data: {
        type: "StepResult",
        attributes: {
          step: stepData.step,
          result: stepData.result
        },
        relationships: {
          user: {
            data: {
              type: "User",
              id: `/api/users/${stepData.userId}`
            }
          }
        }
      }
    };

    const response = await apiService.authenticatedRequest('/step_results', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  async getTestCase(id: string): Promise<{ data: ApiTestCase }> {
    return apiService.authenticatedRequest(`/test_cases/${id}`);
  }

  async createTestCase(testCaseData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    testType: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance';
    status: 'draft' | 'active' | 'deprecated';
    automationStatus: 1 | 2 | 3 | 4 | 5;
    estimatedDuration: number;
    tags: Tag[];
    projectId: string;
    folderId?: string;
    creatorId: string;
    stepResults?: Array<{
      id: string;
      order: number;
    }>;
    template?: number;
    preconditions?: string;
  }): Promise<CreateTestCaseResponse> {
    const requestBody: CreateTestCaseRequest = {
      data: {
        type: "TestCase",
        attributes: {
          title: testCaseData.title,
          description: testCaseData.description,
          priority: this.priorityToApi[testCaseData.priority],
          type: this.typeToApi[testCaseData.testType],
          state: this.statusToApi[testCaseData.status],
          automation: testCaseData.automationStatus,
          template: testCaseData.template || 1,
          preconditions: testCaseData.preconditions || ''
        },
        relationships: {
          project: {
            data: { type: "Project", id: `/api/projects/${testCaseData.projectId}` }
          },
          user: {
            data: { type: "User", id: `/api/users/${testCaseData.creatorId}` }
          }
        }
      }
    };

    // Add folder relationship if provided
    if (testCaseData.folderId) {
      requestBody.data.relationships.folder = {
        data: { type: "Folder", id: `/api/folders/${testCaseData.folderId}` }
      };
    }

    // Add tags relationship if provided
    if (testCaseData.tags && testCaseData.tags.length > 0) {
      requestBody.data.relationships.tags = {
        data: testCaseData.tags.map(tag => ({ type: "Tag", id: `/api/tags/${tag.id}` }))
      };
    }

    // Add step_results relationship if provided
    if (testCaseData.stepResults && testCaseData.stepResults.length > 0) {
      requestBody.data.relationships.step_results = {
        data: testCaseData.stepResults.map(stepResult => ({
          type: "StepResult",
          id: `/api/step_results/${stepResult.id}`,
          meta: {
            order: stepResult.order
          }
        }))
      };
    }

    const response = await apiService.authenticatedRequest('/test_cases', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  async updateTestCase(id: string, testCaseData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    testType: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance';
    status: 'draft' | 'active' | 'deprecated';
    automationStatus: 1 | 2 | 3 | 4 | 5;
    template: number;
    preconditions: string;
    tags: Tag[];
    stepResultsRelationships?: Array<{
      type: string;
      id: string;
      meta: {
        order: number;
      };
    }>;
  }): Promise<UpdateTestCaseResponse> {
    const requestBody: UpdateTestCaseRequest = {
      data: {
        type: "TestCase",
        attributes: {
          title: testCaseData.title,
          description: testCaseData.description,
          priority: this.priorityToApi[testCaseData.priority],
          type: this.typeToApi[testCaseData.testType],
          state: this.statusToApi[testCaseData.status],
          automation: testCaseData.automationStatus,
          template: testCaseData.template,
          preconditions: testCaseData.preconditions
        }
      }
    };

    // Initialize relationships object
    requestBody.data.relationships = {};
    
    // Add tags relationship if provided
    // Always send tags relationship (empty array if no tags selected)
    requestBody.data.relationships.tags = {
      data: testCaseData.tags.map(tag => ({ type: "Tag", id: `/api/tags/${tag.id}` }))
    };
    
    // Add step_results relationship if provided
    if (testCaseData.stepResultsRelationships && testCaseData.stepResultsRelationships.length > 0) {
      requestBody.data.relationships.step_results = {
        data: testCaseData.stepResultsRelationships
      };
    }

    const response = await apiService.authenticatedRequest(`/test_cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  async deleteTestCase(id: string): Promise<void> {
    await apiService.authenticatedRequest(`/test_cases/${id}`, {
      method: 'DELETE',
    });
  }

  async updateStepResult(id: string, stepData: {
    step: string;
    result: string;
    userId: string;
  }): Promise<void> {
    const requestBody = {
      data: {
        type: "StepResult",
        attributes: {
          step: stepData.step,
          result: stepData.result
        },
        relationships: {
          user: {
            data: {
              type: "User",
              id: stepData.userId
            }
          }
        }
      }
    };

    await apiService.authenticatedRequest(`/step_results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });
  }

  async getStepResult(id: string): Promise<{
    data: {
      id: string;
      type: string;
      attributes: {
        id: number;
        step: string;
        result: string;
        order: number;
      };
    };
  }> {
    return apiService.authenticatedRequest(`/step_results/${id}`);
  }

  // Helper method to transform API test case to our internal format
  async transformApiTestCase(apiTestCase: ApiTestCase, included?: Array<any>) {
    // Extraire l'ID du projet depuis l'URL de l'API
    const projectId = apiTestCase.relationships.project.data.id.split('/').pop() || '';
    const folderId = apiTestCase.relationships.folder?.data?.id?.split('/').pop();
    
    console.log('🔄 Transforming test case:', apiTestCase.attributes.id, 'folderId from API:', folderId);
    
    // Extract tags from relationships and fetch actual labels
    let tags: string[] = [];
    if (apiTestCase.relationships.tags?.data) {
      // Extract tag IRIs and fetch actual tag data
      const tagIris = apiTestCase.relationships.tags.data.map(tag => tag.id);
      console.log('🏷️ Fetching tag details for IRIs:', tagIris);
      
      // Fetch tag details for each IRI
      try {
        const tagPromises = tagIris.map(async (tagIri) => {
          try {
            const tagResponse = await apiService.authenticatedRequest(tagIri.replace('/api', ''));
            return tagResponse.data.attributes.label;
          } catch (error) {
            console.error('Failed to fetch tag:', tagIri, error);
            return null;
          }
        });
        
        const tagLabels = await Promise.all(tagPromises);
        tags = tagLabels.filter(label => label !== null);
        console.log('✅ Fetched tag labels:', tags);
      } catch (error) {
        console.error('❌ Failed to fetch tag labels:', error);
        tags = [];
      }
    } else if (apiTestCase.attributes.tags) {
      // If tags are in attributes, use them directly
      tags = Array.isArray(apiTestCase.attributes.tags) ? apiTestCase.attributes.tags : [];
    }
    
    // Extract step result IDs from relationships
    const stepResults = apiTestCase.relationships.stepResults?.data?.map(stepResult => 
      stepResult.id.split('/').pop() || stepResult.id
    ) || [];
    
    const transformed = {
      id: apiTestCase.attributes.id.toString(),
      projectId: projectId,
      folderId: folderId,
      title: apiTestCase.attributes.title,
      description: apiTestCase.attributes.description,
      preconditions: apiTestCase.attributes.preconditions || '', // Add preconditions from API
      priority: this.priorityFromApi[apiTestCase.attributes.priority as keyof typeof this.priorityFromApi] || 'medium',
      type: this.typeFromApi[apiTestCase.attributes.type as keyof typeof this.typeFromApi] || 'functional',
      status: this.statusFromApi[apiTestCase.attributes.state as keyof typeof this.statusFromApi] || 'draft',
      automationStatus: apiTestCase.attributes.automation, // Utilise directement le champ automation de l'API
      steps: [], // Steps would need to be fetched separately or included in the response
      sharedSteps: [], // Shared steps would need to be fetched separately
      stepResults: stepResults, // Add step result IDs
      tags: tags,
      createdAt: new Date(apiTestCase.attributes.createdAt),
      updatedAt: new Date(apiTestCase.attributes.updatedAt),
      estimatedDuration: apiTestCase.attributes.estimatedDuration || 5
    };
    
    console.log('✅ Transformed test case:', transformed.id, 'folderId:', transformed.folderId);
    return transformed;
  }
}

export const testCasesApiService = new TestCasesApiService();