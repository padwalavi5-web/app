export interface Youth {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD format
  personalBudgetNumber: string;
  totalHours: number;
  paidHours: number;
  budget: number;
}

export interface Manager {
  id: string;
  name: string;
  branch: string;
  password: string;
}

export interface Branch {
  name: string;
  password: string;
}

export interface HourlyRate {
  age: number;
  rate: number;
}

export interface Report {
  id: string;
  youthId: string;
  branch: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

export type User = Youth | Manager | { role: 'guide' };

export type Role = 'youth' | 'manager' | 'guide';