export type Role = 'youth' | 'manager' | 'guide';

export interface Youth {
  id: string;
  name: string;
  birthDate: string;
  personalBudgetNumber: string;
  totalHours: number;
  lastResetHours: number;
  paidHours?: number; 
  budget?: number;
}

export interface Report {
  id?: string;
  youthId: string;
  youthName: string;
  branch: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Branch {
  name: string;
  password: string;
}

export interface HourlyRate {
  id: string;
  age: number;
  rate: number;
}