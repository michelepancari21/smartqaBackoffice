import { apiService } from './api';

export interface ApiTag {
  id: string;
  type: string;
  attributes: {
    id: number;
    label: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TagsApiResponse {
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
  data: ApiTag[];
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
  data: ApiTag;
}

export interface Tag {
  id: string;
  label: string;
}

class TagsApiService {
  public getDefaultTagsResponse(): TagsApiResponse {
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

  async getTags(): Promise<TagsApiResponse> {
    const response = await apiService.authenticatedRequest('/tags?itemsPerPage=100');
    return response || this.getDefaultTagsResponse();
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

  // Helper method to transform API tag to our internal format
  transformApiTag(apiTag: ApiTag): Tag {
    return {
      id: apiTag.attributes.id.toString(),
      label: apiTag.attributes.label
    };
  }
}

export const tagsApiService = new TagsApiService();