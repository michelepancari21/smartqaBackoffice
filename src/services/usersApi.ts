import { apiService } from './api';

export interface ApiUser {
  id: string;
  type: string;
  attributes: {
    id: number;
    name: string;
    login: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UsersApiResponse {
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
  data: ApiUser[];
}

export interface User {
  id: string;
  name: string;
  login: string;
  email: string;
}

class UsersApiService {
  public getDefaultUsersResponse(): UsersApiResponse {
    return {
      links: {
        self: '',
        first: '',
        last: ''
      },
      meta: {
        totalItems: 0,
        itemsPerPage: 100,
        currentPage: 1
      },
      data: []
    };
  }

  async getUsers(): Promise<UsersApiResponse> {
    const response = await apiService.authenticatedRequest('/users?itemsPerPage=100');
    return response || this.getDefaultUsersResponse();
  }

  // Helper method to transform API user to our internal format
  transformApiUser(apiUser: ApiUser): User {
    return {
      id: apiUser.attributes.id.toString(),
      name: apiUser.attributes.name,
      login: apiUser.attributes.login,
      email: apiUser.attributes.email
    };
  }
}

export const usersApiService = new UsersApiService();