import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import type { Youth, Report, Branch, HourlyRate } from './types';

export const getYouth = async (): Promise<Youth[]> => {
  const querySnapshot = await getDocs(collection(db, 'youth'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Youth));
};

export const addYouth = async (youth: any) => {
  await setDoc(doc(db, 'youth', youth.id), youth);
};

export const addReport = async (report: any) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), report);
    if (report.youthId) {
      const youthRef = doc(db, 'youth', report.youthId);
      await updateDoc(youthRef, { totalHours: increment(report.hours || 0) });
    }
    return docRef.id;
  } catch (e) { throw e; }
};

export const getReports = async (): Promise<Report[]> => {
  const querySnapshot = await getDocs(collection(db, 'reports'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

export const updateReport = async (reportId: string, updates: any) => {
  await updateDoc(doc(db, 'reports', reportId), updates);
};

export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await getDocs(collection(db, 'branches'));
  return querySnapshot.docs.map(doc => doc.data() as Branch);
};

export const getManagers = async () => {
  const branches = await getBranches();
  return branches.map(b => ({ name: b.name, password: b.password, role: 'manager' as any, branch: b.name }));
};

export const getRates = async (): Promise<HourlyRate[]> => {
  const querySnapshot = await getDocs(collection(db, 'rates'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HourlyRate));
};

export const saveRates = async (rates: any) => {
  await setDoc(doc(db, 'rates', 'current'), rates);
};

export const addRate = async (rate: Omit<HourlyRate, 'id'>) => {
  await addDoc(collection(db, 'rates'), rate);
};

export const deleteRate = async (id: string) => {
  await deleteDoc(doc(db, 'rates', id));
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