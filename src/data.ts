import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import type {
  Branch,
  CurrentUser,
  HourlyRate,
  ManagerCredential,
  Report,
  Youth,
} from './types';

const REQUEST_TIMEOUT_MS = 12000;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timed out'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const normalizeBranch = (branchDoc: DocumentData | undefined, id?: string): Branch => ({
  name: String(branchDoc?.name ?? id ?? '').trim(),
  password: String(branchDoc?.password ?? '').trim(),
});

const normalizeYouth = (youthDoc: DocumentData | undefined, id: string): Youth => ({
  id,
  name: String(youthDoc?.name ?? '').trim(),
  birthDate: String(youthDoc?.birthDate ?? ''),
  personalBudgetNumber: String(youthDoc?.personalBudgetNumber ?? '').trim(),
  totalHours: Number(youthDoc?.totalHours ?? 0),
  lastResetHours: Number(youthDoc?.lastResetHours ?? 0),
  manualHoursAdjustment: Number(youthDoc?.manualHoursAdjustment ?? 0),
  budget: youthDoc?.budget === undefined ? undefined : Number(youthDoc.budget),
});

const normalizeReport = (reportDoc: DocumentData | undefined, id: string): Report => ({
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
  status:
    reportDoc?.status === 'approved' ||
    reportDoc?.status === 'rejected' ||
    reportDoc?.status === 'paid'
      ? reportDoc.status
      : 'pending',
  reviewNote: String(reportDoc?.reviewNote ?? ''),
});

export const getBranches = async (): Promise<Branch[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'branches')));
  return querySnapshot.docs
    .map((branchDoc) => normalizeBranch(branchDoc.data(), branchDoc.id))
    .filter((branch) => branch.name);
};

export const getManagers = async (): Promise<ManagerCredential[]> => {
  const branches = await getBranches();
  return branches.map((branch) => ({ branch: branch.name, password: branch.password }));
};

export const saveBranch = async (branch: Branch): Promise<boolean> => {
  try {
    const normalizedBranch = normalizeBranch(branch);
    if (!normalizedBranch.name || !normalizedBranch.password) {
      return false;
    }

    await setDoc(doc(db, 'branches', normalizedBranch.name), normalizedBranch);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const updateBranchPassword = async (branchName: string, newPassword: string) => {
  await updateDoc(doc(db, 'branches', branchName), { password: newPassword.trim() });
};

export const deleteBranch = async (branchName: string) => {
  await deleteDoc(doc(db, 'branches', branchName));
};

export const updateGuidePassword = async (newPassword: string) => {
  await setDoc(doc(db, 'config', 'guideSettings'), { password: newPassword.trim() }, { merge: true });
};

export const getGuidePassword = async (): Promise<string> => {
  const guideDoc = await withTimeout(getDoc(doc(db, 'config', 'guideSettings')));
  return String(guideDoc.data()?.password ?? 'admin');
};

export const getYouth = async (): Promise<Youth[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'youth')));
  return querySnapshot.docs.map((youthDoc) => normalizeYouth(youthDoc.data(), youthDoc.id));
};

export const addYouth = async (youth: Omit<Youth, 'id'>) => {
  const id = `${String(youth.name).trim()}_${String(youth.personalBudgetNumber).trim()}`;
  await setDoc(doc(db, 'youth', id), {
    ...youth,
    id,
    totalHours: Number(youth.totalHours ?? 0),
    lastResetHours: Number(youth.lastResetHours ?? 0),
    manualHoursAdjustment: Number(youth.manualHoursAdjustment ?? 0),
  });
  return id;
};

export const updateYouth = async (youthId: string, updates: Partial<Youth>) => {
  await updateDoc(doc(db, 'youth', youthId), updates);
};

export const deleteYouth = async (youthId: string) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'youth', youthId));

  const relatedReports = await getDocs(query(collection(db, 'reports'), where('youthId', '==', youthId)));
  relatedReports.docs.forEach((reportDoc) => {
    batch.delete(reportDoc.ref);
  });

  await batch.commit();
};

export const resetPaidHours = async (youthId: string, currentTotal: number) => {
  await updateDoc(doc(db, 'youth', youthId), { lastResetHours: Number(currentTotal) });
};

// --- פונקציה חדשה לעדכון אטומי של הנתונים ---
export const finalizePaymentCycle = async (
  youthUpdates: { youthId: string; lastResetHours: number }[],
  reportIds: string[]
) => {
  const batch = writeBatch(db);

  youthUpdates.forEach((update) => {
    const youthRef = doc(db, 'youth', update.youthId);
    batch.update(youthRef, { lastResetHours: update.lastResetHours });
  });

  reportIds.forEach((id) => {
    const reportRef = doc(db, 'reports', id);
    batch.update(reportRef, { status: 'paid' }); // מסמן את הדיווחים כ"שולמו"
  });

  await batch.commit();
};

export const getRates = async (): Promise<HourlyRate[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'rates')));
  return querySnapshot.docs.map((rateDoc) => ({ id: rateDoc.id, ...rateDoc.data() }) as HourlyRate);
};

export const addRate = async (rate: Omit<HourlyRate, 'id'>) => {
  await addDoc(collection(db, 'rates'), rate);
};

export const deleteRate = async (rateId: string) => {
  await deleteDoc(doc(db, 'rates', rateId));
};

export const updateRate = async (rateId: string, updates: Partial<HourlyRate>) => {
  await updateDoc(doc(db, 'rates', rateId), updates);
};

export const addReport = async (report: Omit<Report, 'id'>) => {
  await addDoc(collection(db, 'reports'), report);
};

export const getReports = async (): Promise<Report[]> => {
  const querySnapshot = await withTimeout(getDocs(collection(db, 'reports')));
  return querySnapshot.docs.map((reportDoc) => normalizeReport(reportDoc.data(), reportDoc.id));
};

export const updateReport = async (reportId: string, updates: Partial<Report>) => {
  await updateDoc(doc(db, 'reports', reportId), updates);
};

export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
};

export const setCurrentUser = (user: CurrentUser) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const getCurrentUser = (): CurrentUser | null => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};
