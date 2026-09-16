import { Assignment, ClassRoom, Student, Submission } from '../types';

const STORAGE_KEYS = {
  CLASSES: 'quran_recite_classes_v2',
  STUDENTS: 'quran_recite_students_v3',
  ASSIGNMENTS: 'quran_recite_assignments_v3',
  SUBMISSIONS: 'quran_recite_submissions_v2',
  CURRENT_USER: 'quran_recite_current_user',
};

// Seed initial data with 5 classes: فرقة ١ إلى ٥
const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'class-1', name: 'الفرقة ١', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-2', name: 'الفرقة ٢', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-3', name: 'الفرقة ٣', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-4', name: 'الفرقة ٤', createdAt: '2026-09-01T10:00:00Z' },
  { id: 'class-5', name: 'الفرقة ٥', createdAt: '2026-09-01T10:00:00Z' },
];

// No registered students by default
const INITIAL_STUDENTS: Student[] = [];

// No assigned assignments by default
const INITIAL_ASSIGNMENTS: Assignment[] = [];

// Ensure all previous mock students & assignments are purged from localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('quran_recite_students_v2');
    localStorage.removeItem('quran_recite_students_v1');
    if (!localStorage.getItem('quran_recite_cleared_all_v3')) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
      localStorage.setItem('quran_recite_cleared_all_v3', 'true');
    }

    localStorage.removeItem('quran_recite_assignments_v2');
    localStorage.removeItem('quran_recite_assignments_v1');
    if (!localStorage.getItem('quran_recite_cleared_assignments_v3')) {
      localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify([]));
      localStorage.setItem('quran_recite_cleared_assignments_v3', 'true');
    }
  } catch (e) {
    console.warn('Storage purge error', e);
  }
}

// IndexedDB Helper for storing large audio blobs safely
const DB_NAME = 'QuranReciteAudioDB';
const STORE_NAME = 'recordings';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioToIDB(id: string, base64Audio: string): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(base64Audio, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback: Audio could not be saved to IndexedDB, using localStorage directly', err);
  }
}

export async function getAudioFromIDB(id: string): Promise<string | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return null;
  }
}

export async function deleteAudioFromIDB(id: string): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error', err);
  }
}

// Local Storage Wrappers
export function getClasses(): ClassRoom[] {
  const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    return INITIAL_CLASSES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_CLASSES;
  }
}

export function saveClass(name: string): ClassRoom {
  const classes = getClasses();
  const newClass: ClassRoom = {
    id: `class-${Date.now()}`,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  classes.push(newClass);
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  return newClass;
}

export function updateClass(classId: string, name: string): ClassRoom | null {
  const classes = getClasses();
  const index = classes.findIndex(c => c.id === classId);
  if (index === -1) return null;
  classes[index].name = name.trim();
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));

  // Sync className in submissions
  const submissions = getSubmissions();
  let subModified = false;
  submissions.forEach(s => {
    if (s.classId === classId) {
      s.className = name.trim();
      subModified = true;
    }
  });
  if (subModified) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }

  return classes[index];
}

export function deleteClass(classId: string): void {
  const classes = getClasses().filter(c => c.id !== classId);
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
}

export function getStudents(): Student[] {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function saveStudent(student: Omit<Student, 'id' | 'createdAt'>): Student {
  const students = getStudents();
  const newStudent: Student = {
    ...student,
    id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  students.push(newStudent);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  return newStudent;
}

export function updateStudent(
  studentId: string,
  updates: { name?: string; personalNumber?: string; classId?: string }
): Student | null {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index === -1) return null;

  if (updates.name !== undefined) {
    students[index].name = updates.name.trim();
  }
  if (updates.personalNumber !== undefined) {
    students[index].personalNumber = updates.personalNumber.trim();
  }
  if (updates.classId !== undefined) {
    students[index].classId = updates.classId;
  }

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  // Synchronize student's existing submissions so reports and tables remain accurate
  const submissions = getSubmissions();
  const classes = getClasses();
  let subModified = false;

  submissions.forEach(sub => {
    if (sub.studentId === studentId) {
      if (updates.name !== undefined) sub.studentName = updates.name.trim();
      if (updates.personalNumber !== undefined) sub.personalNumber = updates.personalNumber.trim();
      if (updates.classId !== undefined) {
        sub.classId = updates.classId;
        const targetClass = classes.find(c => c.id === updates.classId);
        if (targetClass) sub.className = targetClass.name;
      }
      subModified = true;
    }
  });

  if (subModified) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }

  return students[index];
}

