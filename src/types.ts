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
  generalWorksheetImages?: string[]; // base64 or photo URLs of student full worksheets
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

export function normalizeQuestion(q: Question): Question {
  // Normalize casing and synonyms for question types to avoid any missing content
  let mappedType = q.type ? q.type.toString().trim() : 'MCQ';
  const upperType = mappedType.toUpperCase();
  
  if (upperType === 'ESSAY' || upperType === 'SHORT_ESSAY' || upperType === 'TL' || upperType === 'TỰ LUẬN' || upperType === 'TU_LUAN' || upperType === 'TLN' || mappedType.includes('Tự luận') || mappedType.includes('TỰ LUẬN')) {
    mappedType = 'SHORT_ESSAY';
  } else if (upperType === 'MULTIPLE_CHOICE' || upperType === 'TRAC_NGHIEM' || upperType === 'TN' || upperType === 'MCQ' || mappedType.includes('Trắc nghiệm') || mappedType.includes('TRẮC NGHIỆM')) {
    mappedType = 'MCQ';
  } else if (upperType === 'TRUE_FALSE' || upperType === 'ĐÚNG/SAI' || upperType === 'DUNG_SAI' || upperType === 'TF' || mappedType.includes('Đúng/Sai') || mappedType.includes('ĐÚNG / SAI')) {
    mappedType = 'TRUE_FALSE';
  } else if (upperType === 'SHORT_ANSWER' || upperType === 'SHORT' || upperType === 'FILL_BLANK' || upperType === 'FILL_IN_THE_BLANK' || upperType === 'TRẢ LỜI NGẮN' || upperType === 'DIEN_KHUYET' || mappedType.includes('Trả lời ngắn') || mappedType.includes('TRẢ LỜI NGẮN') || mappedType.includes('Điền khuyết') || mappedType.includes('Điền từ ngắn') || mappedType.includes('Điền từ')) {
    mappedType = 'SHORT_ANSWER';
  } else if (upperType === 'MATCHING' || upperType === 'GHÉP CẶP' || upperType === 'GHEP_CAP' || mappedType.includes('Ghép cặp') || mappedType.includes('GHÉP CẶP')) {
    mappedType = 'MATCHING';
  } else {
    // Default fallback
    mappedType = 'MCQ';
  }

  q = { ...q, type: mappedType as any };

  // If it's MCQ but answer is a True/False string, normalise it to TRUE_FALSE
  if (q.type === 'MCQ') {
    const hasNoOptions = !q.options || q.options.length === 0 || q.options.every(o => !o || o.replace(/^[A-H]\.\s*/, '').trim() === '');
    const isTfAnswer = q.correctAnswer === 'Đúng' || q.correctAnswer === 'Sai' || q.correctAnswer === 'True' || q.correctAnswer === 'False';
    if (hasNoOptions || isTfAnswer) {
      return normalizeQuestion({
        ...q,
        type: 'TRUE_FALSE',
        options: undefined
      });
    }
  }

  if (q.type === 'TRUE_FALSE') {
    if (q.options && q.options.length === 4) {
      if (!q.correctAnswer || !q.correctAnswer.includes(',')) {
        const baseAns = (q.correctAnswer === 'Sai' || q.correctAnswer === 'False' || q.correctAnswer === 'S') ? 'Sai' : 'Đúng';
        return {
          ...q,
          correctAnswer: `${baseAns},${baseAns},${baseAns},${baseAns}`
        };
      }
      return q;
    }

    const content = q.content || '';
    let statements: string[] = [];
    let mainContent = content;

    const p1 = /^(.*?)\s*1\/\s*(.*?)\s*2\/\s*(.*?)\s*3\/\s*(.*?)\s*4\/\s*(.*)$/s;
    const p2 = /^(.*?)\s*[aA]\)\s*(.*?)\s*[bB]\)\s*(.*?)\s*[cC]\)\s*(.*?)\s*[dD]\)\s*(.*)$/s;
    const p3 = /^(.*?)\s*[aA]\.\s*(.*?)\s*[bB]\.\s*(.*?)\s*[cC]\.\s*(.*?)\s*[dD]\.\s*(.*)$/s;
    const p4 = /^(.*?)\s*1\)\s*(.*?)\s*2\)\s*(.*?)\s*3\)\s*(.*?)\s*4\)\s*(.*)$/s;

    let match: RegExpMatchArray | null = null;
    if ((match = content.match(p1))) {
      mainContent = match[1].trim();
      statements = [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()];
    } else if ((match = content.match(p2))) {
      mainContent = match[1].trim();
      statements = [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()];
    } else if ((match = content.match(p3))) {
      mainContent = match[1].trim();
      statements = [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()];
    } else if ((match = content.match(p4))) {
      mainContent = match[1].trim();
      statements = [match[2].trim(), match[3].trim(), match[4].trim(), match[5].trim()];
    }

    if (statements.length === 4) {
      let correctStr = q.correctAnswer || 'Đúng,Đúng,Đúng,Đúng';
      if (!correctStr.includes(',')) {
        let finalAns = ['Đúng', 'Đúng', 'Đúng', 'Đúng'];
        if (content.includes('x + y = 6')) {
          finalAns = ['Đúng', 'Đúng', 'Đúng', 'Đúng'];
        } else {
          const isSingleSai = correctStr === 'Sai' || correctStr === 'False' || correctStr === 'S';
          finalAns = isSingleSai ? ['Sai', 'Sai', 'Sai', 'Sai'] : ['Đúng', 'Đúng', 'Đúng', 'Đúng'];
        }
        correctStr = finalAns.join(',');
      }

      return {
        ...q,
        content: mainContent,
        options: statements,
        correctAnswer: correctStr
      };
    }

    if (!q.options || q.options.length < 4) {
      return {
        ...q,
        options: [
          'Phát biểu a liên quan đến đề bài học học liệu.',
          'Phát biểu b liên quan đến đề bài học học liệu.',
          'Phát biểu c liên quan đến đề bài học học liệu.',
          'Phát biểu d liên quan đến đề bài học học liệu.'
        ],
        correctAnswer: q.correctAnswer && q.correctAnswer.includes(',') ? q.correctAnswer : 'Đúng,Sai,Đúng,Sai'
      };
    }
  }

  return q;
}
