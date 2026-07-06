export type Role = 'youth' | 'manager' | 'guide';

export const VOLUNTEER_BRANCH_NAME = 'התנדבות';

export interface Youth {
  id: string;
  name: string;
  birthDate: string;
  personalBudgetNumber: string;
  totalHours: number;
  lastResetHours: number;
  manualHoursAdjustment?: number;
  manualVolunteerAdjustment?: number;
  budget?: number;
}

export interface Report {
  id?: string;
  youthId: string;
  youthName: string;
  branch: string;
  reportType?: 'work' | 'volunteer';
  details?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  approvalTarget?: 'manager' | 'guide';
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  reviewNote?: string;
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

export interface ManagerUser {
  role: 'manager';
  branch: string;
}

export interface GuideUser {
  role: 'guide';
}

export type YouthUser = Youth & { role: 'youth' };

export type CurrentUser = YouthUser | ManagerUser | GuideUser;

export interface ManagerCredential {
  branch: string;
  password: string;
}
