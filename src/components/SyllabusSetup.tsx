import React, { useState } from 'react';
import { SubjectConfig, Chapter, Lesson, Question, Test, Assignment } from '../types';
import { 
  Sparkles, Trash2, Plus, X, Save, CheckCircle, AlertCircle, 
  ArrowLeft, ArrowRight, BookOpen, Users, Award, Activity, 
  RefreshCw, Sliders, Calendar, ListTodo, HelpCircle, GraduationCap, ChevronRight 
} from 'lucide-react';

interface SyllabusSetupProps {
  activeSubject: SubjectConfig;
  questions: Question[];
  tests: Test[];
  assignments: Assignment[];
  role: string;
  onSave: (config: SubjectConfig) => void;
  onSaveTest: (test: Test, parsedQs?: Question[]) => void;
  onUpdateQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onAssignTest: (testId: string, className: string, deadline: string, notes: string) => void;
  onChangeTab: (tab: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  apiKey: string;
}

export const SyllabusSetup: React.FC<SyllabusSetupProps> = ({ 
  activeSubject, 
  questions,
  tests,
  assignments,
  role,
  onSave, 
  onSaveTest,
  onUpdateQuestions,
  onAssignTest,
  onChangeTab,
  onToast, 
  apiKey 
}) => {
  const [editingSubject, setEditingSubject] = useState<SubjectConfig>({ ...activeSubject });
  const [syllabusInputText, setSyllabusInputText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Keep the editing form subject configuration in sync with parent activeSubject updates
  React.useEffect(() => {
    setEditingSubject({ ...activeSubject });
    setIsSynced(false);
  }, [activeSubject]);
  
  // States for the Sync Hub view
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<{ [lessonId: string]: boolean }>({});
  
  // States for Quick Test Generator
  const [selectedChapterForQuickTest, setSelectedChapterForQuickTest] = useState<string>('');
  const [quickTestQuestionsCount, setQuickTestQuestionsCount] = useState<number>(10);
  const [isCreatingTestAI, setIsCreatingTestAI] = useState<boolean>(false);

  // States for Quick Assignment
  const [selectedTestIdForAssign, setSelectedTestIdForAssign] = useState<string>('');
  const [assignedClass, setAssignedClass] = useState<string>('6A1');
  const [deadlineDate, setDeadlineDate] = useState<string>(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return tom.toISOString().split('T')[0];
  });

  const handleAIAnalyzeSyllabus = async () => {
    if (!syllabusInputText.trim()) {
      onToast('Vui lòng nhập văn bản chương trình học cần phân tích.', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusText: syllabusInputText,
          clientApiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const chaptersData = await response.json();
      if (Array.isArray(chaptersData)) {
        const formattedChapters: Chapter[] = chaptersData.map((ch: any, chIndex: number) => ({
          id: `CH-${Date.now()}-${chIndex}`,
          name: ch.name || `Chương ${chIndex + 1}`,
          lessons: (ch.lessons || []).map((l: any, lIndex: number) => ({
            id: `LES-${Date.now()}-${chIndex}-${lIndex}`,
            name: l.name || `Bài ${lIndex + 1}`,
            learningOutcomes: l.learningOutcomes || [],
          })),
        }));

        setEditingSubject((prev) => ({
          ...prev,
          chapters: formattedChapters,
        }));
        
        // Auto select first chapter for quick action defaults
        if (formattedChapters.length > 0) {
          setSelectedChapterForQuickTest(formattedChapters[0].id);
        }
        
        onToast('Gemini AI đã lập cấu trúc phân phối học tập cực chuần!', 'success');
      } else {
        throw new Error('Dữ liệu AI trả về không đúng định dạng giáo trình.');
      }
    } catch (error: any) {
      console.error(error);
      onToast(`Không thể phân tích: ${error.message || error}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addChapter = () => {
    const newCh: Chapter = {
      id: `CH-${Date.now()}`,
      name: `Chương mới ${editingSubject.chapters.length + 1}`,
      lessons: [{ id: `LES-${Date.now()}-0`, name: 'Bài học 1', learningOutcomes: [] }],
    };
    setEditingSubject({
      ...editingSubject,
      chapters: [...editingSubject.chapters, newCh],
    });
  };

  const removeChapter = (id: string) => {
    setEditingSubject({
      ...editingSubject,
      chapters: editingSubject.chapters.filter((c) => c.id !== id),
    });
  };

  const addLesson = (chIdx: number) => {
    const updated = [...editingSubject.chapters];
    updated[chIdx].lessons.push({
      id: `LES-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `Bài học mới ${updated[chIdx].lessons.length + 1}`,
      learningOutcomes: [],
    });
    setEditingSubject({ ...editingSubject, chapters: updated });
  };

  const removeLesson = (chIdx: number, lIdx: number) => {
    const updated = [...editingSubject.chapters];
    updated[chIdx].lessons.splice(lIdx, 1);
    setEditingSubject({ ...editingSubject, chapters: updated });
  };

  const handleSaveAndSyncApplet = () => {
    if (!editingSubject.name.trim()) {
      onToast('Tên môn học không được bỏ trống.', 'error');
      return;
    }
    // Update core syllabus configuration
    onSave(editingSubject);
    
    // Set auto default selected chapter
    if (editingSubject.chapters.length > 0 && !selectedChapterForQuickTest) {
      setSelectedChapterForQuickTest(editingSubject.chapters[0].id);
    }
    
    // Show the glorious Sync hub transition
    setIsSynced(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ACTION FILL GAP: Generate 5 LaTeX MCQ questions using Gemini for a specific empty lesson
  const handleAutoFillLessonGap = async (chapter: Chapter, lesson: Lesson) => {
    setIsGeneratingQuestions(prev => ({ ...prev, [lesson.id]: true }));
    onToast(`Đang kết nối Gemini AI để biên soạn 5 câu hỏi lý thuyết cho bài: ${lesson.name}...`, 'info');
    
    try {
      const response = await fetch('/api/gemini/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: editingSubject.name,
          grade: editingSubject.grade,
          book: editingSubject.book,
          chapterName: chapter.name,
          lessonName: lesson.name,
          numQuestions: 5,
          duration: 15,
          purpose: 'Khảo sát kiến thức chuyên sâu bài học',
          formats: ['MCQ'],
          cognitivePercent: {
            'Nhận biết': 60,
            'Thông hiểu': 40,
            'Vận dụng': 0,
            'Vận dụng cao': 0
          },
          useRealLifeScenarios: true,
          clientApiKey: apiKey || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi từ Gemini AI Server. Hãy thử lại.');
      }

      const data = await response.json();
      if (data && Array.isArray(data.questions)) {
        const parsedQs: Question[] = data.questions.map((q: any, idx: number) => ({
          id: `Q-AI-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          subjectId: editingSubject.id,
          chapterId: chapter.id,
          lessonId: lesson.id,
          type: q.type || 'MCQ',
          level: q.level || 'Nhận biết',
          content: q.content,
          options: q.options || ['A', 'B', 'C', 'D'],
          matchingRight: q.matchingRight || null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          learningOutcome: q.learningOutcome || '',
          source: 'AI',
          tags: [editingSubject.name, lesson.name, 'Đồng bộ Giáo án']
        }));

        onUpdateQuestions(prev => [...prev, ...parsedQs]);
        onToast(`Đồng bộ thành công! Đã nạp 5 câu hỏi tri thức latex chất lượng cao cho bài "${lesson.name}".`, 'success');
      } else {
        throw new Error('Cấu trúc câu hỏi trả về từ AI không tương thích.');
      }
    } catch (error: any) {
      console.error(error);
      onToast(`Lỗi sinh câu hỏi: ${error.message || error}`, 'error');
    } finally {
      setIsGeneratingQuestions(prev => ({ ...prev, [lesson.id]: false }));
    }
  };

  // ACTION QUICK TEST: Generate a complete Test based on the newly updated chapters
  const handleBuildQuickTestAI = async () => {
    if (!selectedChapterForQuickTest) {
      onToast('Vui lòng chọn một Chương học để thiết kế đề thi.', 'info');
      return;
    }
    const ch = editingSubject.chapters.find(c => c.id === selectedChapterForQuickTest);
    if (!ch) return;

    setIsCreatingTestAI(true);
    onToast(`AI đang tiến hành bóc tách phân phối và soạn Đề thi thử nghiệm (${quickTestQuestionsCount} câu)...`, 'info');
    
    try {
      const response = await fetch('/api/gemini/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: editingSubject.name,
          grade: editingSubject.grade,
          book: editingSubject.book,
          chapterName: ch.name,
          lessonName: '',
          numQuestions: quickTestQuestionsCount,
          duration: editingSubject.defaultDuration || 45,
          purpose: 'Bài kiểm tra chuyên đề tổng hợp của Chương học',
          formats: editingSubject.questionTypes.length > 0 ? editingSubject.questionTypes : ['MCQ'],
          cognitivePercent: {
            'Nhận biết': 40,
            'Thông hiểu': 30,
            'Vận dụng': 20,
            'Vận dụng cao': 10
          },
          useRealLifeScenarios: true,
          clientApiKey: apiKey || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi liên kết server tạo đề bằng Gemini.');
      }

      const data = await response.json();
      if (data && Array.isArray(data.questions)) {
        const parsedQs: Question[] = data.questions.map((q: any, idx: number) => ({
          id: `Q-AI-TEST-${Date.now()}-${idx}`,
          subjectId: editingSubject.id,
          chapterId: ch.id,
          lessonId: ch.lessons[0]?.id || '',
          type: q.type || 'MCQ',
          level: q.level || 'Nhận biết',
          content: q.content,
          options: q.options || ['A', 'B', 'C', 'D'],
          matchingRight: q.matchingRight || null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          learningOutcome: q.learningOutcome || '',
          source: 'AI',
          tags: [editingSubject.name, ch.name, 'Đề thi chương']
        }));

        const newTest: Test = {
          id: `TEST-${Date.now()}`,
          title: data.title || `Khảo sát chuyên bồi dưỡng: ${ch.name}`,
          subjectId: editingSubject.id,
          grade: editingSubject.grade,
          chapterId: ch.id,
          lessonId: undefined,
          duration: editingSubject.defaultDuration || 45,
          purpose: 'Bài đánh giá bồi dưỡng chương định kỳ',
          questions: parsedQs,
          createdAt: new Date().toLocaleDateString('vi-VN'),
          status: 'Nháp'
        };

        onSaveTest(newTest, parsedQs);
        setSelectedTestIdForAssign(newTest.id);
        onToast(`Tuyệt vời! Đã soạn xong và đưa vào mỏ neo đề khoa "${newTest.title}" (${parsedQs.length} câu).`, 'success');
      } else {
        throw new Error('Dữ liệu trả về bị thiếu dải câu hỏi liên kết.');
      }
    } catch (error: any) {
      console.error(error);
      onToast(`Lỗi đồng bộ tạo đề: ${error.message || error}`, 'error');
    } finally {
      setIsCreatingTestAI(false);
    }
  };

  // ACTION QUICK ASSIGN: Link to Class Assigning
  const handleDirectAssignAction = () => {
    if (!selectedTestIdForAssign) {
      onToast('Vui lòng chọn một đề thi hợp lệ để giao.', 'info');
      return;
    }
    onAssignTest(selectedTestIdForAssign, assignedClass, deadlineDate, 'Sinh & giao trực tiếp từ Giáo Án');
  };

  // Gap Analysis calculations for subject
  const subjectQuestions = questions.filter(q => q.subjectId === editingSubject.id);
  const subjectTests = tests.filter(t => t.subjectId === editingSubject.id);
  
  // List lessons with question counts
  const lessonsStatus = editingSubject.chapters.flatMap(ch => 
    ch.lessons.map(les => {
      const qCount = subjectQuestions.filter(q => q.lessonId === les.id).length;
      return {
        chapter: ch,
        lesson: les,
        qCount
      };
    })
  );

  const totalLessons = lessonsStatus.length;
  const coveredLessonsCount = lessonsStatus.filter(l => l.qCount > 0).length;
  const missingLessonsCount = totalLessons - coveredLessonsCount;
  const coveragePercent = totalLessons === 0 ? 0 : Math.round((coveredLessonsCount / totalLessons) * 100);

  // ================= VIEW 1: SYLLABUS SYNC & LINK HUB =================
  if (isSynced) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn pb-12" id="syllabus-sync-hub">
        {/* Sync Success Header Card */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-15 pointer-events-none">
            <CheckCircle className="w-64 h-64 text-white" />
          </div>
          
          <div className="flex items-start gap-4 z-10">
            <div className="bg-white/20 p-3.5 rounded-2xl backdrop-blur-md border border-white/20 shrink-0">
              <CheckCircle className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-black uppercase tracking-wider mb-2 border border-emerald-400/30">
                <RefreshCw className="w-3 h-3 animate-spin duration-1000" /> Đồng bộ thành công
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                TRUNG TÂM ĐỒNG BỘ GIÁO ÁN MÔN {editingSubject.name.toUpperCase()}
              </h2>
              <p className="text-xs md:text-sm text-emerald-100/90 mt-1 max-w-xl">
                Cấu trúc chương trình học vừa được cập nhật và lưu trữ. Tất cả các khớp nối hoạt động bồi dưỡng học sinh, ngân hàng câu hỏi, và tiến trình tích lũy học tập đã được thiết lập.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col lg:flex-row gap-3 z-10">
            <button
              onClick={() => setIsSynced(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl border border-white/25 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Bản đồ giáo trình
            </button>
            <button
              onClick={() => onChangeTab('dashboard')}
              className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              Về Trang chủ <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Synchronized Academic Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Khung Chương Trình</p>
              <p className="text-sm font-black text-slate-800">{editingSubject.chapters.length} Chương / {totalLessons} Bài</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kho Câu Hỏi Riêng</p>
              <p className="text-sm font-black text-slate-800">{subjectQuestions.length} câu LaTeX sẵn sàng</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ngân Hàng Đề Thi</p>
              <p className="text-sm font-black text-slate-800">{subjectTests.length} đề thi liên kết</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${coveragePercent >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Độ Bao Phủ Tri Thức</p>
              <p className="text-sm font-black text-slate-800">{coveragePercent}% bài giảng</p>
            </div>
          </div>
        </div>

        {/* Dynamic Sync Hub Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column Left (Lg: 7): Knowledge Gap Detector */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 lg:col-span-7 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Sliders className="w-4.5 h-4.5 text-indigo-600" /> 🔍 RÀ SOÁT KHOẢNG TRỐNG TRI THỨC (GAP DETECTOR)
                </h3>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {missingLessonsCount} bài trống
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Các bài giảng dưới đây chưa tồn tại câu hỏi ôn luyện trong Ngân hàng đề của Subject. Hãy sử dụng Gemini AI bồi dưỡng khẩn cấp mẫu tri thức 5 câu để học sinh có tư liệu làm bài.
              </p>
            </div>

            {/* Gap Visualization Bar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>Tiến độ bao phủ ngân hàng:</span>
                <span className="text-indigo-600">{coveredLessonsCount}/{totalLessons} Bài có câu hỏi ({coveragePercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" 
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
            </div>

            {/* Active Syllabus Lessons List with Question Counts and Quick AI actions */}
            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
              {lessonsStatus.map(({ chapter, lesson, qCount }) => (
                <div 
                  key={lesson.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                    qCount === 0 
                      ? 'bg-amber-50/20 border-amber-200/50 hover:border-amber-300' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 max-w-[70%]">
                    <div className="mt-0.5">
                      {qCount === 0 ? (
                        <div className="bg-amber-100 p-1 rounded-md text-amber-700">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="bg-emerald-100 p-1 rounded-md text-emerald-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 truncate">{chapter.name}</p>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">{lesson.name}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end self-end sm:self-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      qCount === 0 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200/50' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
                    }`}>
                      {qCount} câu hỏi
                    </span>

                    <button
                      onClick={() => handleAutoFillLessonGap(chapter, lesson)}
                      disabled={isGeneratingQuestions[lesson.id]}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer select-none ${
                        qCount === 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                      } disabled:opacity-50`}
                    >
                      {isGeneratingQuestions[lesson.id] ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Biên soạn...
                        </>
                      ) : qCount === 0 ? (
                        <>
                          <Sparkles className="w-3 h-3" /> Sinh 5 câu (AI)
                        </>
                      ) : (
                        <>Sinh thêm câu</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column Right (Lg: 5): Activity Quick Links & Tests Generator Bridge */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Widget A: Quick AI Test generator */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> ⚡ TẠO ĐỀ THI ĐÁNH GIÁ CHUYÊN ĐỀ TỪ GIÁO ÁN
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Trích xuất và tự động tổng hợp câu tạo Đề kiểm tra bồi dưỡng cấp độ Chương theo phân phối rèn luyện.
                </p>
              </div>

              <div className="flex flex-col gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">CHỌN CHƯƠNG ĐỂ SOẠN ĐỀ</label>
                  <select
                    value={selectedChapterForQuickTest}
                    onChange={(e) => setSelectedChapterForQuickTest(e.target.value)}
                    className="w-full p-2 bg-white text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {editingSubject.chapters.length === 0 ? (
                      <option value="">Chưa có chương nào được lập</option>
                    ) : (
                      editingSubject.chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">SỐ CÂU HỎI</label>
                    <input
                      type="number"
                      min={5}
                      max={20}
                      value={quickTestQuestionsCount}
                      onChange={(e) => setQuickTestQuestionsCount(Number(e.target.value))}
                      className="w-full p-2 bg-white text-xs font-bold border border-slate-200 rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">THỜI GIAN NHÁP</label>
                    <div className="p-2 bg-white text-xs font-bold border border-slate-200 rounded-lg text-slate-500 text-center">
                      {editingSubject.defaultDuration} Phút
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBuildQuickTestAI}
                  disabled={isCreatingTestAI || editingSubject.chapters.length === 0}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  {isCreatingTestAI ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Vui lòng chờ trợ lý đề thi...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Tự động Soạn & Đóng Đóng Đề
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Widget B: Fast Assign to Classes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-emerald-600" /> 👥 KHỚP NỔI GIAO BÀI TẬP RÈN LUYỆN NHANH CHO LỚP
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đẩy thẳng đề thi từ Giáo án sang hoạt động luyện thi rèn luyện trực tuyến của học sinh.
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">CHỌN ĐỀ KIỂM TRA ĐỒNG BỘ</label>
                  <select
                    value={selectedTestIdForAssign}
                    onChange={(e) => setSelectedTestIdForAssign(e.target.value)}
                    className="w-full p-2 bg-white text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">-- Chọn đề thi có sẵn --</option>
                    {subjectTests.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.questions.length} câu)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">LỚP THỤ HƯỞNG</label>
                    <select
                      value={assignedClass}
                      onChange={(e) => setAssignedClass(e.target.value)}
                      className="w-full p-2 bg-white text-xs font-black border border-slate-200 rounded-lg"
                    >
                      <option value="6A1">Lớp 6A1 (Chuyên)</option>
                      <option value="6A2">Lớp 6A2 (Đại trà)</option>
                      <option value="6A3">Lớp 6A3 (Đại trà)</option>
                      <option value="7A1">Lớp 7A1</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">HẠN NỘP BÀI</label>
                    <input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full p-1.5 bg-white text-xs font-bold border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDirectAssignAction}
                  disabled={!selectedTestIdForAssign}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer mt-1"
                >
                  <Calendar className="w-3.5 h-3.5" /> GIAO BÀI CHO HỌC SINH LỚP {assignedClass}
                </button>
              </div>
            </div>

            {/* Widget C: Quick links to other tabs */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">🔗 CẦU NỐI KẾT NỐI KHÔNG GIAN BÀI DẠY</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onChangeTab('test-bank')}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-xl transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-all">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800">Kho Đề & Ngân hàng</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sửa cấu trúc LaTeX câu hỏi đề</p>
                </button>

                <button
                  onClick={() => onChangeTab('progress-setup')}
                  className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-all">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800">Tiến trình Khảo sát</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Xem biểu đồ kết quả rèn luyện</p>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW 2: ORIGINAL FORM EDIT MODE (Polished visually) =================
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
            ⚙️ THIẾT KẾ CẤU TRÚC PHẦN PHỐI CHƯƠNG TRÌNH
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Chủ động cập nhật chương, thiết kế bài học, khai phóng tính liên kết ngân hàng câu hỏi tri thức và đồng bộ applet nhanh chóng.
          </p>
        </div>
        
        {/* Link back if has chapters */}
        {activeSubject.chapters.length > 0 && (
          <button
            onClick={() => setIsSynced(true)}
            className="self-start sm:self-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1"
          >
            Đưa vào Sync Hub <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">MÔN HỌC</label>
          <input 
            type="text" 
            value={editingSubject.name} 
            onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
            placeholder="Tên môn học (Ví dụ: Toán học, Vật lí...)"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">LỚP HỌC</label>
          <input 
            type="text" 
            value={editingSubject.grade} 
            onChange={(e) => setEditingSubject({ ...editingSubject, grade: e.target.value })}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
            placeholder="Khối lớp (Ví dụ: Lớp 6, Lớp 7...)"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">BỘ SÁCH GIÁO KHOA</label>
          <input 
            type="text" 
            value={editingSubject.book} 
            onChange={(e) => setEditingSubject({ ...editingSubject, book: e.target.value })}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            placeholder="Ví dụ: Kết nối tri thức, Chân trời sáng tạo..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">HỌ VÀ TÊN GIÁO VIÊN CHỦ NHIỆM</label>
          <input 
            type="text" 
            value={editingSubject.teacherName} 
            onChange={(e) => setEditingSubject({ ...editingSubject, teacherName: e.target.value })}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">TRƯỜNG HỌC LIÊN KẾT</label>
          <input 
            type="text" 
            value={editingSubject.schoolName} 
            onChange={(e) => setEditingSubject({ ...editingSubject, schoolName: e.target.value })}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">SỐ CÂU CỦA ĐỀ MẪU</label>
            <input 
              type="number" 
              value={editingSubject.defaultQuestionsCount} 
              onChange={(e) => setEditingSubject({ ...editingSubject, defaultQuestionsCount: Number(e.target.value) })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">THỜI GIAN NHÁP (CO)</label>
            <input 
              type="number" 
              value={editingSubject.defaultDuration} 
              onChange={(e) => setEditingSubject({ ...editingSubject, defaultDuration: Number(e.target.value) })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center"
            />
          </div>
        </div>
      </div>

      {/* AI AUTO BUILD SECTION */}
      <div className="border border-indigo-100 hover:border-indigo-200 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/20 to-slate-50/50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs md:text-sm font-black text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-bounce" /> AI TỰ LẬP CẤU TRÚC PHÂN PHỐI CHƯƠNG TRÌNH DẠY VÀ HỌC
          </h4>
          <button 
            type="button"
            onClick={() => {
              const val = `Chương I: Tập hợp các số tự nhiên
Bài 1: Tập hợp lý thuyết và phần tử mẫu
Bài 2: Ghi số tự nhiên và thứ tự sắp xếp liên tục
Chương II: Tính chất chia hết trong tập hợp số tự nhiên
Bài 1: Phép chia hết và học toán thông minh
Bài 2: Ước và bội số của toán thực tế`;
              setSyllabusInputText(val);
            }}
            className="text-[11px] text-indigo-600 font-extrabold hover:underline"
          >
            Dán mẫu Giáo án 2 Chương
          </button>
        </div>
        <textarea
          value={syllabusInputText}
          onChange={(e) => setSyllabusInputText(e.target.value)}
          placeholder="Dán mục lục của sách giáo khoa vào đây... Hãy để trợ lý Gemini AI dọn dẹp các ký tự thừa và phân tách thành giáo án hoàn hảo chỉ sau vài giây."
          className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs min-h-[90px] focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
        />
        <button
          type="button"
          onClick={handleAIAnalyzeSyllabus}
          disabled={isAnalyzing}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Trợ lý AI đang lập giáo án khoa học...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Bóc tách phân bổ giáo án bằng Gemini AI
            </>
          )}
        </button>
      </div>

      {/* CƠ CẤU CHƯƠNG TRÌNH HÀNH CHÍNH */}
      <div className="flex flex-col gap-3.5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">MỤC LỤC & KHUNG BÀI HỌC VẬT LÝ CHI TIẾT</h4>
          <button 
            type="button"
            onClick={addChapter}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-all"
          >
            + Thêm Chương lí thuyết
          </button>
        </div>

        <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
          {editingSubject.chapters.map((ch, cIdx) => (
            <div key={ch.id} className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/55 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <input 
                  type="text" 
                  value={ch.name}
                  onChange={(e) => {
                    const up = [...editingSubject.chapters];
                    up[cIdx].name = e.target.value;
                    setEditingSubject({ ...editingSubject, chapters: up });
                  }}
                  className="font-black text-slate-800 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:outline-none flex-grow"
                  placeholder="Tên chương học..."
                />
                <button 
                  type="button"
                  onClick={() => removeChapter(ch.id)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa bộ
                </button>
              </div>

              <div className="pl-4 border-l-2 border-slate-200 flex flex-col gap-2">
                {ch.lessons.map((les, lIdx) => (
                  <div key={les.id} className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-200/50">
                    <input 
                      type="text" 
                      value={les.name}
                      onChange={(e) => {
                        const up = [...editingSubject.chapters];
                        up[cIdx].lessons[lIdx].name = e.target.value;
                        setEditingSubject({ ...editingSubject, chapters: up });
                      }}
                      className="text-xs text-slate-700 bg-transparent focus:outline-none flex-grow font-semibold"
                      placeholder="Tên bài dạy..."
                    />
                    <button 
                      type="button"
                      onClick={() => removeLesson(cIdx, lIdx)}
                      className="text-slate-400 hover:text-red-500 text-xs font-bold"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addLesson(cIdx)}
                  className="text-left text-xs font-bold text-emerald-600 hover:underline mt-1 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Thêm Bài dạy giảng dạy
                </button>
              </div>
            </div>
          ))}

          {editingSubject.chapters.length === 0 && (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              Mục lục trống rỗng. Hãy dán text ở trên bóc tách bằng AI hoặc bấm nút "+ Thêm Chương lí thuyết" để bắt đầu thủ công.
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={handleSaveAndSyncApplet}
          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" /> LƯU CHƯƠNG TRÌNH & ĐỒNG BỘ APPLET
        </button>
      </div>
    </div>
  );
};
