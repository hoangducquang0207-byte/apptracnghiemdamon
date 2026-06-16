// src/data.ts
import { SubjectConfig, Question, Student, Test, Assignment, QuizAttempt } from './types';

export const DEFAULT_SUBJECTS: SubjectConfig[] = [
  {
    id: 'TOAN6',
    name: 'Toán',
    grade: '6',
    book: 'Kết nối tri thức với cuộc sống',
    teacherName: 'Hoàng Quang',
    schoolName: 'THCS Archimedes',
    strands: ['Số học và Đại số', 'Hình học và Đo lường'],
    defaultQuestionsCount: 10,
    defaultDuration: 15,
    questionTypes: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'],
    cognitiveLevels: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'],
    chapters: [
      {
        id: 'T6-C1',
        name: 'Chương I: Tập hợp các số tự nhiên',
        lessons: [
          { id: 'T6-C1-B1', name: 'Bài 1: Tập hợp và phần tử', learningOutcomes: ['Nhận biết tập hợp và phần tử', 'Dùng ký hiệu thuộc, không thuộc'] },
          { id: 'T6-C1-B2', name: 'Bài 2: Tập hợp các số tự nhiên', learningOutcomes: ['Biết ghi số tự nhiên', 'Thứ tự trong tập hợp số tự nhiên'] },
          { id: 'T6-C1-B3', name: 'Bài 3: Các phép tính trong tập số tự nhiên', learningOutcomes: ['Thực hiện thành thạo các phép tính cộng trừ nhân chia', 'Áp dụng tính chất phép toán để tính nhanh'] }
        ]
      },
      {
        id: 'T6-C2',
        name: 'Chương II: Tính chia hết trong tập hợp số tự nhiên',
        lessons: [
          { id: 'T6-C2-B1', name: 'Bài 1: Quan hệ chia hết và tính chất', learningOutcomes: ['Nhận biết chia hết và chia có dư', 'Áp dụng tính chất chia hết của một tổng'] },
          { id: 'T6-C2-B2', name: 'Bài 2: Dấu hiệu chia hết cho 2, 5, 3, 9', learningOutcomes: ['Nhận biết dấu hiệu chia hết nhanh'] },
          { id: 'T6-C2-B3', name: 'Bài 3: Số nguyên tố và hợp số', learningOutcomes: ['Phân biệt số nguyên tố và hợp số', 'Phân tích một số ra thừa số nguyên tố'] }
        ]
      }
    ]
  },
  {
    id: 'KHTN6',
    name: 'Khoa học tự nhiên',
    grade: '6',
    book: 'Cánh diều',
    teacherName: 'Nguyễn Thị Minh',
    schoolName: 'THCS Archimedes',
    strands: ['Chất và sự biến đổi của chất', 'Vật sống', 'Năng lượng và sự biến đổi'],
    defaultQuestionsCount: 10,
    defaultDuration: 15,
    questionTypes: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_BLANK'],
    cognitiveLevels: ['Nhận biết', 'Thông hiểu', 'Vận dụng'],
    chapters: [
      {
        id: 'K6-C1',
        name: 'Chương I: Các phép đo cơ bản',
        lessons: [
          { id: 'K6-C1-B1', name: 'Bài 1: Đo chiều dài', learningOutcomes: ['Lựa chọn thước đo phù hợp', 'Đọc và ghi kết quả đúng quy định'] },
          { id: 'K6-C1-B2', name: 'Bài 2: Đo khối lượng', learningOutcomes: ['Hiểu về cân và giới hạn đo khối lượng', 'Thực hành đo khối lượng vật'] }
        ]
      },
      {
        id: 'K6-C2',
        name: 'Chương II: Các thể của chất',
        lessons: [
          { id: 'K6-C2-B1', name: 'Bài 1: Ba thể của chất và đặc điểm', learningOutcomes: ['Nêu được ba thể của chất với các đặc điểm nén, hình dạng'] },
          { id: 'K6-C2-B2', name: 'Bài 2: Sự chuyển thể của các chất', learningOutcomes: ['Giải thích hiện tượng bay hơi, ngưng tụ, đông đặc'] }
        ]
      }
    ]
  },
  {
    id: 'TA6',
    name: 'Tiếng Anh',
    grade: '6',
    book: 'Global Success',
    teacherName: 'Lê Hoàng Nam',
    schoolName: 'THCS Archimedes',
    strands: ['Vocabulary', 'Grammar', 'Reading', 'Listening'],
    defaultQuestionsCount: 10,
    defaultDuration: 15,
    questionTypes: ['MCQ', 'FILL_BLANK', 'SHORT_ANSWER'],
    cognitiveLevels: ['Nhận biết', 'Thông hiểu', 'Vận dụng'],
    chapters: [
      {
        id: 'E6-U1',
        name: 'Unit 1: My New School',
        lessons: [
          { id: 'E6-U1-B1', name: 'Vocabulary & Pronunciation', learningOutcomes: ['Identify school items and activities', 'Pronounce sounds /ɑː/ and /ʌ/'] },
          { id: 'E6-U1-B2', name: 'Grammar: Present Simple', learningOutcomes: ['Use Present Simple tense correctly', 'Identify action verbs in school context'] }
        ]
      },
      {
        id: 'E6-U2',
        name: 'Unit 2: My House',
        lessons: [
          { id: 'E6-U2-B1', name: 'Vocabulary: Rooms & Furniture', learningOutcomes: ['Name various types of rooms and common furniture'] },
          { id: 'E6-U2-B2', name: 'Grammar: Prepositions of Place', learningOutcomes: ['Describe location of things in a house using in, on, behind, next to'] }
        ]
      }
    ]
  }
];

