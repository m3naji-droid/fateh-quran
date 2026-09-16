import { TajweedAnalysisReport } from './utils/tajweedEngine';

export interface ClassRoom {
  id: string;
  name: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  personalNumber: string; // الرقم الشخصي
  classId: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  startAyah: number;
  endAyah: number;
  createdAt: string;
  instructions?: string;
}

export type WordStatus = 'correct' | 'mispronounced' | 'missing' | 'extra';

export interface WordEvaluation {
  word: string; // Original voweled text
  cleanWord: string; // Normalized word without diacritics
  status: WordStatus;
  recognizedWord?: string;
  ayahNumber: number;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  personalNumber: string;
  classId: string;
  className: string;
  assignmentId: string;
  assignmentTitle: string;
  audioBase64: string; // Base64 audio string for persistent audio playback
  durationSeconds: number;
  transcribedText: string;
  accuracyPercentage: number;
  aiScore: number; // Out of 10
  tajweedScore?: number; // Out of 10
  tajweedReport?: TajweedAnalysisReport;
  teacherGrade: number | null; // Teacher evaluated grade out of 10
  teacherNotes: string; // Teacher feedback
  wordEvaluations: WordEvaluation[];
  submittedAt: string;
}

export type UserRole = 'none' | 'teacher' | 'student';

export interface CurrentUser {
  role: UserRole;
  teacherName?: string;
  student?: Student;
  classRoom?: ClassRoom;
}
