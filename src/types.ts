// Src/types.ts

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'FILL_BLANK' | 'MATCHING' | 'SHORT_ESSAY';
export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
export type UserRole = 'teacher' | 'student';

export interface Lesson {
  id: string;
  name: string;
  learningOutcomes?: string[];
}

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface SubjectConfig {
  id: string;
  name: string;
  grade: string;
  book: string;
  teacherName: string;
  schoolName: string;
  strands: string[];
  chapters: Chapter[];
  defaultQuestionsCount: number;
  defaultDuration: number; // minutes
  questionTypes: QuestionType[];
  cognitiveLevels: CognitiveLevel[];
}

export interface Question {
  id: string;
  subjectId: string;
  chapterId: string;
  lessonId: string;
  type: QuestionType;
  level: CognitiveLevel;
  content: string;
  context?: string; // read-comprehension context / table data / experiment
  options?: string[]; // for MCQ (usually 4 options), for MATCHING (left items)
  matchingRight?: string[]; // for MATCHING (right items corresponding to option indices)
  correctAnswer: string; // for MCQ (A/B/C/D), T/F (Đúng/Sai), text for short answer, comma separated for matching pairs "0-1, 1-0"
  explanation: string;
  learningOutcome?: string;
  difficultyScore?: number; // scale 1-10 difficulty
  reqOutcomesGDPT2018?: string[]; // list of requirements (YCCĐ)
  competenciesGDPT2018?: string[]; // list of competencies (Năng lực thành phần GDPT 2018)
  source: 'Giáo viên' | 'AI' | 'Tệp tải lên';
  tags: string[];
  points?: number;
}

export interface Test {
  id: string;
  title: string;
  subjectId: string;
  grade: string;
  chapterId?: string;
  lessonId?: string;
  duration: number; // minutes
  purpose: string;
  questions: Question[];
  createdAt: string;
  status: 'Nháp' | 'Đã giao' | 'Đóng';
}

export interface Assignment {
  id: string;
  testId: string;
  testTitle: string;
  subjectId: string;
  className: string;
  deadline: string;
  notes: string;
  status: 'Đang mở' | 'Đã đóng';
  submittedCount: number;
}

export interface QuizAttempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  className: string;
  answers: { [questionId: string]: string };
  studentImages?: { [questionId: string]: string }; // base64 or photo URL
  gradedDetails?: { 
    [questionId: string]: { 
      score: number; 
      comment: string; 
      criteriaPoints?: { [criteria: string]: number };
    } 
  };
  score: number;
  timeSpent: number; // seconds
  submittedAt: string;
  feedback?: string;
  isGraded: boolean;
}

export interface StudentProgress {
  subjectId: string;
  completedLessons: string[]; // lessonIds
}

export interface Student {
  id: string;
  name: string;
  className: string;
  email: string;
  password?: string;
}

export function removeVietnameseTones(str: string): string {
  let result = str;
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  result = result.replace(/Ỳ|Ý|Y|Ỷ|Ỹ/g, "Y");
  result = result.replace(/Đ/g, "D");
  // Remove combining accents
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  return result;
}

export function generateStudentPassword(className: string, studentName: string): string {
  const cleanClass = className.trim().toUpperCase();
  const cleanName = removeVietnameseTones(studentName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${cleanClass}-${cleanName}`;
}