export const generateSampleQuestions = (): Question[] => {
  const q: Question[] = [];
  
  // TOÁN 6
  const mathQuestions: Partial<Question>[] = [
    {
      id: 'Q-M01', chapterId: 'T6-C1', lessonId: 'T6-C1-B1', type: 'MCQ', level: 'Nhận biết',
      content: 'Cho tập hợp $A = \\{2; 3; 5; 7\\}$. Khẳng định nào sau đây là ĐÚNG?',
      options: ['A. $5 \\notin A$', 'B. $1 \\in A$', 'C. $3 \\in A$', 'D. $7 \\notin A$'], correctAnswer: 'C',
      explanation: 'Số 3 có mặt trong danh sách các phần tử của tập hợp A, do đó $3 \\in A$.'
    },
    {
      id: 'Q-M02', chapterId: 'T6-C1', lessonId: 'T6-C1-B1', type: 'MCQ', level: 'Thông hiểu',
      content: 'Viết tập hợp $B = \\{x \\in \\mathbb{N} \\mid 5 < x \\le 9\\}$ bằng cách liệt kê phần tử:',
      options: ['A. $B = \\{6; 7; 8; 9\\}$', 'B. $B = \\{5; 6; 7; 8; 9\\}$', 'C. $B = \\{6; 7; 8\\}$', 'D. $B = \\{5; 6; 7; 8\\}$'], correctAnswer: 'A',
      explanation: '$x$ là số tự nhiên lớn hơn 5 và nhỏ hơn hoặc bằng 9 nên $B = \\{6; 7; 8; 9\\}$.'
    },
    {
      id: 'Q-M03', chapterId: 'T6-C1', lessonId: 'T6-C1-B1', type: 'TRUE_FALSE', level: 'Nhận biết',
      content: 'Ký hiệu $\\emptyset$ dùng để chỉ một tập hợp không chứa phần tử nào (tập hợp rỗng).',
      correctAnswer: 'Đúng', explanation: 'Tập rỗng kí hiệu là $\\emptyset$ và có số phần tử bằng 0.'
    },
    {
      id: 'Q-M04', chapterId: 'T6-C1', lessonId: 'T6-C1-B2', type: 'MCQ', level: 'Nhận biết',
      content: 'Số tự nhiên liền sau của số 1999 là số nào?',
      options: ['A. 1998', 'B. 2000', 'C. 2001', 'D. 20000'], correctAnswer: 'B',
      explanation: 'Số liền sau của số $n$ là $n + 1$. Vậy $1999 + 1 = 2000$.'
    },
    {
      id: 'Q-M05', chapterId: 'T6-C1', lessonId: 'T6-C1-B2', type: 'SHORT_ANSWER', level: 'Vận dụng',
      content: 'Tìm số tự nhiên $x$, biết rằng $x$ là số tự nhiên nhỏ nhất có ba chữ số khác nhau.',
      correctAnswer: '102', explanation: 'Số tự nhiên có 3 chữ số khác nhau nhỏ nhất có chữ số hàng trăm là 1, hàng chục là 0 và hàng đơn vị là 2.'
    },
    {
      id: 'Q-M06', chapterId: 'T6-C1', lessonId: 'T6-C1-B3', type: 'MCQ', level: 'Thông hiểu',
      content: 'Tính nhanh tổng sau: $28 + 65 + 72 + 35$',
      options: ['A. 180', 'B. 200', 'C. 210', 'D. 220'], correctAnswer: 'B',
      explanation: 'Ta nhóm các số tròn trăm: $(28 + 72) + (65 + 35) = 100 + 100 = 200$.'
    },
    {
      id: 'Q-M07', chapterId: 'T6-C1', lessonId: 'T6-C1-B3', type: 'SHORT_ANSWER', level: 'Vận dụng',
      content: 'Tìm $x$ biết: $3 \\cdot (x - 5) + 12 = 30$. Nhập giá trị số của $x$.',
      correctAnswer: '11', explanation: '$3 \\cdot (x - 5) = 30 - 12 = 18 \\Rightarrow x - 5 = 6 \\Rightarrow x = 11$.'
    },
    {
      id: 'Q-M08', chapterId: 'T6-C1', lessonId: 'T6-C1-B3', type: 'SHORT_ANSWER', level: 'Thông hiểu',
      content: 'Tính giá trị của biểu thức $P = 3^3 + 2^2$.',
      correctAnswer: '31',
      explanation: 'Ta có $P = 27 + 4 = 31$.'
    }
  ];

  for (let i = 1; i <= 30; i++) {
    const defaultItem = mathQuestions[i-1];
    if (defaultItem) {
      q.push({
        id: defaultItem.id!,
        subjectId: 'TOAN6',
        chapterId: defaultItem.chapterId!,
        lessonId: defaultItem.lessonId!,
        type: defaultItem.type!,
        level: defaultItem.level!,
        content: defaultItem.content!,
        options: defaultItem.options,
        matchingRight: defaultItem.matchingRight,
        correctAnswer: defaultItem.correctAnswer!,
        explanation: defaultItem.explanation!,
        source: 'Giáo viên',
        tags: ['Học kì 1', 'Mẫu']
      });
    } else {
      const idNum = i < 10 ? `0${i}` : `${i}`;
      const isC1 = i <= 20;
      q.push({
        id: `Q-M${idNum}`,
        subjectId: 'TOAN6',
        chapterId: isC1 ? 'T6-C1' : 'T6-C2',
        lessonId: isC1 ? 'T6-C1-B3' : 'T6-C2-B2',
        type: 'MCQ',
        level: i % 4 === 0 ? 'Vận dụng' : (i % 3 === 0 ? 'Thông hiểu' : 'Nhận biết'),
        content: `Câu hỏi luyện tập Toán học Số ${i}: Hãy xác định giá trị của biểu thức $A = ${i * 3} + x$ tại $x = 10$.`,
        options: [`A. ${i * 3 + 5}`, `B. ${i * 3 + 10}`, `C. ${i * 3 + 15}`, `D. ${i * 3 + 20}`],
        correctAnswer: 'B',
        explanation: `Thay $x = 10$ vào biểu thức ta có $A = ${i * 3} + 10 = ${i * 3 + 10}$.`,
        source: 'Giáo viên',
        tags: ['Hệ thống', 'Luyện tập']
      });
    }
  }

  // KHTN 6
  const scienceQuestions: Partial<Question>[] = [
    {
      id: 'Q-S01', chapterId: 'K6-C1', lessonId: 'K6-C1-B1', type: 'MCQ', level: 'Nhận biết',
      content: 'Để đo chiều dài của một căn phòng học, loại thước nào sau đây là phù hợp nhất?',
      options: ['A. Thước kẻ học sinh (20 cm)', 'B. Cặp pan-me đo độ dày', 'C. Thước cuộn hoặc thước dây (5 m)', 'D. Thước kẹp kim loại'], correctAnswer: 'C',
      explanation: 'Phòng học có kích thước khoảng vài mét, nên dùng thước cuộn có giới hạn đo lớn.'
    },
    {
      id: 'Q-S02', chapterId: 'K6-C1', lessonId: 'K6-C1-B1', type: 'TRUE_FALSE', level: 'Thông hiểu',
      content: 'Khi đọc kết quả đo chiều dài, chúng ta đặt mắt nhìn theo hướng xiên để dễ thấy vạch chia gần nhất.',
      correctAnswer: 'Sai', explanation: 'Phải đặt mắt nhìn vuông góc với cạnh thước ở đầu vật để tránh sai số.'
    },
    {
      id: 'Q-S03', chapterId: 'K6-C1', lessonId: 'K6-C1-B2', type: 'SHORT_ANSWER', level: 'Nhận biết',
      content: 'Đơn vị đo khối lượng hợp pháp của nước Việt Nam hiện nay là gì? (Nhập tên đầy đủ viết thường)',
      correctAnswer: 'kilôgam', explanation: 'Đơn vị đo khối lượng chính thức là kilôgam (kg).'
    },
    {
      id: 'Q-S04', chapterId: 'K6-C2', lessonId: 'K6-C2-B1', type: 'MCQ', level: 'Nhận biết',
      content: 'Chất ở thể nào sau đây có hình dạng và thể tích xác định, rất khó bị nén?',
      options: ['A. Thể rắn', 'B. Thể lỏng', 'C. Thể khí', 'D. Thể hơi'], correctAnswer: 'A',
      explanation: 'Chất rắn có các phân tử liên kết mạnh, giữ hình dạng cố định.'
    },
    {
      id: 'Q-S05', chapterId: 'K6-C2', lessonId: 'K6-C2-B2', type: 'FILL_BLANK', level: 'Thông hiểu',
      content: 'Quá trình một chất chuyển từ thể lỏng sang thể khí từ bề mặt chất lỏng được gọi là sự [bay hơi].',
      correctAnswer: 'bay hơi', explanation: 'Sự chuyển thể từ lỏng thành hơi độc lập ở bề mặt chất lỏng là sự bay hơi.'
    }
  ];

  for (let i = 1; i <= 30; i++) {
    const defaultItem = scienceQuestions[i-1];
    if (defaultItem) {
      q.push({
        id: defaultItem.id!,
        subjectId: 'KHTN6',
        chapterId: defaultItem.chapterId!,
        lessonId: defaultItem.lessonId!,
        type: defaultItem.type!,
        level: defaultItem.level!,
        content: defaultItem.content!,
        options: defaultItem.options,
        correctAnswer: defaultItem.correctAnswer!,
        explanation: defaultItem.explanation!,
        source: 'Giáo viên',
        tags: ['Khoa học', 'Mẫu']
      });
    } else {
      const idNum = i < 10 ? `0${i}` : `${i}`;
      const isC1 = i <= 15;
      q.push({
        id: `Q-S${idNum}`,
        subjectId: 'KHTN6',
        chapterId: isC1 ? 'K6-C1' : 'K6-C2',
        lessonId: isC1 ? 'K6-C1-B2' : 'K6-C2-B2',
        type: 'MCQ',
        level: i % 3 === 0 ? 'Thông hiểu' : 'Nhận biết',
        content: `Câu hỏi thí nghiệm KHTN số ${i}: Một học sinh đo thể tích chất lỏng bằng ống đong nhựa thấy vạch chỉ số ${10 + i} mL. Hãy chọn độ chia nhỏ nhất (ĐCNN) phù hợp nhất.`,
        options: ['A. 1 mL', 'B. 0.5 mL', 'C. 2 mL', 'D. 5 mL'],
        correctAnswer: 'A',
        explanation: 'ĐCNN là hiệu giá trị giữa hai vạch chia liên tiếp trên dụng cụ đo.',
        source: 'Giáo viên',
        tags: ['KHTN', 'Hệ thống']
      });
    }
  }

  // TIẾNG ANH 6
  const englishQuestions: Partial<Question>[] = [
    {
      id: 'Q-E01', chapterId: 'E6-U1', lessonId: 'E6-U1-B1', type: 'MCQ', level: 'Nhận biết',
      content: 'Choose the word that has a different pronunciation: "school", "classroom", "book", "pencil"',
      options: ['A. school', 'B. classroom', 'C. book', 'D. pencil'], correctAnswer: 'A',
      explanation: 'Sự khác biệt nằm ở âm nguyên âm kéo dài /uː/.'
    },
    {
      id: 'Q-E02', chapterId: 'E6-U1', lessonId: 'E6-U1-B2', type: 'MCQ', level: 'Thông hiểu',
      content: 'Complete the sentence: "He ________ soccer with his friends every Thursday afternoon."',
      options: ['A. play', 'B. plays', 'C. is playing', 'D. played'], correctAnswer: 'B',
      explanation: 'Chủ ngữ "He" là ngôi thứ ba số ít đi với động từ "plays" ở thì hiện tại đơn.'
    },
    {
      id: 'Q-E03', chapterId: 'E6-U1', lessonId: 'E6-U1-B2', type: 'FILL_BLANK', level: 'Thông hiểu',
      content: 'We [do] our homework in the library after school on Mondays.',
      correctAnswer: 'do', explanation: '"do homework" là cụm từ đi cùng chủ ngữ We số nhiều.'
    },
    {
      id: 'Q-E04', chapterId: 'E6-U2', lessonId: 'E6-U2-B1', type: 'MCQ', level: 'Nhận biết',
      content: 'Where do people usually cook food in a family house?',
      options: ['A. Living room', 'B. Bathroom', 'C. Kitchen', 'D. Bedroom'], correctAnswer: 'C',
      explanation: 'Kitchen (phòng bếp) là nơi chế biến thức ăn.'
    },
    {
      id: 'Q-E05', chapterId: 'E6-U2', lessonId: 'E6-U2-B2', type: 'MCQ', level: 'Thông hiểu',
      content: 'Look! The cat is ________ the desk, sleeping under the desk-lamp.',
      options: ['A. on', 'B. in', 'C. under', 'D. between'], correctAnswer: 'A',
      explanation: 'Sử dụng giới từ vị trí "on" biểu thị nằm phía trên mặt bàn.'
    }
  ];

  for (let i = 1; i <= 30; i++) {
    const defaultItem = englishQuestions[i-1];
    if (defaultItem) {
      q.push({
        id: defaultItem.id!,
        subjectId: 'TA6',
        chapterId: defaultItem.chapterId!,
        lessonId: defaultItem.lessonId!,
        type: defaultItem.type!,
        level: defaultItem.level!,
        content: defaultItem.content!,
        options: defaultItem.options,
        correctAnswer: defaultItem.correctAnswer!,
        explanation: defaultItem.explanation!,
        source: 'Giáo viên',
        tags: ['English', 'Grammar']
      });
    } else {
      const idNum = i < 10 ? `0${i}` : `${i}`;
      const isU1 = i <= 15;
      q.push({
        id: `Q-E${idNum}`,
        subjectId: 'TA6',
        chapterId: isU1 ? 'E6-U1' : 'E6-U2',
        lessonId: isU1 ? 'E6-U1-B2' : 'E6-U2-B2',
        type: 'MCQ',
        level: i % 4 === 0 ? 'Vận dụng' : 'Thông hiểu',
        content: `English Practice ${i}: "My brothers ________ to school at 7:00 AM every day."`,
        options: ['A. goes', 'B. go', 'C. are going', 'D. went'],
        correctAnswer: 'B',
        explanation: '"My brothers" là danh từ số nhiều, động từ giữ nguyên mẫu ở hiện tại đơn là "go".',
        source: 'Giáo viên',
        tags: ['Practice', 'English']
      });
    }
  }

  return q;
};

