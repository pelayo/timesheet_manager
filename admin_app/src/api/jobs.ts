import { api } from './axios';

export interface Job {
  id: string;
  name: string;
  data: any;
  state: 'created' | 'retry' | 'active' | 'completed' | 'expired' | 'cancelled' | 'failed';
  createdon: string;
  startedon: string;
  completedon: string;
  retrycount: number;
  output: any;
}

export const getJobs = async (): Promise<Job[]> => {
  const response = await api.get<Job[]>('/jobs');
  return response.data;
};

export const retryJob = async (id: string) => {
  const response = await api.post(`/jobs/${id}/retry`);
  return response.data;
};
