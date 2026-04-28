import apiClient from './apiClient';

export interface FileUploadResponse {
  url: string;
  fileName: string;
}

export const uploadAudio = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<FileUploadResponse>('/files/upload-audio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadImage = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<FileUploadResponse>('/files/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const uploadVideo = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<FileUploadResponse>('/files/upload-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};


