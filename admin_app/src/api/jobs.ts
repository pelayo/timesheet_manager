import { api } from './axios';

export interface Job {
  id: string;
  name: string;
  data: any;
  state: 'created' | 'retry' | 'active' | 'completed' | 'expired' | 'cancelled' | 'failed';
  createdon: string | number;
  startedon: string | number | null;
  completedon: string | number | null;
  retrycount: number;
  output: any;
  queue?: string;
}

export const getJobs = async (): Promise<Job[]> => {
  const response = await api.get<Job[]>('/jobs');
  return response.data;
};

export const retryJob = async (id: string) => {
  const response = await api.post(`/jobs/${id}/retry`);
  return response.data;
};

export const uploadTeamworkExcel = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/jobs/teamwork-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
