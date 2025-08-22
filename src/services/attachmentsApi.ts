import { apiService } from './api';

export interface CreateAttachmentRequest {
  data: {
    type: "Attachment";
    attributes: {
      url: string;
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

export interface CreateAttachmentResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      id: number;
      url: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

class AttachmentsApiService {
  async createAttachment(attachmentData: {
    url: string;
    userId: string;
  }): Promise<CreateAttachmentResponse> {
    const requestBody: CreateAttachmentRequest = {
      data: {
        type: "Attachment",
        attributes: {
          url: attachmentData.url
        },
        relationships: {
          user: {
            data: {
              type: "User",
              id: `/api/users/${attachmentData.userId}`
            }
          }
        }
      }
    };

    const response = await apiService.authenticatedRequest('/attachments', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    return response;
  }
}

export const attachmentsApiService = new AttachmentsApiService();