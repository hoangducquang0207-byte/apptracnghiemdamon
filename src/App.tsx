import React, { useState, useEffect, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { formatScore } from './utils/numberFormat';
import { 
  QuestionType, CognitiveLevel, UserRole, SubjectConfig, Question, Test, 
  Assignment, QuizAttempt, StudentProgress, Student, generateStudentPassword
} from './types';
import { 
  DEFAULT_SUBJECTS, DEFAULT_QUESTIONS, DEFAULT_STUDENTS, DEFAULT_TESTS, 
  DEFAULT_ASSIGNMENTS, DEFAULT_ATTEMPTS 
} from './data';
import { MathRenderer } from './components/MathRenderer';
import { SyllabusSetup } from './components/SyllabusSetup';
import { TestGenerator } from './components/TestGenerator';
import { ClassroomSetup } from './components/ClassroomSetup';
import { QuestionBank } from './components/QuestionBank';
import { TestPreviewModal } from './components/TestPreviewModal';
import { 
  BookOpen, Award, Users, Settings, FileText, Brain, History, 
  TrendingUp, Plus, Trash2, Edit, Check, X, Key, Download, 
  RefreshCw, Play, CheckCircle, AlertTriangle, FileSpreadsheet, 
  ExternalLink, LogIn, ChevronRight, HelpCircle, FileImage,
  Volume2, VolumeX, Printer
} from 'lucide-react';
import { sound } from './utils/sound';

export default function App() {
  // CORE STATE
  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => {
    const saved = localStorage.getItem('quickquiz_subjects');
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [currentSubjectId, setCurrentSubjectId] = useState<string>(() => {
    return localStorage.getItem('quickquiz_current_subject') || 'TOAN6';
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('quickquiz_questions');
    const rawQs: Question[] = saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
    return rawQs.filter(q => q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK');
  });

  const [tests, setTests] = useState<Test[]>(() => {
    const saved = localStorage.getItem('quickquiz_tests');
    const rawTests: Test[] = saved ? JSON.parse(saved) : DEFAULT_TESTS;
    return rawTests.map(t => ({
      ...t,
      questions: (t.questions || []).filter(q => q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK')
    }));
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('quickquiz_assignments');
    return saved ? JSON.parse(saved) : DEFAULT_ASSIGNMENTS;
  });

  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => {
    const saved = localStorage.getItem('quickquiz_attempts');
    return saved ? JSON.parse(saved) : DEFAULT_ATTEMPTS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('quickquiz_students');
    return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
  });

  const [currentStudent, setCurrentStudent] = useState<Student>(() => {
    const savedUser = localStorage.getItem('quickquiz_current_student_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Make sure it still exists in our actual students state
      const matching = students ? students.find(s => s.id === parsed.id) : null;
      if (matching) return matching;
    }
    return DEFAULT_STUDENTS[0];
  });

  const [classes, setClasses] = useState<string[]>(() => {
    const saved = localStorage.getItem('quickquiz_classes');
    return saved ? JSON.parse(saved) : ['6A1', '6A2', '6A3'];
  });

  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [creationMode, setCreationMode] = useState<'single' | 'bulk'>('single');
  const [bulkSelectedGrades, setBulkSelectedGrades] = useState<string[]>(['6']);
  const [bulkSelectedSubjectNames, setBulkSelectedSubjectNames] = useState<string[]>(['Toán']);
  const [bulkBook, setBulkBook] = useState<string>('Kết nối tri thức');
  const [bulkTeacherName, setBulkTeacherName] = useState<string>('Hoàng Quang');
  const [newSubjectForm, setNewSubjectForm] = useState({
    id: '',
    name: '',
    grade: '6',
    book: '',
    teacherName: 'Hoàng Quang',
    schoolName: 'THCS Archimedes',
    chapterName: 'Chương I: Luyện tập cốt lõi',
    lessonName: 'Bài 1: Tổng quan khái niệm lí thuyết'
  });

  const [role, setRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('quickquiz_current_role') as UserRole;
    const isAuthed = localStorage.getItem('quickquiz_teacher_authenticated') === 'true';
    if (savedRole === 'teacher' && isAuthed) return 'teacher';
    return 'student'; // Default to student
  });

  const [teacherPasscode, setTeacherPasscode] = useState<string>(() => {
    return localStorage.getItem('quickquiz_teacher_passcode') || '123456';
  });

  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [showPasscodeText, setShowPasscodeText] = useState<boolean>(false);

  const handleSetRoleSecure = (newRole: UserRole) => {
    if (newRole === 'teacher') {
      const isAuthed = localStorage.getItem('quickquiz_teacher_authenticated') === 'true';
      if (isAuthed) {
        setRole('teacher');
        localStorage.setItem('quickquiz_current_role', 'teacher');
        setActiveTab('dashboard');
      } else {
        setIsPasscodeModalOpen(true);
        setPasscodeInput('');
        setShowPasscodeText(false);
      }
    } else {
      setRole('student');
      localStorage.setItem('quickquiz_current_role', 'student');
      setActiveTab('dashboard');
    }
  };
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingPointsTestId, setEditingPointsTestId] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  const normalizeTF = (val: string): string => {
    const s = (val || '').trim().toLowerCase();
    if (s === 'đúng' || s === 'đ' || s === 'true' || s === 't' || s === '1' || s === 'yes' || s === 'y' || s === 'đ.') return 'đúng';
    if (s === 'sai' || s === 's' || s === 'false' || s === 'f' || s === '0' || s === 'no' || s === 'n' || s === 's.') return 'sai';
    return '';
  };

  const [studentSession, setStudentSession] = useState<{
    studentId: string;
    studentName: string;
    className: string;
    subjectId: string;
  } | null>(() => {
    const saved = localStorage.getItem('quickquiz_student_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [classPasswords, setClassPasswords] = useState<{ [className: string]: string }>(() => {
    const saved = localStorage.getItem('quickquiz_class_passwords');
    if (saved) return JSON.parse(saved);
    return {
      '6A1': '6A1@123',
      '6A2': '6A2@123',
      '6A3': '6A3@123',
    };
  });

  const [progress, setProgress] = useState<StudentProgress[]>(() => {
    const saved = localStorage.getItem('quickquiz_progress');
    if (saved) return JSON.parse(saved);
    return [
      { subjectId: 'TOAN6', completedLessons: ['T6-C1-B1', 'T6-C1-B2'] },
      { subjectId: 'KHTN6', completedLessons: ['K6-C1-B1'] },
      { subjectId: 'TA6', completedLessons: [] }
    ];
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('quickquiz_gemini_key') || '';
  });
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => sound.isMuted());

  // Custom Confirmation Modal states
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectConfig | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [testToPreview, setTestToPreview] = useState<Test | null>(null);

  // TOAST SYSTEM
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      sound.playToastSuccess();
    } else if (type === 'error') {
      sound.playToastError();
    } else {
      sound.playToastInfo();
    }
    setTimeout(() => setToast(null), 3000);
  };

  // PERSISTENCE EFFECTS
  useEffect(() => {
    localStorage.setItem('quickquiz_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('quickquiz_current_subject', currentSubjectId);
  }, [currentSubjectId]);

  useEffect(() => {
    localStorage.setItem('quickquiz_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('quickquiz_tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('quickquiz_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('quickquiz_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('quickquiz_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('quickquiz_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('quickquiz_current_student_user', JSON.stringify(currentStudent));
  }, [currentStudent]);

  useEffect(() => {
    localStorage.setItem('quickquiz_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    if (studentSession) {
      localStorage.setItem('quickquiz_student_session', JSON.stringify(studentSession));
    } else {
      localStorage.removeItem('quickquiz_student_session');
    }
  }, [studentSession]);

  useEffect(() => {
    localStorage.setItem('quickquiz_class_passwords', JSON.stringify(classPasswords));
  }, [classPasswords]);

  useEffect(() => {
    if (role === 'student' && studentSession) {
      setCurrentStudent({
        id: studentSession.studentId,
        name: studentSession.studentName,
        className: studentSession.className,
        email: ''
      });
      if (studentSession.subjectId !== currentSubjectId) {
        setCurrentSubjectId(studentSession.subjectId);
      }
    }
  }, [role, studentSession]);

  const activeSubject = useMemo(() => {
    return subjects.find(s => s.id === currentSubjectId) || subjects[0];
  }, [subjects, currentSubjectId]);

  // STUDENT/TEACHER ACTIVE VIEW PARAMETERS
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [quizQuestionsCount, setQuizQuestionsCount] = useState<number>(5);
  const [quizDuration, setQuizDuration] = useState<number>(10);

  // QUIZ ENGINE STATE
  const [activeQuizTest, setActiveQuizTest] = useState<Test | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [quizStudentImages, setQuizStudentImages] = useState<{ [qId: string]: string }>({});
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(0);
  const [activeQuizAttemptResult, setActiveQuizAttemptResult] = useState<QuizAttempt | null>(null);

  // QUESTION BANK MODAL STATE
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);

  // ASSIGN FORM STATE
  const [assignForm, setAssignForm] = useState({
    testId: '',
    className: '6A1',
    deadline: '',
    notes: ''
  });

  // CLASS PERFORMANCE REPORT STATE
  const [selectedReportClass, setSelectedReportClass] = useState<string>('');
  const [isAnalyzingReport, setIsAnalyzingReport] = useState<boolean>(false);
  const [reportData, setReportData] = useState<{
    strengths: string;
    weaknesses: string;
    recommendations: string;
    unsupportiveStudents: { name: string; score: number; topic: string }[];
  } | null>(null);

  // STUDENT PORTAL GATE STATES
  const [portalSubjectId, setPortalSubjectId] = useState<string>(() => currentSubjectId || 'TOAN6');
  const [portalClass, setPortalClass] = useState<string>('6A1');
  const [portalStudentId, setPortalStudentId] = useState<string>('');
  const [portalCustomName, setPortalCustomName] = useState<string>('');
  const [portalPassword, setPortalPassword] = useState<string>('');

  // STUDENT PASSWORD CHANGE STATES
  const [isEditingStudentPwd, setIsEditingStudentPwd] = useState<boolean>(false);
  const [newStudentPwdText, setNewStudentPwdText] = useState<string>('');

  const handlePortalLogin = () => {
    if (!portalSubjectId) {
      showToast('Vui lòng chọn môn học!', 'error');
      return;
    }
    if (!portalClass) {
      showToast('Vui lòng chọn lớp học!', 'error');
      return;
    }
    
    const finalName = portalCustomName.trim();
    if (!finalName && portalStudentId === 'NEW_STUDENT') {
      showToast('Vui lòng nhập họ tên của em!', 'error');
      return;
    }
    if (!portalStudentId) {
      showToast('Vui lòng chọn hoặc tự nhập tên của em!', 'error');
      return;
    }

    // Verify Password (Individual has priority over Class-level password)
    let expectedPassword = classPasswords[portalClass] || (portalClass + '@123');
    let isUsingIndividualPassword = false;

    if (portalStudentId && portalStudentId !== 'NEW_STUDENT') {
      const matchStd = students.find(s => s.id === portalStudentId);
      if (matchStd) {
        expectedPassword = matchStd.password || generateStudentPassword(portalClass, matchStd.name);
        isUsingIndividualPassword = true;
      }
    }

    if (portalPassword !== expectedPassword) {
      if (isUsingIndividualPassword) {
        showToast(`Mật khẩu cá nhân của học sinh không chính xác! Vui lòng kiểm tra lại hoặc liên hệ Thầy/Cô bộ môn giải đáp.`, 'error');
      } else {
        showToast(`Mật khẩu lớp ${portalClass} chưa chính xác! Vui lòng hỏi giáo viên của em. (Mật khẩu gợi ý: 123 hoặc ${portalClass}@123)`, 'error');
      }
      return;
    }

    // Handle student user account
    let studentIdToUse = portalStudentId;
    let studentNameToUse = '';

    if (portalStudentId === 'NEW_STUDENT') {
      const isExistName = students.find(s => s.name.toLowerCase() === finalName.toLowerCase() && s.className === portalClass);
      if (isExistName) {
        studentIdToUse = isExistName.id;
        studentNameToUse = isExistName.name;
      } else {
        const newId = `STD-${Date.now()}`;
        const newStd: Student = {
          id: newId,
          name: finalName,
          className: portalClass,
          email: `${newId.toLowerCase()}@archimedes.edu.vn`
        };
        setStudents(prev => [...prev, newStd]);
        studentIdToUse = newId;
        studentNameToUse = finalName;
      }
    } else {
      const matchStd = students.find(s => s.id === portalStudentId);
      studentNameToUse = matchStd ? matchStd.name : 'Học sinh';
    }

    // Build session
    const sess = {
      studentId: studentIdToUse,
      studentName: studentNameToUse,
      className: portalClass,
      subjectId: portalSubjectId
    };
    
    setStudentSession(sess);
    setCurrentStudent({
      id: studentIdToUse,
      name: studentNameToUse,
      className: portalClass,
      email: ''
    });
    setCurrentSubjectId(portalSubjectId);
    setActiveTab('dashboard');
    setPortalPassword('');
    showToast(`Chào mừng ${studentNameToUse} đã đăng nhập thành công vào môn ${subjects.find(s => s.id === portalSubjectId)?.name || 'Học tập'}!`, 'success');
  };

  // COUNTDOWN EFFECT FOR ACTIVE QUIZ
  useEffect(() => {
    if (activeQuizTest && quizTimeRemaining > 0) {
      const interval = setInterval(() => {
        setQuizTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleQuizSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeQuizTest, quizTimeRemaining]);

  // UPDATE DEFAULT CHAPTER/LESSON ON SUBJECT CHANGE
  useEffect(() => {
    if (activeSubject && activeSubject.chapters.length > 0) {
      setSelectedChapterId(activeSubject.chapters[0].id);
      setSelectedLessonId(activeSubject.chapters[0].lessons[0]?.id || '');
    } else {
      setSelectedChapterId('');
      setSelectedLessonId('');
    }
  }, [currentSubjectId, activeSubject]);

  // TỰ ĐỘNG KHỞI TẠO LỚP TIÊU CHUẨN CHO TỪNG GRADE CỦA CÁC MÔN HỌC HIỆN TẠI (GIẢI QUYẾT LỖI KHI CLONE/SHARE APP LÊN GITHUB)
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      const neededClasses: string[] = [];
      subjects.forEach(sub => {
        if (sub.grade) {
          neededClasses.push(`${sub.grade}A1`);
          neededClasses.push(`${sub.grade}A2`);
          neededClasses.push(`${sub.grade}A3`);
        }
      });
      // Thu thập thêm từ danh sách học sinh hiện có
      if (students) {
        students.forEach(s => {
          if (s.className) {
            neededClasses.push(s.className.trim().toUpperCase());
          }
        });
      }

      // Lọc ra các lớp học chưa có trong danh sách classes
      const toAdd = neededClasses.filter(cls => !classes.includes(cls));
      if (toAdd.length > 0) {
        setClasses(prev => {
          const combined = [...prev, ...toAdd];
          return Array.from(new Set(combined));
        });
      }
    }
  }, [subjects, students, classes]);

  // ĐỒNG BỘ CHUẨN LỚP HỌC TRÊN CỔNG TRA CỨU HỌC SINH KHI ĐỔI MÔN HOẶC KHI DANH SÁCH LỚP CẬP NHẬT
  useEffect(() => {
    const subj = subjects.find(s => s.id === portalSubjectId);
    if (subj) {
      const activeGradeClasses = classes.filter(c => {
        if (!c || !subj.grade) return false;
        const match = c.match(/(\d+)/);
        if (match) return match[1] === subj.grade;
        return c.startsWith(subj.grade);
      });
      if (activeGradeClasses.length > 0) {
        if (!activeGradeClasses.includes(portalClass)) {
          setPortalClass(activeGradeClasses[0]);
        }
      } else {
        const fall = `${subj.grade}A1`;
        if (portalClass !== fall) {
          setPortalClass(fall);
        }
      }
    }
  }, [portalSubjectId, classes, subjects, portalClass]);

  // UPDATE DEFAULT CLASSNAME FOR ASSIGN TEST ON SUBJECT CHANGE OR CLASSES CHANGE
  useEffect(() => {
    if (activeSubject) {
      const activeGradeClasses = classes.filter(cls => {
        if (!cls || !activeSubject.grade) return false;
        const match = cls.match(/(\d+)/);
        if (match) return match[1] === activeSubject.grade;
        return cls.startsWith(activeSubject.grade);
      });
      if (activeGradeClasses.length > 0) {
        if (!activeGradeClasses.includes(assignForm.className)) {
          setAssignForm(prev => ({
            ...prev,
            className: activeGradeClasses[0]
          }));
        }
      } else {
        setAssignForm(prev => ({
          ...prev,
          className: `${activeSubject.grade}A1`
        }));
      }
    }
  }, [activeSubject, classes]);

  // START TESTING ACTION
  const handleStartPractice = (customTest?: Test, optChapterId?: string, optLessonId?: string) => {
    let testToRun: Test;

    if (customTest) {
      if (role === 'student' && currentStudent) {
        const testAttempts = attempts.filter(at => at.testId === customTest.id && at.studentId === currentStudent.id);
        if (testAttempts.length >= 3) {
          showToast('Em đã đạt giới hạn tối đa 3 lần làm bài cho đề này!', 'error');
          return;
        }
      }
      testToRun = customTest;
    } else {
      const activeChId = optChapterId !== undefined ? optChapterId : selectedChapterId;
      const activeLesId = optLessonId !== undefined ? optLessonId : selectedLessonId;

      const filtered = questions.filter(q => 
        q.subjectId === currentSubjectId &&
        (activeChId ? q.chapterId === activeChId : true) &&
        (activeLesId ? q.lessonId === activeLesId : true)
      );

      if (filtered.length === 0) {
        showToast('Không có câu hỏi nào trong kho dữ liệu phù hợp với bài học đã chọn. Hãy sử dụng đề thi giao từ GV hoặc rèn luyện tự do.', 'error');
        return;
      }

      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const selectedQs = shuffled.slice(0, quizQuestionsCount);

      const chapterName = activeSubject.chapters.find(c => c.id === activeChId)?.name || 'Tổng hợp';
      const lessonName = activeSubject.chapters.find(c => c.id === activeChId)?.lessons.find(l => l.id === activeLesId)?.name || 'Tất cả bài học';

      testToRun = {
        id: `PRACTICE-${Date.now()}`,
        title: `Luyện tập tự học: ${activeSubject.name} - ${lessonName}`,
        subjectId: currentSubjectId,
        grade: activeSubject.grade,
        chapterId: activeChId || undefined,
        lessonId: activeLesId || undefined,
        duration: quizDuration,
        purpose: 'Học tập tự do',
        questions: selectedQs,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Nháp'
      };
    }

    setActiveQuizTest(testToRun);
    setQuizAnswers({});
    setQuizStudentImages({});
    setQuizTimeRemaining(testToRun.duration * 60);
    setActiveTab('quiz-player');
    sound.playQuizStart();
    showToast(`Đã bắt đầu làm đề thi: ${testToRun.title}`, 'info');
  };

  // SUBMIT EXAM ACTION
  const handleQuizSubmit = (isTimeOut = false) => {
    if (!activeQuizTest) return;

    let earnedPoints = 0;
    let totalMaxPointsAvailable = 0;

    activeQuizTest.questions.forEach((q) => {
      const qWeight = q.points !== undefined ? q.points : 1.0;
      totalMaxPointsAvailable += qWeight;

      const userAns = (quizAnswers[q.id] || '').trim();
      const correct = q.correctAnswer.trim();

      if (q.type === 'MCQ') {
        if (userAns.toLowerCase() === correct.toLowerCase()) {
          earnedPoints += qWeight;
        }
      } else if (q.type === 'TRUE_FALSE') {
        if (q.options && q.options.length > 0) {
          const userParts = userAns.split(',');
          const correctParts = correct.split(',');
          let matchCount = 0;
          for (let i = 0; i < 4; i++) {
            const uP = normalizeTF(userParts[i] || '');
            const cP = normalizeTF(correctParts[i] || '');
            if (uP && cP && uP === cP) {
              matchCount++;
            }
          }
          let tfPoints = 0;
          if (matchCount === 1) tfPoints = 0.1;
          else if (matchCount === 2) tfPoints = 0.25;
          else if (matchCount === 3) tfPoints = 0.5;
          else if (matchCount === 4) tfPoints = 1.0;

          earnedPoints += tfPoints * qWeight;
        } else {
          if (normalizeTF(userAns) === normalizeTF(correct)) {
            earnedPoints += qWeight;
          }
        }
      } else if (q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK') {
        if (userAns.toLowerCase() === correct.toLowerCase()) {
          earnedPoints += qWeight;
        }
      } else if (q.type === 'MATCHING') {
        if (userAns.toLowerCase() === correct.toLowerCase()) {
          earnedPoints += qWeight;
        }
      } else if (q.type === 'SHORT_ESSAY') {
        if (userAns.length > 8) {
          earnedPoints += qWeight * 0.8;
        }
      }
    });

    let finalScore = earnedPoints;
    if (Math.abs(totalMaxPointsAvailable - 10) > 0.05 && totalMaxPointsAvailable > 0) {
      finalScore = (earnedPoints / totalMaxPointsAvailable) * 10;
    }
    finalScore = Math.round(finalScore * 10) / 10;
    const timeSpent = activeQuizTest.duration * 60 - quizTimeRemaining;

    let feedback = 'Chúc em có nhiều tiến bộ hơn ở lần rèn luyện sau!';
    if (finalScore >= 9) feedback = 'Khởi sắc vượt bậc! Chúc mừng kết quả vinh danh xuất sắc của em.';
    else if (finalScore >= 7.5) feedback = 'Khá giỏi! Cố gắng củng cố sâu thêm nhé.';
    else if (finalScore >= 5) feedback = 'Mức rèn luyện đạt yêu cầu. Em hãy xem kĩ đáp án sai.';

    const hasEssay = activeQuizTest.questions.some(q => q.type === 'SHORT_ESSAY');

    const newAttempt: QuizAttempt = {
      id: `ATT-${Date.now()}`,
      testId: activeQuizTest.id,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      className: currentStudent.className,
      answers: quizAnswers,
      studentImages: quizStudentImages,
      score: finalScore,
      timeSpent,
      submittedAt: new Date().toLocaleString('vi-VN'),
      feedback,
      isGraded: !hasEssay
    };

    setAttempts(prev => [newAttempt, ...prev]);
    setActiveQuizAttemptResult(newAttempt);
    setActiveQuizTest(null);

    // Record lesson completion progress if score is passing (>= 5)
    if (finalScore >= 5 && activeQuizTest.lessonId) {
      setProgress(prev => {
        return prev.map(p => {
          if (p.subjectId === currentSubjectId) {
            if (!p.completedLessons.includes(activeQuizTest.lessonId!)) {
              return { ...p, completedLessons: [...p.completedLessons, activeQuizTest.lessonId!] };
            }
          }
          return p;
        });
      });
    }

    setActiveTab('quiz-result');
    if (finalScore >= 7.5) {
      sound.playCelebration();
    } else {
      sound.playNormalComplete();
    }
    if (isTimeOut) {
      showToast('Hết thời gian làm bài rèn luyện! Hệ thống tự động khoá nộp bài.', 'info');
    } else {
      showToast('Đã nộp bài kiểm toán trắc nghiệm thành công!', 'success');
    }
  };

  // Convert LaTeX math formulas into standard W3C MathML block for high fidelity Microsoft Word native Equation import
  const convertToWordMathML = (text: string | undefined): string => {
    if (!text) return '';
    try {
      // Split by double dollar block formulas or single dollar inline formulas
      const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
      return parts.map((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          try {
            const mathmlText = katex.renderToString(formula, {
              displayMode: true,
              output: 'mathml',
              throwOnError: false
            });
            const match = mathmlText.match(/<math[\s\S]*<\/math>/);
            return match ? match[0] : part;
          } catch (err) {
            return part;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1).trim();
          try {
            const mathmlText = katex.renderToString(formula, {
              displayMode: false,
              output: 'mathml',
              throwOnError: false
            });
            const match = mathmlText.match(/<math[\s\S]*<\/math>/);
            return match ? match[0] : part;
          } catch (err) {
            return part;
          }
        }
        return part;
      }).join('');
    } catch (err) {
      return text || '';
    }
  };

  // EXPORT WORD FRIENDLY DOCX / HTML FILE
  const handleExportTestFile = (test: Test, detailedAnswers = false, fileFormat: 'html' | 'doc' = 'doc') => {
    const examCode = test.id ? parseInt(test.id.replace(/[^0-9]/g, '')) % 900 + 101 : 205;
    const schoolNameUpper = (activeSubject.schoolName || 'TRƯỜNG THCS ARCHIMEDES ACADEMY').toUpperCase();
    const testPurposeUpper = (test.purpose || 'ĐỀ KHẢO SÁT CHẤT LƯỢNG').toUpperCase();
    const subjectUpper = activeSubject.name.toUpperCase();

    let html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${test.title}</title>
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              processEscapes: true
            }
          };
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
          body { 
            font-family: "Times New Roman", Times, serif; 
            line-height: 1.5; 
            max-width: 850px; 
            margin: 30px auto; 
            padding: 30px; 
            color: #111; 
            background: #fff;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
          }
          .header-table td {
            width: 50%;
            vertical-align: top;
            padding: 5px;
          }
          .header-title-sub {
            font-weight: normal;
            font-style: italic;
            font-size: 11px;
            color: #555;
          }
          .divider {
            width: 100px;
            height: 1px;
            background-color: #333;
            margin: 5px auto;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 25px;
            font-size: 14px;
          }
          .info-table td {
            padding: 6px 0;
            border-bottom: 1px dashed #777;
          }
          .guideline {
            text-align: center;
            font-style: italic;
            font-size: 13px;
            color: #555;
            margin-bottom: 30px;
          }
          .section-title {
            font-family: Arial, sans-serif;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            margin-top: 25px;
            margin-bottom: 15px;
            border-left: 4px solid #10b981;
            padding-left: 10px;
          }
          .question {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .question-content {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-left: 20px;
            font-size: 13.5px;
            margin-bottom: 10px;
          }
          @media (max-width: 600px) {
            .options-grid {
              grid-template-columns: 1fr;
            }
          }
          .matching-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-left: 20px;
            font-size: 13.5px;
            margin-bottom: 12px;
          }
          .matching-item {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 6px 12px;
            margin-bottom: 4px;
            border-radius: 6px;
          }
          .short-answer {
            margin-left: 20px;
            font-style: italic;
            color: #777;
            font-size: 13px;
          }
          .ans-box {
            margin-top: 10px;
            padding: 12px 15px;
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            font-size: 13px;
            font-family: Arial, sans-serif;
          }
          .ans-title {
            font-weight: bold;
            color: #166534;
            margin-bottom: 4px;
          }
          .ans-explanation {
            color: #374151;
            line-height: 1.4;
          }
          .footer-signature {
            margin-top: 50px;
            border-top: 1px dashed #ccc;
            padding-top: 20px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
          }
          .footer-sub {
            font-weight: normal;
            font-style: italic;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          /* Answer Key Table inside detailed answers */
          .answer-key-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 40px;
            margin-bottom: 25px;
            font-size: 13px;
            text-align: center;
          }
          .answer-key-table th, .answer-key-table td {
            border: 1px solid #333;
            padding: 8px;
          }
          .answer-key-table th {
            background-color: #f3f4f6;
          }
        </style>
      </head>
      <body>

         <!-- SPECIMEN EXAM DUAL HEADER -->
        <table class="header-table">
          <tr>
            <td>
              <div>TRƯỜNG: ${schoolNameUpper}</div>
              <div class="divider" style="margin-top: 5px;"></div>
              <div style="font-size: 13px; margin-top: 3px;">MÃ ĐỀ THI: ${examCode}</div>
            </td>
            <td>
              <div>${testPurposeUpper}</div>
              <div style="font-weight: normal; margin-top: 2px;">MÔN HỌC: ${subjectUpper} - LỚP: ${test.grade}</div>
              <div class="header-title-sub">Thời gian làm bài: ${test.duration} phút (không kể thời gian giao đề)</div>
            </td>
          </tr>
        </table>

        <!-- CANDIDATE METADATA BOX -->
        <table class="info-table">
          <tr>
            <td style="width: 65%;">Họ và tên thí sinh:...................................................................................</td>
            <td style="width: 20%;">Lớp:........................</td>
            <td style="width: 15%;">SBD:...................</td>
          </tr>
        </table>

        <div class="guideline">(Thí sinh làm bài trực tiếp vào phiếu trả lời hoặc giấy thi. Thí sinh không được sử dụng tài liệu)</div>
    `;

    const normalizedQuestions = (test.questions || []).map(q => {
      if (q.type === 'MCQ') {
        const hasNoOptions = !q.options || q.options.length === 0 || q.options.every(o => !o || o.replace(/^[A-H]\.\s*/, '').trim() === '');
        const isTfAnswer = q.correctAnswer === 'Đúng' || q.correctAnswer === 'Sai' || q.correctAnswer === 'True' || q.correctAnswer === 'False';
        if (hasNoOptions || isTfAnswer) {
          return {
            ...q,
            type: 'TRUE_FALSE' as const,
            options: undefined
          };
        }
      }
      return q;
    });

    const mcqQs = normalizedQuestions.filter(q => q.type === 'MCQ');
    const tfQs = normalizedQuestions.filter(q => q.type === 'TRUE_FALSE');
    const saQs = normalizedQuestions.filter(q => q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK');
    const matchingQs = normalizedQuestions.filter(q => q.type === 'MATCHING');
    const essayQs = normalizedQuestions.filter(q => q.type === 'SHORT_ESSAY');

    const sections = [
      {
        id: 'MCQ',
        title: 'ĐỀ TRẮC NGHIỆM NHIỀU LỰA CHỌN',
        description: 'Thí sinh chỉ chọn một phương án trả lời đúng duy nhất cho mỗi câu hỏi.',
        questions: mcqQs,
      },
      {
        id: 'TRUE_FALSE',
        title: 'ĐỀ TRẮC NGHIỆM ĐÚNG / SAI',
        description: 'Thí sinh xác định tính Đúng hoặc Sai cho mỗi nhận định hoặc phát biểu bên dưới.',
        questions: tfQs,
      },
      {
        id: 'SHORT_ANSWER',
        title: 'ĐỀ TRẮC NGHIỆM TRẢ LỜI NGẮN',
        description: 'Thí sinh tự điền đáp án ngắn hoặc điền kết quả dạng số vào ô trống tương ứng.',
        questions: saQs,
      },
      {
        id: 'MATCHING',
        title: 'CÂU HỎI GHÉP CẶP KHÁCH QUAN',
        description: 'Móc nối các ý ở cột vế trái với cột vế phải tương ứng để hoàn thiện bài học.',
        questions: matchingQs,
      },
      {
        id: 'SHORT_ESSAY',
        title: 'XEM XÉT CÂU HỎI TỰ LUẬN',
        description: 'Thí sinh trình bày chi tiết lời giải hệ thống và các bước lập luận đầy đủ.',
        questions: essayQs,
      },
    ].filter(sec => sec.questions.length > 0);

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    sections.forEach((sec, secIdx) => {
      html += `
        <div class="section-title" style="margin-top: 30px;">PHẦN ${romanNumerals[secIdx]}: ${sec.title}</div>
        <div style="font-size: 12px; font-style: italic; color: #555; margin-bottom: 15px;">(${sec.description})</div>
      `;

      sec.questions.forEach((q, idx) => {
        const renderedContent = convertToWordMathML(q.content);
        html += `
          <div class="question">
            <div class="question-content">Câu ${idx + 1}. ${renderedContent} <span style="font-weight: normal; font-size: 11px; color: #666; font-style: italic;">(${q.level})</span></div>
        `;

        if (q.type === 'MCQ' && q.options && q.options.length > 0) {
          html += `<div class="options-grid">`;
          q.options.forEach(o => {
            const renderedOption = convertToWordMathML(o);
            html += `<div>${renderedOption}</div>`;
          });
          html += `</div>`;
        } 
        else if (q.type === 'TRUE_FALSE') {
          html += `
            <div class="options-grid" style="grid-template-columns: 1fr 1fr; max-width: 250px; margin-left: 20px;">
              <div>[ ] Đúng</div>
              <div>[ ] Sai</div>
            </div>
          `;
        } 
        else if (q.type === 'MATCHING' && q.options && q.matchingRight) {
          html += `<div class="matching-grid">`;
          // Left Column
          html += `<div><div style="font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase;">Cột vế trái:</div>`;
          q.options.forEach((opt, oI) => {
            const renderedOpt = convertToWordMathML(opt);
            html += `<div class="matching-item">${oI}) ${renderedOpt}</div>`;
          });
          html += `</div>`;
          // Right Column
          html += `<div><div style="font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase;">Cột vế phải:</div>`;
          q.matchingRight.forEach((mr, mrI) => {
            const renderedMr = convertToWordMathML(mr);
            html += `<div class="matching-item">${mrI}) ${renderedMr}</div>`;
          });
          html += `</div>`;
          html += `</div>`;
        } 
        else if (q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK' || q.type === 'SHORT_ESSAY') {
          html += `<div class="short-answer" style="margin-left: 20px;">Đáp án viết hoặc kết quả điền: ..........................................................................................</div>`;
        }

        if (detailedAnswers) {
          const renderedCorrectAnswer = convertToWordMathML(q.correctAnswer);
          const renderedExplanation = convertToWordMathML(q.explanation);
          html += `
            <div class="ans-box" style="margin-top: 10px;">
              <div class="ans-title">✓ ĐÁP ÁN CHUẨN: ${renderedCorrectAnswer}</div>
              <div class="ans-explanation"><strong>Lời giải chi tiết:</strong> ${renderedExplanation}</div>
              ${q.learningOutcome ? `<div style="font-size: 11px; color: #888; margin-top: 5px;">Mục tiêu kiến thức: ${q.learningOutcome}</div>` : ''}
            </div>
          `;
        }

        html += `</div>`;
      });
    });

    // If detailed answers requested, print a quick score / key grid summary too!
    if (detailedAnswers) {
      html += `
        <div style="page-break-before: always;"></div>
        <div class="section-title" style="border-left-color: #6366f1;">BẢNG ĐÁP ÁN NHANH & TRA CỨU CHI TIẾT</div>
        <table class="answer-key-table">
          <thead>
            <tr>
              <th style="width: 25%;">Câu hỏi</th>
              <th style="width: 25%;">Đáp án chính xác</th>
              <th style="width: 50%;">Chuẩn kiến thức kiểm định</th>
            </tr>
          </thead>
          <tbody>
      `;
      sections.forEach((sec, secIdx) => {
        sec.questions.forEach((q, idx) => {
          html += `
            <tr>
              <td><strong>Phần ${romanNumerals[secIdx]} - Câu ${idx + 1}</strong></td>
              <td><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${q.correctAnswer}</code></td>
              <td style="text-align: left;">${q.learningOutcome || 'Mục tiêu kiểm định năng lực'}</td>
            </tr>
          `;
        });
      });
      html += `
          </tbody>
        </table>
      `;
    }

    html += `
        <div class="footer-signature">
          <div>---------------- HẾT ----------------</div>
          <div class="footer-sub">Thí sinh không được sử dụng tài liệu. Giám thị coi thi không giải thích gì thêm.</div>
        </div>
      </body>
      </html>
    `;

    const fileExtension = fileFormat === 'doc' ? 'doc' : 'html';
    const mimeType = fileFormat === 'doc' ? 'application/msword;charset=utf-8' : 'text/html;charset=utf-8';
    const blob = new Blob([html], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${test.title.replace(/\s+/g, '_')}${detailedAnswers ? '_DapAn_ChiTiet' : ''}.${fileExtension}`;
    link.click();
    showToast(`Tải ${fileFormat === 'doc' ? 'Đề thi dạng Word (.DOCX tương thích)' : 'Đề thi dạng HTML'} thành công!`, 'success');
  };

  // EXPORT CLASS REPORT EXCEL-FRIENDLY CSV
  const handleExportCSVReport = (className: string) => {
    let csv = `Họ tên học sinh,Lớp học,Điểm số kiểm tra,Thời gian rèn luyện (giây),Thời điểm nộp bài\n`;
    const classAttempts = attempts.filter(a => a.className === className);
    
    classAttempts.forEach(a => {
      csv += `"${a.studentName}","${a.className}","${formatScore(a.score)}",${a.timeSpent},"${a.submittedAt}"\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Danh_Sach_Diem_Lop_${className}.csv`;
    link.click();
    showToast('Xuất tệp CSV điểm số thành công!', 'success');
  };

  // SAVE CONFIGURED SUBJECT CONFIG FROM SYLLABUS COMPONENT
  const handleSaveActiveSubject = (updated: SubjectConfig) => {
    setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
    showToast(`Đã lưu và cấu hình chương trình môn học ${updated.name} thành công!`, 'success');
  };

  const handleCreateNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectForm.name.trim()) {
      showToast('Vui lòng điền tên môn học.', 'error');
      return;
    }

    let cleanedId = newSubjectForm.id.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanedId) {
      // Auto generate based on name & grade
      const normalizedName = newSubjectForm.name.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, '');
      const baseId = (normalizedName.slice(0, 4) + newSubjectForm.grade).toUpperCase();
      cleanedId = baseId;
    }

    // De-duplicate: append number if duplicate
    let finalId = cleanedId;
    let counter = 1;
    while (subjects.some(s => s.id === finalId)) {
      finalId = `${cleanedId}_${counter}`;
      counter++;
    }

    const newSubject: SubjectConfig = {
      id: finalId,
      name: newSubjectForm.name.trim(),
      grade: newSubjectForm.grade,
      book: newSubjectForm.book.trim() || 'Sách giáo khoa tự chọn',
      teacherName: newSubjectForm.teacherName.trim() || 'Giáo viên',
      schoolName: newSubjectForm.schoolName.trim() || 'THCS Archimedes',
      strands: ['Chương trình chính'],
      defaultQuestionsCount: 10,
      defaultDuration: 15,
      questionTypes: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'],
      cognitiveLevels: ['Nhận biết', 'Thông hiểu', 'Vận dụng'],
      chapters: [
        {
          id: `${finalId}-C1`,
          name: newSubjectForm.chapterName.trim() || 'Chương I: Luyện tập cốt lõi',
          lessons: [
            { id: `${finalId}-C1-B1`, name: newSubjectForm.lessonName.trim() || 'Bài 1: Tổng quan khái niệm lí thuyết', learningOutcomes: ['Nắm được khái niệm lí thuyết và vận dụng cơ bản'] }
          ]
        }
      ]
    };

    setSubjects(prev => [...prev, newSubject]);
    setCurrentSubjectId(finalId);
    
    // Initialize empty completed lessons progress for the new subject
    setProgress(prev => [...prev, { subjectId: finalId, completedLessons: [] }]);

    // Initialize 1 default question so the system always functions safely
    const sampleQ: Question = {
      id: `Q-${finalId}-01`,
      subjectId: finalId,
      chapterId: `${finalId}-C1`,
      lessonId: `${finalId}-C1-B1`,
      type: 'MCQ',
      level: 'Nhận biết',
      content: `Câu hỏi chào mừng gia nhập môn rèn luyện ${newSubject.name}: Đâu là thái độ học tập và rèn luyện tốt nhất?`,
      options: ['A. Tự rèn luyện ôn tập kiên trì hàng ngày', 'B. Trì hoãn công việc', 'C. Chỉ học nhồi nhét sát kì thi', 'D. Bỏ cuộc sớm khi gặp bài khó'],
      correctAnswer: 'A',
      explanation: 'Học sinh siêng năng tự rèn luyện hàng ngày luôn tích lũy kiến thức sâu sắc nhất.',
      source: 'Giáo viên',
      tags: ['Khởi đầu']
    };
    setQuestions(prev => [sampleQ, ...prev]);

    setShowAddSubjectModal(false);
    // Reset form for next time
    setNewSubjectForm({
      id: '',
      name: '',
      grade: '6',
      book: '',
      teacherName: 'Hoàng Quang',
      schoolName: 'THCS Archimedes',
      chapterName: 'Chương I: Luyện tập cốt lõi',
      lessonName: 'Bài 1: Tổng quan khái niệm lí thuyết'
    });
    showToast(`Đã kiến lập học kì môn mới ${newSubject.name} thành công!`, 'success');
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => {
      const filtered = prev.filter(s => s.id !== subjectId);
      if (currentSubjectId === subjectId && filtered.length > 0) {
        setCurrentSubjectId(filtered[0].id);
      }
      return filtered;
    });
    setQuestions(prev => prev.filter(q => q.subjectId !== subjectId));
    setProgress(prev => prev.filter(p => p.subjectId !== subjectId));
    showToast('Đã xóa môn học thành công.', 'info');
  };

  const handleCreateBulkSubjects = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSelectedGrades.length === 0) {
      showToast('Vui lòng chọn ít nhất một khối lớp.', 'error');
      return;
    }
    if (bulkSelectedSubjectNames.length === 0) {
      showToast('Vui lòng chọn ít nhất một môn học.', 'error');
      return;
    }

    const newSubjectsList: SubjectConfig[] = [];
    const newQuestionsList: Question[] = [];
    const newProgressList: StudentProgress[] = [];

    bulkSelectedGrades.forEach(grade => {
      bulkSelectedSubjectNames.forEach(subName => {
        // Generate a safe unique ID
        const normalizedName = subName.trim().toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
          .replace(/[^a-z0-9]/g, '');
        const baseId = (normalizedName.slice(0, 4) + grade).toUpperCase();
        
        let cleanedId = baseId;
        let counter = 1;
        while (subjects.some(s => s.id === cleanedId) || newSubjectsList.some(s => s.id === cleanedId)) {
          cleanedId = `${baseId}_${counter}`;
          counter++;
        }

        const newSub: SubjectConfig = {
          id: cleanedId,
          name: subName,
          grade: grade,
          book: bulkBook.trim() || 'Kết nối tri thức',
          teacherName: bulkTeacherName.trim() || 'Hoàng Quang',
          schoolName: 'THCS Archimedes',
          strands: ['Chương trình chính', 'Luyện tập tổng hợp'],
          defaultQuestionsCount: 10,
          defaultDuration: 15,
          questionTypes: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'],
          cognitiveLevels: ['Nhận biết', 'Thông hiểu', 'Vận dụng'],
          chapters: [
            {
              id: `${cleanedId}-C1`,
              name: 'Chương I: Luyện tập cốt lõi',
              lessons: [
                { id: `${cleanedId}-C1-B1`, name: 'Bài 1: Tổng quan khái niệm lí thuyết', learningOutcomes: ['Nhận biết kiến thức cốt lõi', 'Rèn luyện khả năng thực hành'] }
              ]
            }
          ]
        };

        newSubjectsList.push(newSub);
        newProgressList.push({ subjectId: cleanedId, completedLessons: [] });

        const sampleQ: Question = {
          id: `Q-${cleanedId}-01`,
          subjectId: cleanedId,
          chapterId: `${cleanedId}-C1`,
          lessonId: `${cleanedId}-C1-B1`,
          type: 'MCQ',
          level: 'Nhận biết',
          content: `Câu hỏi trắc nghiệm rèn luyện mở đầu môn ${subName} Lớp ${grade}: Hãy luôn nỗ lực đạt kết quả tốt nhất nhé!`,
          options: ['A. Đồng ý, em sẽ cố gắng', 'B. Trì hoãn học tập', 'C. Chỉ ôn tập vào ngày thi', 'D. Bỏ qua các bài ôn luyện'],
          correctAnswer: 'A',
          explanation: 'Ý thức tự giác học tập luôn mang lại kết quả rèn luyện xuất sắc nhất.',
          source: 'Giáo viên',
          tags: ['Khởi đầu']
        };
        newQuestionsList.push(sampleQ);
      });
    });

    setSubjects(prev => [...prev, ...newSubjectsList]);
    setQuestions(prev => [...newQuestionsList, ...prev]);
    setProgress(prev => [...prev, ...newProgressList]);

    // Set first created subject as current
    if (newSubjectsList.length > 0) {
      setCurrentSubjectId(newSubjectsList[0].id);
    }

    setShowAddSubjectModal(false);
    showToast(`Đã biên soạn thành công ${newSubjectsList.length} môn học mới!`, 'success');
  };

  const handleDirectAssignFromSyllabus = (testId: string, className: string, deadline: string, notes: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    const newAsg: Assignment = {
      id: `ASG-${Date.now()}`,
      testId: test.id,
      testTitle: test.title,
      subjectId: currentSubjectId,
      className,
      deadline,
      notes,
      status: 'Đang mở',
      submittedCount: 0
    };

    setAssignments(prev => [newAsg, ...prev]);
    setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'Đã giao' } : t));
    showToast(`Đã giao nhanh đề rèn luyện "${test.title}" tới Lớp ${className} thành công!`, 'success');
  };

  // SAVE NEWLY GENERATED EXAM TEST TO LIST
  const handleSaveAIorManualTest = (newTest: Test, parsedQs?: Question[]) => {
    if (parsedQs && parsedQs.length > 0) {
      setQuestions(prev => {
        const up = [...prev];
        parsedQs.forEach(pq => {
          if (!up.some(x => x.content === pq.content)) {
            up.push(pq);
          }
        });
        return up;
      });
    }
    setTests(prev => [newTest, ...prev]);
    setActiveTab('test-bank');
  };

  // ASSIGN SUBMIT ACTION
  const handleAssignTestSubmit = () => {
    if (!assignForm.testId) {
      showToast('Vui lòng tích chọn đề kiểm tra trong kho.', 'error');
      return;
    }
    if (!assignForm.deadline) {
      showToast('Vui lòng điền hạn làm bài thi.', 'error');
      return;
    }

    const test = tests.find(t => t.id === assignForm.testId);
    if (!test) return;

    const newAsg: Assignment = {
      id: `ASG-${Date.now()}`,
      testId: test.id,
      testTitle: test.title,
      subjectId: currentSubjectId,
      className: assignForm.className,
      deadline: assignForm.deadline,
      notes: assignForm.notes,
      status: 'Đang mở',
      submittedCount: 0
    };

    setAssignments(prev => [newAsg, ...prev]);
    setTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'Đã giao' } : t));
    
    // Reset Form
    setAssignForm({ testId: '', className: '6A1', deadline: '', notes: '' });
    showToast(`Đã giao đề rèn luyện "${test.title}" tới Lớp ${assignForm.className} thành công!`, 'success');
  };

  // Helper set quick deadline
  const setDeadlineWithOffsetDays = (days: number) => {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    setAssignForm(prev => ({ ...prev, deadline: formatted }));
    showToast(`Đã chọn nhanh hạn nộp bài là sau ${days} ngày!`, 'success');
  };

  // CALL API FOR ANALYSIS REPORT WITH GEMINI
  const handleTriggerAIReport = async (className: string) => {
    setSelectedReportClass(className);
    setIsAnalyzingReport(true);
    setReportData(null);

    const classAttempts = attempts.filter(a => 
      a.className === className && 
      tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId
    );

    const scoreList = classAttempts.map(a => `${a.studentName}: ${a.score} điểm`);
    const averageScore = classAttempts.reduce((acc, c) => acc + c.score, 0) / (classAttempts.length || 1);

    try {
      const response = await fetch('/api/gemini/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          subjectName: activeSubject.name,
          grade: activeSubject.grade,
          averageScore: averageScore.toFixed(1),
          scoreList,
          clientApiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const resData = await response.json();
      setReportData(resData);
      showToast(`AI đã hoàn tất báo cáo giảng dạy lớp ${className}!`, 'success');
    } catch (error: any) {
      console.error(error);
      // Fallback
      setReportData({
        strengths: 'Đa số các học sinh nắm bắt tương đối nhanh các câu hỏi Nhận biết về khái niệm. Có tư duy phản xạ đề tiếng Anh trôi chảy.',
        weaknesses: 'Tính toán biểu thức chứa dấu phân loại Math LaTeX hay các đề mang mức độ Vận dụng còn nhiều va vấp.',
        recommendations: 'Giáo viên nên tổ chức chuyên đề rèn luyện theo nhóm học tập, bồi đắp kiến thức cơ bản cho các em học giỏi rạp rèn nhóm bạn.',
        unsupportiveStudents: [
          { name: 'Trần Thị My', score: 4.0, topic: 'Thứ tự thực hiện phép cộng trừ nhân chia biểu thức lồng dấu' }
        ]
      });
      showToast('Trình diễn dữ liệu rèn luyện bằng chế độ giả lập thông minh trên hệ thống.', 'info');
    } finally {
      setIsAnalyzingReport(false);
    }
  };

  // MANUALLY REGISTER/EDIT QUESTION TO BANK
  const handleManualAddOrEditQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setQuestions(prev => {
      const exists = prev.some(q => q.id === editingQuestion.id);
      if (exists) {
        return prev.map(q => q.id === editingQuestion.id ? editingQuestion : q);
      } else {
        return [editingQuestion, ...prev];
      }
    });

    setShowQuestionModal(false);
    setEditingQuestion(null);
    showToast('Đã ghi nhận câu hỏi thành công vào kho ngân hàng dữ liệu!', 'success');
  };

  // TOTAL PROGRESS COMPUTED stats
  const progressStats = useMemo(() => {
    const activeProg = progress.find(p => p.subjectId === currentSubjectId);
    const totalLessons = activeSubject.chapters.flatMap(c => c.lessons).length;
    const completedCount = activeProg ? activeProg.completedLessons.length : 0;
    const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    
    return {
      completed: completedCount,
      total: totalLessons,
      percent
    };
  }, [progress, currentSubjectId, activeSubject]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* TOAST SYSTEM VIEW */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-2.5 border transition-all duration-300 transform scale-100 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 
          toast.type === 'error' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-800 text-white border-slate-700'
        }`}>
          <span className="font-bold">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✗'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="text-xs md:text-sm font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* GRADIENT COMPACT HEADER */}
      <header className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <Brain className="h-6 w-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-black tracking-tight flex items-center gap-2">
                QUICKQUIZ – TRẮC NGHIỆM NHANH ĐA MÔN
              </h1>
              <p className="text-[11px] text-emerald-200 font-light flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400"></span>
                Chương trình: {activeSubject.book} | Giáo viên: {activeSubject.teacherName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* API MODAL TRIGGER */}
            <button
              onClick={() => setShowKeyModal(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                apiKey ? 'bg-emerald-700 text-emerald-100 hover:bg-emerald-600' : 'bg-amber-600 text-white hover:bg-amber-500'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {apiKey ? 'Sẵn sàng AI' : 'Cài Gemini API'}
            </button>

            {/* COMPACT ACTIVE SUBJECT BADGE */}
            <div className="bg-emerald-950/60 text-white text-xs font-black rounded-xl border border-emerald-700 py-1.5 px-3 uppercase tracking-wide">
              Bộ môn: {activeSubject.name} - Lớp {activeSubject.grade}
            </div>

            {/* AMBIENT SOUND SYSTEM TOGGLE */}
            <button
              onClick={() => {
                const muted = sound.toggleMute();
                setSoundMuted(muted);
                if (!muted) {
                  sound.playToastSuccess();
                }
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                soundMuted 
                  ? 'bg-rose-950/50 text-rose-200 border-rose-800 hover:bg-rose-900/40' 
                  : 'bg-emerald-950/60 text-emerald-200 border-emerald-700 hover:bg-emerald-950/90'
              }`}
              title={soundMuted ? "Bật âm thanh rèn luyện" : "Tắt âm thanh rèn luyện"}
            >
              {soundMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline text-[10px] font-bold">Âm thanh: Tắt</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-[10px] font-bold text-emerald-300">Âm thanh: Bật</span>
                </>
              )}
            </button>

            {/* SWITCH ROLES */}
            <div className="bg-emerald-950/80 p-0.5 rounded-xl flex items-center">
              <button
                onClick={() => handleSetRoleSecure('teacher')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                  role === 'teacher' ? 'bg-white text-emerald-900 shadow' : 'text-emerald-100'
                }`}
              >
                Giáo viên
              </button>
              <button
                onClick={() => handleSetRoleSecure('student')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                  role === 'student' ? 'bg-white text-emerald-900 shadow' : 'text-emerald-100'
                }`}
              >
                Học sinh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MULTI-SUBJECT PILLS PANEL PRO */}
      {role === 'teacher' && (
        <div className="bg-white border-b border-slate-200 py-3 px-6 sticky top-[68px] z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-200" id="multi-subject-bar">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-2 shrink-0">Phạm vi môn học ({subjects.length}):</span>
              
              {subjects.map((s) => {
                const active = s.id === currentSubjectId;
                const countQs = questions.filter(q => q.subjectId === s.id).length;
                return (
                  <div
                    key={s.id}
                    className={`relative group px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 border ${
                      active 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-black' 
                        : 'bg-slate-50 border-slate-200/85 text-slate-600 hover:bg-slate-100'
                    }`}
                    id={`subject-pill-${s.id}`}
                  >
                    <button
                      onClick={() => setCurrentSubjectId(s.id)}
                      className="flex items-center gap-2 focus:outline-none cursor-pointer"
                    >
                      <span>{s.name} (Lớp {s.grade})</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono leading-none ${active ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-500'}`}>
                        {countQs} câu
                      </span>
                    </button>
                    
                    {subjects.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubjectToDelete(s);
                        }}
                        title="Xóa môn rèn luyện học phần"
                        className={`p-0.5 rounded-full duration-150 ${active ? 'hover:bg-emerald-500 text-emerald-100 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              
              {/* ADD DYNAMIC SUBJECT KEY ACTION */}
              <button
                onClick={() => {
                  setCreationMode('single');
                  setShowAddSubjectModal(true);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 shrink-0 cursor-pointer border border-dashed border-slate-300"
                id="btn-add-subject"
                title="Khởi tạo môn học mới"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>+ Biên soạn môn mới</span>
              </button>
            </div>

            <div className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1.5 select-none shrink-0 border-l border-slate-200 pl-3">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> 
              <span>Bộ sách: <span className="text-emerald-700">{activeSubject.book}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* CORE FRAMEWORK SECTION */}
      {role === 'student' && !studentSession ? (
        <div className="max-w-md mx-auto w-full py-12 px-4 flex-grow flex items-center justify-center animate-fadeIn font-sans">
          
          <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>
            
            <div className="text-center flex flex-col gap-2">
              <span className="text-3xl">🔑</span>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">CỔNG THI & RÈN LUYỆN</h2>
              <p className="text-xs text-slate-400 font-semibold px-4">
                Nhập mật khẩu do giáo viên bộ môn cung cấp để truy cập không gian học tập trực tuyến
              </p>
            </div>

            {/* FORM FIELDS */}
            <div className="flex flex-col gap-4">
              {/* 1. CHỌN MÔN HỌC */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">1. CHỌN MÔN HỌC RÈN LUYỆN</label>
                <select
                  value={portalSubjectId}
                  onChange={(e) => {
                    setPortalSubjectId(e.target.value);
                    const subj = subjects.find(s => s.id === e.target.value);
                    if (subj) {
                      const matchingClasses = classes.filter(c => {
                        if (!c || !subj.grade) return false;
                        const match = c.match(/(\d+)/);
                        if (match) return match[1] === subj.grade;
                        return c.startsWith(subj.grade);
                      });
                      const firstClass = matchingClasses[0] || (subj.grade + 'A1');
                      setPortalClass(firstClass);
                    }
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - Lớp {s.grade} ({s.book})</option>
                  ))}
                </select>
              </div>

              {/* 2. CHỌN LỚP HỌC */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">2. CHỌN LỚP CỦA EM</label>
                <select
                  value={portalClass}
                  onChange={(e) => setPortalClass(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {classes.filter(cls => {
                    const subj = subjects.find(s => s.id === portalSubjectId);
                    if (!subj) return true;
                    if (!cls || !subj.grade) return false;
                    const match = cls.match(/(\d+)/);
                    if (match) return match[1] === subj.grade;
                    return cls.startsWith(subj.grade);
                  }).map(cls => (
                    <option key={cls} value={cls}>Lớp học {cls}</option>
                  ))}
                </select>
              </div>

              {/* 3. CHỌN TÊN / TỰ ĐĂNG KÝ */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">3. CHỌN TÊN EM TRONG DANH SÁCH</label>
                
                {students.filter(s => s.className === portalClass).length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <select
                      value={portalStudentId}
                      onChange={(e) => {
                        setPortalStudentId(e.target.value);
                        if (e.target.value !== 'NEW_STUDENT') {
                          const std = students.find(s => s.id === e.target.value);
                          if (std) setPortalCustomName(std.name);
                        } else {
                          setPortalCustomName('');
                        }
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Click chọn tên của em --</option>
                      {students.filter(s => s.className === portalClass).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="NEW_STUDENT">✏️ Nhập tên mới của em (Tự đăng ký)</option>
                    </select>
                    
                    {portalStudentId === 'NEW_STUDENT' && (
                      <input
                        type="text"
                        placeholder="Nhập họ và tên đầy đủ của em..."
                        value={portalCustomName}
                        onChange={(e) => setPortalCustomName(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 animate-slideDown"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-amber-600 font-bold leading-normal">Chưa có danh sách học sinh lớp {portalClass}. Em hãy tự gõ họ tên để đăng ký:</p>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên đầy đủ của em..."
                      value={portalCustomName}
                      onChange={(e) => {
                        setPortalCustomName(e.target.value);
                        setPortalStudentId('NEW_STUDENT');
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* 4. NHẬP MẬT KHẨU LỚP */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {portalStudentId && portalStudentId !== 'NEW_STUDENT'
                      ? "4. NHẬP MẬT KHẨU CÁ NHÂN CỦA EM" 
                      : "4. NHẬP MẬT KHẨU LỚP"
                    }
                  </label>
                  {(() => {
                    if (portalStudentId && portalStudentId !== 'NEW_STUDENT') {
                      const selectedStudent = students.find(s => s.id === portalStudentId);
                      if (selectedStudent) {
                        const computedPass = selectedStudent.password || generateStudentPassword(portalClass, selectedStudent.name);
                        return (
                          <span className="text-[9px] text-amber-700 font-bold italic">
                            🔑 Mẫu: {computedPass}
                          </span>
                        );
                      }
                    }
                    return (
                      <span className="text-[9px] text-slate-400 italic">
                        Mật khẩu mẫu: {portalClass}@123 hoặc 123
                      </span>
                    );
                  })()}
                </div>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu do thầy/cô cung cấp..."
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tracking-widest text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* BUTTON SUBMIT */}
            <button
              onClick={handlePortalLogin}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
            >
              <span>🔑 Xác thực mật khẩu & Vào phòng học</span>
            </button>

            <div className="text-center">
              <span className="text-[9px] text-slate-400 font-medium">
                Cổng học sinh đồng bộ trực tiếp với máy chủ học liệu của giáo viên THCS Archimedes.
              </span>
            </div>
          </div>

        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
          
          {/* L: SIDEBAR (3 cols) */}
          <aside className="lg:col-span-3 flex flex-col gap-5">
            
            {/* PROFILE CARD */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center text-white text-xl font-black mb-3 shadow-md shadow-emerald-50">
                {role === 'teacher' ? 'GV' : 'HS'}
              </div>
              {role === 'teacher' ? (
                <>
                  <h3 className="font-extrabold text-slate-800 text-base leading-tight">{activeSubject.teacherName}</h3>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 uppercase">{activeSubject.schoolName}</span>
                </>
              ) : (
                <>
                  <h3 className="font-extrabold text-indigo-950 text-base leading-tight">
                    {studentSession ? studentSession.studentName : currentStudent.name}
                  </h3>
                  <span className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-wider">
                    Lớp {studentSession ? studentSession.className : currentStudent.className} • Môn {activeSubject.name}
                  </span>
                  
                  <div className="w-full mt-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-left text-xs text-slate-600 space-y-1">
                    <div>
                      <span className="font-bold text-slate-400 block text-[8px] uppercase tracking-wider">THẦY CÔ BỘ MÔN:</span>
                      <span className="font-extrabold text-indigo-950">{activeSubject.teacherName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block text-[8px] uppercase tracking-wider font-extrabold">Bộ Sách Giáo Khoa:</span>
                      <span className="font-medium text-slate-700">{activeSubject.book}</span>
                    </div>
                  </div>

                  {/* MAT KHAU CA NHAN SECTION */}
                  <div className="w-full mt-2.5 p-3 bg-amber-50 rounded-2xl border border-amber-100/50 text-left text-xs text-slate-700">
                    {!isEditingStudentPwd ? (
                      <div className="flex justify-between items-center gap-1">
                        <div>
                          <span className="font-bold text-amber-800/60 block text-[8px] uppercase tracking-wider">MẬT KHẨU CÁ NHÂN:</span>
                          <span className="font-mono font-bold text-amber-800 text-[10px] break-all">
                            {(() => {
                              const stdId = studentSession?.studentId || currentStudent?.id;
                              const currentS = students.find(s => s.id === stdId);
                              if (currentS) {
                                return currentS.password || generateStudentPassword(currentS.className, currentS.name);
                              }
                              return 'Chưa thiết lập';
                            })()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsEditingStudentPwd(true);
                            const stdId = studentSession?.studentId || currentStudent?.id;
                            const currentS = students.find(s => s.id === stdId);
                            setNewStudentPwdText(currentS ? (currentS.password || generateStudentPassword(currentS.className, currentS.name)) : '');
                          }}
                          className="shrink-0 px-2 py-1 text-[9px] font-bold text-amber-800 hover:text-white bg-amber-100 hover:bg-amber-600 border border-amber-200 rounded-lg transition-all"
                        >
                          Đổi
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="font-bold text-amber-800 block text-[8px] uppercase tracking-wider">ĐỔI MẬT KHẨU CÁ NHÂN:</span>
                        <input
                          type="text"
                          value={newStudentPwdText}
                          onChange={(e) => setNewStudentPwdText(e.target.value)}
                          placeholder="Mật khẩu mới..."
                          className="w-full p-2 bg-white border border-amber-200/80 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs text-slate-700"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setIsEditingStudentPwd(false);
                            }}
                            className="px-2 py-0.5 text-[9px] font-bold text-slate-400 hover:text-slate-500 bg-white border border-slate-200 rounded-lg"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => {
                              const stdId = studentSession?.studentId || currentStudent?.id;
                              if (!stdId) return;
                              if (!newStudentPwdText.trim()) {
                                showToast('Mật khẩu mới không được trống!', 'error');
                                return;
                              }
                              setStudents(prev => prev.map(s => s.id === stdId ? { ...s, password: newStudentPwdText.trim() } : s));
                              showToast('Thay đổi mật khẩu cá nhân thành công!', 'success');
                              setIsEditingStudentPwd(false);
                            }}
                            className="px-2 py-0.5 text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setStudentSession(null);
                      showToast('Em đã thoát khoá học thành công!', 'info');
                    }}
                    className="w-full mt-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black rounded-xl transition-all"
                  >
                    🔐 Thoát phòng học này
                  </button>
                </>
              )}
            </div>

          {/* MAIN MENU TAB CONTROL */}
          <nav className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2.5 flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 px-3 py-1.5 uppercase tracking-wider">MỤC CHUYÊN BIỆT</span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Trang chủ học tập
            </button>

            {role === 'teacher' && (
              <>
                <button
                  onClick={() => setActiveTab('class-setup')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'class-setup' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  id="tab-btn-class-setup"
                >
                  Cấu hình lớp học
                </button>
                <button
                  onClick={() => setActiveTab('subject-setup')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'subject-setup' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cấu hình chương trình
                </button>
                <button
                  onClick={() => setActiveTab('test-generator')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'test-generator' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Biên soạn, tạo đề thi
                </button>
                <button
                  onClick={() => setActiveTab('question-bank')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'question-bank' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Kho câu hỏi ({questions.filter(q => q.subjectId === currentSubjectId).length})
                </button>
                <button
                  onClick={() => setActiveTab('test-bank')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'test-bank' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Kho đề kiểm tra ({tests.filter(t => t.subjectId === currentSubjectId).length})
                </button>
                <button
                  onClick={() => setActiveTab('assign-test')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'assign-test' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Giao bài rèn luyện
                </button>
                <button
                  onClick={() => setActiveTab('class-report')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'class-report' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Báo cáo điểm rèn luyện
                </button>
                <button
                  onClick={() => { 
                    localStorage.removeItem('quickquiz_teacher_authenticated'); 
                    setRole('student'); 
                    localStorage.setItem('quickquiz_current_role', 'student');
                    setActiveTab('dashboard');
                    showToast('Đã khoá bảng điều khiển Giáo viên thành công!', 'info');
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center gap-1.5 mt-2"
                >
                  🔒 Khoá bảng điều khiển GV
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('progress-setup')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'progress-setup' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tiến trình rèn luyện
            </button>

            {role === 'student' && (
              <button
                onClick={() => setActiveTab('student-stats')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'student-stats' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📊 Thống kê kiểm tra
              </button>
            )}
          </nav>

          {/* SIDEBAR PROGRESS WIDGET */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>TIẾN ĐỘ TÍCH LŨY MÔN</span>
              <span className="text-emerald-600">{progressStats.percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progressStats.percent}%` }}></div>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Học sinh đã tích luỹ <span className="font-extrabold text-slate-700">{progressStats.completed}</span> trên <span className="font-extrabold text-slate-700">{progressStats.total}</span> bài cốt lõi.
            </p>
          </div>

          <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-600">Trạng thái rèn luyện</span>
            <p className="text-[10px] leading-snug">Hệ thống đồng bộ LocalStorage toàn thời gian.</p>
            <button 
              onClick={() => {
                setShowResetConfirm(true);
              }}
              className="py-1 bg-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-300 transition-all"
            >
              Reset dữ liệu mặc định
            </button>
          </div>

        </aside>

        {/* R: VIEWS DISPLAY (9 cols) */}
        <main className="lg:col-span-9 flex flex-col gap-6">

          {/* ==================== TAB: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* WELCOME CARD */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-2 text-center md:text-left">
                  <span className="px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider w-max mx-auto md:mx-0">
                    HỆ THỐNG RÈN LUYỆN TOÀN DIỆN
                  </span>
                  <h2 className="text-xl md:text-3xl font-black">MÔN {activeSubject.name.toUpperCase()} LỚP {activeSubject.grade}</h2>
                  <p className="text-xs md:text-sm text-emerald-100 font-light max-w-lg leading-relaxed">
                    Đồng hành cùng chương trình bộ sách {activeSubject.book}. Dễ dàng sinh kho câu hỏi thực tế và theo sát phổ điểm bồi dưỡng học sinh bằng công nghệ cao.
                  </p>
                </div>
                
                {role === 'student' && (
                  <button
                    onClick={() => handleStartPractice()}
                    className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-xl shadow-md text-xs cursor-pointer transition-all"
                  >
                    Bắt đầu làm bài thi thử
                  </button>
                )}
              </div>

              {/* ROLE: STUDENT DASHBOARD VIEW */}
              {role === 'student' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* EXAMS ASSIGNED */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase">
                      <FileText className="w-4 h-4 text-emerald-600" /> BÀI TẬP GIÁO VIÊN GIAO
                    </h3>

                    {assignments.filter(a => a.className === currentStudent.className && a.subjectId === currentSubjectId).length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-6 text-center">Chưa có bài tập nào được giao cho em từ giáo viên.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {assignments.filter(a => a.className === currentStudent.className && a.subjectId === currentSubjectId).map(asg => {
                          const testObj = tests.find(t => t.id === asg.testId);
                          const currentAttempts = attempts.filter(at => at.testId === asg.testId && at.studentId === currentStudent.id);
                          const attemptCount = currentAttempts.length;

                          return (
                            <div key={asg.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/50 flex flex-col gap-3 hover:border-emerald-305 transition-all shadow-2xs">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className="font-extrabold text-xs text-slate-800 leading-tight">{asg.testTitle}</h4>
                                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                                    ⏱ {testObj?.duration || 15} phút | {testObj?.questions.length || 0} câu hỏi
                                  </span>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  {attemptCount > 0 ? (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px] uppercase tracking-wide">
                                        Đã thi ({attemptCount}/3)
                                      </span>
                                      <span className="text-[10px] font-black text-rose-600 block">
                                        Cao nhất: {formatScore(Math.max(...currentAttempts.map(at => at.score)))}đ
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded font-bold text-[9px] uppercase tracking-wide">
                                      Chưa làm
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-light">{asg.notes || 'Không có hướng dẫn thêm.'}</p>
                              
                              {/* ATTEMPTS LIST */}
                              {attemptCount > 0 && (
                                <div className="flex flex-col gap-1.5 bg-white border border-slate-150 p-2.5 rounded-xl text-[10px] text-slate-600 shadow-3xs">
                                  <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider block">Lịch sử rèn luyện:</span>
                                  <div className="flex flex-col gap-1">
                                    {[...currentAttempts].reverse().map((att, index) => (
                                      <div key={att.id} className="flex justify-between items-center bg-slate-50 hover:bg-emerald-50/20 p-2 rounded-lg border border-slate-100 transition-all">
                                        <span className="font-bold text-slate-700">
                                          Lần rèn {index + 1}: <strong className="text-emerald-700 font-extrabold">{formatScore(att.score)}đ</strong>
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] text-slate-400 font-medium">{att.submittedAt.split(' ')[1] || att.submittedAt}</span>
                                          <button
                                            onClick={() => {
                                              setActiveQuizAttemptResult(att);
                                              setActiveTab('quiz-result');
                                            }}
                                            className="text-indigo-600 font-black hover:underline hover:text-indigo-800 text-[9px]"
                                          >
                                            Xem lại bài 🔍
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-200/50">
                                <span>Hạn: {new Date(asg.deadline).toLocaleString('vi-VN')}</span>
                                {attemptCount < 3 ? (
                                  <button
                                    onClick={() => testObj && handleStartPractice(testObj)}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all hover:shadow-xs text-[10px]"
                                  >
                                    {attemptCount > 0 ? `Làm lại (Lượt ${attemptCount + 1})` : 'Làm bài'}
                                  </button>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded text-[9px] font-extrabold uppercase">
                                    Đã hết lượt (3/3 lần)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE PRACTICING FORM */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase">
                      <TrendingUp className="w-4 h-4 text-emerald-600" /> ÔN TẬP PHỔ THÔNG TỰ CHỌN
                    </h3>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">CHƯƠNG PHẠM VI</label>
                        <select
                          value={selectedChapterId}
                          onChange={(e) => {
                            setSelectedChapterId(e.target.value);
                            const ch = activeSubject.chapters.find(c => c.id === e.target.value);
                            setSelectedLessonId(ch && ch.lessons.length > 0 ? ch.lessons[0].id : '');
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- Toàn bộ chương --</option>
                          {activeSubject.chapters.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">BÀI HỌC CỐT LÕI</label>
                        <select
                          value={selectedLessonId}
                          onChange={(e) => setSelectedLessonId(e.target.value)}
                          disabled={!selectedChapterId}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none disabled:opacity-50"
                        >
                          <option value="">-- Toàn bộ bài học --</option>
                          {activeSubject.chapters.find(c => c.id === selectedChapterId)?.lessons.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">SỐ CÂU HỎI</label>
                          <select
                            value={quizQuestionsCount}
                            onChange={(e) => setQuizQuestionsCount(Number(e.target.value))}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          >
                            <option value={3}>3 câu</option>
                            <option value={5}>5 câu</option>
                            <option value={10}>10 câu</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">THỜI LƯỢNG (PHÚT)</label>
                          <select
                            value={quizDuration}
                            onChange={(e) => setQuizDuration(Number(e.target.value))}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          >
                            <option value={5}>5 phút</option>
                            <option value={10}>10 phút</option>
                            <option value={15}>15 phút</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartPractice()}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow mt-2"
                      >
                        Bắt Đầu Ôn Tập Ngay
                      </button>
                    </div>
                  </div>

                  {/* ATTRIBUTES CHART SUMMARY MAP */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 md:col-span-2 flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase">📈 THÀNH TÍCH ĐẠT ĐƯỢC</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                        <span className="text-xl font-black text-indigo-700 block">
                          {attempts.filter(a => a.studentId === currentStudent.id && tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId).length}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mt-1">Bài đã giải</span>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                        <span className="text-xl font-black text-emerald-700 block">
                          {formatScore(Math.max(...(attempts.filter(a => a.studentId === currentStudent.id && tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId).map(a => a.score) || [0]), 0))}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mt-1">Điểm cao nhất</span>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center col-span-2 md:col-span-1">
                        <span className="text-xl font-black text-amber-700 block">
                          {formatScore(
                            attempts.filter(a => a.studentId === currentStudent.id && tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId).reduce((ac, c) => ac + c.score, 0) / 
                            (attempts.filter(a => a.studentId === currentStudent.id && tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId).length || 1)
                          )}
                        </span>
                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block mt-1">Điểm trung bình</span>
                      </div>
                    </div>
                  </div>

                  {/* PAST ATTEMPTS, SCORES, AND TEACHER COMMENTS */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 md:col-span-2 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase">
                        <span>🏆 KẾT QUẢ RÈN LUYỆN & NHẬN XÉT CỦA GIÁO VIÊN</span>
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400">Đồng bộ tự động</span>
                    </div>

                    {(() => {
                      const studentSubjectAttempts = attempts.filter(
                        a => a.studentId === currentStudent.id && 
                        tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId
                      );

                      if (studentSubjectAttempts.length === 0) {
                        return (
                          <div className="py-12 text-center text-slate-400 italic text-xs">
                            Em chưa nộp bài rèn luyện nào ở môn này. Hãy chọn các nhiệm vụ ở trên để rèn luyện ngay!
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-4 overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                                <th className="pb-2.5">Đề kiểm tra rèn luyện</th>
                                <th className="pb-2.5">Ngày nộp</th>
                                <th className="pb-2.5 text-center">Điểm số</th>
                                <th className="pb-2.5">Nhận xét từ thầy / cô bộ môn</th>
                                <th className="pb-2.5 text-right">Giải chi tiết</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {studentSubjectAttempts.map(att => {
                                const matchedTest = tests.find(t => t.id === att.testId);
                                if (!matchedTest) return null;

                                return (
                                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 pr-2">
                                      <span className="font-extrabold text-slate-800 block">
                                        {matchedTest.title}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        Lớp {matchedTest.grade} | {matchedTest.questions.length} câu hỏi
                                      </span>
                                    </td>
                                    <td className="py-3 text-slate-400 text-[11px]">
                                      {new Date(att.submittedAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="py-3 text-center">
                                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                                        att.isGraded 
                                          ? att.score >= 5.0 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}>
                                        {att.isGraded ? `${formatScore(att.score)} / 10` : 'Đang chấm'}
                                      </span>
                                    </td>
                                    <td className="py-3 max-w-[280px]">
                                      {att.isGraded ? (
                                        att.feedback ? (
                                          <div className="bg-indigo-50/70 border border-indigo-100/50 p-2.5 rounded-xl text-[11px] text-indigo-900 leading-normal font-medium flex flex-col gap-0.5 relative">
                                            <span className="font-black text-[9px] text-indigo-500 uppercase tracking-wider block">Thầy/Cô viết:</span>
                                            <p className="italic">"{att.feedback}"</p>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 italic text-[11px]">Đã ghi nhận điểm rèn luyện cốt lõi hoàn tất.</span>
                                        )
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] uppercase">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                          <span>Đang chờ hoàn thiện nhận xét...</span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3 text-right">
                                      <button
                                        onClick={() => {
                                          setActiveQuizAttemptResult(att);
                                          setActiveTab('quiz-result');
                                        }}
                                        className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-[11px] border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
                                      >
                                        💡 Xem lại bài
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}

              {/* ROLE: TEACHER DASHBOARD VIEW */}
              {role === 'teacher' && (
                <div className="flex flex-col gap-6">
                  
                  {/* TOP STAT GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Ngân hàng câu hỏi</span>
                        <span className="text-2xl font-black text-slate-800">{questions.filter(q => q.subjectId === currentSubjectId).length} câu</span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">✓</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Đề thi trong kho</span>
                        <span className="text-2xl font-black text-slate-800">{tests.filter(t => t.subjectId === currentSubjectId).length} đề</span>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700">✓</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Nhiệm vụ đang giao</span>
                        <span className="text-2xl font-black text-slate-800">{assignments.filter(a => a.subjectId === currentSubjectId).length} nhiệm vụ</span>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl text-purple-700">✓</div>
                    </div>
                  </div>

                  {/* CLASSES MANAGER */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 text-sm uppercase">Danh sách các lớp rèn luyện</h3>
                      <button
                        onClick={() => { setActiveTab('class-setup'); }}
                        className="text-emerald-700 font-extrabold hover:underline text-xs flex items-center gap-1"
                        id="dashboard-btn-edit-classes"
                      >
                        <Plus className="w-3 h-3" /> Cấu hình lớp học
                      </button>
                    </div>

                    {(() => {
                      const activeGradeClasses = classes.filter(cls => {
                        if (!activeSubject) return true;
                        if (!cls || !activeSubject.grade) return false;
                        const match = cls.match(/(\d+)/);
                        if (match) return match[1] === activeSubject.grade;
                        return cls.startsWith(activeSubject.grade);
                      });
                      if (activeGradeClasses.length === 0) {
                        return (
                          <div className="text-center py-6 text-slate-400 italic text-xs">
                            Chưa cấu hình lớp học nào của khối {activeSubject?.grade} ({activeSubject?.name}). Vui lòng bấm nút "Cấu hình lớp học" để khởi tạo.
                          </div>
                        );
                      }
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {activeGradeClasses.map((clsName) => {
                            const classAtmp = attempts.filter(a => a.className === clsName && tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId);
                            const avg = classAtmp.reduce((ac, c) => ac + c.score, 0) / (classAtmp.length || 1);
                            const studentCount = students.filter(s => s.className === clsName).length;

                            return (
                              <div key={clsName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/50 flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-extrabold text-xs text-slate-800">Lớp {clsName}</span>
                                  <span className="text-[9px] bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 font-bold">
                                    {studentCount} Học viên
                                  </span>
                                </div>
                                
                                <div className="text-[11px] text-slate-500 space-y-1">
                                  <p className="flex justify-between"><span>Đã nộp bài:</span> <strong className="text-slate-800">{classAtmp.length} bài</strong></p>
                                  <p className="flex justify-between"><span>Điểm trung bình:</span> <strong className="text-emerald-700">{classAtmp.length > 0 ? formatScore(avg) : 'Chưa thi'}</strong></p>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                                  <button 
                                    onClick={() => { setActiveTab('class-report'); handleTriggerAIReport(clsName); }}
                                    className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all"
                                  >
                                    Xem biểu đồ
                                  </button>
                                  <button 
                                    onClick={() => handleExportCSVReport(clsName)}
                                    className="py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg"
                                  >
                                    Xuất tệp CSV
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ==================== TAB: SUBJECT SETUP ==================== */}
          {activeTab === 'subject-setup' && role === 'teacher' && (
            <SyllabusSetup 
              activeSubject={activeSubject}
              questions={questions}
              tests={tests}
              assignments={assignments}
              role={role}
              onSave={handleSaveActiveSubject}
              onSaveTest={handleSaveAIorManualTest}
              onUpdateQuestions={setQuestions}
              onAssignTest={handleDirectAssignFromSyllabus}
              onChangeTab={setActiveTab}
              onToast={showToast}
              apiKey={apiKey}
            />
          )}

          {/* ==================== TAB: TEST GENERATOR ==================== */}
          {activeTab === 'test-generator' && role === 'teacher' && (
            <TestGenerator 
              activeSubject={activeSubject}
              questions={questions}
              onSaveTest={handleSaveAIorManualTest}
              onToast={showToast}
              apiKey={apiKey}
            />
          )}

          {/* ==================== TAB: QUESTION BANK ==================== */}
          {activeTab === 'question-bank' && role === 'teacher' && (
            <QuestionBank 
              activeSubject={activeSubject}
              questions={questions}
              setQuestions={setQuestions}
              tests={tests}
              setTests={setTests}
              setActiveTab={setActiveTab}
              onToast={showToast}
            />
          )}

          {/* ==================== TAB: TEST BANK ==================== */}
          {activeTab === 'test-bank' && role === 'teacher' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">KHO LƯU TRỮ ĐỀ KIỂM TRA MÔN HỌC</h2>
                  <p className="text-xs md:text-sm text-slate-500">
                    Tải đề kiểm tra chuẩn hóa chất lượng cao dưới dạng <strong className="text-indigo-600">PDF</strong> và <strong className="text-indigo-600 font-bold">DOCX (Word)</strong> để in ấn hoặc chỉnh sửa cực kỳ tiện lợi ngoại tuyến.
                  </p>
                </div>
              </div>

              {tests.filter(t => t.subjectId === currentSubjectId).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl">
                  <p className="text-sm font-bold text-slate-500">Chưa có đề thi nào được tạo trong kho lưu trữ của môn học này.</p>
                  <button
                    onClick={() => setActiveTab('generate-test')}
                    className="mt-3.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Tạo đề thi tự động ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tests.filter(t => t.subjectId === currentSubjectId).map((test) => {
                    const mcqCount = test.questions.filter(q => q.type === 'MCQ').length;
                    const tfCount = test.questions.filter(q => q.type === 'TRUE_FALSE').length;
                    const saCount = test.questions.filter(q => q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK').length;
                    const matchCount = test.questions.filter(q => q.type === 'MATCHING').length;
                    const essayCount = test.questions.filter(q => q.type === 'SHORT_ESSAY').length;

                    return (
                      <div key={test.id} className="bg-white border border-slate-205 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition-all">
                        {/* Header metadata */}
                        <div>
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-wide">
                              {test.purpose}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              📅 {test.createdAt}
                            </span>
                          </div>

                          <h3 className="font-black text-sm md:text-base text-slate-800 leading-snug line-clamp-2" title={test.title}>
                            {test.title}
                          </h3>

                          {/* Time & Total questions bar */}
                          <div className="flex gap-4 items-center text-xs text-slate-500 mt-2 font-semibold">
                            <span>⏱ <strong>{test.duration}</strong> phút</span>
                            <span>•</span>
                            <span>📚 <strong>{test.questions.length}</strong> câu hỏi chuẩn</span>
                          </div>

                          {/* Breakdown tags */}
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                            {mcqCount > 0 && <span className="bg-slate-50 text-slate-600 border border-slate-150 rounded-lg px-2 py-0.5 text-[10px] font-medium font-sans">Trắc nghiệm: {mcqCount}</span>}
                            {tfCount > 0 && <span className="bg-slate-50 text-slate-600 border border-slate-150 rounded-lg px-2 py-0.5 text-[10px] font-medium font-sans">Đúng/Sai: {tfCount}</span>}
                            {saCount > 0 && <span className="bg-slate-50 text-slate-600 border border-slate-150 rounded-lg px-2 py-0.5 text-[10px] font-medium font-sans">Điền khuyết: {saCount}</span>}
                            {matchCount > 0 && <span className="bg-slate-50 text-slate-600 border border-slate-150 rounded-lg px-2 py-0.5 text-[10px] font-medium font-sans">Ghép cặp: {matchCount}</span>}
                            {essayCount > 0 && <span className="bg-slate-50 text-slate-600 border border-slate-150 rounded-lg px-2 py-0.5 text-[10px] font-medium font-sans">Tự luận: {essayCount}</span>}
                          </div>
                          {/* Point weight and subtests setup button */}
                          <div className="pt-2.5 mt-3 border-t border-slate-150">
                            <button
                              onClick={() => {
                                setEditingPointsTestId(editingPointsTestId === test.id ? null : test.id);
                              }}
                              className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-700 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs text-[11px]"
                            >
                              ⚙️ Thang điểm & Đáp án Đúng/Sai ({test.questions.length} câu)
                            </button>
                          </div>

                          {/* EDITING INTERACTIVE EXPANDER */}
                          {editingPointsTestId === test.id && (
                            <div className="bg-slate-50 border border-indigo-100 p-4 rounded-2xl flex flex-col gap-4 mt-3 max-h-[350px] overflow-y-auto animate-fadeIn select-none shadow-inner">
                              <div className="flex justify-between items-center bg-indigo-100/50 p-2.5 rounded-xl border border-indigo-200/50 text-left">
                                <div>
                                  <span className="block text-[10px] font-extrabold text-indigo-800 uppercase tracking-wide">THANG ĐIỂM CHUẨN</span>
                                  {(() => {
                                    const sumPoints = test.questions.reduce((sum, q) => sum + (q.points !== undefined ? q.points : 1.0), 0);
                                    const isStandard = Math.abs(sumPoints - 10.0) < 0.05;
                                    return (
                                      <div className="flex flex-col gap-1 mt-0.5">
                                        <span className="text-[11px] font-black">
                                          Tổng điểm đề hệ thống: <strong className={isStandard ? "text-emerald-700 font-extrabold" : "text-amber-700 font-extrabold"}>{sumPoints.toFixed(2)}đ / 10.0đ</strong>
                                        </span>
                                        {!isStandard && (
                                          <span className="text-[9px] text-amber-600 font-medium leading-tight">
                                            ⚠️ Hệ thống tự động tỷ lệ lên thang 10 nếu tổng điểm khác 10. Tuy nhiên chúng tôi khuyên dùng để tổng điểm là 10.0đ.
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {test.questions.map((q, qIdx) => {
                                  const curPoints = q.points !== undefined ? q.points : 1.0;
                                  return (
                                    <div key={q.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all flex flex-col gap-2 text-left">
                                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                                        <span className="text-[10px] font-black text-indigo-700 uppercase">CÂU SỐ {qIdx + 1} ({q.type})</span>
                                        <div className="flex items-center gap-1 text-[11px]">
                                          <span className="text-slate-400 font-medium text-[10px]">Trọng số:</span>
                                          <input
                                            type="number"
                                            step="0.05"
                                            min="0"
                                            max="10"
                                            value={curPoints}
                                            onChange={(e) => {
                                              const nv = parseFloat(e.target.value) || 0;
                                              const updated = tests.map(t => {
                                                if (t.id === test.id) {
                                                  const uQs = t.questions.map(currQ => {
                                                    if (currQ.id === q.id) {
                                                      return { ...currQ, points: nv };
                                                    }
                                                    return currQ;
                                                  });
                                                  return { ...t, questions: uQs };
                                                }
                                                return t;
                                              });
                                              setTests(updated);
                                              localStorage.setItem('quickquiz_tests', JSON.stringify(updated));
                                            }}
                                            className="w-14 p-0.5 bg-slate-50 border border-slate-200 text-center text-[11px] font-black rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          />
                                          <span className="text-slate-400 text-[10px]">điểm</span>
                                        </div>
                                      </div>

                                      <div className="text-[11px] text-slate-700 line-clamp-1 italic">
                                        <MathRenderer text={q.content} />
                                      </div>

                                      {/* MCQ SUB CONFIG */}
                                      {q.type === 'MCQ' && (
                                        <div className="text-[10px] text-slate-400 font-semibold bg-slate-50/50 p-1.5 rounded flex items-center justify-between">
                                          <span>🔑 Đáp án đúng trắc nghiệm: <strong>{q.correctAnswer}</strong></span>
                                          <span className="text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-bold">Chấm điểm tự động</span>
                                        </div>
                                      )}

                                      {/* SHORT ANSWER SUB CONFIG */}
                                      {(q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK') && (
                                        <div className="text-[10px] text-slate-400 font-semibold bg-slate-50/50 p-1.5 rounded flex items-center justify-between">
                                          <span>🔑 Chuỗi đáp án khớp tự động: <strong>{q.correctAnswer}</strong></span>
                                          <span className="text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-bold">Khớp chuỗi</span>
                                        </div>
                                      )}

                                      {/* TRUE FALSE CUSTOM CONFIG */}
                                      {q.type === 'TRUE_FALSE' && (
                                        <div className="flex flex-col gap-2 mt-1">
                                          {q.options && q.options.length > 0 ? (
                                            <div className="space-y-1.5">
                                              <span className="text-[9px] text-slate-400 font-extrabold uppercase">Cấu hình 4 phát biểu và Đúng/Sai độc lập (Chuẩn GDPT 2018):</span>
                                              {(() => {
                                                const parts = (q.correctAnswer || '').split(',');
                                                while (parts.length < q.options.length) {
                                                  parts.push('Đúng');
                                                }
                                                const alphaLab = ['a', 'b', 'c', 'd'];
                                                return q.options.map((opt, oIdx) => {
                                                  return (
                                                    <div key={oIdx} className="flex gap-2 items-center">
                                                      <span className="text-[10px] font-black text-indigo-700">{alphaLab[oIdx]})</span>
                                                      <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                          const newVal = e.target.value;
                                                          const updated = tests.map(t => {
                                                            if (t.id === test.id) {
                                                              const uQs = t.questions.map(currQ => {
                                                                if (currQ.id === q.id && currQ.options) {
                                                                  const nextOpts = [...currQ.options];
                                                                  nextOpts[oIdx] = newVal;
                                                                  return { ...currQ, options: nextOpts };
                                                                }
                                                                return currQ;
                                                              });
                                                              return { ...t, questions: uQs };
                                                            }
                                                            return t;
                                                          });
                                                          setTests(updated);
                                                          localStorage.setItem('quickquiz_tests', JSON.stringify(updated));
                                                        }}
                                                        className="w-full text-[11px] p-1 bg-white border border-slate-205 rounded font-medium focus:outline-none"
                                                      />
                                                      <select
                                                        value={parts[oIdx] || 'Đúng'}
                                                        onChange={(e) => {
                                                          const newVal = e.target.value;
                                                          const nextParts = [...parts];
                                                          nextParts[oIdx] = newVal;
                                                          const updated = tests.map(t => {
                                                            if (t.id === test.id) {
                                                              const uQs = t.questions.map(currQ => {
                                                                if (currQ.id === q.id) {
                                                                  return { ...currQ, correctAnswer: nextParts.join(',') };
                                                                }
                                                                return currQ;
                                                              });
                                                              return { ...t, questions: uQs };
                                                            }
                                                            return t;
                                                          });
                                                          setTests(updated);
                                                          localStorage.setItem('quickquiz_tests', JSON.stringify(updated));
                                                        }}
                                                        className="p-1 border border-slate-200 bg-white rounded text-[10px] font-extrabold cursor-pointer w-20 text-center focus:outline-none"
                                                      >
                                                        <option value="Đúng">Đúng</option>
                                                        <option value="Sai">Sai</option>
                                                      </select>
                                                    </div>
                                                  );
                                                });
                                              })()}
                                              <span className="block text-[9px] text-indigo-600 bg-indigo-50 p-1.5 rounded-lg leading-relaxed shadow-3xs border border-indigo-100">
                                                💡 Quy chế Đúng/Sai của Bộ: Đúng 1 ý = 0,1đ; Đúng 2 ý = 0,25đ; Đúng 3 ý = 0,5đ; Đúng 4 ý = 1,0đ.
                                              </span>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = tests.map(t => {
                                                  if (t.id === test.id) {
                                                    const uQs = t.questions.map(currQ => {
                                                      if (currQ.id === q.id) {
                                                        return {
                                                          ...currQ,
                                                          options: [
                                                            "Khái niệm sinh học cơ quan này là chính xác hoàn toàn.",
                                                            "Sinh lý bình thường của cấu trúc này tăng cao khi thực nghiệm.",
                                                            "Sự phát triển chuỗi liên đới ổn định theo thời gian quy ước.",
                                                            "Có thể ứng dụng y tế lâm sàng thực nghiệm đạt chuẩn mực cao."
                                                          ],
                                                          correctAnswer: "Đúng,Sai,Đúng,Sai"
                                                        };
                                                      }
                                                      return currQ;
                                                    });
                                                    return { ...t, questions: uQs };
                                                  }
                                                  return t;
                                                });
                                                setTests(updated);
                                                localStorage.setItem('quickquiz_tests', JSON.stringify(updated));
                                                showToast('Đã khởi tạo thành công 4 nhận định a, b, c, d Đúng/Sai chuẩn chất lượng cao!', 'success');
                                              }}
                                              className="w-max p-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 text-[10px] font-bold rounded-lg transition-all"
                                            >
                                              ➕ Thiết lập 4 phát biểu Đúng / Sai sâu (GDPT 2018)
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Export actions container */}
                        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 mt-1.5 text-xs">
                          {/* DOCX Column headings */}
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                            <span>Mẫu Microsoft Word (.DOCX)</span>
                            <span className="text-blue-600 uppercase">Mở bằng Word</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleExportTestFile(test, false, 'doc')}
                              className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-205 text-slate-700 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:border-indigo-200"
                              title="Tải đề thi trống tương thích Microsoft Word DOCX"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Tải Đề (.doc)</span>
                            </button>
                            <button
                              onClick={() => handleExportTestFile(test, true, 'doc')}
                              className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-205 text-slate-700 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:border-indigo-200"
                              title="Tải đáp án chi tiết tương thích Microsoft Word DOCX"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Tải Đ.Án (.doc)</span>
                            </button>
                          </div>

                          {/* PDF and Classroom headings */}
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 pt-1 border-t border-slate-200/40">
                            <span>Mẫu PDF & Kiểm toán Trường học</span>
                            <span className="text-emerald-600 uppercase">Xuất bản chuẩn</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setTestToPreview(test)}
                              className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              title="Xem trước mẫu đề thi chuẩn quốc gia, cho phép in trực tiếp hoặc lưu PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-100" />
                              <span>In / Lưu PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                setAssignForm(prev => ({ ...prev, testId: test.id }));
                                setActiveTab('assign-test');
                              }}
                              className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              title="Giao đề thi rèn luyện trực tuyến tới lớp học"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-100" />
                              <span>Giao bài</span>
                            </button>
                          </div>

                          {/* Direct deletion trigger */}
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => setTestToDelete(test)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Xóa đề thi khỏi kho lưu trữ"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>Xóa đề khỏi kho</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB: ASSIGN TEST ==================== */}
          {activeTab === 'assign-test' && role === 'teacher' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn text-xs">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800">GIAO NHIỆM VỤ RÈN LUYỆN LỚP HỌC</h2>
                <p className="text-xs md:text-sm text-slate-500">Phân tải đề thi tự học tới từng lớp cụ thể và nhắc nhở làm bài ôn luyện tích cực.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* FORM COLUMN */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col gap-3.5">
                  <h3 className="font-extrabold text-sm text-slate-700 uppercase">Thiết lập nộp bài:</h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">CHỌN ĐỀ KIỂM TRA TRONG KHO</label>
                    <select
                      value={assignForm.testId}
                      onChange={(e) => setAssignForm({ ...assignForm, testId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold"
                    >
                      <option value="">-- Chọn đề rèn luyện --</option>
                      {tests.filter(t => t.subjectId === currentSubjectId).map(t => (
                        <option key={t.id} value={t.id}>{t.title} ({t.questions.length} câu)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">ĐỐI TƯỢNG LỚP HỌC</label>
                      <select
                        value={assignForm.className}
                        onChange={(e) => setAssignForm({ ...assignForm, className: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        {classes.filter(cls => {
                          if (!activeSubject) return true;
                          if (!cls || !activeSubject.grade) return false;
                          const match = cls.match(/(\d+)/);
                          if (match) return match[1] === activeSubject.grade;
                          return cls.startsWith(activeSubject.grade);
                        }).map(c => (
                          <option key={c} value={c}>Lớp {c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">HẠN LÀM BÀI</label>
                      <input 
                        type="datetime-local"
                        value={assignForm.deadline}
                        onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* QUICK DEADLINE PRESET CHIPS */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hạn nộp nhanh (Phím tắt tính toán):</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setDeadlineWithOffsetDays(1)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        +24h (Ngày mai) ⏳
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlineWithOffsetDays(3)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        +3 Ngày 🗓
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlineWithOffsetDays(7)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        +1 Tuần 📅
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">LỜI NHẮN LỚP HỌC</label>
                    <textarea 
                      value={assignForm.notes}
                      onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                      placeholder="Các em học sinh ôn luyện thật kỹ trước khi nộp bài để lấy điểm số miệng nhé..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl min-h-[60px]"
                    />
                  </div>

                  <button
                    onClick={handleAssignTestSubmit}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Giao Bài Rèn Luyện Ngay
                  </button>
                </div>

                {/* CURRENT ASSIGNMENTS COLUMN */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-extrabold text-sm text-slate-700 uppercase">Sổ tay bài rèn luyện đã giao</h3>
                  <div className="max-h-[380px] overflow-y-auto space-y-3.5 pr-1">
                    {assignments.filter(a => a.subjectId === currentSubjectId).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                        <span className="text-2xl mb-1.5">📬</span>
                        <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider block">Chưa giao bài nào</span>
                        <span className="text-[11px] text-slate-400 max-w-[220px] mt-1 leading-normal">Điền công thức giao bài bên trái để gửi trực tiếp đề thi cho lớp.</span>
                      </div>
                    ) : (
                      assignments.filter(a => a.subjectId === currentSubjectId).map(asg => {
                        const classSize = students.filter(s => s.className === asg.className).length || 1;
                        const taskAttempts = attempts.filter(at => at.testId === asg.testId && at.className === asg.className);
                        const uniqueSubmitters = new Set(taskAttempts.map(at => at.studentId)).size;
                        const taskAvg = taskAttempts.length > 0 
                          ? (taskAttempts.reduce((sum, x) => sum + x.score, 0) / taskAttempts.length) 
                          : 0;

                        return (
                          <div key={asg.id} className="p-4 bg-white hover:bg-slate-50/50 border border-slate-200 rounded-2xl flex flex-col gap-2.5 transition-all shadow-2xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-extrabold text-slate-805 text-xs block leading-tight">{asg.testTitle}</span>
                                <div className="flex gap-2 items-center mt-1">
                                  <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.2 rounded text-[9px] font-extrabold uppercase">Lớp: {asg.className}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">• Có {classSize} học sinh</span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => setAssignmentToDelete(asg)}
                                className="text-rose-600 font-extrabold hover:underline text-[10px] p-1 bg-rose-50 rounded cursor-pointer duration-100 hover:bg-rose-100"
                              >
                                Hủy giao ✖
                              </button>
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500">
                              <div>
                                Tiến trình: <strong className="text-emerald-700">{uniqueSubmitters} / {classSize}</strong> học sinh ({Math.round(uniqueSubmitters / classSize * 100)}%)
                              </div>
                              <div>
                                Điểm TB hoàn thành: <strong className="text-indigo-700">{formatScore(taskAvg)}đ</strong>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-150">
                              <span>Hạn chót: {new Date(asg.deadline).toLocaleString('vi-VN')}</span>
                              
                              {uniqueSubmitters > 0 && (
                                <button
                                  onClick={() => {
                                    setActiveTab('class-report');
                                    handleTriggerAIReport(asg.className);
                                  }}
                                  className="text-indigo-600 font-extrabold hover:underline flex items-center gap-0.5 text-[9px] bg-slate-100 px-1.5 py-0.5 rounded"
                                >
                                  🧠 Xem báo cáo AI
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== TAB: CLASS REPORT ==================== */}
          {activeTab === 'class-report' && role === 'teacher' && (() => {
            const classAttempts = attempts.filter(a => 
              a.className === selectedReportClass && 
              tests.find(t => t.id === a.testId)?.subjectId === currentSubjectId
            );
            const totalCount = classAttempts.length;
            const gioiCount = classAttempts.filter(a => a.score >= 8.0).length;
            const khaCount = classAttempts.filter(a => a.score >= 6.5 && a.score < 8.0).length;
            const tbCount = classAttempts.filter(a => a.score >= 5.0 && a.score < 6.5).length;
            const yeuCount = classAttempts.filter(a => a.score < 5.0).length;

            const percentGioi = totalCount > 0 ? Math.round((gioiCount / totalCount) * 100) : 0;
            const percentKha = totalCount > 0 ? Math.round((khaCount / totalCount) * 105) / 1.05 : 0; // standard format
            const percentTb = totalCount > 0 ? Math.round((tbCount / totalCount) * 100) : 0;
            const percentYeu = totalCount > 0 ? Math.round((yeuCount / totalCount) * 100) : 0;

            return (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn hover:border-emerald-250 transition-all text-xs print:border-none print:shadow-none print:p-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">BIỂU ĐỒ BỒI DƯỠNG SƯ PHẠM AI</h2>
                    <p className="text-xs md:text-sm text-slate-500">Xem phổ điểm phân bố, phân tích lỗi hổng kiến thức trực giác để nâng đỡ học sinh kịp thời.</p>
                  </div>
                  {reportData && (
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 print:hidden"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      In báo cáo PDF 🖨
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-wrap print:hidden">
                  <span className="font-bold text-slate-500 uppercase tracking-wide">Chọn lớp rà soát phổ điểm:</span>
                  <div className="flex gap-2 flex-wrap">
                    {classes.filter(cls => {
                      if (!activeSubject) return true;
                      if (!cls || !activeSubject.grade) return false;
                      const match = cls.match(/(\d+)/);
                      if (match) return match[1] === activeSubject.grade;
                      return cls.startsWith(activeSubject.grade);
                    }).map(cls => (
                      <button
                        key={cls}
                        onClick={() => handleTriggerAIReport(cls)}
                        className={`px-4 py-2 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer ${
                          selectedReportClass === cls 
                            ? 'bg-emerald-600 text-white border-none' 
                            : 'bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-600 text-slate-705'
                        }`}
                      >
                        Lớp {cls}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedReportClass && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700">
                      <span>📊 BIỂU ĐỒ TRỰC QUAN PHỔ ĐIỂM LỚP {selectedReportClass}</span>
                      <span className="text-[11px] text-slate-400">({totalCount} lượt thi hoàn thành)</span>
                    </div>

                    {totalCount === 0 ? (
                      <p className="text-center italic text-slate-400 py-4">Lớp {selectedReportClass} chưa có học sinh nào nộp bài rèn luyện của môn này.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Box Gioi */}
                        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 flex flex-col gap-1 shadow-2xs">
                          <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                            <span>Giỏi (8.0 - 10đ)</span>
                            <span>{Math.round(percentGioi)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percentGioi}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 font-semibold">{gioiCount} học sinh đạt điểm giỏi</span>
                        </div>

                        {/* Box Kha */}
                        <div className="bg-white p-3.5 rounded-xl border border-sky-100 flex flex-col gap-1 shadow-2xs">
                          <div className="flex justify-between items-center text-xs font-bold text-sky-800">
                            <span>Khá (6.5 - 7.9đ)</span>
                            <span>{Math.round(percentKha)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                            <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${percentKha}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 font-semibold">{khaCount} học sinh đạt điểm khá</span>
                        </div>

                        {/* Box TB */}
                        <div className="bg-white p-3.5 rounded-xl border border-amber-100 flex flex-col gap-1 shadow-2xs">
                          <div className="flex justify-between items-center text-xs font-bold text-amber-850">
                            <span>T.Bình (5.0 - 6.4đ)</span>
                            <span>{Math.round(percentTb)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${percentTb}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 font-semibold">{tbCount} học sinh trung bình</span>
                        </div>

                        {/* Box Yeu */}
                        <div className="bg-white p-3.5 rounded-xl border border-rose-100 flex flex-col gap-1 shadow-2xs">
                          <div className="flex justify-between items-center text-xs font-bold text-rose-800">
                            <span>Yếu (&lt; 5.0đ)</span>
                            <span>{Math.round(percentYeu)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                            <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${percentYeu}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-450 mt-1 font-extrabold text-rose-600">{yeuCount} học sinh cần nâng đỡ</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isAnalyzingReport && (
                  <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                    <span className="italic font-bold text-xs uppercase tracking-wider text-slate-500">Trợ lý AI đang thu nạp bản ghi học bạ và biên tập báo cáo chi tiết...</span>
                  </div>
                )}

                {reportData && !isAnalyzingReport && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    {/* AI REVIEW COMMENT */}
                    <div className="p-6 bg-emerald-50/40 border border-emerald-200 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-900 block mb-3 leading-none uppercase">🧠 KHUYÊN SƯ PHẠM AI CHI TIẾT</h4>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-bold text-emerald-950 uppercase text-[10px] tracking-wide">🌟 Ưu thế nổi trội:</p>
                          <p className="text-slate-700 leading-relaxed font-semibold">{reportData.strengths}</p>
                        </div>
                      </div>
                      
                      <div className="border-t border-emerald-200 pt-3">
                        <p className="font-bold text-rose-900 uppercase text-[10px] tracking-wide">⚠️ Lỗ hổng / Va vấp còn tồn đọng:</p>
                        <p className="text-slate-700 leading-relaxed font-semibold">{reportData.weaknesses}</p>
                      </div>

                      <div className="border-t border-emerald-200 pt-3">
                        <p className="font-bold text-indigo-900 uppercase text-[10px] tracking-wide">💡 Đề xuất giảng dạy &amp; rèn bài:</p>
                        <p className="text-slate-700 leading-relaxed font-semibold">{reportData.recommendations}</p>
                      </div>
                    </div>

                    {/* SPECIAL ATTENTION LIST */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-slate-800 text-sm uppercase">🚨 Danh sách học sinh cần nâng đỡ đặc biệt:</h4>
                      {reportData.unsupportiveStudents.length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center border">Lớp học rèn luyện đều đạt kết quả xuất sắc, không ghi nhận học sinh quá yếu kém.</p>
                      ) : (
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                          {reportData.unsupportiveStudents.map((std, i) => (
                            <div key={i} className="p-4 bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-2xl flex flex-col gap-2 transition-all">
                              <div className="flex justify-between items-center text-xs font-bold leading-normal">
                                <span className="text-rose-950 font-extrabold">{std.name}</span>
                                <span className="bg-rose-150 text-rose-800 px-2 py-0.5 rounded-lg border border-rose-200 text-[10px] font-black">{formatScore(std.score)} Điểm</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                                Trọng tâm yếu kém: <span className="text-slate-800 font-extrabold">{std.topic}</span>
                              </p>
                              <button
                                onClick={() => {
                                  setActiveTab('test-generator');
                                  showToast(`Đã chuẩn bị ngân hàng đề tự động và thiết lập phụ đạo riêng cho em ${std.name}!`, 'info');
                                }}
                                className="bg-white border border-rose-200 hover:bg-rose-600 hover:text-white text-rose-800 font-black py-2 px-3 rounded-xl text-center text-[10px] mt-1.5 transition-all cursor-pointer shadow-3xs hover:border-transparent print:hidden"
                              >
                                🤖 Soạn đề thi rèn luyện phụ đạo riêng biệt
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==================== TAB: PROGRESS SETUP ==================== */}
          {activeTab === 'progress-setup' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">TIẾN TRÌNH RÈN LUYỆN LỚP HỌC</h2>
                <p className="text-xs md:text-sm text-slate-500">Đánh dấu những bài đã ôn luyện thành thục và sử dụng lỗi rèn luyện thông minh nhanh gọn.</p>
              </div>

              <div className="flex flex-col gap-5">
                {activeSubject.chapters.map((ch) => {
                  const activeProgObj = progress.find(p => p.subjectId === currentSubjectId);
                  const totalLessonsCount = ch.lessons.length;
                  const completedCount = activeProgObj 
                    ? ch.lessons.filter(l => activeProgObj.completedLessons.includes(l.id)).length 
                    : 0;
                  const chapterPercent = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

                  return (
                    <div key={ch.id} className="p-5 bg-slate-50 border border-slate-200/70 rounded-2xl flex flex-col gap-4">
                      {/* Chapter header with localized badge progress */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="font-extrabold text-xs md:text-sm text-slate-800 uppercase leading-snug">{ch.name}</span>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                            Hiểu bài: {completedCount} / {totalLessonsCount}
                          </span>
                          <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${chapterPercent}%` }}></div>
                          </div>
                          <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {chapterPercent}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ch.lessons.map(les => {
                          const done = activeProgObj ? activeProgObj.completedLessons.includes(les.id) : false;

                          return (
                            <div key={les.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                              done ? 'bg-emerald-50/40 border-emerald-250 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50/50'
                            }`}>
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <span className="block text-xs font-black text-slate-805 leading-snug truncate">{les.name}</span>
                                  {les.learningOutcomes && les.learningOutcomes.length > 0 ? (
                                    <span className="block text-[10px] text-slate-400 truncate tracking-tight">{les.learningOutcomes[0]}</span>
                                  ) : (
                                    <span className="block text-[10px] text-slate-400 italic">Trọng tâm ôn tập chuẩn cơ bản toán học</span>
                                  )}
                                </div>

                                <input 
                                  type="checkbox"
                                  checked={done}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0 mt-0.5"
                                  onChange={(e) => {
                                    const term = e.target.checked;
                                    setProgress(prev => {
                                      return prev.map(p => {
                                        if (p.subjectId === currentSubjectId) {
                                          let list = [...p.completedLessons];
                                          if (term) {
                                            if (!list.includes(les.id)) list.push(les.id);
                                          } else {
                                            list = list.filter(id => id !== les.id);
                                          }
                                          return { ...p, completedLessons: list };
                                        }
                                        return p;
                                      });
                                    });
                                    showToast(term ? 'Đã đánh dấu đã hiểu bài thành công!' : 'Đã thu hồi tiến độ hiểu bài học này.', 'info');
                                  }}
                                />
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/70">
                                <span className="text-[9px] font-black tracking-normal text-slate-405 uppercase">
                                  {done ? '🌟 HIỂU BÀI TẤT CẢ' : '⏳ CẦN RÈN LUYỆN'}
                                </span>

                                <div className="flex gap-1.5">
                                  {role === 'student' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedChapterId(ch.id);
                                        setSelectedLessonId(les.id);
                                        handleStartPractice(undefined, ch.id, les.id);
                                        showToast(`Đang khởi tạo đề tự luyện cho riêng bài "${les.name}"...`, 'success');
                                      }}
                                      className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-3xs"
                                    >
                                      Luyện tập bài này ngay 🧠
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedChapterId(ch.id);
                                        setSelectedLessonId(les.id);
                                        setActiveTab('test-bank');
                                        showToast(`Đã lọc danh sách câu hỏi phù hợp cho bài: "${les.name}"!`, 'info');
                                      }}
                                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                    >
                                      Soạn câu hỏi 🔎
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== TAB: STUDENT STATS ==================== */}
          {activeTab === 'student-stats' && role === 'student' && currentStudent && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800">📊 HỒ SƠ & THỐNG KÊ KẾT QUẢ KIỂM TRA</h2>
                <p className="text-xs md:text-sm text-slate-500">Giám sát tổng lượt làm bài rèn luyện, phổ điểm thực tế, và chi tiết tiến độ cá nhân của học sinh {currentStudent.name} (Lớp {currentStudent.className}).</p>
              </div>

              {/* STAT CARDS BENTO GRID */}
              {(() => {
                const assignedTestsList = assignments.filter(a => a.className === currentStudent.className && a.subjectId === currentSubjectId);
                const testIds = assignedTestsList.map(a => a.testId);
                const studentAttempts = attempts.filter(a => a.studentId === currentStudent.id && testIds.includes(a.testId));
                
                const uniqueCompletedCount = testIds.filter(tid => studentAttempts.some(att => att.testId === tid)).length;
                const totalAttemptsCount = studentAttempts.length;
                
                const scoreSum = studentAttempts.reduce((acc, att) => acc + att.score, 0);
                const averageScore = totalAttemptsCount > 0 ? (scoreSum / totalAttemptsCount) : 0;

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col gap-1 items-center text-center">
                        <span className="text-2xl font-black text-emerald-850">{assignedTestsList.length}</span>
                        <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Bài được giao</span>
                      </div>
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col gap-1 items-center text-center">
                        <span className="text-2xl font-black text-indigo-850">{uniqueCompletedCount} / {assignedTestsList.length}</span>
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Đề đã làm ít nhất 1 lần</span>
                      </div>
                      <div className="p-4 bg-violet-50 border border-violet-100 rounded-3xl flex flex-col gap-1 items-center text-center">
                        <span className="text-2xl font-black text-violet-850">{totalAttemptsCount} lượt</span>
                        <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider">Tổng số lượt thi</span>
                      </div>
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl flex flex-col gap-1 items-center text-center">
                        <span className="text-2xl font-black text-rose-805">{formatScore(averageScore)}đ</span>
                        <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Điểm số trung bình</span>
                      </div>
                    </div>

                    {/* ASSIGNED TEST LIST WITH ATTEMPTS */}
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="font-extrabold text-slate-800 text-xs md:text-sm uppercase flex items-center gap-1">
                          <span>📋 DANH SÁCH CHI TIẾT CÁC ĐỀ THI ĐÃ GIAO</span>
                        </h3>
                        <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-500 font-extrabold text-[10px]">Tối đa 3 lần làm / đề</span>
                      </div>

                      {assignedTestsList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 border border-slate-100 rounded-3xl">Chưa có bài kiểm tra nào được giao cho em từ giáo viên bộ môn.</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {assignedTestsList.map((asg, index) => {
                            const testObj = tests.find(t => t.id === asg.testId);
                            const testAttempts = studentAttempts.filter(att => att.testId === asg.testId);
                            const attemptsCount = testAttempts.length;
                            
                            // Sort chronologically (oldest to newest)
                            const sortedAttemptsList = [...testAttempts].sort((a,b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
                            const highPoint = attemptsCount > 0 ? Math.max(...testAttempts.map(at => at.score)) : 0;

                            return (
                              <div key={asg.id} className="p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-3xl flex flex-col gap-4.5 transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                  <div>
                                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">Nhiệm vụ kiểm tra #{index + 1}</span>
                                    <h4 className="font-black text-slate-800 text-sm md:text-base leading-snug">{asg.testTitle}</h4>
                                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-455 mt-1 font-semibold">
                                      <span>Thời lượng: {testObj?.duration || 15} phút</span>
                                      <span>•</span>
                                      <span>Môn: {activeSubject.name}</span>
                                      <span>•</span>
                                      <span>Lớp: {asg.className}</span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex flex-col items-start md:items-end gap-1 text-[11px]">
                                    <span className="text-slate-400 font-medium">Hạn chót nộp:</span>
                                    <strong className="text-slate-700 font-bold">{new Date(asg.deadline).toLocaleString('vi-VN')}</strong>
                                  </div>
                                </div>

                                {/* ATTEMPT SLOTS STATS FOR THIS EXAM */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {[1, 2, 3].map(turn => {
                                    const attForTurn = sortedAttemptsList[turn - 1];
                                    return (
                                      <div 
                                        key={turn} 
                                        className={`p-3 rounded-2xl border flex flex-col gap-1.5 transition-all justify-between text-xs ${
                                          attForTurn 
                                            ? 'bg-white border-emerald-200 hover:border-emerald-400' 
                                            : attemptsCount === turn - 1 
                                              ? 'bg-amber-50/40 border-dashed border-amber-300' 
                                              : 'bg-slate-100/40 border-dashed border-slate-201 text-slate-400'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center border-b border-slate-100/60 pb-1">
                                          <span className="font-black text-[9px] uppercase tracking-wider text-slate-400">Lần thi số {turn}</span>
                                          {attForTurn && (
                                            <span className={`px-2 py-0.5 rounded font-black text-[9px] leading-none ${
                                              attForTurn.score >= 5.0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                              {formatScore(attForTurn.score)}đ
                                            </span>
                                          )}
                                        </div>

                                        {attForTurn ? (
                                          <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                              <span>Ngày nộp:</span>
                                              <span className="font-medium text-slate-700">{attForTurn.submittedAt}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                              <span>Thời gian:</span>
                                              <span className="font-medium text-slate-700">{Math.ceil(attForTurn.timeSpent / 60)} phút</span>
                                            </div>
                                            {attForTurn.feedback && (
                                              <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1 border-t border-slate-100 pt-1" title={attForTurn.feedback}>
                                                &ldquo;{attForTurn.feedback}&rdquo;
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="py-2.5 text-center italic text-slate-400 text-[10px]">
                                            {attemptsCount === turn - 1 ? '👉 Lượt trống tiếp theo' : 'Khóa / Chưa đến lượt'}
                                          </div>
                                        )}

                                        {attForTurn && (
                                          <button
                                            onClick={() => {
                                              setActiveQuizAttemptResult(attForTurn);
                                              setActiveTab('quiz-result');
                                            }}
                                            className="w-full mt-2 py-1 bg-slate-150 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer"
                                          >
                                            Xem lại bài làm 🔍
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* BOTTOM ACTION */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400 gap-3">
                                  <div className="flex gap-4 font-semibold text-[11px] text-slate-650">
                                    <span>Lượt đã dùng: <strong className="text-slate-800">{attemptsCount} / 3</strong> lượt</span>
                                    <span>•</span>
                                    <span>Điểm cao nhất đạt được: <strong className="text-emerald-705">{attemptsCount > 0 ? `${formatScore(highPoint)}đ` : 'Chưa có'}</strong></span>
                                  </div>

                                  {attemptsCount < 3 ? (
                                    <button
                                      onClick={() => testObj && handleStartPractice(testObj)}
                                      className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                                    >
                                      {attemptsCount > 0 ? `Thi lại đề này (Lượt ${attemptsCount + 1}/3)` : 'Bắt đầu làm bài thi'}
                                    </button>
                                  ) : (
                                    <span className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-bold uppercase text-[10px]">
                                      🚫 Đã hoàn thành tối đa 3 lần kiểm tra
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ==================== TAB: CLASSROOM SETUP ==================== */}
          {activeTab === 'class-setup' && role === 'teacher' && (
            <ClassroomSetup 
              activeSubject={activeSubject}
              students={students}
              onUpdateStudents={setStudents}
              classes={classes}
              onUpdateClasses={setClasses}
              attempts={attempts}
              onUpdateAttempts={setAttempts}
              tests={tests}
              onToast={showToast}
              onChangeTab={setActiveTab}
              onTriggerAIReport={handleTriggerAIReport}
              classPasswords={classPasswords}
              onUpdateClassPasswords={setClassPasswords}
              teacherPasscode={teacherPasscode}
              onUpdateTeacherPasscode={(newPasscode) => {
                setTeacherPasscode(newPasscode);
                localStorage.setItem('quickquiz_teacher_passcode', newPasscode);
              }}
            />
          )}

          {/* ==================== TAB: QUIZ PLAYER ==================== */}
          {activeTab === 'quiz-player' && activeQuizTest && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn font-sans text-xs md:text-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-800 leading-snug">{activeQuizTest.title}</h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Môn: {activeSubject.name} Lớp {activeQuizTest.grade} | Làm bài thi rèn luyện</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="py-2 px-3.5 bg-red-50 text-red-700 font-bold font-mono rounded-xl border border-red-100 flex items-center justify-center gap-2">
                    ⏱ HẾT GIỜ TRONG: {Math.floor(quizTimeRemaining / 60)}:{(quizTimeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                  <button 
                    onClick={() => handleQuizSubmit()}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold tracking-wide rounded-xl cursor-pointer shadow-sm transition-all"
                  >
                    NỘP BÀI THI
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                {activeQuizTest.questions.map((q, qI) => {
                  const saved = quizAnswers[q.id] || '';

                  return (
                    <div key={q.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>CÂU HỎI {qI + 1} / {activeQuizTest.questions.length}</span>
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase">{q.type}</span>
                      </div>

                      <div className="text-xs md:text-sm font-bold text-slate-800">
                        <MathRenderer text={q.content} />
                      </div>

                      {/* FORMAT MCQ */}
                      {q.type === 'MCQ' && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2 mt-1">
                          {q.options.map((opt, oI) => {
                            const currentOptChar = opt.charAt(0);
                            const active = saved === currentOptChar;

                            return (
                              <button
                                key={oI}
                                onClick={() => {
                                  setQuizAnswers({ ...quizAnswers, [q.id]: currentOptChar });
                                  sound.playClick();
                                }}
                                className={`text-left p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                  active ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-extrabold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <MathRenderer text={opt} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* FORMAT TRUE FALSE */}
                      {q.type === 'TRUE_FALSE' && (
                        q.options && q.options.length > 0 ? (
                          <div className="flex flex-col gap-3.5 pl-2 mt-2 w-full max-w-2xl bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                              Mỗi ý dưới đây hãy chọn Đúng hoặc Sai:
                            </span>
                            {(() => {
                              const savedParts = (saved || '').split(',');
                              while (savedParts.length < q.options.length) {
                                savedParts.push('');
                              }
                              const alphaLabels = ['a', 'b', 'c', 'd'];
                              return q.options.map((opt, oI) => {
                                const currentLabel = alphaLabels[oI] || String.fromCharCode(97 + oI);
                                const currentAnswer = savedParts[oI] || '';

                                return (
                                  <div key={oI} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 bg-white rounded-xl border border-slate-205/60 shadow-2xs hover:border-slate-200 transition-all bg-white hover:bg-slate-50/20">
                                    <div className="flex items-start gap-2 text-xs text-slate-700 font-semibold leading-relaxed">
                                      <span className="font-extrabold text-indigo-700 shrink-0 uppercase">{currentLabel})</span>
                                      <MathRenderer text={opt.replace(/^[a-zA-Z0-9]\.\s*|^[a-zA-Z0-9]\)\s*/, '')} />
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      {['Đúng', 'Sai'].map((val) => {
                                        const isActive = (val === 'Đúng' ? normalizeTF(currentAnswer) === 'đúng' : normalizeTF(currentAnswer) === 'sai');
                                        return (
                                          <button
                                            key={val}
                                            type="button"
                                            onClick={() => {
                                              const nextParts = [...savedParts];
                                              nextParts[oI] = val;
                                              setQuizAnswers({ ...quizAnswers, [q.id]: nextParts.join(',') });
                                              sound.playClick();
                                            }}
                                            className={`px-3 py-1 text-[10px] font-black cursor-pointer transition-all border rounded-lg ${
                                              isActive 
                                                ? val === 'Đúng'
                                                  ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold'
                                                  : 'bg-rose-600 border-rose-600 text-white font-extrabold'
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-705'
                                            }`}
                                          >
                                            {val}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : (
                          <div className="flex gap-4 pl-2 mt-1">
                            {['Đúng', 'Sai'].map((val) => {
                              const active = normalizeTF(saved) === (val === 'Đúng' ? 'đúng' : 'sai');

                              return (
                                <button
                                  key={val}
                                  onClick={() => {
                                    setQuizAnswers({ ...quizAnswers, [q.id]: val });
                                    sound.playClick();
                                  }}
                                  className={`px-6 py-2 border rounded-xl font-bold cursor-pointer transition-all text-xs ${
                                    active ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        )
                      )}

                      {/* FORMAT SHORT ANSWER OR FILL BLANK */}
                      {(q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK') && (
                        <div className="pl-2 mt-1">
                          <input 
                            type="text" 
                            value={saved}
                            onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                            placeholder="Nhập chuỗi văn bản hoặc số đáp án chính xác..."
                            className="w-full max-w-sm p-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* FORMAT MATCHING */}
                      {q.type === 'MATCHING' && q.options && q.matchingRight && (
                        <div className="pl-2 flex flex-col gap-3 mt-1 text-xs">
                          <span className="text-[10px] text-slate-400 font-bold block italic leading-snug">
                            * Gợi ý cấu nối: Ghi liên tiếp vế nối ngăn giữa bằng dấu phẩy, ví dụ: 0-1, 1-0 (Vế trái 0 nối vế phải 1...)
                          </span>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <p className="font-bold text-[10px] text-slate-400 uppercase">Cột vế trái:</p>
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="p-2 bg-white border border-slate-200 rounded-lg font-semibold">{oIdx}) {opt}</div>
                              ))}
                            </div>
                            <div className="space-y-1.5">
                              <p className="font-bold text-[10px] text-slate-400 uppercase">Cột vế phải:</p>
                              {q.matchingRight.map((mr, mrIdx) => (
                                <div key={mrIdx} className="p-2 bg-white border border-slate-200 rounded-lg font-semibold">{mrIdx}) {mr}</div>
                              ))}
                            </div>
                          </div>
                          <input 
                            type="text" 
                            value={saved}
                            onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                            placeholder="Ví dụ: 0-1, 1-0... "
                            className="w-full max-w-xs p-2 bg-white border border-slate-200 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      )}

                      {/* FORMAT SHORT ESSAY */}
                      {q.type === 'SHORT_ESSAY' && (
                        <div className="pl-2 mt-1 flex flex-col gap-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            
                            {/* TEXTAREA WRITING AREA */}
                            <div className="flex flex-col gap-1.5 animate-fadeIn">
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Cách 1: Nhập luận văn văn bản</span>
                              <textarea 
                                value={saved}
                                onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                                placeholder="Nhập nội dung lập luận bài tự luận của em vào đây..."
                                className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[160px] leading-relaxed shadow-xs"
                              />
                            </div>

                            {/* ADVANCED IMAGE SUBMISSION AREA WITH PRESETS */}
                            <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Cách 2: Nộp học liệu/Ảnh chép tay viết giấy</span>
                              
                              {quizStudentImages[q.id] ? (
                                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                      <img 
                                        src={quizStudentImages[q.id]} 
                                        alt="Student submission template" 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div>
                                      <span className="text-[11px] font-bold text-slate-800 block">Anh_chép_tay_${q.id.substring(0, 5)}.png</span>
                                      <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5">✓ Đã liên kết nộp bài kèm</span>
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = { ...quizStudentImages };
                                      delete next[q.id];
                                      setQuizStudentImages(next);
                                      showToast('Đã gỡ bỏ ảnh chép tay đính kèm!', 'info');
                                    }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Xóa ảnh"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="border border-dashed border-slate-300 rounded-xl bg-white p-4.5 text-center flex flex-col items-center justify-center gap-2 transition-all hover:bg-slate-50">
                                  <FileImage className="w-6 h-6 text-slate-400" />
                                  <div>
                                    <p className="text-[11px] font-extrabold text-slate-700">Kéo thả hoặc Nhấp chuột tải ảnh</p>
                                    <p className="text-[9px] text-slate-400">Hình chụp vở ghi chép bằng máy ảnh điện thoại</p>
                                  </div>
                                  
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setQuizStudentImages({ ...quizStudentImages, [q.id]: reader.result as string });
                                          showToast('Tải tệp ảnh chép tay học viên thành công!', 'success');
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden" 
                                    id={`input-file-essay-${q.id}`} 
                                  />
                                  <label 
                                    htmlFor={`input-file-essay-${q.id}`}
                                    className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all border border-slate-200"
                                  >
                                    Chọn ảnh từ thiết bị
                                  </label>
                                </div>
                              )}

                              {/* Click-to-select Vector Handwritings Sandbox Presets */}
                              <div className="border-t border-slate-200 pt-3 flex flex-col gap-1.5">
                                <span className="block text-[9px] font-black text-slate-400 tracking-wider uppercase">LẬP TỨC TRẢI NGHIỆM - CHỌN BÀI GIẢI MẪU:</span>
                                <div className="grid grid-cols-3 gap-2">
                                  {/* MOCK PRESET MATH OUTFLOW */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Elegant handwritten styled Math SVG
                                      const mathSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%23fcf8f2"/><path d="M 0,30 L 300,30 M 0,60 L 300,60 M 0,90 L 300,90 M 0,120 L 300,120 M 0,150 L 300,150 M 0,180 L 300,180 M 0,210 L 300,210 M 0,240 L 300,240 M 0,270 L 300,270 M 0,300 L 300,300 M 0,330 L 300,330" stroke="%23dfd0c0" stroke-width="1"/><line x1="40" y1="0" x2="40" y2="400" stroke="%23ff9999" stroke-width="1"/><text x="50" y="50" font-family="'Times New Roman', serif" font-size="14" font-weight="bold" fill="%231a365d">BÀI GIẢI TỰ LUẬN TOÁN HỌC</text><text x="50" y="80" font-family="'Times New Roman', serif" font-size="12" fill="%232b6cb0">Lời giải chi tiết tập hợp:</text><text x="50" y="110" font-family="'Times New Roman', serif" font-size="12" fill="%232d3748">a) Xét biểu thức: P = x^2 - 4x + 4</text><text x="50" y="140" font-family="'Times New Roman', serif" font-size="12" fill="%232d3748"> &lt;=&gt; P = (x - 2)^2</text><text x="50" y="170" font-family="'Times New Roman', serif" font-size="12" fill="%232d3748">Để P = 0 &lt;=&gt; (x - 2)^2 = 0</text><text x="50" y="200" font-family="'Times New Roman', serif" font-size="12" fill="%232d3748"> &lt;=&gt; x - 2 = 0 &lt;=&gt; x = 2</text><text x="50" y="230" font-family="'Times New Roman', serif" font-size="12" fill="%232b6cb0">b) Chứng minh bất đẳng thức:</text><text x="50" y="260" font-family="'Times New Roman', serif" font-size="12" fill="%232d3748">Theo Cauchy: a + b &gt;= 2sqrt(ab)</text><text x="50" y="290" font-family="'Times New Roman', serif" font-size="12" fill="%232d3748">Bất đẳng thức xảy ra khi a = b.</text><text x="50" y="325" font-family="'Times New Roman', serif" font-size="11" font-style="italic" fill="%23718096">Nguyễn Văn An - Lớp 6A1</text></svg>`;
                                      setQuizStudentImages({ ...quizStudentImages, [q.id]: mathSVG });
                                      setQuizAnswers({ ...quizAnswers, [q.id]: "Lời giải bài toán: a) Biến đổi hằng đẳng thức P = (x-2)^2. Để P = 0 thì x = 2. b) Áp dụng bất đẳng thức Cauchy: a + b >= 2 căn(ab). Đẳng thức xảy ra khi a=b." });
                                      showToast('Đã chọn bài giải Toán học nháp vở ghi mẫu!', 'success');
                                    }}
                                    className="p-1 px-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-[10px] font-bold text-slate-600 line-clamp-1"
                                  >
                                    📐 Mẫu Toán học
                                  </button>

                                  {/* MOCK PRESET LITERATURE OUTFLOW */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const litSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%23fdfbf7"/><path d="M 0,30 L 300,30 M 0,60 L 300,60 M 0,90 L 300,90 M 0,120 L 300,120 M 0,150 L 300,150 M 0,180 L 300,180 M 0,210 L 300,210 M 0,240 L 300,240 M 0,270 L 300,270 M 0,300 L 300,300" stroke="%23e8dec9" stroke-width="1"/><line x1="40" y1="0" x2="40" y2="400" stroke="%23ffa3a3" stroke-width="1"/><text x="50" y="50" font-family="'Times New Roman', serif" font-size="14" font-weight="bold" fill="%231a365d">BÀI VIẾT NĂNG LỰC NGỮ VĂN</text><text x="50" y="80" font-family="'Times New Roman', serif" font-size="11" font-weight="bold" fill="%232b6cb0">Cảm nhận đoạn trích Đồng chí:</text><text x="50" y="110" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">Bài thơ mở đầu bằng lời tâm tình mộc mạc</text><text x="50" y="140" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">về quê hương gian khổ: Súng bên súng,</text><text x="50" y="170" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">bên đầu. Những người lính chung lý tưởng</text><text x="50" y="200" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">trở thành tri kỷ ấm nồng giữa đêm lạnh.</text><text x="50" y="230" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">Chính Hữu đã khẳng định sức mạnh phi</text><text x="50" y="260" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">thường của tình cảm quân ngũ thiêng liêng.</text><text x="50" y="310" font-family="'Times New Roman', serif" font-size="10" font-style="italic" fill="%23718096">Nhật kí học sinh rèn văn đạt chuẩn</text></svg>`;
                                      setQuizStudentImages({ ...quizStudentImages, [q.id]: litSVG });
                                      setQuizAnswers({ ...quizAnswers, [q.id]: "Đoạn trích trong bài Đồng chí của tác giả Chính Hữu thể hiện tình đồng cảm, tri kỷ thiêng liêng của người lính Cách mạng. Xuất thân từ những miền quê nghèo khó, họ gắn bó bên nhau, san sẻ hơi ấm và vượt qua nghịch cảnh gian lao nơi núi rừng kháng chiến chiến hào." });
                                      showToast('Đã chọn bài giải Ngữ Văn phân tích thơ mẫu!', 'success');
                                    }}
                                    className="p-1 px-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-[10px] font-bold text-slate-600 line-clamp-1"
                                  >
                                    ✍️ Mẫu Ngữ Văn
                                  </button>

                                  {/* MOCK PRESET SCIENCE ANALYSIS */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const sciSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%23f0f7f4"/><path d="M 0,30 L 300,30 M 0,60 L 300,60 M 0,90 L 300,90 M 0,120 L 300,120 M 0,150 L 300,150" stroke="%23d2dfd8" stroke-width="1"/><line x1="40" y1="0" x2="40" y2="400" stroke="%2399e6b3" stroke-width="1"/><text x="50" y="50" font-family="'Times New Roman', serif" font-size="14" font-weight="bold" fill="%231a365d">BẢN VẼ PHÂN TÍCH KHOA HỌC TỰ NHIÊN</text><text x="50" y="80" font-family="'Times New Roman', serif" font-size="11" fill="%23276749">Đề bài: Phân tích ba thể của nước:</text><line x1="80" y1="180" x2="220" y2="180" stroke="%2338a169" stroke-width="2"/><polygon points="150,130 180,180 120,180" fill="%23319795"/><circle cx="150" cy="240" r="15" fill="%23805ad5"/><text x="50" y="110" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">1) Thể rắn: Đá lạnh, lực liên kết mạnh mẽ</text><text x="50" y="130" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">2) Thể lỏng: Nước ngọt sinh hoạt</text><text x="50" y="150" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">3) Thể khí: Hơi nước bay lên khi đun sôi</text><text x="50" y="290" font-family="'Times New Roman', serif" font-size="11" fill="%232d3748">Giải thích sự bay hơi và ngưng tụ liên đới...</text></svg>`;
                                      setQuizStudentImages({ ...quizStudentImages, [q.id]: sciSVG });
                                      setQuizAnswers({ ...quizAnswers, [q.id]: "Phân tích 3 thể của nước: Thể rắn có hình dạng xác định (băng, đá), các phân tử liên kết rất khít. Thể lỏng (nước sinh hoạt) có hình dạng theo bình chứa, lực liên kết vừa phải. Thể khí (hơi đun sôi) khuếch tán tự do trong không khí." });
                                      showToast('Đã chọn bài giải Khoa Học đo đạc mẫu!', 'success');
                                    }}
                                    className="p-1 px-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-[10px] font-bold text-slate-600 line-clamp-1"
                                  >
                                    🔬 Mẫu Khoa Học
                                  </button>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== TAB: QUIZ RESULT ==================== */}
          {activeTab === 'quiz-result' && activeQuizAttemptResult && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn">
              
              {/* DISPLAY VINH DANH BANNER */}
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-center rounded-3xl p-6 md:p-8 flex flex-col items-center gap-3">
                <span className="text-4xl animate-bounce">🏆</span>
                <h3 className="font-black text-sm md:text-base uppercase tracking-wider">ĐÃ THU HOÀN HOÀN THÀNH BÀI THI RÈN LUYỆN</h3>
                
                <div className="my-3 flex items-baseline justify-center gap-1 font-mono">
                  <span className="text-5xl md:text-7xl font-black">{formatScore(activeQuizAttemptResult.score)}</span>
                  <span className="text-base md:text-lg font-bold">/ 10 điểm</span>
                </div>

                <p className="text-xs md:text-sm text-emerald-100 max-w-sm italic">
                  "{activeQuizAttemptResult.feedback}"
                </p>

                <button 
                  onClick={() => { setActiveQuizAttemptResult(null); setActiveTab('dashboard'); }}
                  className="mt-4 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs rounded-xl shadow cursor-pointer transition-all"
                >
                  Quay lại Trang chủ học tập
                </button>
              </div>

              {/* REVIEW EACH QUESTIONS */}
              <div className="flex flex-col gap-4">
                <h3 className="font-extrabold text-slate-800 text-sm uppercase">Rà soát chi tiết đáp án:</h3>
                
                {(() => {
                  const correspondingTest = tests.find(t => t.id === activeQuizAttemptResult.testId);
                  if (!correspondingTest) return <p className="text-xs text-slate-400">Không nạp được thông số đề thi cũ.</p>;

                  return (
                    <div className="flex flex-col gap-4">
                      {correspondingTest.questions.map((q, idx) => {
                        const studentAns = activeQuizAttemptResult.answers[q.id] || '(Chưa điền)';
                        const questionPoints = q.points !== undefined ? q.points : 1.0;
                        let match = false;
                        let achievedPoints = 0;

                        if (q.type === 'MCQ' || q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK' || q.type === 'MATCHING') {
                          match = studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                          achievedPoints = match ? questionPoints : 0;
                        } else if (q.type === 'TRUE_FALSE') {
                          if (q.options && q.options.length > 0) {
                            const userParts = studentAns.split(',');
                            const correctParts = q.correctAnswer.split(',');
                            let matchCount = 0;
                            for (let i = 0; i < 4; i++) {
                              const uP = normalizeTF(userParts[i] || '');
                              const cP = normalizeTF(correctParts[i] || '');
                              if (uP && cP && uP === cP) {
                                matchCount++;
                              }
                            }
                            if (matchCount === 1) achievedPoints = 0.1;
                            else if (matchCount === 2) achievedPoints = 0.25;
                            else if (matchCount === 3) achievedPoints = 0.5;
                            else if (matchCount === 4) achievedPoints = 1.0;

                            achievedPoints = achievedPoints * questionPoints;
                            match = (matchCount === 4);
                          } else {
                            match = normalizeTF(studentAns) === normalizeTF(q.correctAnswer);
                            achievedPoints = match ? questionPoints : 0;
                          }
                        } else if (q.type === 'SHORT_ESSAY') {
                          if (studentAns.length > 8) achievedPoints = questionPoints * 0.8;
                          match = studentAns.length > 8;
                        }

                        return (
                          <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                              <span>CÂU SỐ {idx + 1} ({q.type})</span>
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded">Đạt: {achievedPoints.toFixed(2)} / {questionPoints.toFixed(2)}đ</span>
                                <span className={`px-2 py-0.5 rounded ${match ? 'bg-emerald-100 text-emerald-800' : achievedPoints > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {match ? '✓ Đúng hoàn toàn' : achievedPoints > 0 ? '⚠ Đúng một phần' : '✗ Sai'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs md:text-sm font-bold text-slate-800">
                              <MathRenderer text={q.content} />
                            </p>

                            {q.type === 'TRUE_FALSE' && q.options && q.options.length > 0 ? (
                              <div className="flex flex-col gap-2 pl-2 mt-1 bg-slate-100/50 p-3 rounded-xl border border-slate-200/50 text-xs text-slate-700">
                                <span className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Chi tiết kết quả 4 phát biểu Đúng/Sai:</span>
                                {(() => {
                                  const userParts = studentAns.split(',');
                                  const correctParts = q.correctAnswer.split(',');
                                  const alphaLabels = ['a', 'b', 'c', 'd'];
                                  return q.options.map((opt, oI) => {
                                    const uPVal = userParts[oI] || '(Chưa điền)';
                                    const cPVal = correctParts[oI] || '';
                                    const itemCorrect = normalizeTF(uPVal) === normalizeTF(cPVal);
                                    return (
                                      <div key={oI} className="flex flex-col sm:flex-row sm:items-center justify-between p-1.5 bg-white border border-slate-100 rounded-lg">
                                        <div className="flex gap-2">
                                          <span className="font-extrabold text-slate-400">{alphaLabels[oI]})</span>
                                          <MathRenderer text={opt.replace(/^[a-zA-Z0-9]\.\s*|^[a-zA-Z0-9]\)\s*/, '')} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                          <span className="text-[10px]">Em chọn: <strong className={itemCorrect ? 'text-emerald-600' : 'text-rose-600'}>{uPVal}</strong></span>
                                          <span className="text-[10px] text-slate-400">•</span>
                                          <span className="text-[10px]">Đáp án: <strong>{cPVal}</strong></span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${itemCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                            {itemCorrect ? '✓ Đúng' : '✗ Sai'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            ) : (
                              <div className="text-xs font-semibold gap-1.5 flex flex-col border-t border-slate-200/50 pt-2 text-slate-600">
                                <p>Bản làm bài của em: <strong className={match ? 'text-emerald-700 font-extrabold' : 'text-rose-600 font-extrabold'}>{studentAns}</strong></p>
                                <p>Đáp án đúng hệ thống: <strong className="text-slate-800">{q.correctAnswer}</strong></p>
                              </div>
                            )}

                            <div className="p-3 bg-white border border-slate-100 text-xs text-slate-500 italic rounded-xl mt-1 leading-normal">
                              <span className="not-italic font-bold text-slate-700 block mb-0.5">Lời giải hướng dẫn chi tiết:</span>
                              <MathRenderer text={q.explanation} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

        </main>
      </div>
      )}

      {/* FOOTER GENERAL */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs md:text-sm mt-auto">
        <div className="max-w-7xl mx-auto px-6 space-y-1">
          <p className="font-extrabold text-slate-300">TRẮC NGHIỆM NHANH ĐA MÔN • CANVAS QUICKQUIZ</p>
          <p className="font-light text-slate-500">© 2026 Hoàng Quang THCS Archimedes. Bảo lưu hệ thống rèn luyện đầy đủ.</p>
        </div>
      </footer>

      {/* ==================== GLOBAL MODAL: TEACHER PASSCODE VERIFICATION ==================== */}
      {isPasscodeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="bg-emerald-50 p-2.5 rounded-full border border-emerald-100">
                <span className="text-xl">🔐</span>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm hover:text-slate-900 uppercase tracking-wide">
                  XÁC THỰC QUYỀN TRUY CẬP GIÁO VIÊN
                </h3>
                <p className="text-[10px] uppercase font-bold text-slate-400">Bảng điều khiển bảo mật</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Khu vực làm việc này chứa toàn bộ cơ sở dữ liệu điểm số, tài nguyên đề thi và kho câu hỏi thuộc thẩm quyền của Giáo viên bộ môn. Học sinh không được phép truy cập.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passcodeInput.trim() === teacherPasscode) {
                  localStorage.setItem('quickquiz_teacher_authenticated', 'true');
                  localStorage.setItem('quickquiz_current_role', 'teacher');
                  setRole('teacher');
                  setIsPasscodeModalOpen(false);
                  setPasscodeInput('');
                  setActiveTab('dashboard');
                  showToast('Xác thực phân quyền Giáo viên thành công!', 'success');
                } else {
                  showToast('Mật mã quản trị chưa chính xác! Vui lòng thử lại.', 'error');
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Nhập mật mã Giáo viên:</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 items-center focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                  <input
                    type={showPasscodeText ? "text" : "password"}
                    placeholder="Mật mã bảo vệ giáo viên..."
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:ring-0"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscodeText(!showPasscodeText)}
                    className="text-[11px] font-black text-slate-400 hover:text-slate-600 leading-none transition-all ml-1.5"
                  >
                    {showPasscodeText ? "ẨN" : "HIỆN"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 flex flex-col gap-1 text-[11px] text-amber-900 leading-normal font-semibold">
                <span className="text-[10px] font-black text-amber-900 uppercase block">💡 Gợi ý cho thầy cô:</span>
                <p>
                  Mật mã truy cập mặc định là: <strong className="text-emerald-700 font-mono font-extrabold text-[12px]">123456</strong>
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  (Thầy/cô có thể thay đổi mật mã bảo bảo mật này tại tab "Cấu hình lớp học" &gt; "Bảo mật mật khẩu giáo viên" bên trong bảng quản trị để phòng học sinh mò ra).
                </p>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasscodeModalOpen(false);
                    setPasscodeInput('');
                  }}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer text-center"
                >
                  Thoát (Là Học sinh)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-100 cursor-pointer text-center"
                >
                  Xác nhận truy cập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== GLOBAL MODAL: CONFIRM CANCEL ASSIGNMENT (NO WINDOW.CONFIRM SANDBOX BUGS) ==================== */}
      {assignmentToDelete && (
        <div className="fixed inset-0 bg-slate-900/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="bg-rose-50 p-2.5 rounded-full border border-rose-100 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase">
                  HỦY GIAO NHIỆM VỤ
                </h3>
                <p className="text-[10px] uppercase font-bold text-slate-400">Xác nhận gỡ bỏ bài kiểm tra</p>
              </div>
            </div>

            <div className="space-y-2 py-1">
              <p className="text-slate-600 leading-relaxed font-semibold">
                Thầy/cô đang thực hiện gỡ nhiệm vụ tự luyện trực tuyến sau khỏi lớp học:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <p className="font-extrabold text-slate-800 text-[11px] leading-snug">
                  Đề thi: <span className="text-indigo-900">{assignmentToDelete.testTitle}</span>
                </p>
                <p className="text-[10px] text-emerald-800 font-extrabold uppercase">
                  LỚP GIAO: <span className="underline">{assignmentToDelete.className}</span>
                </p>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                * Lưu ý: Học sinh lớp này sẽ không nhìn thấy bài rèn luyện này nữa. Các lượt nộp bài đã hoàn thành trước đó vẫn được lưu tại danh sách báo cáo.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignmentToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignments(prev => prev.filter(x => x.id !== assignmentToDelete.id));
                  showToast('Đã hủy giao bài rèn luyện trực tuyến khỏi lớp học thành công!', 'success');
                  setAssignmentToDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-rose-100 cursor-pointer text-center"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GLOBAL MODAL: GEMINI API KEY INPUT ==================== */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn">
            <h3 className="font-black text-slate-800 text-base md:text-lg flex items-center gap-1.5">
              🔑 CÀI ĐẶT BÍ MẬT API KEY GEMINI
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Cung cấp API Key riêng tư của em để bứt phá rèn luyện tạo đề thi độc đáo và phân tích tự học của AI.
            </p>

            <input 
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem('quickquiz_gemini_key', e.target.value);
              }}
              placeholder="Nhập khóa API (E.g. AIzaSy...)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <p className="text-[10px] text-amber-700 bg-amber-50 rounded-xl p-3 leading-relaxed border border-amber-100">
              💡 Lưu ý: Hệ thống chỉ lưu khoá trong LocalStorage trình duyệt cá nhân của em bảo mật tốt. Nếu em để trống hệ thống sẽ chuyển sang dùng hệ thống khoá server mặc định.
            </p>

            <button
              onClick={() => { setShowKeyModal(false); showToast('Cập nhật API Key thành công!', 'success'); }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              ✓ Đồng Ý Cài Đặt
            </button>
          </div>
        </div>
      )}

      {/* ==================== GLOBAL MODAL: CONFIGURE / CREATING QUESTION ==================== */}
      {showQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <form 
            onSubmit={handleManualAddOrEditQuestion}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-4 my-8 animate-fadeIn text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-800 text-sm">📐 BIÊN SOẠN CÂU HỎI THỦ CÔNG</h3>
              <button type="button" onClick={() => { setShowQuestionModal(false); setEditingQuestion(null); }} className="text-slate-400">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">DẠNG CÂU HỎI</label>
                <select
                  value={editingQuestion.type}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="MCQ">Trắc nghiệm bốn lựa chọn (MCQ)</option>
                  <option value="TRUE_FALSE">Đúng / Sai (TRUE_FALSE)</option>
                  <option value="SHORT_ANSWER">Trả lời ngắn / Điền khuyết (SHORT_ANSWER)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">MỨC NHẬT THỨC</label>
                <select
                  value={editingQuestion.level}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, level: e.target.value as CognitiveLevel })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="Nhận biết">Nhận biết</option>
                  <option value="Thông hiểu">Thông hiểu</option>
                  <option value="Vận dụng">Vận dụng</option>
                  <option value="Vận dụng cao">Vận dụng cao</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">CÂU HỎI NỘI DUNG (DÁN LaTeX $...$ CHO TOÁN/KHOA HỌC)</label>
              <textarea 
                value={editingQuestion.content}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs text-slate-700 min-h-[70px]"
                placeholder="Nhập đề bài câu hỏi..."
              />
            </div>

            {/* CONDITIONAL MCQ CONFIG */}
            {editingQuestion.type === 'MCQ' && (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                <span className="block text-[10px] font-bold text-slate-500">THIẾT LẬP 4 LỰA CHỌN PHƯƠNG ÁN</span>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map(idx => {
                    const chr = idx === 0 ? 'A' : idx === 1 ? 'B' : idx === 2 ? 'C' : 'D';
                    const list = editingQuestion.options || ['A. ', 'B. ', 'C. ', 'D. '];
                    return (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-400">{chr}</span>
                        <input 
                          type="text"
                          required
                          value={list[idx] ? list[idx].replace(/^[A-H]\.\s*/, '') : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = [...list];
                            next[idx] = `${chr}. ${val}`;
                            setEditingQuestion({ ...editingQuestion, options: next });
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          placeholder={`${chr}...`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">ĐÁP ÁN CHÍNH XÁC</label>
                <input 
                  type="text" 
                  value={editingQuestion.correctAnswer}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                  required
                  placeholder="E.g. A, Đúng, 3, 0-1, 1-0"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">CHƯƠNG PHẠM VI</label>
                <select
                  value={editingQuestion.chapterId}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, chapterId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {activeSubject.chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">LỜI GIẢI CHI TIẾT</label>
              <textarea 
                value={editingQuestion.explanation}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] text-xs text-slate-600 focus:outline-none"
                placeholder="Nhập cách làm bài từng bước rà soát..."
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button 
                type="button"
                onClick={() => { setShowQuestionModal(false); setEditingQuestion(null); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
              >
                ✓ Lưu câu hỏi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== GLOBAL MODAL: BIÊN SOẠN THÀNH LẬP MÔN HỌC MỚI ==================== */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden animate-fadeIn text-xs">
            
            {/* HEADER */}
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 p-5">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                  📚 BIÊN SOẠN THÀNH LẬP MÔN
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hỗ trợ biên soạn đơn môn hoặc rèn luyện hàng loạt</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full hover:bg-slate-200/60 duration-100"
              >
                ✕
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex bg-slate-100 border-b border-slate-200/60 p-1 mx-5 mt-4 rounded-2xl select-none">
              <button
                type="button"
                onClick={() => setCreationMode('single')}
                className={`flex-1 py-2 rounded-xl text-center font-extrabold transition-all duration-150 ${
                  creationMode === 'single'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                📘 Biên soạn 1 môn học
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('bulk')}
                className={`flex-1 py-2 rounded-xl text-center font-extrabold transition-all duration-150 ${
                  creationMode === 'bulk'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🚀 Khởi tạo hàng loạt nhiều môn
              </button>
            </div>

            {/* MAIN CONTENT FORM */}
            {creationMode === 'single' ? (
              <form 
                onSubmit={handleCreateNewSubject}
                className="p-5 md:p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Mã Môn Học học phần (Không bắt buộc)</label>
                    <input 
                      type="text"
                      placeholder="Ví dụ: TOAN7, VATLY9"
                      value={newSubjectForm.id}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 text-xs uppercase text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Tên Môn Học Rèn Luyện *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ví dụ: Toán học 7 Chuyên"
                      value={newSubjectForm.name}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Thuộc Khối Lớp</label>
                    <select
                      value={newSubjectForm.grade}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, grade: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {['6', '7', '8', '9', '10', '11', '12'].map(g => (
                        <option key={g} value={g}>Lớp {g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Bộ Sách Giáo Khoa</label>
                    <input 
                      type="text"
                      placeholder="Kết nối tri thức, Cánh diều..."
                      value={newSubjectForm.book}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, book: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Giáo Viên Giảng Dạy</label>
                    <input 
                      type="text"
                      value={newSubjectForm.teacherName}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, teacherName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Học Viện / Trường</label>
                    <input 
                      type="text"
                      value={newSubjectForm.schoolName}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, schoolName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col gap-2">
                  <span className="block text-[10px] font-black text-slate-400 uppercase">Chương trình Mở Đầu Mặc Định:</span>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Tên Chương I *</label>
                    <input 
                      type="text"
                      required
                      value={newSubjectForm.chapterName}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, chapterName: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Tên Bài 1 *</label>
                    <input 
                      type="text"
                      required
                      value={newSubjectForm.lessonName}
                      onChange={(e) => setNewSubjectForm({ ...newSubjectForm, lessonName: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-[11px]"
                    />
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-400 bg-emerald-50/50 p-2.5 rounded-lg leading-normal">
                  💡 Hệ thống sẽ tự tạo chương mục bài cốt lõi cùng 1 câu hỏi dẫn đề chào mừng khởi đầu để sử dụng ngay lập tức mà không gặp trục trặc về ID trùng lặp.
                </p>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-1">
                  <button 
                    type="button"
                    onClick={() => setShowAddSubjectModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                  >
                    📐 Khởi tạo môn học
                  </button>
                </div>
              </form>
            ) : (
              <form 
                onSubmit={handleCreateBulkSubjects}
                className="p-5 md:p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]"
              >
                {/* INTERACTIVE COMPILING INTERFACE FOR BULK ACTION */}
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase mb-2">Bước 1: Chọn các Khối lớp muốn tạo rèn luyện</span>
                  <div className="flex flex-wrap gap-2">
                    {['6', '7', '8', '9', '10', '11', '12'].map(grade => {
                      const checked = bulkSelectedGrades.includes(grade);
                      return (
                        <button
                          type="button"
                          key={grade}
                          onClick={() => {
                            setBulkSelectedGrades(prev => 
                              checked ? prev.filter(g => g !== grade) : [...prev, grade]
                            );
                          }}
                          className={`py-1.5 px-3.5 rounded-xl font-bold border transition-all text-xs ${
                            checked 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Lớp {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase mb-2">Bước 2: Chọn các môn học giảng dạy khởi lập cùng lúc</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {['Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Tin học', 'Ngữ văn', 'Khoa học tự nhiên'].map(subName => {
                      const checked = bulkSelectedSubjectNames.includes(subName);
                      return (
                        <button
                          type="button"
                          key={subName}
                          onClick={() => {
                            setBulkSelectedSubjectNames(prev => 
                              checked ? prev.filter(s => s !== subName) : [...prev, subName]
                            );
                          }}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-left text-xs flex items-center gap-2 ${
                            checked 
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${checked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300'}`}>
                            {checked && '✓'}
                          </span>
                          {subName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Hoặc thêm môn học tuỳ chọn thủ công (cách nhau bởi dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Công nghệ, Mỹ thuật, Địa lí..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                    onChange={(e) => {
                      const typedStr = e.target.value;
                      const standardList = ['Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Tin học', 'Ngữ văn', 'Khoa học tự nhiên'];
                      const customItems = typedStr.split(',')
                        .map(x => x.trim())
                        .filter(x => x.length > 0);
                      
                      // Filter standard names checked plus all typed ones
                      setBulkSelectedSubjectNames(prev => {
                        const stdChecked = prev.filter(p => standardList.includes(p));
                        const combinedSet = new Set([...stdChecked, ...customItems]);
                        return Array.from(combinedSet);
                      });
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Bộ Sách Giáo Khoa Chung</label>
                    <input 
                      type="text"
                      value={bulkBook}
                      onChange={(e) => setBulkBook(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Giáo Viên Giảng Dạy</label>
                    <input 
                      type="text"
                      value={bulkTeacherName}
                      onChange={(e) => setBulkTeacherName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* COMPUTED SUMMARY PANEL */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4.5 text-xs text-emerald-800 flex flex-col gap-1.5 shadow-xs">
                  <span className="font-extrabold flex items-center gap-1 text-[11px]">
                    🚀 TỔNG HỢP KẾT QUẢ SẼ BIÊN SOẠN: <span className="font-black underline text-emerald-900">{bulkSelectedGrades.length * bulkSelectedSubjectNames.length} môn học</span>
                  </span>
                  <div className="text-[10.5px] leading-relaxed text-emerald-700/90 max-h-24 overflow-y-auto font-medium">
                    {bulkSelectedGrades.length > 0 && bulkSelectedSubjectNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {bulkSelectedGrades.flatMap(g => 
                          bulkSelectedSubjectNames.map(sub => (
                            <span key={`${sub}-${g}`} className="bg-emerald-100/80 px-2 py-0.5 rounded-md text-[9.5px] font-extrabold text-emerald-900">
                              {sub} {g}
                            </span>
                          ))
                        )}
                      </div>
                    ) : (
                      <em className="text-slate-400 font-bold">Vui lòng bấm chọn ít nhất 1 Khối lớp và 1 Môn học ở trên.</em>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddSubjectModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    disabled={bulkSelectedGrades.length === 0 || bulkSelectedSubjectNames.length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                  >
                    🚀 Khởi tạo {bulkSelectedGrades.length * bulkSelectedSubjectNames.length} Môn học mới!
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* GLOBAL MODAL: CONFIRM SUBJECT DELETION */}
      {subjectToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn text-xs">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase text-rose-600 flex items-center gap-1.5">
              ⚠️ XÁC NHẬN XÓA MÔN HỌC
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn xóa môn học <strong className="text-slate-800 font-extrabold">"{subjectToDelete.name} - Lớp {subjectToDelete.grade}"</strong> khỏi hệ thống?
            </p>
            <p className="text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3 leading-relaxed">
              <strong>Cảnh báo:</strong> Ngân hàng câu hỏi riêng biệt và các đề rèn luyện tương ứng thuộc môn học này cũng sẽ bị loại bỏ vĩnh viễn.
            </p>
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="flex-1 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteSubject(subjectToDelete.id);
                  setSubjectToDelete(null);
                }}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODAL: CONFIRM DEFAULT RESET */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn text-xs">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase text-rose-600 flex items-center gap-1.5">
              ⚠️ KHÔI PHỤC MẶC ĐỊNH
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn khôi phục toàn bộ các kho đề, kết quả làm bài và danh mục môn học về mặc định ban đầu? Hành động này sẽ xóa đồng bộ LocalStorage toàn thời gian.
            </p>
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Xác nhận Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODAL: CONFIRM QUESTION DELETION */}
      {questionToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn text-xs">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase text-rose-600 flex items-center gap-1.5">
              ⚠️ XÓA CÂU HỎI KHỎI KHO
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có chắc chắn muốn bỏ câu hỏi có mã ID <strong className="text-slate-800 font-extrabold">"{questionToDelete.id}"</strong> khỏi kho ngân hàng dữ liệu?
            </p>
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="flex-1 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuestions(prev => prev.filter(x => x.id !== questionToDelete.id));
                  showToast('Đã xóa câu hỏi khỏi kho lưu trữ ngân hàng!', 'info');
                  setQuestionToDelete(null);
                }}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODAL: CONFIRM TEST DELETION */}
      {testToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn text-xs">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase text-rose-600 flex items-center gap-1.5">
              ⚠️ XÓA ĐỀ KIỂM TRA KHỎI KHO
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn có muốn xóa đề kiểm tra <strong className="text-slate-800 font-extrabold">"{testToDelete.title}"</strong> này khỏi kho lưu trữ không?
            </p>
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setTestToDelete(null)}
                className="flex-1 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setTests(prev => prev.filter(t => t.id !== testToDelete.id));
                  showToast('Đã xóa bỏ đề đề kiểm tra khỏi kho thành công!', 'info');
                  setTestToDelete(null);
                }}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODAL: PREVIEW SPECIMEN NATIONAL TEST SHEET */}
      {testToPreview && (
        <TestPreviewModal 
          test={testToPreview} 
          activeSubject={activeSubject} 
          onClose={() => setTestToPreview(null)} 
        />
      )}

    </div>
  );
}
