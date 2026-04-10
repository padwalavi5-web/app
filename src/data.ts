import { db } from './firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Branch, HourlyRate, Report, Youth } from './types';

const normalizeBranch = (branchDoc: Partial<Branch>, id?: string): Branch => ({
  name: String(branchDoc?.name ?? id ?? '').trim(),
  password: String(branchDoc?.password ?? ''),
});

const normalizeReport = (reportDoc: any, id: string): Report => ({
  id,
  youthId: String(reportDoc?.youthId ?? ''),
  youthName: String(reportDoc?.youthName ?? ''),
  branch: String(reportDoc?.branch ?? ''),
  details: String(reportDoc?.details ?? ''),
  date: String(reportDoc?.date ?? ''),
  startTime: String(reportDoc?.startTime ?? ''),
  endTime: String(reportDoc?.endTime ?? ''),
  totalHours: Number(reportDoc?.totalHours ?? 0),
  approvalTarget: reportDoc?.approvalTarget === 'guide' ? 'guide' : 'manager',
  status: reportDoc?.status ?? 'pending',
});

export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await getDocs(collection(db, 'branches'));
  return querySnapshot.docs
    .map((branchDoc) => normalizeBranch(branchDoc.data(), branchDoc.id))
    .filter((branch) => branch.name);
};

export const saveBranch = async (branch: Branch): Promise<boolean> => {
  try {
    const normalizedBranch = normalizeBranch(branch);
    if (!normalizedBranch.name || !normalizedBranch.password.trim()) {
      return false;
    }

    await setDoc(doc(db, 'branches', normalizedBranch.name), normalizedBranch);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteBranch = async (branchName: string) => {
  await deleteDoc(doc(db, 'branches', branchName));
};

export const getYouth = async (): Promise<Youth[]> => {
  const querySnapshot = await getDocs(collection(db, 'youth'));
  return querySnapshot.docs.map((youthDoc) => ({ id: youthDoc.id, ...youthDoc.data() } as Youth));
};

export const addYouth = async (youth: Omit<Youth, 'id'>) => {
  const id = `${String(youth.name).trim()}_${String(youth.personalBudgetNumber).trim()}`;
  await setDoc(doc(db, 'youth', id), { ...youth, id, totalHours: 0, lastResetHours: 0 });
  return id;
};

export const getRates = async (): Promise<HourlyRate[]> => {
  const querySnapshot = await getDocs(collection(db, 'rates'));
  return querySnapshot.docs.map((rateDoc) => ({ id: rateDoc.id, ...rateDoc.data() } as HourlyRate));
};

export const addRate = async (rate: Omit<HourlyRate, 'id'>) => {
  await addDoc(collection(db, 'rates'), rate);
};

export const resetPaidHours = async (youthId: string, currentTotal: number) => {
  await updateDoc(doc(db, 'youth', youthId), { lastResetHours: currentTotal });
};

export const addReport = async (report: Omit<Report, 'id'>) => {
  await addDoc(collection(db, 'reports'), report);
};

export const getReports = async (): Promise<Report[]> => {
  const querySnapshot = await getDocs(collection(db, 'reports'));
  return querySnapshot.docs.map((reportDoc) => normalizeReport(reportDoc.data(), reportDoc.id));
};

export const updateReport = async (reportId: string, updates: Partial<Report>) => {
  await updateDoc(doc(db, 'reports', reportId), updates);
};

export const getManagers = async () => {
  const branches = await getBranches();
  return branches.map((branch) => ({ ...branch, role: 'manager' as const, branch: branch.name }));
};

export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
};

export const setCurrentUser = (user: any) => localStorage.setItem('currentUser', JSON.stringify(user));
export const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser') || 'null');
export const logout = () => localStorage.removeItem('currentUser');
