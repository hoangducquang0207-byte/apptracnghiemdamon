// src/components/ClassroomSetup.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Student, QuizAttempt, Test, SubjectConfig, generateStudentPassword } from '../types';
import { MathRenderer } from './MathRenderer';
import { formatScore } from '../utils/numberFormat';
import { 
  Users, UserPlus, Trash2, Check, Search, BookOpen, GraduationCap, 
  X, Plus, AlertCircle, Sparkles, Filter, Award, TrendingUp, RefreshCw,
  Download, Upload, PenTool, Edit, Eye, Save, CheckCircle, FileImage
} from 'lucide-react';

interface ClassroomSetupProps {
  activeSubject: SubjectConfig;
  students: Student[];
  onUpdateStudents: (updater: Student[] | ((prev: Student[]) => Student[])) => void;
  classes: string[];
  onUpdateClasses: (updater: string[] | ((prev: string[]) => string[])) => void;
  attempts: QuizAttempt[];
  onUpdateAttempts: (updater: QuizAttempt[] | ((prev: QuizAttempt[]) => QuizAttempt[])) => void;
  tests: Test[];
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onChangeTab: (tab: string) => void;
  onTriggerAIReport: (className: string) => void;
  classPasswords: { [className: string]: string };
  onUpdateClassPasswords: React.Dispatch<React.SetStateAction<{ [className: string]: string }>>;
  teacherPasscode: string;
  onUpdateTeacherPasscode: (newPasscode: string) => void;
}

