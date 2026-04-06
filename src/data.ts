import type { Youth, Manager, Branch, HourlyRate, Report } from './types';
import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

// Utility function to calculate age from birth date
export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Get hourly rate by age
export const getRateByAge = async (age: number): Promise<number> => {
  const rates = await getRates();
  const rate = rates.find(r => r.age === age);
  return rate ? rate.rate : 0;
};

const STORAGE_KEYS = {
  YOUTH: 'kibbutz_youth',
  MANAGERS: 'kibbutz_managers',
  BRANCHES: 'kibbutz_branches',
  RATES: 'kibbutz_rates',
  REPORTS: 'kibbutz_reports',
  CURRENT_USER: 'kibbutz_current_user',
};

// Mock data for fallback
const mockYouth: Youth[] = [
  {
    id: '1',
    name: 'דניאל כהן',
    birthDate: '2008-04-05', // 16 years old
    personalBudgetNumber: '12345',
    totalHours: 85,
    paidHours: 0,
    budget: 0,
  },
  {
    id: '2',
    name: 'שרה לוי',
    birthDate: '2007-04-05', // 17 years old
    personalBudgetNumber: '12346',
    totalHours: 95,
    paidHours: 5,
    budget: 50,
  },
];

const mockManagers: Manager[] = [
  {
    id: 'm1',
    name: 'יוסי רוזן',
    branch: 'רפת',
    password: 'pass1',
  },
];

const mockBranches: Branch[] = [
  { name: 'רפת', password: 'pass1' },
  { name: 'נוי', password: 'pass2' },
  { name: 'חדר אוכל', password: 'pass3' },
  { name: 'מטבח', password: 'pass4' },
  { name: 'כלבו', password: 'pass5' },
  { name: 'אחר', password: 'pass6' },
];

const mockRates: HourlyRate[] = [
  { age: 14, rate: 5 },
  { age: 15, rate: 6 },
  { age: 16, rate: 7 },
  { age: 17, rate: 8 },
  { age: 18, rate: 9 },
];

const mockReports: Report[] = [
  {
    id: 'r1',
    youthId: '1',
    branch: 'רפת',
    date: '2024-04-01',
    startTime: '08:00',
    endTime: '12:00',
    totalHours: 4,
    status: 'approved',
  },
  {
    id: 'r2',
    youthId: '1',
    branch: 'נוי',
    date: '2024-04-02',
    startTime: '14:00',
    endTime: '18:00',
    totalHours: 4,
    status: 'pending',
  },
];

// Firebase functions
export const getYouth = async (): Promise<Youth[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'youth'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Youth));
  } catch (error) {
    console.error('Error fetching youth:', error);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.YOUTH) || JSON.stringify(mockYouth));
  }
};

export const saveYouth = async (youth: Youth[]) => {
  try {
    // For simplicity, we'll update localStorage as backup
    localStorage.setItem(STORAGE_KEYS.YOUTH, JSON.stringify(youth));
    // In a real app, you'd sync with Firebase
  } catch (error) {
    console.error('Error saving youth:', error);
  }
};

export const addYouth = async (newYouth: Omit<Youth, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'youth'), newYouth);
    return docRef.id;
  } catch (error) {
    console.error('Error adding youth:', error);
    // Fallback to local
    const youth = await getYouth();
    const id = Date.now().toString();
    youth.push({ ...newYouth, id });
    saveYouth(youth);
    return id;
  }
};

export const getManagers = async (): Promise<Manager[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'managers'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Manager));
  } catch (error) {
    console.error('Error fetching managers:', error);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MANAGERS) || JSON.stringify(mockManagers));
  }
};

export const saveManagers = async (managers: Manager[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MANAGERS, JSON.stringify(managers));
  } catch (error) {
    console.error('Error saving managers:', error);
  }
};

export const getBranches = async (): Promise<Branch[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'branches'));
    return querySnapshot.docs.map(doc => doc.data() as Branch);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANCHES) || JSON.stringify(mockBranches));
  }
};

export const saveBranches = async (branches: Branch[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  } catch (error) {
    console.error('Error saving branches:', error);
  }
};

export const getRates = async (): Promise<HourlyRate[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'rates'));
    return querySnapshot.docs.map(doc => doc.data() as HourlyRate);
  } catch (error) {
    console.error('Error fetching rates:', error);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RATES) || JSON.stringify(mockRates));
  }
};

export const saveRates = async (rates: HourlyRate[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
  } catch (error) {
    console.error('Error saving rates:', error);
  }
};

export const addRate = async (newRate: HourlyRate) => {
  try {
    await addDoc(collection(db, 'rates'), newRate);
  } catch (error) {
    console.error('Error adding rate:', error);
    // Fallback to local
    const rates = await getRates();
    rates.push(newRate);
    saveRates(rates);
  }
};

export const updateRate = async (age: number, newRate: number) => {
  try {
    // Note: This is a simple implementation. In a real app, you'd use a proper ID
    const rates = await getRates();
    const index = rates.findIndex(r => r.age === age);
    if (index !== -1) {
      rates[index].rate = newRate;
      saveRates(rates);
    }
  } catch (error) {
    console.error('Error updating rate:', error);
  }
};

export const deleteRate = async (age: number) => {
  try {
    const rates = await getRates();
    const filteredRates = rates.filter(r => r.age !== age);
    saveRates(filteredRates);
  } catch (error) {
    console.error('Error deleting rate:', error);
  }
};

export const getReports = async (): Promise<Report[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'reports'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  } catch (error) {
    console.error('Error fetching reports:', error);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || JSON.stringify(mockReports));
  }
};

export const saveReports = async (reports: Report[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  } catch (error) {
    console.error('Error saving reports:', error);
  }
};

export const addReport = async (newReport: Omit<Report, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), newReport);
    return docRef.id;
  } catch (error) {
    console.error('Error adding report:', error);
    // Fallback
    const reports = await getReports();
    const id = Date.now().toString();
    reports.push({ ...newReport, id });
    saveReports(reports);
    return id;
  }
};

export const updateReport = async (id: string, updates: Partial<Report>) => {
  try {
    const reportRef = doc(db, 'reports', id);
    await updateDoc(reportRef, updates);
  } catch (error) {
    console.error('Error updating report:', error);
    // Fallback
    const reports = await getReports();
    const index = reports.findIndex(r => r.id === id);
    if (index !== -1) {
      reports[index] = { ...reports[index], ...updates };
      saveReports(reports);
    }
  }
};

export const getCurrentUser = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

export const setCurrentUser = (user: any) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const resetPaidHours = async () => {
  const youth = await getYouth();
  const updatedYouth = youth.map(y => {
    if (y.totalHours > 90) {
      const paid = y.totalHours - 90;
      return { ...y, totalHours: 90, paidHours: y.paidHours + paid };
    }
    return y;
  });
  await saveYouth(updatedYouth);
  return updatedYouth;
};

export const resetUnder90Hours = async () => {
  const today = new Date();
  if (today.getMonth() === 5 && today.getDate() === 20) { // June 20
    const youth = await getYouth();
    const updatedYouth = youth.map(y => {
      if (y.totalHours <= 90) {
        return { ...y, totalHours: 0 };
      }
      return y;
    });
    await saveYouth(updatedYouth);
    return updatedYouth;
  }
  return await getYouth();
};