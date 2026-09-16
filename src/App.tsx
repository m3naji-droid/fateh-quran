import React, { useState, useEffect } from 'react';
import { CurrentUser, Student, ClassRoom } from './types';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentInterface } from './components/StudentInterface';
import {
  getClasses,
  getStudents,
  getAssignments,
  getSubmissions,
} from './utils/storage';

const SESSION_STORAGE_KEY = 'quran_recite_session_user';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { role: 'none' };
  });

  const [classes, setClasses] = useState(getClasses);
  const [students, setStudents] = useState(getStudents);
  const [assignments, setAssignments] = useState(getAssignments);
  const [submissions, setSubmissions] = useState(getSubmissions);

  // Student active tab
  const [studentActiveTab, setStudentActiveTab] = useState<string>('current-assignment');

  // Teacher active section
  const [teacherActiveSection, setTeacherActiveSection] = useState<'submissions' | 'classes' | 'assignments'>('submissions');

  // Refresh all state from storage
  const refreshData = () => {
    setClasses(getClasses());
    setStudents(getStudents());
    setAssignments(getAssignments());
    setSubmissions(getSubmissions());
  };

  const handleTeacherLogin = (teacherName: string) => {
    const user: CurrentUser = {
      role: 'teacher',
      teacherName,
    };
    setCurrentUser(user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  };

  const handleStudentLogin = (student: Student, classRoom: ClassRoom) => {
    const user: CurrentUser = {
      role: 'student',
      student,
      classRoom,
    };
    setCurrentUser(user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser({ role: 'none' });
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f2] text-stone-900 font-sans" dir="rtl">
      {/* Navigation Bar (visible when logged in) */}
      {currentUser.role !== 'none' && (
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          activeTab={studentActiveTab}
          onTabChange={setStudentActiveTab}
          teacherTab={teacherActiveSection}
          onTeacherTabChange={setTeacherActiveSection}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentUser.role === 'none' && (
          <AuthScreen
            classes={classes}
            students={students}
            onTeacherLogin={handleTeacherLogin}
            onStudentLogin={handleStudentLogin}
          />
        )}

        {currentUser.role === 'teacher' && (
          <TeacherDashboard
            classes={classes}
            students={students}
            assignments={assignments}
            submissions={submissions}
            onDataRefresh={refreshData}
            activeSection={teacherActiveSection}
            onSectionChange={setTeacherActiveSection}
          />
        )}

        {currentUser.role === 'student' && currentUser.student && currentUser.classRoom && (
          <StudentInterface
            student={currentUser.student}
            classRoom={currentUser.classRoom}
            assignments={assignments}
            submissions={submissions}
            onSubmissionsUpdated={refreshData}
            activeTab={studentActiveTab}
            setActiveTab={setStudentActiveTab}
          />
        )}
      </main>

      {/* Subtle Islamic Footer */}
      <footer className="border-t border-emerald-100/80 bg-white/70 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-emerald-950">
            مقرأة الفاتح لتصحيح التلاوة وتجويد سورة يس المباركة
          </p>
          <p className="text-[11px] text-stone-400">
            تصميم متجاوب بالكامل • محرك تقييم ذكي فوري • حفظ صوتي دائم
          </p>
        </div>
      </footer>
    </div>
  );
}
