import * as XLSX from 'xlsx';
import { Submission, Student, ClassRoom } from '../types';

export interface ParsedStudentRow {
  name: string;
  personalNumber: string;
}

export function parseStudentsFile(file: File): Promise<ParsedStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });
        if (!rows || rows.length === 0) {
          return resolve([]);
        }

        const students: ParsedStudentRow[] = [];
        let startIndex = 0;

        // Check if first row is header
        const firstRow = rows[0].map(cell => String(cell || '').trim().toLowerCase());
        const hasHeader = firstRow.some(cell => 
          cell.includes('اسم') || 
          cell.includes('name') || 
          cell.includes('رقم') || 
          cell.includes('id') || 
          cell.includes('شخصي')
        );

        if (hasHeader) {
          startIndex = 1;
        }

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          // Expect column 0 = Name, column 1 = Personal ID (or vice versa if digits found)
          let col0 = String(row[0] || '').trim();
          let col1 = String(row[1] || '').trim();

          if (!col0 && !col1) continue;

          let studentName = col0;
          let personalNumber = col1;

          // If col0 is purely numbers and col1 has letters, swap them
          if (/^\d+$/.test(col0) && !/^\d+$/.test(col1)) {
            personalNumber = col0;
            studentName = col1;
          }

          if (studentName) {
            students.push({
              name: studentName,
              personalNumber: personalNumber || `${1000 + i}`,
            });
          }
        }

        resolve(students);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function exportSubmissionsToExcel(submissions: Submission[], filename: string = 'درجات_تلاوة_القرآن'): void {
  const exportData = submissions.map((sub, idx) => ({
    'م': idx + 1,
    'الصف الدراسي': sub.className,
    'اسم الطالب': sub.studentName,
    'الرقم الشخصي': sub.personalNumber,
    'الواجب الأسبوعي': sub.assignmentTitle,
    'نسبة الدقة': `${sub.accuracyPercentage}%`,
    'التقييم العام (من 10)': sub.aiScore,
    'درجة التجويد (من 10)': sub.tajweedScore !== undefined ? sub.tajweedScore : sub.aiScore,
    'درجة المعلم المعتمدة (من 10)': sub.teacherGrade !== null ? sub.teacherGrade : 'قيد المراجعة',
    'ملاحظات المعلم': sub.teacherNotes || 'لا توجد ملاحظات',
    'تاريخ الإرسال': new Date(sub.submittedAt).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set RTL on sheet if supported
  if (!worksheet['!views']) {
    worksheet['!views'] = [{ RTL: true }];
  }

  // Adjust column widths
  worksheet['!cols'] = [
    { wch: 5 },  // م
    { wch: 22 }, // الصف
    { wch: 20 }, // اسم الطالب
    { wch: 14 }, // الرقم الشخصي
    { wch: 30 }, // الواجب
    { wch: 12 }, // نسبة الدقة
    { wch: 20 }, // تقييم الذكاء الاصطناعي
    { wch: 20 }, // درجة المعلم
    { wch: 35 }, // ملاحظات المعلم
    { wch: 24 }, // تاريخ الإرسال
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'درجات التلاوة');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    { 'اسم الطالب': 'محمد عبد الله', 'الرقم الشخصي': '101' },
    { 'اسم الطالب': 'أحمد إبراهيم', 'الرقم الشخصي': '102' },
    { 'اسم الطالب': 'سالم الكعبي', 'الرقم الشخصي': '103' },
    { 'اسم الطالب': 'خالد المنصوري', 'الرقم الشخصي': '104' },
    { 'اسم الطالب': 'يوسف القحطاني', 'الرقم الشخصي': '105' },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [{ wch: 25 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قالب الطلاب');
  XLSX.writeFile(wb, 'قالب_بيانات_الطلاب.xlsx');
}

export function exportStudentsListToExcel(students: Student[], classes: ClassRoom[], filename: string = 'قائمة_الطلاب_المسجلين'): void {
  const classMap = new Map(classes.map(c => [c.id, c.name]));
  const exportData = students.map((std, idx) => ({
    'م': idx + 1,
    'اسم الطالب': std.name,
    'الرقم الشخصي': std.personalNumber,
    'الصف الدراسي': classMap.get(std.classId) || 'غير محدد',
    'تاريخ التسجيل': new Date(std.createdAt).toLocaleDateString('ar-SA'),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 16 }, { wch: 20 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
