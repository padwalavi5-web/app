export type Role = 'guide' | 'manager' | 'youth';

export interface Youth {
  id: string;
  name: string;
  birthDate: string;
  personalBudgetNumber: string;
  totalHours: number;
  password?: string;
  branch?: string;
  role?: Role;
}

export interface Report {
  id: string;
  youthId: string;
  youthName: string;
  branch: string;
  date: string;
  hours: number;
  startTime: string;
  endTime: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

export interface Branch {
  name: string;
  password: string;
}

// עדכון הטיפוס הזה יפתור את רוב השגיאות ב-ManagerRates
export interface HourlyRate {
  id?: string;
  age: number;
  rate: number;
  amount?: number; 
}

export interface Rate {
  id: string;
  normal: number;
  weekend: number;
}