export const DEFAULT_QUESTIONS = generateSampleQuestions();

export const DEFAULT_STUDENTS: Student[] = [
  { id: 'STU-001', name: 'Nguyễn Văn An', className: '6A1', email: 'an.nv@school.edu.vn' },
  { id: 'STU-002', name: 'Trần Thị My', className: '6A1', email: 'my.tt@school.edu.vn' },
  { id: 'STU-003', name: 'Lê Hoàng Hải', className: '6A2', email: 'hai.lh@school.edu.vn' },
  { id: 'STU-004', name: 'Phạm Gia Bảo', className: '6A2', email: 'bao.pg@school.edu.vn' },
  { id: 'STU-005', name: 'Đỗ Minh Anh', className: '6A3', email: 'anh.dm@school.edu.vn' }
];

export const DEFAULT_TESTS: Test[] = [
  {
    id: 'TEST-001',
    title: 'Bài khảo sát năng lực Toán đầu năm',
    subjectId: 'TOAN6',
    grade: '6',
    chapterId: 'T6-C1',
    duration: 15,
    purpose: 'Kiểm tra đầu giờ',
    createdAt: '2026-06-01',
    status: 'Đã giao',
    questions: DEFAULT_QUESTIONS.filter(q => q.subjectId === 'TOAN6').slice(0, 5)
  },
  {
    id: 'TEST-002',
    title: 'Kiểm tra nhanh Các thể của chất',
    subjectId: 'KHTN6',
    grade: '6',
    chapterId: 'K6-C2',
    duration: 10,
    purpose: 'Ôn tập chương',
    createdAt: '2026-06-05',
    status: 'Đã giao',
    questions: DEFAULT_QUESTIONS.filter(q => q.subjectId === 'KHTN6' && q.chapterId === 'K6-C2').slice(0, 5)
  },
  {
    id: 'TEST-003',
    title: 'Unit 1 Quick Test Grammar',
    subjectId: 'TA6',
    grade: '6',
    chapterId: 'E6-U1',
    duration: 15,
    purpose: 'Kiểm tra thường xuyên',
    createdAt: '2026-06-10',
    status: 'Nháp',
    questions: DEFAULT_QUESTIONS.filter(q => q.subjectId === 'TA6' && q.chapterId === 'E6-U1').slice(0, 5)
  }
];

