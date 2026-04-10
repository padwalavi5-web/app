import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import type { Youth, Report, Branch, HourlyRate } from './types';

// --- ניהול ענפים (Branches) ---
export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await getDocs(collection(db, 'branches'));
  return querySnapshot.docs.map(doc => doc.data() as Branch);
};

export const saveBranch = async (branch: Branch): Promise<boolean> => {
  try {
    // שמירה לפי שם הענף כ-ID כדי למנוע כפילויות
    await setDoc(doc(db, 'branches', branch.name), branch);
    return true; 
  } catch (e) {
    console.error("Error saving branch:", e);
    return false;
  }
};

export const deleteBranch = async (branchName: string) => {
  try {
    await deleteDoc(doc(db, 'branches', branchName));
  } catch (e) {
    console.error("Error deleting branch:", e);
  }
};

// --- ניהול נוער (Youth) ---
export const getYouth = async (): Promise<Youth[]> => {
  const querySnapshot = await getDocs(collection(db, 'youth'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Youth));
};

export const addYouth = async (youth: any) => {
  const id = `${youth.name}_${youth.personalBudgetNumber}`;
  await setDoc(doc(db, 'youth', id), { 
    ...youth, 
    id, 
    totalHours: 0, 
    lastResetHours: 0 
  });
};

// --- ניהול דיווחים (Reports) ---
export const addReport = async (report: Omit<Report, 'id'>) => {
  try {
    await addDoc(collection(db, 'reports'), report);
  } catch (e) {
    console.error("Error adding report:", e);
  }
};

export const getReports = async (): Promise<Report[]> => {
  const querySnapshot = await getDocs(collection(db, 'reports'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

export const updateReport = async (reportId: string, updates: Partial<Report>) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, updates);
  } catch (e) {
    console.error("Error updating report:", e);
  }
};

// --- ניהול תעריפים (Rates) ---
export const getRates = async (): Promise<HourlyRate[]> => {
  const querySnapshot = await getDocs(collection(db, 'rates'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HourlyRate));
};

export const addRate = async (rate: Omit<HourlyRate, 'id'>) => {
  try {
    await addDoc(collection(db, 'rates'), rate);
  } catch (e) {
    console.error("Error adding rate:", e);
  }
};

// --- לוגיקה עסקית ומשתמשים ---
export const getManagers = async () => {
  const branches = await getBranches();
  return branches.map(b => ({
    name: b.name,
    password: b.password,
    role: 'manager' as const,
    branch: b.name
  }));
};

export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const resetPaidHours = async (youthId: string, currentTotal: number) => {
  await updateDoc(doc(db, 'youth', youthId), { lastResetHours: currentTotal });
};

// --- ניהול Session (LocalStorage) ---
export const setCurrentUser = (user: any) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};