export function saveBulkStudents(newStudents: Array<{ name: string; personalNumber: string; classId: string }>): number {
  const students = getStudents();
  let addedCount = 0;
  
  newStudents.forEach(item => {
    if (!item.name || !item.personalNumber) return;
    // Prevent duplicate personal numbers in same class
    const exists = students.some(s => s.personalNumber.trim() === item.personalNumber.trim() && s.classId === item.classId);
    if (!exists) {
      students.push({
        id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name.trim(),
        personalNumber: item.personalNumber.trim(),
        classId: item.classId,
        createdAt: new Date().toISOString(),
      });
      addedCount++;
    }
  });

  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  return addedCount;
}

export function deleteStudent(studentId: string): void {
  const students = getStudents().filter(s => s.id !== studentId);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function deleteStudentsInClass(classId: string): number {
  const students = getStudents();
  const filtered = students.filter(s => s.classId !== classId);
  const deletedCount = students.length - filtered.length;
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
  return deletedCount;
}

export function deleteAllStudents(): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  localStorage.removeItem('quran_recite_students_v2');
  localStorage.removeItem('quran_recite_students_v1');
}

export function getAssignments(): Assignment[] {
  const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    return INITIAL_ASSIGNMENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_ASSIGNMENTS;
  }
}

export function saveAssignment(assignment: Omit<Assignment, 'id' | 'createdAt'>): Assignment {
  const assignments = getAssignments();
  const newAssignment: Assignment = {
    ...assignment,
    id: `asg-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  assignments.unshift(newAssignment);
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  return newAssignment;
}

export function updateAssignment(
  assignmentId: string,
  updates: Partial<Omit<Assignment, 'id' | 'createdAt'>>
): Assignment | null {
  const assignments = getAssignments();
  const index = assignments.findIndex(a => a.id === assignmentId);
  if (index === -1) return null;

  assignments[index] = {
    ...assignments[index],
    ...updates,
  };

  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));

  // Sync title in submissions
  if (updates.title) {
    const submissions = getSubmissions();
    let subModified = false;
    submissions.forEach(sub => {
      if (sub.assignmentId === assignmentId) {
        sub.assignmentTitle = updates.title!;
        subModified = true;
      }
    });
    if (subModified) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    }
  }

  return assignments[index];
}

export function deleteAssignment(assignmentId: string): void {
  const assignments = getAssignments().filter(a => a.id !== assignmentId);
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
}

export function deleteAllAssignments(): void {
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify([]));
  localStorage.removeItem('quran_recite_assignments_v2');
  localStorage.removeItem('quran_recite_assignments_v1');
}

export function getSubmissions(): Submission[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveSubmission(submission: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission> {
  const submissions = getSubmissions();
  const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Save audio to IndexedDB for reliable playback of heavy audio files
  if (submission.audioBase64) {
    await saveAudioToIDB(id, submission.audioBase64);
  }

  const newSubmission: Submission = {
    ...submission,
    id,
    submittedAt: new Date().toISOString(),
  };

  submissions.unshift(newSubmission);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  return newSubmission;
}

export async function getSubmissionAudio(submission: Submission): Promise<string> {
  if (submission.audioBase64 && submission.audioBase64.startsWith('data:audio')) {
    return submission.audioBase64;
  }
  const idbAudio = await getAudioFromIDB(submission.id);
  if (idbAudio) return idbAudio;
  return submission.audioBase64 || '';
}

export function updateSubmissionTeacherFeedback(
  submissionId: string,
  teacherGrade: number | null,
  teacherNotes: string
): void {
  const submissions = getSubmissions();
  const index = submissions.findIndex(s => s.id === submissionId);
  if (index !== -1) {
    submissions[index].teacherGrade = teacherGrade;
    submissions[index].teacherNotes = teacherNotes;
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  const submissions = getSubmissions().filter(s => s.id !== submissionId);
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  await deleteAudioFromIDB(submissionId);
}