export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 'ASG-001',
    testId: 'TEST-001',
    testTitle: 'Bài khảo sát năng lực Toán đầu năm',
    subjectId: 'TOAN6',
    className: '6A1',
    deadline: '2026-06-25T23:59',
    notes: 'Các em hoàn thành đúng thời gian để lấy điểm kiểm tra miệng nhé!',
    status: 'Đang mở',
    submittedCount: 2
  },
  {
    id: 'ASG-002',
    testId: 'TEST-002',
    testTitle: 'Kiểm tra nhanh Các thể của chất',
    subjectId: 'KHTN6',
    className: '6A1',
    deadline: '2026-06-20T23:59',
    notes: 'Đọc kỹ phần mô tả sự bay hơi và đông đặc trước khi làm bài.',
    status: 'Đang mở',
    submittedCount: 1
  }
];

export const DEFAULT_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'ATT-001',
    testId: 'TEST-001',
    studentId: 'STU-001',
    studentName: 'Nguyễn Văn An',
    className: '6A1',
    answers: { 'Q-M01': 'C', 'Q-M02': 'A', 'Q-M03': 'Đúng', 'Q-M04': 'B', 'Q-M05': '102' },
    score: 10.0,
    timeSpent: 245,
    submittedAt: '2026-06-02 08:30',
    feedback: 'Xuất sắc! Em nắm vững kiến thức chương I.',
    isGraded: true
  },
  {
    id: 'ATT-002',
    testId: 'TEST-001',
    studentId: 'STU-002',
    studentName: 'Trần Thị My',
    className: '6A1',
    answers: { 'Q-M01': 'C', 'Q-M02': 'B', 'Q-M03': 'Sai', 'Q-M04': 'B', 'Q-M05': '100' },
    score: 4.0,
    timeSpent: 310,
    submittedAt: '2026-06-02 09:15',
    feedback: 'Cần ôn lại cách biểu diễn tập hợp và tìm số tự nhiên nhỏ nhất.',
    isGraded: true
  },
  {
    id: 'ATT-003',
    testId: 'TEST-002',
    studentId: 'STU-001',
    studentName: 'Nguyễn Văn An',
    className: '6A1',
    answers: { 'Q-S01': 'C', 'Q-S02': 'Sai', 'Q-S03': 'kilôgam', 'Q-S04': 'A', 'Q-S05': 'bay hơi' },
    score: 10.0,
    timeSpent: 180,
    submittedAt: '2026-06-06 14:20',
    feedback: 'Xuất sắc! Em nắm vững kiến thức đo chiều dài và khối lượng.',
    isGraded: true
  }
];
