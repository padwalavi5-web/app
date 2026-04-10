import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Youth, Report, Branch, HourlyRate } from './types';

// --- ענפים ---
export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await getDocs(collection(db, 'branches'));
  return querySnapshot.docs.map(doc => doc.data() as Branch);
};

export const saveBranch = async (branch: Branch): Promise<boolean> => {
  try {
    await setDoc(doc(db, 'branches', branch.name), branch);
    return true; // התיקון שמונע את השגיאה ב-ManageBranches
  } catch (e) {
    console.error("Error saving branch:", e);
    return false;
  }
};

export const deleteBranch = async (branchName: string) => {
  await deleteDoc(doc(db, 'branches', branchName));
};

// --- נוער ---
export const getYouth = async (): Promise<Youth[]> => {
  const querySnapshot = await getDocs(collection(db, 'youth'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Youth));
};

export const addYouth = async (youth: any) => {
  const id = `${youth.name}_${youth.personalBudgetNumber}`;
  await setDoc(doc(db, 'youth', id), { ...youth, id, totalHours: 0, lastResetHours: 0 });
};

// --- דיווחים ---
export const addReport = async (report: Omit<Report, 'id'>) => {
  await addDoc(collection(db, 'reports'), report);
};

export const getReports = async (): Promise<Report[]> => {
  const querySnapshot = await getDocs(collection(db, 'reports'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

export const updateReport = async (reportId: string, updates: Partial<Report>) => {
  await updateDoc(doc(db, 'reports', reportId), updates);
};

// --- עזר וניהול ---
export const getManagers = async () => {
  const branches = await getBranches();
  return branches.map(b => ({ name: b.name, password: b.password, role: 'manager' as const, branch: b.name }));
};

export const getRates = async (): Promise<HourlyRate[]> => {
  const querySnapshot = await getDocs(collection(db, 'rates'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HourlyRate));
};

export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
};

export const resetPaidHours = async (youthId: string, currentTotal: number) => {
  await updateDoc(doc(db, 'youth', youthId), { lastResetHours: currentTotal });
};

export const setCurrentUser = (user: any) => localStorage.setItem('currentUser', JSON.stringify(user));
export const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser') || 'null');
export const logout = () => localStorage.removeItem('currentUser');
export const addRate = async (rate: Omit<HourlyRate, 'id'>) => {
  await addDoc(collection(db, 'rates'), rate);
};