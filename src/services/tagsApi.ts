import { apiService } from './api';

export interface ApiTagListItem {
  id: number;
  label: string;
  iri: string;
}

export interface TagsListApiResponse {
  data: ApiTagListItem[];
  meta: {
    totalItems: number;
  };
}

export interface CreateTagRequest {
  data: {
    type: "Tag";
    attributes: {
      label: string;
    };
  };
}

export interface CreateTagResponse {
  data: ApiTagListItem;
}

export interface Tag {
  id: string;
  label: string;
}

class TagsApiService {
  async getTags(): Promise<Tag[]> {
    const response: TagsListApiResponse = await apiService.authenticatedRequest(
      '/tags-list'
    );

    if (response && response.data) {
      return response.data.map(item => this.transformApiTag(item));
    }

    return [];
  }

  async createTag(label: string): Promise<CreateTagResponse> {
    const requestBody: CreateTagRequest = {
      data: {
        type: "Tag",
        attributes: {
          label: label
        }
      }
    };

    const response = await apiService.authenticatedRequest('/tags', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }

  transformApiTag(apiTag: ApiTagListItem): Tag {
    return {
      id: apiTag.id.toString(),
      label: apiTag.label
    };
  }
}

export const tagsApiService = new TagsApiService();