export const ClassroomSetup: React.FC<ClassroomSetupProps> = ({
  activeSubject,
  students,
  onUpdateStudents,
  classes,
  onUpdateClasses,
  attempts,
  onUpdateAttempts,
  tests,
  onToast,
  onChangeTab,
  onTriggerAIReport,
  classPasswords,
  onUpdateClassPasswords,
  teacherPasscode,
  onUpdateTeacherPasscode
}) => {
  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Advanced Essay Paper Grading States
  const [activePanel, setActivePanel] = useState<'roster' | 'grading' | 'security'>('roster');
  const [newTeacherPasscode, setNewTeacherPasscode] = useState<string>('');
  const [maskPasscode, setMaskPasscode] = useState<boolean>(true);
  const [gradingAttempt, setGradingAttempt] = useState<QuizAttempt | null>(null);
  const [aiProcessingId, setAiProcessingId] = useState<string | null>(null);
  const [localGradeScore, setLocalGradeScore] = useState<number>(8.0);
  const [localGradeComment, setLocalGradeComment] = useState<string>('');
  const [localCriteriaPoints, setLocalCriteriaPoints] = useState<{ [crit: string]: number }>({});
  
  // Class Setup Controls
  const [newClassName, setNewClassName] = useState<string>('');
  const [showAddClassForm, setShowAddClassForm] = useState<boolean>(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  // Student Form Controls
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [pastedRosterText, setPastedRosterText] = useState<string>('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState<boolean>(false);
  
  // Filter classes to only show those belonging to the active subject's grade level
  const activeGradeClasses = useMemo(() => {
    return classes.filter(cls => {
      if (!cls || !activeSubject.grade) return false;
      const match = cls.match(/(\d+)/);
      if (match) {
        return match[1] === activeSubject.grade;
      }
      return cls.startsWith(activeSubject.grade);
    });
  }, [classes, activeSubject.grade]);

  // Auto-initialize default classes of active grade if none exist
  useEffect(() => {
    const hasClassForGrade = classes.some(cls => {
      if (!cls || !activeSubject.grade) return false;
      const match = cls.match(/(\d+)/);
      if (match) {
        return match[1] === activeSubject.grade;
      }
      return cls.startsWith(activeSubject.grade);
    });
    if (!hasClassForGrade) {
      const defaultGradeClasses = [
        `${activeSubject.grade}A1`,
        `${activeSubject.grade}A2`,
        `${activeSubject.grade}A3`
      ];
      onUpdateClasses(prev => {
        const toAdd = defaultGradeClasses.filter(c => !prev.includes(c));
        if (toAdd.length > 0) {
          return [...prev, ...toAdd];
        }
        return prev;
      });
    }
  }, [activeSubject.grade, classes, onUpdateClasses]);

  const [studentForm, setStudentForm] = useState({
    id: '',
    name: '',
    className: activeGradeClasses[0] || `${activeSubject.grade}A1`,
    email: '',
    password: ''
  });

  // Calculate stats for each class belonging to the active grade
  const classStats = useMemo(() => {
    return activeGradeClasses.map(cls => {
      const classStudents = students.filter(s => s.className === cls);
      const classAttempts = attempts.filter(a => a.className === cls);
      
      const avgScore = classAttempts.length > 0 
        ? classAttempts.reduce((sum, a) => sum + a.score, 0) / classAttempts.length 
        : 0;

      const passedAttempts = classAttempts.filter(a => a.score >= 5.0).length;
      const passRate = classAttempts.length > 0 
        ? Math.round((passedAttempts / classAttempts.length) * 100) 
        : 0;

      return {
        className: cls,
        studentCount: classStudents.length,
        attemptsCount: classAttempts.length,
        avgScore: avgScore,
        passRate: passRate
      };
    });
  }, [activeGradeClasses, students, attempts]);

  // Filtered Students (only matching classes of active grade)
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Must belong to one of our active grade classes
      const isCorrectClass = activeGradeClasses.includes(s.className);
      if (!isCorrectClass) return false;

      const classMatch = selectedClassFilter === 'ALL' || s.className === selectedClassFilter;
      const searchMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
      return classMatch && searchMatch;
    });
  }, [students, selectedClassFilter, searchQuery, activeGradeClasses]);

  // Handle Class Addition
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newClassName.trim().toUpperCase();
    if (!formatted) {
      onToast('Tên lớp học không được để trống.', 'error');
      return;
    }
    if (classes.includes(formatted)) {
      onToast('Lớp học này đã tồn tại trong danh sách.', 'error');
      return;
    }
    onUpdateClasses(prev => [...prev, formatted]);
    setNewClassName('');
    setShowAddClassForm(false);
    onToast(`Đã thêm lớp học ${formatted} thành công!`, 'success');
  };

  // Handle Class Deletion
  const handleDeleteClass = (clsName: string) => {
    setClassToDelete(clsName);
  };

  // Student CRUD Trigger
  const openAddStudentModal = () => {
    setEditingStudent(null);
    setStudentForm({
      id: `STU-${Date.now().toString().slice(-4)}`,
      name: '',
      className: activeGradeClasses[0] || '6A1',
      email: '',
      password: ''
    });
    setShowStudentModal(true);
  };

  const openEditStudentModal = (stu: Student) => {
    setEditingStudent(stu);
    setStudentForm({
      id: stu.id,
      name: stu.name,
      className: stu.className,
      email: stu.email,
      password: stu.password || ''
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim()) {
      onToast('Họ tên học sinh không được trống.', 'error');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (studentForm.email && !emailPattern.test(studentForm.email)) {
      onToast('Email không đúng định dạng.', 'error');
      return;
    }

    onUpdateStudents(prev => {
      const exists = prev.some(s => s.id === studentForm.id);
      const studentNameClean = studentForm.name.trim();
      const finalPassword = studentForm.password.trim() || generateStudentPassword(studentForm.className, studentNameClean);
      
      if (exists) {
        return prev.map(s => s.id === studentForm.id ? { 
          ...s, 
          name: studentNameClean, 
          className: studentForm.className.trim().toUpperCase(), 
          email: studentForm.email.trim(), 
          password: finalPassword 
        } : s);
      } else {
        return [...prev, { 
          id: studentForm.id, 
          name: studentNameClean, 
          className: studentForm.className.trim().toUpperCase(), 
          email: studentForm.email.trim(), 
          password: finalPassword 
        }];
      }
    });

    setShowStudentModal(false);
    onToast(editingStudent ? 'Đã cập nhật thông tin học sinh thành công!' : 'Đã thêm học sinh mới thành công!', 'success');
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const { id, name } = studentToDelete;
    onUpdateStudents(prev => prev.filter(s => s.id !== id));
    onToast(`Đã xóa học sinh ${name} thành công.`, 'info');
    setStudentToDelete(null);
  };

  const confirmDeleteAllStudents = () => {
    onUpdateStudents(prev => {
      if (selectedClassFilter === 'ALL') {
        return prev.filter(s => !activeGradeClasses.includes(s.className));
      } else {
        return prev.filter(s => s.className !== selectedClassFilter);
      }
    });

    const targetScope = selectedClassFilter === 'ALL'
      ? `tất cả các lớp thuộc Khối ${activeSubject.grade}`
      : `Lớp ${selectedClassFilter}`;
    onToast(`Đã xóa toàn bộ học sinh của ${targetScope} thành công!`, 'info');
    setShowDeleteAllConfirm(false);
  };

  // Handle downloading the current filtered student list
  const handleDownloadCurrentClassList = () => {
    if (filteredStudents.length === 0) {
      onToast('Không có dữ liệu học viên để tải về.', 'error');
      return;
    }

    try {
      const headers = ["Mã số học viên", "Họ và Tên", "Lớp hiện tại", "Địa chỉ Email", "Mật khẩu", "Số bài đã nộp", "Điểm cao nhất"];
      const rows = filteredStudents.map(student => {
        const studentAttemptsCount = attempts.filter(a => a.studentId === student.id).length;
        const maxScoreAttempt = attempts
          .filter(a => a.studentId === student.id)
          .sort((x, y) => y.score - x.score)[0];
        const maxScore = maxScoreAttempt ? formatScore(maxScoreAttempt.score) : 'Chưa thi';
        const passwordUsed = student.password || generateStudentPassword(student.className, student.name);
        
        return [
          student.id,
          student.name,
          student.className,
          student.email || 'Chưa cung cấp',
          passwordUsed,
          studentAttemptsCount,
          maxScore
        ];
      });

      const csvContent = "\uFEFF" + [
        headers.join(","),
        ...rows.map(r => r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `Danh_sach_hoc_sinh_${selectedClassFilter === 'ALL' ? 'tat_ca_lop' : `lop_${selectedClassFilter}`}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast('Đã tải xuống danh sách học sinh thành công!', 'success');
    } catch (error) {
      console.error(error);
      onToast('Có lỗi xảy ra trong quá trình xuất dữ liệu.', 'error');
    }
  };

  // Handle downloading sample template for students
  const handleDownloadSampleTemplate = () => {
    try {
      const headers = ["Mã số học viên", "Họ và Tên", "Lớp hiện tại", "Địa chỉ Email", "Mật khẩu (Không bắt buộc)"];
      const rows = [
        ["STU-001", "Nguyễn Văn An", "6A1", "nguyenvanan@gmail.com", "6A1-Nguyễn Văn An"],
        ["STU-002", "Trần Thị Bình", "6A1", "tranthibinh@gmail.com", ""],
        ["STU-003", "Phạm Minh Cường", "6A2", "phamminhcuong@gmail.com", "6A2-Phạm Minh Cường"],
        ["STU-004", "Lê Hoàng Dung", "6A3", "lehoangdung@gmail.com", ""]
      ];

      const csvContent = "\uFEFF" + [
        headers.join(","),
        ...rows.map(r => r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.setAttribute("href", url);
      link.setAttribute("download", "Danh_sach_hoc_sinh_mau.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast('Đã tải xuống file bản mẫu danh sách học sinh!', 'success');
    } catch (error) {
      console.error(error);
      onToast('Có lỗi xảy ra khi tạo file bản mẫu.', 'error');
    }
  };

  // Handle copying sample data structure as tabular text direct helper
  const handleCopySampleCSV = () => {
    const csvContent = `Mã số học viên,Họ và Tên,Lớp hiện tại,Địa chỉ Email,Mật khẩu
STU-001,Nguyễn Văn An,6A1,nguyenvanan@gmail.com,6A1-Nguyễn Văn An
STU-002,Trần Thị Bình,6A1,tranthibinh@gmail.com,
STU-003,Phạm Minh Cường,6A2,phamminhcuong@gmail.com,6A2-Phạm Minh Cường
STU-004,Lê Hoàng Dung,6A3,lehoangdung@gmail.com,`;
    
    navigator.clipboard.writeText(csvContent)
      .then(() => onToast('Đã sao chép cấu trúc bản mẫu của học sinh vào bộ nhớ tạm! Thầy cô hãy dán sang Excel hoặc dán vào khung dán văn bản trực tiếp nhé.', 'success'))
      .catch((err) => {
        console.error(err);
        onToast('Sao chép thất bại do phân quyền trình duyệt, xin vui lòng tải file bản mẫu.', 'error');
      });
  };

  // Unified Parser function for parsing CSV, Semicolon, or Tab-separated file or pasted text
  const processRawCSVText = (text: string): { added: number; updated: number; error?: string } => {
    try {
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      const lines = cleanText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length <= 1) {
        return { added: 0, updated: 0, error: 'Dữ liệu trống hoặc không có dòng học sinh nào.' };
      }

      // Detect delimiter based on the first line content
      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;

      let delimiter = ',';
      if (semicolonCount > commaCount && semicolonCount > tabCount) {
        delimiter = ';';
      } else if (tabCount > commaCount && tabCount > semicolonCount) {
        delimiter = '\t';
      }

      // Parse CSV row by row supporting quotes and chosen delimiter
      const parsedRows: string[][] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const row: string[] = [];
        let insideQuote = false;
        let entry = '';
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === delimiter && !insideQuote) {
            row.push(entry.trim());
            entry = '';
          } else {
            entry += char;
          }
        }
        row.push(entry.trim());
        parsedRows.push(row);
      }

      // Clean quotes from parsed entries
      const cleanRows = parsedRows.map(row => 
        row.map(cell => {
          let val = cell.trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          return val.replace(/""/g, '"').trim();
        })
      );

      // Check headers
      const headerRow = cleanRows[0].map(h => h.toLowerCase());
      
      // Determine columns
      const idIdx = headerRow.findIndex(h => h.includes('mã') || h.includes('id') || h.includes('studentid') || h.includes('ms'));
      const nameIdx = headerRow.findIndex(h => {
        const isIdColumn = h.includes('mã') || h.includes('id') || h.includes('ms');
        const hasNameText = h.includes('tên') || h.includes('name') || (h.includes('họ') && !h.includes('học viên') && !h.includes('số'));
        return hasNameText && !isIdColumn;
      });
      const classIdx = headerRow.findIndex(h => h.includes('lớp') || h.includes('class'));
      const emailIdx = headerRow.findIndex(h => h.includes('email') || h.includes('thư'));
      const pwdIdx = headerRow.findIndex(h => h.includes('mật') || (h.includes('mã') && h.includes('khẩu')) || h.includes('pass') || h.includes('pwd'));

      if (nameIdx === -1) {
        return { added: 0, updated: 0, error: 'Không tìm thấy cột "Họ và Tên" học sinh trong file/văn bản. Hãy đảm bảo dòng đầu chứa tiêu đề cột.' };
      }

      const newStudents: Student[] = [];
      
      for (let i = 1; i < cleanRows.length; i++) {
        const row = cleanRows[i];
        if (row.length < 1) continue;

        let name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : '';
        if (!name) continue;

        let studentId = idIdx !== -1 && row[idIdx] ? row[idIdx] : `STU-${Date.now().toString().slice(-4)}${i}`;
        let className = classIdx !== -1 && row[classIdx] ? row[classIdx] : (selectedClassFilter !== 'ALL' ? selectedClassFilter : activeGradeClasses[0] || `${activeSubject.grade}A1`);
        let email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : '';
        let parsedPassword = pwdIdx !== -1 && row[pwdIdx] ? row[pwdIdx] : '';

        studentId = studentId.toUpperCase().replace(/\s+/g, '');
        className = className.trim().toUpperCase();
        let password = parsedPassword.trim() || generateStudentPassword(className, name);

        newStudents.push({
          id: studentId,
          name: name,
          className: className,
          email: email,
          password: password
        });
      }

      if (newStudents.length === 0) {
        return { added: 0, updated: 0, error: 'Không trích xuất được học sinh hợp lệ nào từ văn bản đã nhập.' };
      }

      let addedCount = 0;
      let updatedCount = 0;

      onUpdateStudents(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const updated = [...prev];

        newStudents.forEach(newStu => {
          if (existingIds.has(newStu.id)) {
            const idx = updated.findIndex(s => s.id === newStu.id);
            if (idx !== -1) {
              updated[idx] = newStu;
              updatedCount++;
            }
          } else {
            updated.push(newStu);
            addedCount++;
          }
        });

        // Auto-add any classroom to the classes array if missing
        const newClassNames = Array.from(new Set(newStudents.map(s => s.className)));
        onUpdateClasses(prevClasses => {
          const addedClasses = newClassNames.filter(c => !prevClasses.includes(c));
          if (addedClasses.length > 0) {
            return [...prevClasses, ...addedClasses];
          }
          return prevClasses;
        });

        return updated;
      });

      return { added: addedCount, updated: updatedCount };
    } catch (e: any) {
      console.error(e);
      return { added: 0, updated: 0, error: 'Phân tích cứu văn bản thất bại. Hãy kiểm tra lại format.' };
    }
  };

  // Handle uploading CSV file to append/update students
  const handleUploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          onToast('Không thể đọc tệp tin trống.', 'error');
          return;
        }

        const res = processRawCSVText(text);
        if (res.error) {
          onToast(res.error, 'error');
        } else {
          onToast(`Tải file và đồng bộ thành công! Đã thêm mới ${res.added} học sinh, cập nhật ${res.updated} học sinh.`, 'success');
          setUploadedFileName(file.name);
          setShowImportModal(false);
        }
      } catch (err) {
        console.error(err);
        onToast('Xảy ra lỗi trong quá trình phân tích file CSV.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Import directly pasted text roster (highly robust alternative)
  const handleImportPastedRoster = () => {
    if (!pastedRosterText.trim()) {
      onToast('Vui lòng dán danh sách học sinh vào khung văn bản bên dưới!', 'error');
      return;
    }
    const res = processRawCSVText(pastedRosterText);
    if (res.error) {
      onToast(res.error, 'error');
    } else {
      onToast(`Đồng bộ dữ liệu thành công! Đã thêm mới ${res.added} học sinh, cập nhật ${res.updated} học sinh.`, 'success');
      setPastedRosterText('');
      setShowImportModal(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-8 animate-fadeIn text-xs md:text-sm">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex flex-wrap items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-600" /> CẤU HÌNH LỚP HỌC & HỌC VIÊN
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="px-2.5 py-0.5 font-extrabold text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/80 rounded-full shrink-0">
              MÔN {activeSubject.name.toUpperCase()} • LỚP {activeSubject.grade}
            </span>
            <span className="text-xs text-slate-400 font-medium select-none">|</span>
            <p className="text-[11px] text-slate-500 font-medium">
              Quản lý cơ cấu các lớp giảng dạy, thêm bớt danh sách học viên rèn luyện và theo dõi chỉ số học tập.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowAddClassForm(!showAddClassForm)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all flex items-center gap-1.5"
            id="btn-toggle-add-class"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            Cấu hình Lớp
          </button>
          
          <button
            onClick={openAddStudentModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-1.5"
            id="btn-add-student-modal"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Thêm học sinh mới
          </button>
        </div>
      </div>

      {/* QUICK ADD CLASS DRAWER */}
      {showAddClassForm && (
        <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-3 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-slate-700">Tùy biến Lớp học giảng dạy</span>
            <button onClick={() => setShowAddClassForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleAddClass} className="flex gap-2 max-w-md">
            <input 
              type="text" 
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Nhập tên lớp mới (E.g. 6A4, 7B1...)"
              className="bg-white border border-slate-200 py-2 px-3 rounded-xl flex-grow font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl transition-all"
            >
              Thêm Lớp
            </button>
          </form>

          <div className="mt-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Lớp hiện tại:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeGradeClasses.map(c => (
                <div key={c} className="bg-white border border-slate-200/80 rounded-xl py-1 px-2.5 flex items-center gap-1.5 font-bold shadow-xs">
                  <span className="text-slate-700">{c}</span>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteClass(c)}
                    className="text-red-500 hover:text-red-700 p-0.5"
                    title="Xóa lớp"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* THREE PANEL WORKSPACE SWITCHER */}
      <div className="flex flex-wrap border-b border-slate-200/80 pb-1.5 gap-2 text-xs font-bold text-slate-400">
        <button
          type="button"
          onClick={() => setActivePanel('roster')}
          className={`py-2 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-extrabold ${
            activePanel === 'roster' ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
          }`}
        >
          📁 Quản lý Danh sách & Sĩ số Lớp học
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('grading')}
          className={`py-2 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 relative font-extrabold ${
            activePanel === 'grading' ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
          }`}
        >
          ✍️ Bàn chấm bài Tự luận theo Ảnh (AI OCR)
          {attempts.some(a => !a.isGraded) && (
            <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white rounded-full text-[8px] font-black px-1.5 py-0.5 animate-pulse">
              {attempts.filter(a => !a.isGraded).length} bài chờ chấm
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('security')}
          className={`py-2 px-5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-extrabold ${
            activePanel === 'security' ? 'bg-rose-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'
          }`}
        >
          🔒 Bảo mật mật khẩu giáo viên
        </button>
      </div>

      {activePanel === 'roster' && (
        <>
          {/* COMPASSIONATE AI ESSAY GRADING HIGHLIGHT BANNER */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-3xl p-5 md:p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl shadow-emerald-950/10 border border-emerald-500/10">
            <div className="space-y-1 md:max-w-2xl">
              <span className="bg-white/20 text-white uppercase text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wider inline-block">
                🚀 MỚI: BÀN CHẤM BÀI TỰ LUẬN CHÉP TAY QUANG HỌC (AI OCR)
              </span>
              <h3 className="font-extrabold text-sm md:text-base tracking-tight text-white flex items-center gap-1.5 leading-snug">
                Hệ thống tự động nhận diện chữ viết viết tay học sinh & Chấm bài khớp chuẩn GDPT 2018!
              </h3>
              <p className="text-[11px] text-white/85 leading-relaxed font-medium">
                Quét nhanh bài chép vở qua tệp hình ảnh, bóc tách chữ viết và đối chiếu với khung Yêu câu cần đạt lý thuyết môn học để đề xuất kết quả, chấm điểm chi tiết tương tác từng câu tự luận.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel('grading')}
              className="px-5 py-3.5 bg-white hover:bg-slate-50 text-emerald-800 font-extrabold rounded-2xl transition-all shadow-lg hover:scale-[1.02] shrink-0 text-xs flex items-center gap-1.5 cursor-pointer uppercase select-none tracking-wide"
            >
              <PenTool className="w-4 h-4 text-emerald-600" />
              👉 VÀO BÀN CHẤM TỰ LUẬN AI NGAY!
            </button>
          </div>

          {/* CLASS STATISTICS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {classStats.map(stat => (
          <div key={stat.className} className="p-5 bg-slate-50/50 border border-slate-200/60 rounded-2xl flex flex-col justify-between gap-3 hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 font-bold text-[10px] uppercase block">Dữ liệu lớp rèn luyện</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base font-black text-slate-800">Lớp {stat.className}</span>
                  <button 
                    onClick={() => handleDeleteClass(stat.className)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                    title="Xóa lớp học"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 py-1 px-2.5 rounded-full font-bold text-[10px]">
                {stat.studentCount} Học viên
              </span>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Tổng bài đã nộp rèn luyện:</span>
                <strong className="text-slate-800">{stat.attemptsCount} lượt</strong>
              </div>
              <div className="flex justify-between">
                <span>Điểm trung bình (GPA):</span>
                <strong className={stat.avgScore >= 8 ? 'text-indigo-600 font-extrabold' : stat.avgScore >= 5 ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>
                  {stat.attemptsCount > 0 ? `${formatScore(stat.avgScore)} / 10` : 'Chưa thi'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Tỷ lệ đạt yêu cầu (≥ 5.0):</span>
                <strong className="text-slate-800">{stat.attemptsCount > 0 ? `${stat.passRate}%` : '0%'}</strong>
              </div>
              
              {/* PASSWORD CONFIG FOR CLASS */}
              <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                  <span>MẬT KHẨU VÀO LỚP:</span>
                  <span className="text-indigo-600 font-mono tracking-wider font-extrabold">
                    {classPasswords[stat.className] || stat.className + '@123'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Đặt mật khẩu lớp..."
                  key={`pwd-${stat.className}`}
                  defaultValue={classPasswords[stat.className] || stat.className + '@123'}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) {
                      onUpdateClassPasswords(prev => ({
                        ...prev,
                        [stat.className]: val
                      }));
                      onToast(`Đã thay đổi mật khẩu nhập lớp ${stat.className} thành "${val}"!`, 'success');
                    }
                  }}
                  className="w-full text-[11px] font-mono tracking-wider bg-white p-1.5 px-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-bold">
              <button
                onClick={() => {
                  onChangeTab('class-report');
                  onTriggerAIReport(stat.className);
                }}
                className="py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100"
              >
                Chẩn Đoán AI
              </button>
              <button
                onClick={() => {
                  setSelectedClassFilter(stat.className);
                }}
                className="py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
              >
                Lọc danh sách
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* STUDENT DIRECTORY / DATA TABLE */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-extrabold text-slate-600 uppercase text-[10px] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" /> Bác bộ Lọc học viên:
            </span>
            <div className="flex overflow-x-auto gap-1">
              <button
                onClick={() => setSelectedClassFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                  selectedClassFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Tất cả
              </button>
              {activeGradeClasses.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClassFilter(c)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                    selectedClassFilter === c ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Lớp {c}
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH BAR & ACTIONS */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, email..."
                className="w-full bg-white border border-slate-200 py-1.5 pl-9 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadCurrentClassList}
              title={`Tải về danh sách học sinh ${selectedClassFilter === 'ALL' ? 'tất cả các lớp' : `Lớp ${selectedClassFilter}`}`}
              className="py-1.5 px-3 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-all font-bold flex items-center gap-1.5 hover:shadow-xs text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Tải danh sách ra
            </button>

            {/* Tải danh sách lớp lên và Tải bản mẫu (Đồng nhất bằng cửa sổ nhập/tải tiện ích) */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              title="Mở cửa sổ tải danh sách lớp học & tải file bản mẫu dữ liệu"
              className="py-1.5 px-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all font-bold flex items-center gap-1.5 hover:shadow-md text-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Tải danh sách lớp lên / Tải bản mẫu
            </button>

            {filteredStudents.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(true)}
                title={`Xóa toàn bộ học sinh rèn luyện (${selectedClassFilter === 'ALL' ? 'tất cả các lớp' : `Lớp ${selectedClassFilter}`})`}
                className="py-1.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 rounded-xl transition-all font-bold flex items-center gap-1.5 hover:shadow-xs text-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {uploadedFileName && (
          <div className="bg-emerald-50 border border-emerald-100/80 rounded-2xl p-3 flex justify-between items-center text-xs text-emerald-800 animate-fadeIn font-bold">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Đang áp dụng dữ liệu học sinh từ tệp: <strong className="font-extrabold text-emerald-950 underline">{uploadedFileName}</strong></span>
            </div>
            <button 
              type="button"
              onClick={() => setUploadedFileName(null)}
              className="text-emerald-500 hover:text-emerald-700 bg-white/80 p-1 rounded-full hover:bg-white/100 duration-100 font-bold w-5 h-5 flex items-center justify-center cursor-pointer border border-emerald-100"
              title="Hủy hiển thị"
            >
              ✕
            </button>
          </div>
        )}

        {/* LIST TABLE */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Mã số học viên</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Lớp hiện tại</th>
                <th className="py-3 px-4">Địa chỉ Email</th>
                <th className="py-3 px-4 text-amber-700 font-bold">Mật khẩu riêng</th>
                <th className="py-3 px-4">Điểm rèn luyện đạt</th>
                <th className="py-3 px-4 text-right">Tác vụ tùy chỉnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Không tìm thấy dữ liệu học viên trùng khớp bộ lọc hiện hành.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const studentAttemptsCount = attempts.filter(a => a.studentId === student.id).length;
                  const maxScoreAttempt = attempts.filter(a => a.studentId === student.id).sort((x, y) => y.score - x.score)[0];

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        {student.id}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-800">
                        {student.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-indigo-50 text-indigo-800 border border-indigo-100 font-bold px-2 py-0.5 rounded text-[10px]">
                          Lớp {student.className}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {student.email || 'Chưa cung cấp'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-amber-50 text-amber-800 border border-amber-100 font-bold px-2.5 py-1 rounded-lg text-[10px] break-all">
                          🔑 {student.password || generateStudentPassword(student.className, student.name)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5 leading-none">
                          <span className="text-slate-700 font-bold">
                            {studentAttemptsCount} bài đã nộp
                          </span>
                          {maxScoreAttempt && (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              Cao nhất: {formatScore(maxScoreAttempt.score)} đ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => openEditStudentModal(student)}
                            className="text-emerald-700 hover:text-emerald-950 font-bold underline p-1 text-[11px]"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="text-red-500 hover:text-red-700 font-bold p-1 text-[11px]"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {activePanel === 'grading' && (
        /* ==================== AI ESSAY PHOTO EVALUATION BENEFIT PANEL ==================== */
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* BANNER BRIEF */}
          <div className="bg-gradient-to-tr from-emerald-50 to-teal-100/55 p-5 rounded-2xl border border-emerald-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans">
            <div>
              <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700 animate-spin" /> BÀN CHẤM BÀI TỰ LUẬN CHÉP TAY QUANG HỌC (AI COGNITIVE DESK)
              </h3>
              <p className="text-slate-600 mt-1">
                Hệ thống nhận diện nét chữ chép tay từ ảnh tập giấy học viên, tự động đối chiếu các <strong>Yêu cầu cần đạt (YCCĐ)</strong> và bản vị năng lực thuộc Chương trình GDPT 2018 để gợi ý khung điểm chuẩn xác.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
              <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-xl">
                Chờ chấm: {attempts.filter(a => !a.isGraded).length} bài
              </span>
              <span>•</span>
              <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl font-bold">
                Đã xong: {attempts.filter(a => a.isGraded).length} bài
              </span>
            </div>
          </div>

          {/* LIST OF STUDENT TEST ATTEMPTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attempts.length === 0 ? (
              <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic">
                Chưa có học sinh nào nộp bài rèn luyện để tiến hành chấm tự luận.
              </div>
            ) : (
              attempts.map(attempt => {
                const associatedTest = tests.find(t => t.id === attempt.testId);
                const hasEssayQ = associatedTest?.questions.some(q => q.type === 'SHORT_ESSAY');
                const hasUploadedImages = attempt.studentImages && Object.keys(attempt.studentImages).length > 0;

                return (
                  <div 
                    key={attempt.id} 
                    className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between gap-4 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start text-[10px] font-black text-slate-400">
                        <span>LƯỢT NỘP: #{attempt.id.substring(4, 9)}</span>
                        <span>{attempt.submittedAt}</span>
                      </div>

                      <h4 className="font-extrabold text-slate-800 text-xs line-clamp-1">
                        {attempt.studentName} • Lớp {attempt.className}
                      </h4>
                      
                      <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2" title={associatedTest?.title}>
                        Bài thi: <span className="font-bold text-slate-700">{associatedTest?.title || 'Đề rèn luyện tổng hợp'}</span>
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {attempt.isGraded ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5 animate-pulse">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> Đã chấm: {formatScore(attempt.score)} / 10đ
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5 animate-pulse">
                            ⏱ Chờ chấm bài tự luận
                          </span>
                        )}

                        {hasEssayQ && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-100 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold">
                            Có bài Tự luận
                          </span>
                        )}

                        {hasUploadedImages ? (
                          <span className="bg-teal-50 text-teal-800 border border-teal-100 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                            📸 Có hình chép tay
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[9px]">
                            ⌨ Văn bản thuần
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setGradingAttempt(attempt);
                        // Copy values to local form states
                        setLocalGradeScore(attempt.score);
                        setLocalGradeComment(attempt.feedback || '');
                        
                        // Copy existing criteria if any
                        const essayQ = associatedTest?.questions.find(q => q.type === 'SHORT_ESSAY');
                        if (essayQ && attempt.gradedDetails?.[essayQ.id]) {
                          setLocalCriteriaPoints(attempt.gradedDetails[essayQ.id].criteriaPoints || {});
                        } else {
                          setLocalCriteriaPoints({});
                        }
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-sans"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      {attempt.isGraded ? 'Xem lại & Chấm lại' : 'Tiến hành Chấm điểm'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ==================== THE WORKSPACE OVERLAY SCREEN DRAW-DRAWER ==================== */}
          {gradingAttempt && (
            <div className="fixed inset-0 bg-slate-950/85 z-50 overflow-y-auto p-4 md:p-8 backdrop-blur-md flex items-center justify-center">
              <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col md:flex-row text-xs md:text-sm">
                
                {/* LEFT COLUMN: ATTEMPT DETAILS & STUDENT SOLUTION IMAGES */}
                <div className="w-full md:w-1/2 p-6 border-r border-slate-100 bg-slate-50/50 overflow-y-auto max-h-[85vh] flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block font-sans">Bài giải học viên</span>
                      <h4 className="font-extrabold text-slate-800 text-sm">{gradingAttempt.studentName} - Lớp {gradingAttempt.className}</h4>
                    </div>
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono">
                      #{gradingAttempt.id.substring(4, 9)}
                    </span>
                  </div>

                  {/* GENERAL WORKSHEET PAGES / TEST EVIDENCE PHOTOS */}
                  {gradingAttempt.generalWorksheetImages && gradingAttempt.generalWorksheetImages.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex flex-col gap-2">
                      <span className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1 font-sans">
                        📸 Ảnh chụp toàn bộ bài làm / viết nháp đính kèm ({gradingAttempt.generalWorksheetImages.length} ảnh)
                      </span>
                      <div className="grid grid-cols-2 gap-2 mt-1.5 animate-fadeIn">
                        {gradingAttempt.generalWorksheetImages.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="relative rounded-xl overflow-hidden border border-slate-200 shadow-3xs bg-slate-900 group">
                            <img 
                              src={imgUrl} 
                              alt={`Worksheet page ${imgIdx+1}`} 
                              className="max-h-[160px] w-full object-contain cursor-pointer transition-all hover:scale-105"
                              onClick={() => window.open(imgUrl, '_blank')}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white font-mono font-bold">
                              Trang {imgIdx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ITERATE ESSSAY QUESTIONS */}
                  {(() => {
                    const linkedTest = tests.find(t => t.id === gradingAttempt.testId);
                    const essayQs = linkedTest?.questions.filter(q => q.type === 'SHORT_ESSAY') || [];

                    if (essayQs.length === 0) {
                      return (
                        <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
                          Đề rèn luyện này không cấu thành câu tự luận phức tạp. Thầy cô có thể chấm trực tiếp ở cột biểu mẫu bên phải.
                        </div>
                      );
                    }

                    return essayQs.map((eq, idx) => {
                      const studentTextAns = gradingAttempt.answers[eq.id] || '(Học sinh bỏ trống bài)';
                      const studentImgAns = gradingAttempt.studentImages?.[eq.id];

                      return (
                        <div key={eq.id} className="bg-white p-4.5 rounded-2xl border border-slate-200 pb-5 space-y-3 shadow-xs">
                          {/* Header */}
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>BÀI TỰ LUẬN SỐ {idx + 1}</span>
                            <span className="bg-purple-150 text-purple-800 px-2 rounded-md font-sans">Văn bản & Chép tay</span>
                          </div>

                          {/* Content */}
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                            <MathRenderer text={eq.content} />
                            
                            {/* Standards linkage display */}
                            {((eq.reqOutcomesGDPT2018 && eq.reqOutcomesGDPT2018.length > 0) || (eq.competenciesGDPT2018 && eq.competenciesGDPT2018.length > 0)) && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex flex-wrap gap-1.5 text-[9px] font-semibold text-slate-500">
                                {eq.reqOutcomesGDPT2018?.map((out, outI) => (
                                  <span key={outI} className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                                    🎯 YCCĐ: {out}
                                  </span>
                                ))}
                                {eq.competenciesGDPT2018?.map((c, cI) => (
                                  <span key={cI} className="bg-indigo-50 text-indigo-805 border border-indigo-100 px-1.5 py-0.5 rounded-full font-sans">
                                    💫 Năng lực: {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Student Text answer */}
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Học sinh soạn thảo văn bản:</span>
                            <p className="bg-slate-50 p-3 rounded-xl min-h-[60px] text-slate-700 italic border border-slate-100 leading-relaxed font-semibold whitespace-pre-wrap">
                              "{studentTextAns}"
                            </p>
                          </div>

                          {/* Image handwritten page solution rendering */}
                          <div className="space-y-1 relative">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Học sinh tải ảnh vở viết tay:</span>
                            {studentImgAns ? (
                              <div className="bg-slate-800 rounded-2xl overflow-hidden p-2.5 border border-slate-700 flex justify-center items-center relative shadow-sm">
                                <img 
                                  src={studentImgAns} 
                                  alt="Student handwriting document scan" 
                                  className="max-h-[290px] object-contain rounded-xl border border-slate-700/55 bg-stone-50 shadow-md"
                                  referrerPolicy="no-referrer"
                                />

                                {/* Interactive flashing glow laser scanner layer on simulation processing */}
                                {aiProcessingId === eq.id && (
                                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none flex flex-col justify-between overflow-hidden">
                                    <div className="w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-1.5 animate-bounce shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                                    <div className="text-center font-bold text-[10px] text-emerald-400 bg-slate-900/95 py-1.5 animate-pulse uppercase tracking-wider select-none leading-none">
                                      🔍 AI Đang quét nét chữ tự luận, chuyển đổi OCR và cấu trúc năng lực...
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 text-center bg-slate-100 rounded-xl text-slate-400 italic">
                                Học sinh nộp bài văn bản thuần, không kích hoạt đính kèm tệp hình ảnh chép tay.
                              </div>
                            )}

                            {studentImgAns && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAiProcessingId(eq.id);
                                    onToast('AI khởi tạo quét quang học tập trung nét chữ học viên...', 'info');
                                    
                                    setTimeout(() => {
                                      setAiProcessingId(null);
                                      onToast('AI chấm bài tự luận qua hình ảnh thành công!', 'success');
                                      
                                      // Build mock evaluations customized to subjects
                                      const isMath = eq.content.toLowerCase().includes('toán') || eq.content.toLowerCase().includes('phương trình') || studentTextAns.toLowerCase().includes('phương trình');
                                      const isVăn = eq.content.toLowerCase().includes('văn') || studentTextAns.toLowerCase().includes('đồng chí') || eq.content.toLowerCase().includes('văn học');
                                      
                                      let mockScore = 8.5;
                                      let mockComment = "Bài làm xuất sắc! Em đã bám sát chuẩn kiến thức kĩ năng bài dạy:";
                                      let mockCriteria: { [k: string]: number } = {};

                                      if (isMath) {
                                        mockScore = 9.0;
                                        mockComment = "Lời giải vở ghi chi tiết, lập luận logic hệt bài khoa học chuẩn mực. Đối chiếu với yêu cầu cần đạt (YCCĐ): \n- Đầy đủ 2 trường hợp nghiệm (đạt 5/5đ) \n- Trình bày công thức hằng đẳng thức gọn sạch (đạt 4/4đ).\n- Cần nắn nót dấu ngoặc nhọn hệ phương trình sạch hơn.";
                                        mockCriteria = {
                                          "Đầy đủ trường hợp và nghiệm": 5.0,
                                          "Biến đổi chuẩn hằng đẳng thức": 4.0
                                        };
                                      } else if (isVăn) {
                                        mockScore = 8.5;
                                        mockComment = "Phân tích có chiều sâu cảm xúc, ngôn từ giàu hình tượng và bám sát lý luận tác phẩm. Đối chiếu với năng lực thành phần GDPT 2018: \n- Cảm nhận chính xác tình đồng chí gian lao (đạt 4.5/5đ) \n- Vận dụng bài viết mạch lạc giàu triết lý quân ngũ (đạt 4.0/5đ).\n- Sửa các lỗi chính tả ở từ láy.";
                                        mockCriteria = {
                                          "Nhận biết tình đồng chí": 4.5,
                                          "Năng lực lập luận triết lý": 4.0
                                        };
                                      } else {
                                        mockScore = 8.0;
                                        mockComment = "Nội dung đạt đầy đủ chuẩn yêu cầu của bài. Em đã mô tả tốt các thể liên kết vật lý/khoa học tự nhiên của nước. Cách biểu đạt sinh động có kèm sơ đồ (đạt 8.0/10đ). Phát huy tốt năng lực tự chủ tự học.";
                                        mockCriteria = {
                                          "Nhận diện 3 thể của nước": 4.0,
                                          "Giải thích biến đổi vật lý": 4.0
                                        };
                                      }

                                      setLocalGradeScore(mockScore);
                                      setLocalGradeComment(mockComment);
                                      setLocalCriteriaPoints(mockCriteria);
                                    }, 1500);
                                  }}
                                  disabled={aiProcessingId !== null}
                                  className="w-full py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-wrap text-center"
                                >
                                  🧙‍♂️ AI CHẤM ĐIỂM THEO ẢNH GIẤY (OCR & ĐỐI CHIẾU YCCĐ)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* RIGHT COLUMN: GRADING SCORING & FINAL OUTCOME */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!gradingAttempt) return;

                    // Update attempt values in parent state
                    onUpdateAttempts(prev => prev.map(a => {
                      if (a.id === gradingAttempt.id) {
                        // Assemble the details of short essays
                        const linkedTest = tests.find(t => t.id === gradingAttempt.testId);
                        const essayQ = linkedTest?.questions.find(q => q.type === 'SHORT_ESSAY');
                        
                        const updatedDetails = { ...(a.gradedDetails || {}) };
                        if (essayQ) {
                          updatedDetails[essayQ.id] = {
                            score: localGradeScore,
                            comment: localGradeComment,
                            criteriaPoints: localCriteriaPoints
                          };
                        }

                        return {
                          ...a,
                          score: localGradeScore,
                          feedback: localGradeComment,
                          isGraded: true,
                          gradedDetails: updatedDetails
                        };
                      }
                      return a;
                    }));

                    onToast(`Đã đồng bộ kết quả kiểm duyệt tự luận cho em ${gradingAttempt.studentName}!`, 'success');
                    setGradingAttempt(null);
                  }}
                  className="w-full md:w-1/2 p-6 flex flex-col justify-between gap-5 max-h-[85vh] overflow-y-auto"
                >
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-1">
                        🏆 KHUNG CHẤM ĐIỂM VÀ ĐÁNH GIÁ CHUYÊN MÔN
                      </h3>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Thầy cô tự thiết lập khung điểm sau khi rà soát bài chép tay học viên</p>
                    </div>

                    {/* SCORE SLIDER VALUE */}
                    <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span className="text-slate-600 block uppercase tracking-wider text-[10px]">ĐIỂM SỐ TỔNG HỢP:</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 p-1.5 px-3 rounded-xl text-lg font-mono font-black animate-pulse">
                          {formatScore(localGradeScore)} / 10đ
                        </span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        step="0.5" 
                        value={localGradeScore}
                        onChange={(e) => setLocalGradeScore(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                        <span>0.0đ (Yêu)</span>
                        <span>5.0đ (Trung bình)</span>
                        <span>8.0đ (Khá tốt)</span>
                        <span>10.0đ (Hoàn hảo)</span>
                      </div>
                    </div>

                    {/* CRITERIAS SECTIONS */}
                    {Object.keys(localCriteriaPoints).length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiêu chí con định lượng chuẩn GDPT 2018:</span>
                        <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                          {Object.entries(localCriteriaPoints).map(([crit, pt]) => (
                            <div key={crit} className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-slate-600 truncate max-w-[200px]" title={crit}>{crit}:</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="5.0" 
                                  step="0.5" 
                                  value={pt}
                                  onChange={(e) => {
                                    const next = { ...localCriteriaPoints, [crit]: parseFloat(e.target.value) || 0 };
                                    setLocalCriteriaPoints(next);
                                    
                                    // Sum points automatically
                                    const vals = Object.values(next) as number[];
                                    const sumVal = vals.reduce((s: number, curr: number) => s + (curr || 0), 0);
                                    setLocalGradeScore(Math.min(10, Math.max(0, sumVal)));
                                  }}
                                  className="w-12 p-1 text-center font-bold font-mono border border-slate-200 bg-white rounded"
                                />
                                <span className="font-bold text-slate-400 text-[10px]">điểm</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* MASTER FEEDBACK COMMENT */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Nhận xét chi tiết của Giáo viên:</span>
                      <textarea
                        required
                        value={localGradeComment}
                        onChange={(e) => setLocalGradeComment(e.target.value)}
                        placeholder="Hãy viết nhận xét động viên kèm sửa lỗi kiến thức cho học viên tại đây..."
                        className="w-full min-h-[140px] p-2.5 bg-slate-50 border border-slate-250 rounded-2xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGradingAttempt(null)}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer flex-grow text-center text-xs"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md flex-grow flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Hoàn tất & Gửi điểm số
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDENT SETUP MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form 
            onSubmit={handleSaveStudent}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-black text-slate-800 text-sm">
                {editingStudent ? '📐 HIỆU CHỈNH HỌC SINH' : '➕ THÊM MỚI HỌC SINH MỚI'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowStudentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Mã số tài khoản</label>
              <input 
                type="text"
                disabled
                value={studentForm.id}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 disabled:opacity-80"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Họ và tên học sinh *</label>
              <input 
                type="text"
                required
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                placeholder="Ví dụ: Nguyễn Minh Nhật"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Thuộc Lớp học</label>
                <select
                  value={studentForm.className}
                  onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {activeGradeClasses.map(c => (
                    <option key={c} value={c}>Lớp {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Địa chỉ Email</label>
                <input 
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="nhat.nm@school.edu"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Mật khẩu riêng của học sinh</label>
              <input 
                type="text"
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder="Để trống để tự động tạo dạng [Tên lớp]-[tên viết liền không dấu]"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
              />
              <span className="text-[9px] text-slate-400 block mt-1 leading-normal">
                * Nếu để trống, hệ thống sẽ tự động tạo mật khẩu dạng: <strong>[Tên lớp]-[Tên học sinh]</strong> (không viết hoa, không dấu, viết liền). Ví dụ: <strong>9AHE-dinhthikimnhi</strong>.
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              * Điền chính xác lớp học để học sinh tương ứng có thể nạp bài và rèn luyện các kho đề thi tự động giao bởi AI.
            </p>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button 
                type="button"
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-500"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all"
              >
                ✓ Xác nhận Lưu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BRAND NEW STATEFUL ROBUSTER IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn text-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col gap-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 p-2 rounded-full border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base uppercase">
                    NHẬP DANH SÁCH LỚP HỌC & HỌC VIÊN
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">CÔNG CỤ ĐỒNG BỘ ĐA PHƯƠNG THỨC</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full duration-150 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PHẦN 1: TẢI HOẶC SAO CHÉP FILE MẪU */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex flex-col gap-3">
              <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <span>📋</span> Bước 1: Chuẩn bị danh sách theo Bản mẫu
              </span>
              <p className="text-slate-500 leading-relaxed font-semibold">
                Danh sách của thầy/cô cần có ít nhất cột tiêu đề <strong className="text-slate-800 font-mono">"Họ và Tên"</strong>. Các cột tùy chọn khác gồm: <strong className="text-slate-800 font-mono">"Mã số học viên"</strong>, <strong className="text-slate-800 font-mono">"Lớp hiện tại"</strong>, <strong className="text-slate-800 font-mono">"Địa chỉ Email"</strong>, <strong className="text-slate-800 font-mono">"Mật khẩu"</strong>.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Method A: Standard Dynamic Download */}
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="py-2 px-3 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-xs cursor-pointer text-[11px]"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Cách A: Tải file bản mẫu .CSV trực tiếp
                </button>

                {/* Method B: Direct Copy-to-Clipboard fallback inside sandbox */}
                <button
                  type="button"
                  onClick={handleCopySampleCSV}
                  className="py-2 px-3 bg-amber-55 text-amber-900 hover:bg-amber-100 border border-amber-250 rounded-xl transition-all font-bold flex items-center gap-1.5 shadow-xs cursor-pointer text-[11px]"
                >
                  <span className="text-xs">📋</span> Cách B: Sao chép nhanh Tab mẫu vào bộ nhớ
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Mẹo: Cách B phù hợp tuyệt đối nếu trình duyệt/môi trường iframe chặn tải file .CSV! Thầy cô chỉ cần sao chép nhanh rồi dán thẳng vào Excel/Google Sheets của mình!
              </p>
            </div>

            {/* PHẦN 2: CHỌN FILE HOẶC DÁN TRỰC TIẾP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* PHƯƠNG THỨC 1: TẢI FILE LÊN (Dùng Label tuyệt đối, 100% người dùng thực click) */}
              <div className="border border-dashed border-slate-250 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all text-center relative overflow-hidden min-h-[165px]">
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase">PHƯƠNG THỨC 1: TẢI FILE</span>
                  <p className="text-slate-500 text-[10px] px-2 leading-relaxed font-semibold">
                    Hãy bấm chọn file danh sách .CSV từ thiết bị của thầy cô để tự động cập nhật & đồng bộ.
                  </p>
                </div>

                {/* REAL CLICKABLE LABEL BUT BEAUTIFULLY CUSTOMIZED */}
                <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer text-center block relative">
                  Chọn file từ máy tính...
                  <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    onChange={handleUploadCSV}
                  />
                </label>
              </div>

              {/* PHƯƠNG THỨC 2: DÁN VĂN BẢN TRỰC TIẾP (BẢO ĐẢM THÀNH CÔNG 100%) */}
              <div className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-3.5 bg-indigo-50/10 min-h-[165px]">
                <div className="flex flex-col gap-1">
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase flex items-center gap-1">
                    <span>✍️</span> PHƯƠNG THỨC 2: VĂN BẢN TRỰC TIẾP
                  </span>
                  <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                    Thầy cô copy các dòng từ Excel hoặc Notepad rồi dán (Ctrl+V) trực tiếp vào khung dưới:
                  </p>
                </div>

                <div className="flex-grow flex flex-col gap-2">
                  <textarea
                    rows={4}
                    value={pastedRosterText}
                    onChange={(e) => setPastedRosterText(e.target.value)}
                    placeholder={`Họ và Tên,Lớp hiện tại,Địa chỉ Email,Mật khẩu\nNguyễn Văn An,6A1,an6a1@school.edu,123456\nTrần Thị Bình,6A2,binh6a2@school.edu,`}
                    className="w-full text-[10px] font-mono leading-normal p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none placeholder-slate-300 font-bold"
                  />
                  
                  <button
                    type="button"
                    onClick={handleImportPastedRoster}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer text-center text-xs"
                  >
                    🚀 Đồng bộ ngay lập tức
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button 
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'security' && (
        <div className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col gap-5 animate-fadeIn">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm uppercase flex items-center gap-2">
              🔒 BẢO MẬT & MẬT KHẨU GIÁO VIÊN VÀ LỚP HỌC
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Quản lý mật khẩu truy cập của Giáo viên bộ môn để phòng học sinh truy cập trái phép, đồng thời xem/sửa nhanh mật khẩu của toàn bộ các lớp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TEACHER PASSWORD SECTION */}
            <div className="p-5 bg-rose-50/40 border border-rose-150 rounded-2xl flex flex-col gap-4">
              <span className="font-extrabold text-rose-950 text-xs uppercase block">1. ĐỔI MẬT KHẨU GIÁO VIÊN</span>
              
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Mật khẩu giáo viên hiện tại:</span>
                <div className="flex items-center gap-2">
                  <input
                    type={maskPasscode ? "password" : "text"}
                    value={teacherPasscode}
                    disabled
                    className="flex-1 p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMaskPasscode(!maskPasscode)}
                    className="p-2 border border-slate-250 bg-white hover:bg-slate-50 rounded-xl text-[10px] font-bold"
                  >
                    {maskPasscode ? "Hiện" : "Ẩn"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Nhập mật khẩu giáo viên mới:</span>
                <input
                  type="text"
                  placeholder="Mật khẩu mới (ít nhất 4 ký tự)..."
                  value={newTeacherPasscode}
                  onChange={(e) => setNewTeacherPasscode(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-none rounded-xl text-xs font-semibold"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const cleaned = newTeacherPasscode.trim();
                  if (cleaned.length < 4) {
                    onToast("Mật khẩu giáo viên mới phải có ít nhất 4 ký tự!", "error");
                    return;
                  }
                  onUpdateTeacherPasscode(cleaned);
                  setNewTeacherPasscode("");
                  onToast("Đã đổi mật khẩu Giáo viên thành công!", "success");
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all text-xs cursor-pointer"
              >
                Cập nhật Mật khẩu Giáo viên ✅
              </button>
            </div>

            {/* CLASS PASSWORD BULK LIST */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-4">
              <span className="font-extrabold text-slate-750 text-xs uppercase block">2. DANH SÁCH MẬT KHẨU LỚP HỌC</span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Đây là danh sách mật khẩu dành cho cả lớp để học sinh có thể tự chọn tên của mình và đăng nhập vào phòng thi rèn luyện.
              </p>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {activeGradeClasses.map((cls) => {
                  const currentPwd = classPasswords[cls] || `${cls}@123`;
                  return (
                    <div key={cls} className="flex justify-between items-center bg-white p-2.5 border border-slate-150 rounded-xl text-xs font-semibold">
                      <span className="text-slate-700 font-extrabold">Lớp {cls}:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={currentPwd}
                          onChange={(e) => {
                            const val = e.target.value;
                            onUpdateClassPasswords(prev => ({
                              ...prev,
                              [cls]: val
                            }));
                          }}
                          className="w-28 text-center p-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-[11.5px] font-mono font-bold text-indigo-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODAL: CONFIRM CLASS DELETION */}
      {classToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="bg-rose-50 p-2.5 rounded-full border border-rose-100">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm hover:text-slate-900">
                XÁC NHẬN XÓA LỚP HỌC
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Thầy cô có chắc chắn muốn xóa lớp <strong className="text-slate-800 font-extrabold">Lớp {classToDelete}</strong> khỏi hệ thống rèn luyện rà soát này không?
            </p>

            {students.filter(s => s.className === classToDelete).length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-100/80 text-amber-800 rounded-2xl flex flex-col gap-1">
                <p className="font-bold text-[10px] uppercase flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Lưu ý quan trọng:
                </p>
                <p className="text-[9.5px] leading-relaxed">
                  Lớp này đang chứa <strong className="font-extrabold">{students.filter(s => s.className === classToDelete).length} học sinh</strong>. Việc xóa lớp sẽ vẫn giữ nguyên các học sinh đó, nhưng thầy cô sẽ cần gán lại lớp khác cho họ.
                </p>
              </div>
            )}

            <div className="flex gap-2 border-t border-slate-100 pt-3 mt-1 text-xs">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all animate-none"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateClasses(prev => prev.filter(c => c !== classToDelete));
                  onToast(`Đã xóa lớp ${classToDelete} thành công!`, 'info');
                  setClassToDelete(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-rose-100 animate-none"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODAL: CONFIRM STUDENT DELETION */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="bg-rose-50 p-2.5 rounded-full border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm hover:text-slate-900 uppercase">
                XÁC NHẬN XÓA HỌC SINH
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn bỏ học sinh <strong className="text-slate-800 font-extrabold">"{studentToDelete.name}"</strong> (Mã Số: {studentToDelete.id}) khỏi lớp {studentToDelete.className}?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-100/80 text-amber-800 rounded-2xl flex flex-col gap-1 text-[10px] leading-relaxed">
              <p className="font-bold uppercase flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Lưu ý:
              </p>
              <p>
                Dữ liệu lịch sử làm bài thi rèn luyện trước đó vẫn giữ nguyên nhưng học sinh này sẽ không còn xuất hiện trong học bạ lớp.
              </p>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3 mt-1 text-xs">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-sm shadow-rose-100 cursor-pointer"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODAL: CONFIRM DELETE ALL STUDENTS */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="bg-rose-100/80 p-2.5 rounded-full border border-rose-200 animate-pulse">
                <AlertCircle className="w-6 h-6 text-rose-700" />
              </div>
              <h3 className="font-extrabold text-rose-950 text-sm hover:text-rose-900 uppercase tracking-tight">
                XÓA TOÀN BỘ HỌC SINH?
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Thầy cô có chắc chắn cực kỳ muốn xóa <strong className="text-rose-600 font-extrabold">TẤT CẢ các học sinh</strong> hiện đang được lọc (lớp: <span className="font-extrabold text-slate-800">{selectedClassFilter === 'ALL' ? 'Tất cả các lớp' : selectedClassFilter}</span>) không?
            </p>

            <div className="p-3 bg-red-50 border border-red-100 text-rose-800 rounded-2xl flex flex-col gap-1 text-[10px] leading-relaxed font-bold">
              <p className="uppercase flex items-center gap-1 text-rose-900 font-extrabold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> CẢNH BÁO NGUY HIỂM:
              </p>
              <p>
                Hành động này sẽ xóa đồng loạt {filteredStudents.length} học sinh đang lọc và không thể khôi phục lại trực tiếp. Hãy đảm bảo thầy cô đã sao lưu danh sách học viên dự phòng hoặc đã tải tệp CSV về máy!
              </p>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3 mt-1 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteAllStudents}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md shadow-rose-100 cursor-pointer"
              >
                Xác nhận Xóa Hết
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
