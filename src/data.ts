import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import type { Youth, Report, Branch, HourlyRate } from './types';

// --- ניהול נוער ---
export const getYouth = async (): Promise<Youth[]> => {
  const querySnapshot = await getDocs(collection(db, 'youth'));
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  } as Youth));
};

export const addYouth = async (youth: any) => {
  // יוצרים ID מבוסס שם ומספר תקציב כדי למנוע כפילויות
  const id = `${youth.name}_${youth.personalBudgetNumber}`;
  await setDoc(doc(db, 'youth', id), {
    ...youth,
    id: id,
    totalHours: 0,
    lastResetHours: 0 // שומר את כמות השעות שהייתה בזמן האיפוס האחרון
  });
};

// --- ניהול דיווחים ---
export const addReport = async (report: any) => {
  const docRef = await addDoc(collection(db, 'reports'), report);
  return docRef.id;
};

export const getReports = async (): Promise<Report[]> => {
  const querySnapshot = await getDocs(collection(db, 'reports'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

export const updateReport = async (reportId: string, updates: any) => {
  await updateDoc(doc(db, 'reports', reportId), updates);
};

// --- ניהול ענפים (תיקון השמירה והשליפה) ---
export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await getDocs(collection(db, 'branches'));
  return querySnapshot.docs.map(doc => doc.data() as Branch);
};

export const saveBranch = async (branch: Branch) => {
  await setDoc(doc(db, 'branches', branch.name), branch);
};

export const deleteBranch = async (branchName: string) => {
  await deleteDoc(doc(db, 'branches', branchName));
};

export const getManagers = async () => {
  const querySnapshot = await getDocs(collection(db, 'branches'));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      name: data.name, 
      password: data.password, 
      role: 'manager' as any, 
      branch: data.name 
    };
  });
};

// --- תעריפים ואיפוסים ---
export const getRates = async (): Promise<HourlyRate[]> => {
  const querySnapshot = await getDocs(collection(db, 'rates'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HourlyRate));
};

export const resetPaidHoursOnly = async (youthId: string, currentTotal: number) => {
  if (!youthId) return;
  // מעדכנים את ה-Baseline לטוטאל הנוכחי. 
  // כך בפעם הבאה: (CurrentTotal - LastReset) יתחיל מ-0.
  await updateDoc(doc(db, 'youth', youthId), { 
    lastResetHours: currentTotal 
  });
};

export const resetEverythingForJuly = async (youthId: string) => {
  if (!youthId) return;
  await updateDoc(doc(db, 'youth', youthId), { 
    totalHours: 0,
    lastResetHours: 0 
  });
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const setCurrentUser = (user: any) => localStorage.setItem('currentUser', JSON.stringify(user));
export const getCurrentUser = () => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};
export const logout = () => localStorage.removeItem('currentUser');