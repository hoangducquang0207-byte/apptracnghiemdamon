import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SubjectConfig, Question, Test, QuestionType, CognitiveLevel, Chapter, Lesson } from '../types';
import { MathRenderer } from './MathRenderer';
import { formatScore } from '../utils/numberFormat';
import { 
  Search, Filter, BookOpen, Download, Upload, Plus, Trash2, Edit, Copy, 
  FileText, LayoutGrid, CheckCircle2, HelpCircle, RefreshCw, SlidersHorizontal, 
  Sparkles, Layers, ChevronRight, ChevronDown, Check, ArrowRight, Info, AlertTriangle
} from 'lucide-react';

interface OptionItem<T> {
  value: T;
  label: string;
}

interface FacetedMultiSelectProps<T extends string> {
  label: string;
  placeholder: string;
  options: OptionItem<T>[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
}

const FacetedMultiSelect = <T extends string>({
  label,
  placeholder,
  options,
  selectedValues,
  onChange,
}: FacetedMultiSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMulti, setIsMulti] = useState(true); // default to true (allows choosing one-or-multiple)
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedLabels = selectedValues
    .map((val) => options.find((opt) => opt.value === val)?.label)
    .filter(Boolean) as string[];

  const displayText =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === options.length
      ? `Tất cả (${placeholder})`
      : selectedLabels.join(', ');

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider select-none">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-750 font-extrabold flex items-center justify-between text-left focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 focus:outline-none transition-all cursor-pointer shadow-xs min-h-[38px] select-none"
      >
        <span className="truncate max-w-[90%] text-[11px] font-bold text-slate-700">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-40 w-full min-w-[230px] bg-white border border-slate-200 rounded-2xl shadow-xl p-3 flex flex-col gap-2.5 animate-fadeIn">
          {/* Header with Mode Toggle */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[10px]">
            <span className="text-slate-400 font-extrabold uppercase tracking-wide">Chế độ chọn:</span>
            <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMulti(false);
                  if (selectedValues.length > 1) {
                    onChange([selectedValues[0]]);
                  }
                }}
                className={`px-1.5 py-0.5 rounded-md font-extrabold text-[9px] transition-all ${
                  !isMulti ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Chọn một
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMulti(true);
                }}
                className={`px-1.5 py-0.5 rounded-md font-extrabold text-[9px] transition-all ${
                  isMulti ? 'bg-white text-emerald-605 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Chọn nhiều
              </button>
            </div>
          </div>

          {/* Select all / Clear choices if Multi-select */}
          {isMulti && (
            <div className="flex items-center justify-between px-1 text-[9px] text-slate-450 font-extrabold border-b border-slate-50 pb-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(options.map((opt) => opt.value));
                }}
                className="text-emerald-600 hover:text-emerald-700 font-black transition-all"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-200">|</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="text-slate-505 hover:text-slate-700 font-black transition-all"
              >
                Clear bỏ chọn
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-[180px] overflow-y-auto scrollbar-thin flex flex-col gap-1 pr-0.5">
            {options.map((opt) => {
              const isChecked = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMulti) {
                      if (isChecked) {
                        onChange(selectedValues.filter((val) => val !== opt.value));
                      } else {
                        onChange([...selectedValues, opt.value]);
                      }
                    } else {
                      onChange([opt.value]);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center justify-between group ${
                    isChecked
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-950 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isMulti ? (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by click
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 shrink-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isChecked ? 'border-emerald-500 bg-emerald-500 shadow-2xs' : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}>
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    )}
                    <span className="truncate select-none">{opt.label}</span>
                  </div>
                  {isChecked && isMulti && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

          {/* Footer controls if active Multi-select */}
          {isMulti && (
            <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center bg-white">
              <span className="text-[10px] text-slate-400 font-extrabold">Đã chọn: {selectedValues.length} mục</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const COGNITIVE_LEVELS_OPTIONS: OptionItem<CognitiveLevel>[] = [
  { value: 'Nhận biết', label: 'Nhận biết' },
  { value: 'Thông hiểu', label: 'Thông hiểu' },
  { value: 'Vận dụng', label: 'Vận dụng' },
  { value: 'Vận dụng cao', label: 'Vận dụng cao' }
];

const QUESTION_TYPES_OPTIONS: OptionItem<QuestionType>[] = [
  { value: 'MCQ', label: 'Trắc nghiệm nhiều lựa chọn (MCQ)' },
  { value: 'TRUE_FALSE', label: 'Đúng / Sai' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
  { value: 'SHORT_ESSAY', label: 'Tự luận (TL)' }
];

const SOURCES_OPTIONS: OptionItem<string>[] = [
  { value: 'Giáo viên', label: 'Giáo viên biên soạn' },
  { value: 'AI', label: 'AI bóc tách phụ giáo án' },
  { value: 'Tệp tải lên', label: 'Nhập từ tệp bảng tính CSV' }
];

interface QuestionBankProps {
  activeSubject: SubjectConfig;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  tests: Test[];
  setTests: React.Dispatch<React.SetStateAction<Test[]>>;
  setActiveTab: (tab: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  activeSubject,
  questions,
  setQuestions,
  tests,
  setTests,
  setActiveTab,
  onToast
}) => {
  // Current active selections for curriculum tree
  // 'ALL' | chapterId | lessonId
  const [selectedTreeType, setSelectedTreeType] = useState<'ALL' | 'CHAPTER' | 'LESSON'>('ALL');
  const [selectedTreeId, setSelectedTreeId] = useState<string>('ALL');
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('grouped');

  // Multi-facet filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<CognitiveLevel[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Selected question IDs for Word document exporting
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Tree collapse/expand state (chapterId -> boolean)
  const [expandedChapters, setExpandedChapters] = useState<{ [key: string]: boolean }>({});

  // Question editing modal / creation state
  const [localEditingQuestion, setLocalEditingQuestion] = useState<Question | null>(null);
  const [showEditorModal, setShowEditorModal] = useState<boolean>(false);

  // CSV Import States
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedImportQuestions, setParsedImportQuestions] = useState<Partial<Question>[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Full Exam (Test) Import and Template States
  const [showTestImportModal, setShowTestImportModal] = useState<boolean>(false);
  const [testImportFile, setTestImportFile] = useState<File | null>(null);
  const [parsedTestQuestions, setParsedTestQuestions] = useState<Question[]>([]);
  const [importTestTitle, setImportTestTitle] = useState<string>('');
  const [importTestDuration, setImportTestDuration] = useState<number>(45);
  const [importTestPurpose, setImportTestPurpose] = useState<string>('Kiểm tra định kỳ');
  const [isTestDragging, setIsTestDragging] = useState<boolean>(false);
  const testFileInputRef = useRef<HTMLInputElement>(null);

  // Quick Test Generation States
  const [showQuickTestModal, setShowQuickTestModal] = useState<boolean>(false);
  const [quickTestTitle, setQuickTestTitle] = useState<string>('');
  const [quickTestDuration, setQuickTestDuration] = useState<number>(15);
  const [quickTestCount, setQuickTestCount] = useState<number>(5);

  // Custom confirmation modal state to bypass restricted iframe window.confirm blocks
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  } | null>(null);

  // Filter out duplicates (enabled by default)
  const [hideDuplicates, setHideDuplicates] = useState<boolean>(true);

  // Subject Questions for counts and operations
  const subjectQuestions = useMemo(() => {
    return questions.filter(q => q.subjectId === activeSubject.id);
  }, [questions, activeSubject.id]);

  // Set default chapter expand values
  useEffect(() => {
    const obj: { [key: string]: boolean } = {};
    activeSubject.chapters.forEach(c => {
      obj[c.id] = true; // Default expand all chapters
    });
    setExpandedChapters(obj);
    // Reset filters when switching subjects
    setSelectedTreeType('ALL');
    setSelectedTreeId('ALL');
    setSelectedChapterIds([]);
    setSelectedLessonIds([]);
    setSelectedLevels([]);
    setSelectedTypes([]);
    setSelectedSources([]);
    setCurrentPage(1);
  }, [activeSubject]);

  // Expand / collapse helper
  const toggleChapterExpand = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // Tree Nodes with question counts
  const chapterQuestionCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    activeSubject.chapters.forEach(c => {
      counts[c.id] = subjectQuestions.filter(q => q.chapterId === c.id).length;
    });
    return counts;
  }, [subjectQuestions, activeSubject.chapters]);

  const lessonQuestionCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    activeSubject.chapters.forEach(c => {
      c.lessons.forEach(l => {
        counts[l.id] = subjectQuestions.filter(q => q.lessonId === l.id).length;
      });
    });
    return counts;
  }, [subjectQuestions, activeSubject.chapters]);

  // Filtered matching count before removing duplicates
  const rawFilteredMatchesCount = useMemo(() => {
    return subjectQuestions.filter(q => {
      // 1. Curriculum Tree Filter (Supports multi-select values or fallback single navigation tree)
      if (selectedChapterIds.length > 0 || selectedLessonIds.length > 0) {
        const matchesChapter = selectedChapterIds.includes(q.chapterId);
        const matchesLesson = selectedLessonIds.includes(q.lessonId);
        if (!matchesChapter && !matchesLesson) return false;
      } else if (selectedTreeType === 'CHAPTER') {
        if (q.chapterId !== selectedTreeId) return false;
      } else if (selectedTreeType === 'LESSON') {
        if (q.lessonId !== selectedTreeId) return false;
      }

      // 2. Facet filters - supports multi-select
      if (selectedLevels.length > 0 && !selectedLevels.includes(q.level)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(q.type)) return false;
      if (selectedSources.length > 0 && !selectedSources.includes(q.source)) return false;

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const contentMatch = q.content.toLowerCase().includes(query);
        const explMatch = q.explanation.toLowerCase().includes(query);
        const ansMatch = q.correctAnswer.toLowerCase().includes(query);
        const tagsMatch = q.tags.some(t => t.toLowerCase().includes(query));
        const optionsMatch = q.options?.some(o => o.toLowerCase().includes(query)) || false;
        if (!contentMatch && !explMatch && !ansMatch && !tagsMatch && !optionsMatch) return false;
      }

      return true;
    }).length;
  }, [subjectQuestions, selectedTreeType, selectedTreeId, selectedChapterIds, selectedLessonIds, selectedLevels, selectedTypes, selectedSources, searchQuery]);

  // Filtered list of questions
  const filteredQuestions = useMemo(() => {
    const rawFiltered = subjectQuestions.filter(q => {
      // 1. Curriculum Tree Filter (Supports multi-select values or fallback single navigation tree)
      if (selectedChapterIds.length > 0 || selectedLessonIds.length > 0) {
        const matchesChapter = selectedChapterIds.includes(q.chapterId);
        const matchesLesson = selectedLessonIds.includes(q.lessonId);
        if (!matchesChapter && !matchesLesson) return false;
      } else if (selectedTreeType === 'CHAPTER') {
        if (q.chapterId !== selectedTreeId) return false;
      } else if (selectedTreeType === 'LESSON') {
        if (q.lessonId !== selectedTreeId) return false;
      }

      // 2. Facet filters - supports multi-select
      if (selectedLevels.length > 0 && !selectedLevels.includes(q.level)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(q.type)) return false;
      if (selectedSources.length > 0 && !selectedSources.includes(q.source)) return false;

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const contentMatch = q.content.toLowerCase().includes(query);
        const explMatch = q.explanation.toLowerCase().includes(query);
        const ansMatch = q.correctAnswer.toLowerCase().includes(query);
        const tagsMatch = q.tags.some(t => t.toLowerCase().includes(query));
        const optionsMatch = q.options?.some(o => o.toLowerCase().includes(query)) || false;
        if (!contentMatch && !explMatch && !ansMatch && !tagsMatch && !optionsMatch) return false;
      }

      return true;
    });

    if (hideDuplicates) {
      const seen = new Set<string>();
      return rawFiltered.filter(q => {
        // Normalize content strictly: remove HTML tags, standard spaces, punctuation, lowercase
        const key = q.content
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, '')
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]?]/g, '')
          .toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return rawFiltered;
  }, [subjectQuestions, selectedTreeType, selectedTreeId, selectedChapterIds, selectedLessonIds, selectedLevels, selectedTypes, selectedSources, searchQuery, hideDuplicates]);

  // Pagination calculations
  const totalItems = filteredQuestions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  // Reset pagination if filtered questions change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTreeType, selectedTreeId, selectedChapterIds, selectedLessonIds, selectedLevels, selectedTypes, selectedSources, searchQuery, hideDuplicates]);

  // Statistical breakdowns
  const stats = useMemo(() => {
    const total = subjectQuestions.length;
    
    // Cognitive Levels
    const levelsMap = { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Vận dụng cao': 0 };
    // Types
    const mcq = subjectQuestions.filter(q => q.type === 'MCQ').length;
    const trueFalse = subjectQuestions.filter(q => q.type === 'TRUE_FALSE').length;
    const shortAnswer = subjectQuestions.filter(q => q.type === 'SHORT_ANSWER').length;
    const essay = subjectQuestions.filter(q => q.type === 'SHORT_ESSAY').length;
    const other = total - mcq - trueFalse - shortAnswer - essay;

    subjectQuestions.forEach(q => {
      if (q.level in levelsMap) {
        levelsMap[q.level as keyof typeof levelsMap]++;
      }
    });

    return {
      total,
      levels: levelsMap,
      types: { mcq, trueFalse, shortAnswer, essay, other }
    };
  }, [subjectQuestions]);

  // Action methods: Edit, Delete, Duplicate
  const handleEditClick = (q: Question) => {
    setLocalEditingQuestion({ ...q });
    setShowEditorModal(true);
  };

  const handleDuplicateClick = (q: Question) => {
    const newId = `Q-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const duplicated: Question = {
      ...q,
      id: newId,
      content: `${q.content} (Bản sao)`,
      source: 'Giáo viên',
    };
    setQuestions(prev => [duplicated, ...prev]);
    onToast(`Đã sao chép câu hỏi và cấp mã số ${newId}!`, 'success');
  };

  const handleDeleteClick = (qId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'XÁC NHẬN XÓA CÂU HỎI',
      message: `Bạn chắc chắn muốn xóa câu hỏi mã [${qId}] ra khỏi kho rèn luyện của hệ thống? Thao tác này không thể khôi phục!`,
      type: 'danger',
      onConfirm: () => {
        setQuestions(prev => prev.filter(q => q.id !== qId));
        setSelectedQuestionIds(prev => prev.filter(id => id !== qId));
        onToast(`Đã xóa câu hỏi [${qId}] ra khỏi kho thành công!`, 'info');
        setConfirmModal(null);
      }
    });
  };

  // Add Question Manually
  const handleCreateNewQuestion = () => {
    let firstChapterId = activeSubject.chapters[0]?.id || '';
    let firstLessonId = activeSubject.chapters[0]?.lessons[0]?.id || '';

    // If filtering by chapter/lesson, pre-fill them
    if (selectedLessonIds.length > 0) {
      firstLessonId = selectedLessonIds[0];
      const parentChapter = activeSubject.chapters.find(c => c.lessons.some(l => l.id === firstLessonId));
      firstChapterId = parentChapter?.id || '';
    } else if (selectedChapterIds.length > 0) {
      firstChapterId = selectedChapterIds[0];
      const ch = activeSubject.chapters.find(c => c.id === firstChapterId);
      firstLessonId = ch?.lessons[0]?.id || '';
    } else if (selectedTreeType === 'CHAPTER') {
      firstChapterId = selectedTreeId;
      const ch = activeSubject.chapters.find(c => c.id === selectedTreeId);
      firstLessonId = ch?.lessons[0]?.id || '';
    } else if (selectedTreeType === 'LESSON') {
      const parentChapter = activeSubject.chapters.find(c => c.lessons.some(l => l.id === selectedTreeId));
      firstChapterId = parentChapter?.id || '';
      firstLessonId = selectedTreeId;
    }

    setLocalEditingQuestion({
      id: `Q-GV-${Date.now()}`,
      subjectId: activeSubject.id,
      chapterId: firstChapterId,
      lessonId: firstLessonId,
      type: 'MCQ',
      level: 'Nhận biết',
      content: '',
      options: ['A. ', 'B. ', 'C. ', 'D. '],
      correctAnswer: 'A',
      explanation: '',
      source: 'Giáo viên',
      tags: ['Tự biên soạn']
    });
    setShowEditorModal(true);
  };

  // Save manual editing question
  const handleSaveEditedQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localEditingQuestion) return;

    // Validate
    if (!localEditingQuestion.content.trim()) {
      onToast('Nội dung câu hỏi không được trống!', 'error');
      return;
    }
    if (!localEditingQuestion.correctAnswer.trim()) {
      onToast('Bạn chưa điền đáp án đúng!', 'error');
      return;
    }

    setQuestions(prev => {
      const exists = prev.some(q => q.id === localEditingQuestion.id);
      if (exists) {
        return prev.map(q => q.id === localEditingQuestion.id ? localEditingQuestion : q);
      } else {
        return [localEditingQuestion, ...prev];
      }
    });

    onToast('Lưu câu hỏi thành công vào kho lưu trữ!', 'success');
    setShowEditorModal(false);
    setLocalEditingQuestion(null);
  };

  // Quick Test Generation from active filters
  const handleQuickTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredQuestions.length === 0) {
      onToast('Bộ lọc hiện tại không chứa câu hỏi nào để tạo đề!', 'error');
      return;
    }

    const availableQs = [...filteredQuestions];
    // Randomize
    const shuffled = availableQs.sort(() => 0.5 - Math.random());
    const selectedCount = Math.min(quickTestCount, shuffled.length);
    const testQs = shuffled.slice(0, selectedCount);

    // Resolve specific selected chapter and lesson for maximum test accuracy
    let testChapterId: string | undefined = undefined;
    let testLessonId: string | undefined = undefined;

    if (selectedLessonIds.length > 0) {
      testLessonId = selectedLessonIds[0];
      const parentChapter = activeSubject.chapters.find(c => c.lessons.some(l => l.id === testLessonId));
      testChapterId = parentChapter?.id;
    } else if (selectedChapterIds.length > 0) {
      testChapterId = selectedChapterIds[0];
      const ch = activeSubject.chapters.find(c => c.id === testChapterId);
      testLessonId = ch?.lessons[0]?.id;
    } else if (selectedTreeType === 'CHAPTER') {
      testChapterId = selectedTreeId;
      const ch = activeSubject.chapters.find(c => c.id === selectedTreeId);
      testLessonId = ch?.lessons[0]?.id;
    } else if (selectedTreeType === 'LESSON') {
      testLessonId = selectedTreeId;
      const parentChapter = activeSubject.chapters.find(c => c.lessons.some(l => l.id === selectedTreeId));
      testChapterId = parentChapter?.id;
    }

    const testId = `TEST-${Date.now()}`;
    const newTest: Test = {
      id: testId,
      title: quickTestTitle.trim() || `Đề tự luyện - ${activeSubject.name} (${selectedCount} Câu)`,
      subjectId: activeSubject.id,
      grade: activeSubject.grade,
      chapterId: testChapterId,
      lessonId: testLessonId,
      duration: quickTestDuration,
      purpose: 'Kiểm tra chủ đề / bài',
      questions: testQs,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      status: 'Nháp'
    };

    setTests(prev => [newTest, ...prev]);
    onToast(`Đã tạo Đề thi rèn luyện "${newTest.title}" thành công từ kho câu hỏi!`, 'success');
    setShowQuickTestModal(false);
    
    // Auto redirect to test bank
    setActiveTab('test-bank');
  };

  const renderSingleQuestionCard = (q: Question, globalIndex: number) => {
    const parentChapter = activeSubject.chapters.find(c => c.id === q.chapterId);
    const parentLesson = parentChapter?.lessons.find(l => l.id === q.lessonId);

    return (
      <div 
        key={q.id} 
        className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-2 relative hover:shadow-md hover:border-emerald-300 transition-all text-xs text-left"
      >
        {/* Badge Row & Actions */}
        <div className="flex flex-wrap gap-2 items-center justify-between text-[10px] font-bold text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
            {/* Selector checkbox */}
            <input
              type="checkbox"
              checked={selectedQuestionIds.includes(q.id)}
              onChange={() => {
                setSelectedQuestionIds(prev =>
                  prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                );
              }}
              className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer mr-1"
              title="Chọn câu hỏi rèn luyện này"
            />

            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold leading-none" title="Mã câu hỏi">
              #{globalIndex} | {q.id}
            </span>
            
            <span className={`px-2 py-0.5 rounded-md text-[9px] ${
              q.level === 'Nhận biết' ? 'bg-emerald-50 text-emerald-700' :
              q.level === 'Thông hiểu' ? 'bg-indigo-50 text-indigo-700' :
              q.level === 'Vận dụng' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700 font-extrabold'
            }`}>
              {q.level}
            </span>

            {/* Visual Color-coded Difficulty Rating Indicator */}
            {(() => {
               const diff = q.difficultyScore || 5;
               let bdClr = 'bg-slate-100 text-slate-705';
               if (diff <= 3) bdClr = 'bg-emerald-50 text-emerald-800 border border-emerald-100';
               else if (diff <= 6) bdClr = 'bg-amber-50 text-amber-800 border border-amber-100';
               else if (diff <= 8) bdClr = 'bg-rose-50 text-rose-805 border border-rose-100';
               else bdClr = 'bg-purple-50 text-purple-800 border border-purple-200';
               return (
                 <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${bdClr}`} title="Độ khó thang điểm 1-10">
                   Độ khó: {diff}/10
                 </span>
               );
            })()}

            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[9px]">
              {q.type}
            </span>

            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[9px] truncate max-w-[100px]" title={`Chương: ${parentChapter?.name || 'Mã ' + q.chapterId}`}>
              Chương: {parentChapter?.name || q.chapterId}
            </span>

            {parentLesson && (
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[9px] truncate max-w-[124px]" title={`Bài: ${parentLesson.name}`}>
                Bài: {parentLesson.name}
              </span>
            )}

            <span className="bg-slate-50 text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded-md text-[8px]">
              Nguồn: {q.source}
            </span>
          </div>

          {/* Editing and duplicating tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEditClick(q)}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
              title="Chỉnh sửa chi tiết câu hỏi"
            >
              <Edit className="w-3.5 h-3.5" /> Sửa
            </button>
            <button
              onClick={() => handleDuplicateClick(q)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
              title="Nhân bản / Tạo câu song song"
            >
              <Copy className="w-3.5 h-3.5" /> Nhân bản
            </button>
            <button
              onClick={() => handleDeleteClick(q.id)}
              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
              title="Xóa câu hỏi khỏi ngân hàng"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa
            </button>
          </div>
        </div>

        {/* Question Main Content */}
        <div className="text-xs md:text-sm font-bold text-slate-800 pt-1.5 leading-relaxed selection:bg-emerald-100 text-left">
          <MathRenderer text={q.content} />
        </div>

        {/* Options Grid (for MCQ) */}
        {q.options && q.options.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-3 py-1.5 text-xs text-slate-600 font-medium text-left font-sans">
            {q.options.map((o, oI) => {
              const optionPrefix = o.charAt(0).toUpperCase();
              const isCorrect = q.correctAnswer.trim().toUpperCase() === optionPrefix;
              return (
                <div 
                  key={oI} 
                  className={`p-2 rounded-xl transition-all flex items-start gap-1 text-left ${
                    isCorrect 
                      ? 'bg-emerald-50/70 border border-emerald-100 text-emerald-800 font-extrabold' 
                      : 'bg-slate-50 border border-slate-100'
                  }`}
                >
                  <div className={`p-0.5 rounded-full shrink-0 mr-1 flex items-center justify-center ${
                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 font-black text-[9px] w-4.5 h-4.5'
                  }`}>
                    {isCorrect ? <Check className="w-3 h-3" /> : optionPrefix}
                  </div>
                  <span className="leading-snug text-left"><MathRenderer text={o.replace(/^[A-H]\.\s*/, '')} /></span>
                </div>
              );
            })}
          </div>
        )}

        {/* Non-MCQ Correct Answer representation */}
        {q.type !== 'MCQ' && (
          <div className="pl-3 py-1 text-xs text-left">
            <span className="font-bold text-slate-500">Đáp án chính xác: </span>
            <span className="bg-emerald-50 text-emerald-800 font-black px-2.5 py-1 rounded-xl border border-emerald-100">
              {q.correctAnswer}
            </span>
          </div>
        )}

        {/* Explanation details collapsible dropdown */}
        {q.explanation && (
          <div className="text-[11px] bg-slate-50/70 border border-slate-200/50 rounded-xl p-3 text-slate-500 italic mt-1 leading-normal text-left">
            <span className="font-bold text-slate-700 not-italic block mb-1">Cách giải chi tiết:</span>
            <div className="not-italic text-slate-600 text-left">
              <MathRenderer text={q.explanation} />
            </div>
          </div>
        )}

        {/* GDPT 2018 Outcomes and Competencies Linkage Status indicators */}
        {((q.reqOutcomesGDPT2018 && q.reqOutcomesGDPT2018.length > 0) || (q.competenciesGDPT2018 && q.competenciesGDPT2018.length > 0)) && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[9.5px] text-left">
            {q.reqOutcomesGDPT2018 && q.reqOutcomesGDPT2018.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-extrabold text-emerald-805 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wide text-[8px] border border-emerald-100">
                  YCCĐ chuẩn mực:
                </span>
                {q.reqOutcomesGDPT2018.map((outcome, oI) => (
                  <span key={oI} className="text-slate-500 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-full italic">
                    {outcome}
                  </span>
                ))}
              </div>
            )}
            {q.competenciesGDPT2018 && q.competenciesGDPT2018.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-extrabold text-indigo-808 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wide text-[8px] border border-indigo-100">
                  Năng lực bổ trợ:
                </span>
                {q.competenciesGDPT2018.map((comp, cI) => (
                  <span key={cI} className="text-slate-600 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-full font-semibold">
                    {comp}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Download presets of CSV structure
  const downloadCSVSample = () => {
    const csvContent = "\uFEFF" + 
      "Nội_dung,Dạng_câu_hỏi,Mức_nhận_thức,Mã_Chương,Mã_Bài,Phương_án_A,Phương_án_B,Phương_án_C,Phương_án_D,Đáp_án_đúng,Giải_thích_chi_tiết\n" +
      "Tính giá trị của biểu thức vạn năng: $A = 2x^2 + 5x - 3$ tại $x = 2$,MCQ,Thông hiểu,CH01,LES01,Giá trị là 15,Giá trị là -1,Giá trị là 11,Giá trị là 5,A,Đây là phương pháp thay số trực tiếp $x = 2$ vào biểu thức $A$.\n" +
      "Ai Cập cổ đại nằm ở châu lục nào?,MCQ,Nhận biết,CH01,LES02,Châu Á,Châu Âu,Châu Phi,Châu Mỹ,C,Nằm ở đông bắc châu Phi dọc theo hạ lưu sông Nile.,\n" +
      "Thời tiết hôm nay có mưa lớn đúng không?,TRUE_FALSE,Thông hiểu,CH01,LES02,,,,,Đúng,Theo dõi số liệu radar thời tiết biểu diễn chính xác.\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bieu_mau_cau_hoi_${activeSubject.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Đã tải tệp bảng tính CSV mẫu thành công!', 'success');
  };

  // Download presets of TXT structure (Specimen-style format matching user image)
  const downloadTXTSample = () => {
    const txtContent = 
      "Chương: chuong-3\n" +
      "Bài: Tứ giác\n" +
      "Mức độ: Nhận biết\n" +
      "Dạng: MCQ\n" +
      "Câu: Trong tứ giác $ABCD$, các cạnh của tứ giác là:\n" +
      "A. $AB, BC, CD, DA$\n" +
      "B. $AB, AC, CD, BD$\n" +
      "C. $AC, BD, AB, CD$\n" +
      "D. $AD, BD, BC, AC$\n" +
      "Đáp án: A\n" +
      "Lời giải: Các cạnh của tứ giác $ABCD$ là các đoạn nối hai đỉnh liên tiếp: $AB, BC, CD, DA$.\n\n" +
      "Chương: chuong-3\n" +
      "Bài: Tứ giác\n" +
      "Mức độ: Vận dụng\n" +
      "Dạng: SHORT\n" +
      "Câu: Cho tứ giác $ABCD$ có $\\widehat A=85^\\circ, \\widehat B=75^\\circ, \\widehat C=110^\\circ$. Tính $\\widehat D$.\n" +
      "Đáp án: $90^\\circ$\n" +
      "Lời giải: $\\widehat D=360^\\circ-(85^\\circ+75^\\circ+110^\\circ)=90^\\circ$.\n\n" +
      "Chương: chuong-3\n" +
      "Chủ đề: Tứ giác\n" +
      "Mức độ: Nhận biết\n" +
      "Dạng: TF\n" +
      "Câu: Khẳng định sau đây về tứ giác $PQRS$ là Đúng hay Sai:\n" +
      "1/ Tứ giác $PQRS$ có các đỉnh là $P, Q, R, S$.\n" +
      "2/ Các cạnh của tứ giác $PQRS$ là $PQ, QR, RS, SP$.\n" +
      "3/ Hai đường chéo của tứ giác $PQRS$ là $PR$ và $QS$.\n" +
      "4/ $PQ$ và $RS$ là hai đường chéo.\n" +
      "Đáp án: Đúng,Đúng,Đúng,Sai\n" +
      "Lời giải: $PQ$ và $RS$ là hai cạnh đối diện, không phải hai đường chéo; hai đường chéo là $PR$ và $QS$.\n";

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bieu_mau_cau_hoi_${activeSubject.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Đã tải tệp văn bản TXT mẫu thành công!', 'success');
  };

  // Export Filtered Questions to CSV
  const handleExportCSV = () => {
    if (filteredQuestions.length === 0) {
      onToast('Không có câu hỏi nào để xuất tệp CSV!', 'error');
      return;
    }

    let csvContent = "\uFEFF" + "Mã_Số,Nội_dung,Dạng_câu_hỏi,Mức_nhận_thức,Mã_Chương,Mã_Bài,Phương_án_A,Phương_án_B,Phương_án_C,Phương_án_D,Đáp_án_đúng,Giải_thích_chi_tiết,Thẻ_Tags\n";
    
    filteredQuestions.forEach(q => {
      const aOpt = q.options?.[0]?.replace(/^[A-H]\.\s*/, '') || '';
      const bOpt = q.options?.[1]?.replace(/^[A-H]\.\s*/, '') || '';
      const cOpt = q.options?.[2]?.replace(/^[A-H]\.\s*/, '') || '';
      const dOpt = q.options?.[3]?.replace(/^[A-H]\.\s*/, '') || '';

      const escape = (val: string) => {
        const str = val ? val.replace(/"/g, '""') : '';
        return `"${str}"`;
      };

      csvContent += `${q.id},${escape(q.content)},${q.type},${q.level},${q.chapterId},${q.lessonId},${escape(aOpt)},${escape(bOpt)},${escape(cOpt)},${escape(dOpt)},${escape(q.correctAnswer)},${escape(q.explanation)},${escape(q.tags.join(';'))}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kho_cau_hoi_${activeSubject.id}_loc.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast(`Đã xuất ${filteredQuestions.length} câu hỏi ra tệp CSV thành công!`, 'success');
  };

  // Download presets of TXT structure for a complete exam (incorporating MCQs and Essay/TL)
  const downloadExamTemplate = () => {
    const txtContent = 
      "Chương: chuong-1\n" +
      "Bài: Ôn tập chương 1\n" +
      "Mức độ: Nhận biết\n" +
      "Dạng: MCQ\n" +
      "Câu: Cho phương trình bậc hai $ax^2 + bx + c = 0$ ($a \\ne 0$). Công thức tính biệt thức $\\Delta$ là:\n" +
      "A. $\\Delta = b^2 - 4ac$\n" +
      "B. $\\Delta = b^2 + 4ac$\n" +
      "C. $\\Delta = b - 4ac$\n" +
      "D. $\\Delta = b^2 - ac$\n" +
      "Đáp án: A\n" +
      "Lời giải: Biệt thức $\\Delta$ của phương trình bậc hai $ax^2 + bx + c = 0$ được tính theo công thức $\\Delta = b^2 - 4ac$.\n\n" +
      "Chương: chuong-1\n" +
      "Bài: Ôn tập chương 1\n" +
      "Mức độ: Thông hiểu\n" +
      "Dạng: TL\n" +
      "Câu: Cho parabol $(P): y = x^2$ và đường thẳng $(d): y = 2x + 3$. Hãy lập luận chứng minh $(d)$ luôn cắt $(P)$ tại hai điểm phân biệt.\n" +
      "Đáp án: Phương trình hoành độ giao điểm: $x^2 - 2x - 3 = 0$. Có $a \\cdot c = 1 \\cdot (-3) = -3 < 0$, suy ra phương trình luôn có hai nghiệm phân biệt trái dấu.\n" +
      "Lời giải: Từ phương trình hoành độ giao điểm $x^2 - 2x - 3 = 0$, ta thấy tích hệ số $a$ và $c$ âm, do đó phương trình luôn có 2 nghiệm phân biệt. Parabol luôn giao đường thẳng tại hai điểm có hoành độ trái dấu.\n\n" +
      "Chương: chuong-2\n" +
      "Bài: Hệ thức lượng trong tam giác\n" +
      "Mức độ: Vận dụng\n" +
      "Dạng: TL\n" +
      "Câu: Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $HB = 2\\text{cm}, HC = 8\\text{cm}$. Tính độ dài đường cao $AH$ và diện tích tam giác $ABC$.\n" +
      "Đáp án: $AH = 4\\text{cm}, S = 20\\text{cm}^2$\n" +
      "Lời giải: Áp dụng hệ thức lượng $AH^2 = HB \\cdot HC = 2 \\cdot 8 = 16 \\Rightarrow AH = 4\\text{cm}$. Cạnh huyền $BC = HB + HC = 10\\text{cm}$. Diện tích $S = \\frac{1}{2} BC \\cdot AH = \\frac{1}{2} \\cdot 10 \\cdot 4 = 20\\text{cm}^2$.\n";

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Mau_de_thi_tu_luan_va_trac_nghiem_${activeSubject.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Đã tải tệp bản mẫu cấu trúc đề thi thô thành công!', 'success');
  };

  const handleTestFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTestDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processTestImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleTestFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processTestImportFile(e.target.files[0]);
    }
  };

  const processTestImportFile = (file: File) => {
    setTestImportFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const blocks = text.split(/\n\s*\n/);
      const parsedData: any[] = [];

      const getActiveChapterAndLesson = () => {
        let activeChId = '';
        let activeLesId = '';
        if (activeSubject.chapters.length > 0) {
          activeChId = activeSubject.chapters[0].id;
          if (activeSubject.chapters[0].lessons.length > 0) {
            activeLesId = activeSubject.chapters[0].lessons[0].id;
          }
        }
        return { activeChId, activeLesId };
      };

      const { activeChId: fallbackChId, activeLesId: fallbackLesId } = getActiveChapterAndLesson();

      for (let b = 0; b < blocks.length; b++) {
        const blockText = blocks[b].trim();
        if (!blockText) continue;

        const lines = blockText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        if (lines.length === 0) continue;

        let currentQuestion: any = {
          id: `Q-TST-IMP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          subjectId: activeSubject.id,
          chapterId: fallbackChId,
          lessonId: fallbackLesId,
          type: 'MCQ',
          level: 'Nhận biết',
          content: '',
          options: [],
          correctAnswer: '',
          explanation: '',
          source: 'Tệp tải lên',
          tags: ['Tải đề lên']
        };

        let currentZone: 'content' | 'explanation' | 'correctAnswer' | 'none' = 'none';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          const chapterMatch = line.match(/^(?:Chương|Chuong|Chapter|Chung)\s*[:=]\s*(.*)$/i);
          const lessonMatch = line.match(/^(?:Chủ đề|Chu de|Lesson|Bài|Bai|Topic|Chude|Bải)\s*[:=]\s*(.*)$/i);
          const levelMatch = line.match(/^(?:Mức độ|Muc do|Mức nhận thức|Level|Muc)\s*[:=]\s*(.*)$/i);
          const typeMatch = line.match(/^(?:Dạng|Dang|Type|Loại|Loai)\s*[:=]\s*(.*)$/i);
          const answerMatch = line.match(/^(?:Đáp án|Dap an|Answer|Key|Đáp số|Dapso|Dapan)\s*[:=]\s*(.*)$/i);
          const explanationMatch = line.match(/^(?:Lời giải|Loi giai|Giải thích|Giai thich|Explanation|Huongdan|Hướng dẫn)\s*[:=]\s*(.*)$/i);
          const optionMatch = line.match(/^([A-H])(?:[\.\)\/])\s*(.*)$/i);
          const questionMatch = line.match(/^(?:Câu|Cau|Question|Q)\s*\d*[:\.\/]?\s*(.*)$/i);

          if (chapterMatch) {
            currentQuestion.rawChapter = chapterMatch[1].trim();
          } else if (lessonMatch) {
            currentQuestion.rawLesson = lessonMatch[1].trim();
          } else if (levelMatch) {
            const rawLvl = levelMatch[1].trim().toLowerCase();
            if (rawLvl.includes('cao') || rawLvl.includes('vận dụng cao') || rawLvl.includes('high')) {
              currentQuestion.level = 'Vận dụng cao';
            } else if (rawLvl.includes('vận dụng') || rawLvl.includes('apply')) {
              currentQuestion.level = 'Vận dụng';
            } else if (rawLvl.includes('hiểu') || rawLvl.includes('thông hiểu') || rawLvl.includes('understand')) {
              currentQuestion.level = 'Thông hiểu';
            } else {
              currentQuestion.level = 'Nhận biết';
            }
          } else if (typeMatch) {
            const rawType = typeMatch[1].trim().toUpperCase();
            if (rawType.includes('SHORT_ANSWER') || rawType.includes('SHORT') || rawType.includes('SHORT_ANSWER_SHORT') || rawType.includes('TỰ LUẬN NGẮN')) {
              currentQuestion.type = 'SHORT_ANSWER';
            } else if (rawType.includes('TRUE_FALSE') || rawType.includes('ĐÚNG_SAI') || rawType.includes('ĐÚNG / SAI') || rawType.includes('ĐÚNG/SAI') || rawType.includes('TF')) {
              currentQuestion.type = 'TRUE_FALSE';
            } else if (rawType.includes('MATCHING') || rawType.includes('NỐI') || rawType.includes('NỐI CẶP')) {
              currentQuestion.type = 'MATCHING';
            } else if (rawType.includes('ESSAY') || rawType.includes('SHORT_ESSAY') || rawType.includes('TỰ LUẬN DÀI') || rawType.includes('TỰ LUẬN') || rawType.includes('TL')) {
              currentQuestion.type = 'SHORT_ESSAY';
            } else if (rawType.includes('FILL') || rawType.includes('BLANK')) {
              currentQuestion.type = 'FILL_BLANK';
            } else {
              currentQuestion.type = 'MCQ';
            }
          } else if (answerMatch) {
            const ansVal = answerMatch[1].trim();
            if (ansVal.includes(',') && (ansVal.toLowerCase().includes('đúng') || ansVal.toLowerCase().includes('sai') || ansVal.toUpperCase().includes('T') || ansVal.toUpperCase().includes('F'))) {
              currentQuestion.type = 'TRUE_FALSE';
            }
            currentQuestion.correctAnswer = ansVal;
            currentZone = 'correctAnswer';
          } else if (explanationMatch) {
            currentQuestion.explanation = explanationMatch[1].trim();
            currentZone = 'explanation';
          } else if (optionMatch) {
            const letter = optionMatch[1].toUpperCase();
            const optVal = optionMatch[2].trim();
            currentQuestion.options.push(`${letter}. ${optVal}`);
            currentZone = 'none';
          } else if (questionMatch) {
            currentQuestion.content = questionMatch[1].trim();
            currentZone = 'content';
          } else {
            if (currentZone === 'content') {
              currentQuestion.content += (currentQuestion.content ? '\n' : '') + line;
            } else if (currentZone === 'explanation') {
              currentQuestion.explanation += (currentQuestion.explanation ? '\n' : '') + line;
            } else if (currentZone === 'correctAnswer') {
              currentQuestion.correctAnswer += (currentQuestion.correctAnswer ? ' ' : '') + line;
            } else if (currentQuestion.options.length > 0) {
              const idx = currentQuestion.options.length - 1;
              currentQuestion.options[idx] += ' ' + line;
            } else {
              currentQuestion.content += (currentQuestion.content ? '\n' : '') + line;
              currentZone = 'content';
            }
          }
        }

        if (currentQuestion.content) {
          const hasNoOptions = !currentQuestion.options || currentQuestion.options.length === 0;
          const isTfAnswer = currentQuestion.correctAnswer === 'Đúng' || currentQuestion.correctAnswer === 'Sai' || currentQuestion.correctAnswer === 'True' || currentQuestion.correctAnswer === 'False';
          if ((currentQuestion.correctAnswer.includes(',') || isTfAnswer || hasNoOptions) && currentQuestion.type === 'MCQ') {
            currentQuestion.type = 'TRUE_FALSE';
          }
          parsedData.push(currentQuestion);
        }
      }

      // Resolve Chapters and Lessons
      const normalizeStr = (str: string) => {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      };
      const getIndex = (str: string): number | null => {
        const arabicMatch = str.match(/\d+/);
        if (arabicMatch) return parseInt(arabicMatch[0], 10);
        return null;
      };

      parsedData.forEach(q => {
        let matchedChapter: any = null;
        if (q.rawChapter) {
          const normInputCh = normalizeStr(q.rawChapter);
          matchedChapter = activeSubject.chapters.find(c => {
            const normId = normalizeStr(c.id);
            const normName = normalizeStr(c.name);
            return normInputCh === normId || normInputCh === normName || normName.includes(normInputCh) || normInputCh.includes(normName);
          });
          if (!matchedChapter) {
            const rawIdx = getIndex(q.rawChapter);
            if (rawIdx !== null) {
              matchedChapter = activeSubject.chapters.find(c => {
                const isUserGen = c.id.includes('CH-') || c.id.length > 15;
                const cIdx = getIndex(c.name) !== null ? getIndex(c.name) : (isUserGen ? null : getIndex(c.id));
                return cIdx === rawIdx;
              });
            }
          }
        }
        if (!matchedChapter) {
          matchedChapter = activeSubject.chapters.find(c => c.id === fallbackChId) || activeSubject.chapters[0];
        }

        if (matchedChapter) {
          q.chapterId = matchedChapter.id;
          let matchedLesson: any = null;
          if (q.rawLesson) {
            const normInputLes = normalizeStr(q.rawLesson);
            matchedLesson = matchedChapter.lessons.find(l => {
              const normId = normalizeStr(l.id);
              const normName = normalizeStr(l.name);
              return normInputLes === normId || normInputLes === normName || normName.includes(normInputLes) || normInputLes.includes(normName);
            });
            if (!matchedLesson) {
              const rawIdx = getIndex(q.rawLesson);
              if (rawIdx !== null) {
                matchedLesson = matchedChapter.lessons.find(l => {
                  const isUserGen = l.id.includes('LES-') || l.id.length > 15;
                  const lIdx = getIndex(l.name) !== null ? getIndex(l.name) : (isUserGen ? null : getIndex(l.id));
                  return lIdx === rawIdx;
                });
              }
            }
          }
          if (!matchedLesson) {
            matchedLesson = matchedChapter.lessons.find(l => l.id === fallbackLesId) || matchedChapter.lessons[0] || null;
          }
          if (matchedLesson) {
            q.lessonId = matchedLesson.id;
          }
        }
      });

      setParsedTestQuestions(parsedData);
      setImportTestTitle(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      onToast(`Nạp thành công ${parsedData.length} câu hỏi tự luận & trắc nghiệm! Hãy thiết lập tiêu đề & lượng thời gian bên dưới.`, 'success');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmTestImport = () => {
    if (parsedTestQuestions.length === 0) {
      onToast('Chưa có câu hỏi nào được nạp!', 'error');
      return;
    }

    const newTest: Test = {
      id: `TEST-IMP-${Date.now()}`,
      title: importTestTitle || `Đề thi tải lên - ${activeSubject.name}`,
      subjectId: activeSubject.id,
      grade: activeSubject.grade,
      duration: importTestDuration || 45,
      purpose: importTestPurpose || 'Kiểm tra định kỳ',
      questions: parsedTestQuestions,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Nháp',
    };

    // Add unique questions to general questions pool
    setQuestions(prev => {
      const existingContents = new Set(prev.map(q => q.content.trim()));
      const uniqueNewQs = parsedTestQuestions.filter(q => !existingContents.has(q.content.trim()));
      return [...uniqueNewQs, ...prev];
    });

    // Save test in global Tests list
    setTests(prev => [newTest, ...prev]);

    onToast(`Đã tải đề lên thành công! Sinh đề "${newTest.title}" gồm ${newTest.questions.length} câu vào Kho đề kiểm tra, đồng thời bổ trợ kho học liệu câu hỏi.`, 'success');
    
    // Reset and close
    setShowTestImportModal(false);
    setParsedTestQuestions([]);
    setTestImportFile(null);
    setActiveTab('test-bank'); // Redirect to Test Bank so user sees the newly compiled test instantly!
  };

  // Export Selected or Filtered Questions to high-quality Microsoft Word format
  const handleExportWordDocx = (inclAnswers: boolean) => {
    const listToExport = selectedQuestionIds.length > 0 
      ? questions.filter(q => selectedQuestionIds.includes(q.id)) 
      : filteredQuestions;

    if (listToExport.length === 0) {
      onToast('Không có câu hỏi nào được chọn hoặc tìm thấy để xuất Word!', 'error');
      return;
    }

    // Modern HTML format designed specifically for Word
    let mhtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>HỒ SƠ ĐỀ KIỂM TRA PHỔ THÔNG GDPT 2018</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:ZOOM>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 210mm 297mm; /* Standard A4 */
            margin: 20mm 20mm 20mm 20mm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.45;
            color: #0f172a;
          }
          .sh-header-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-bottom: 25px;
          }
          .sh-header-table td {
            border: none;
            padding: 2px;
            vertical-align: top;
          }
          .school-title {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
          }
          .exam-title-box {
            text-align: center;
            margin-top: 15px;
            margin-bottom: 25px;
          }
          .exam-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
          }
          .exam-subtitle {
            font-size: 11pt;
            font-style: italic;
          }
          .student-info-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-bottom: 20px;
          }
          .student-info-table td {
            border: none;
            font-weight: bold;
            font-size: 11pt;
            padding: 4px;
          }
          .question-block {
            margin-bottom: 18px;
            page-break-inside: avoid;
          }
          .question-header {
            font-weight: bold;
            font-size: 11pt;
          }
          .options-container {
            width: 100%;
            margin-top: 6px;
            margin-left: 20px;
            margin-bottom: 10px;
          }
          .options-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
          }
          .options-table td {
            border: none;
            padding: 4px;
            font-size: 11pt;
          }
          .outcome-badge {
            font-size: 8.5pt;
            color: #475569;
            background-color: #f1f5f9;
            padding: 3px 6px;
            border-radius: 4px;
            margin-top: 4px;
            display: inline-block;
            font-style: italic;
          }
          .divider {
            border-bottom: 1px dotted #ccc;
            margin: 15px 0;
          }
          .appendix-title {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            margin-top: 40px;
            margin-bottom: 20px;
            page-break-before: always;
          }
          .solutions-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .solutions-table th, .solutions-table td {
            border: 1px solid #94a3b8;
            padding: 8px;
            font-size: 10pt;
          }
          .solutions-table th {
            background-color: #f1f5f9;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <!-- DOUBLE HEADER PANEL -->
        <table class="sh-header-table">
          <tr>
            <td style="width: 45%; text-align: center;">
              <span class="school-title">SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI</span><br>
              <span class="school-title" style="border-bottom: 1px solid #000; padding-bottom: 3px;">TRƯỜNG THCS ARCHIMEDES ACADEMY</span>
            </td>
            <td style="width: 10%;">&nbsp;</td>
            <td style="width: 45%; text-align: center;">
              <span style="font-size: 10pt; font-weight: bold; text-transform: uppercase;">MÃ ĐỀ THI ÔN TẬP: Q-BANK-${activeSubject.id}</span><br>
              <span style="font-size: 10pt; font-weight: normal;">Chương trình Giáo dục Phổ thông 2018</span>
            </td>
          </tr>
        </table>

        <!-- EXAM HEADER TITLE -->
        <div class="exam-title-box">
          <span class="exam-title">ĐỀ CƯƠNG RÈN LUYỆN KIẾN THỨC TOÀN DIỆN MÔN ${activeSubject.name.toUpperCase()}</span><br>
          <span class="exam-subtitle">Nội dung biên soạn phục vụ in ấn - Đánh giá năng lực độc lập</span><br>
          <span style="font-size: 9.5pt;">(Thời gian giải bài: 45 phút | Tổng hợp: ${listToExport.length} câu học liệu)</span>
        </div>

        <!-- STUDENT REGISTRATION FORM BLANK -->
        <table class="student-info-table">
          <tr>
            <td style="width: 60%; border-bottom: 1px dotted #475569;">Họ và tên học sinh: ............................................................................</td>
            <td style="width: 5%;">&nbsp;</td>
            <td style="width: 35%; border-bottom: 1px dotted #475569;">Lớp: ..................................</td>
          </tr>
        </table>

        <div style="margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 5px;">
          <h4 style="margin: 0; font-size: 11pt; text-transform: uppercase;">PHẦN I: THỰC HÀNH GIẢI ĐỀ CÂU HỎI VÀ ĐÁP ÁN</h4>
        </div>

        <!-- EXPORT CONTENT -->
        ${listToExport.map((q, qIdx) => {
          let questionHtml = `
            <div class="question-block">
              <span class="question-header">Câu ${qIdx + 1}:</span> ${q.content}
          `;

          // Handle MCQ Options
          if (q.type === 'MCQ' && q.options && q.options.length > 0) {
            questionHtml += `
              <div class="options-container">
                <table class="options-table">
                  <tr>
                    <td style="width: 50%;">${q.options[0]}</td>
                    <td style="width: 50%;">${q.options[1]}</td>
                  </tr>
                  <tr>
                    <td style="width: 50%;">${q.options[2]}</td>
                    <td style="width: 50%;">${q.options[3]}</td>
                  </tr>
                </table>
              </div>
            `;
          }

          // Handle MATCHING format
          if (q.type === 'MATCHING' && q.options && q.matchingRight) {
            const leftList = q.options.map((opt, oI) => `${oI}) ${opt}`).join(' &nbsp;&bull;&nbsp; ');
            const rightList = q.matchingRight.map((mr, mrI) => `${mrI}) ${mr}`).join(' &nbsp;&bull;&nbsp; ');
            questionHtml += `
              <div style="margin: 6px 0 10px 20px; font-size:10pt; color:#475569;">
                <p style="margin:2px 0;"><strong>Vế nối trái:</strong> ${leftList}</p>
                <p style="margin:2px 0;"><strong>Vế nối phải:</strong> ${rightList}</p>
              </div>
            `;
          }

          // Standards indicators footer (GDPT 2018)
          const outcomesFull = q.reqOutcomesGDPT2018 && q.reqOutcomesGDPT2018.length > 0 
            ? q.reqOutcomesGDPT2018.join(', ') 
            : (q.learningOutcome || 'Chuẩn nội dung bài học');
          const compsFull = q.competenciesGDPT2018 && q.competenciesGDPT2018.length > 0
            ? q.competenciesGDPT2018.join(', ')
            : 'Phát triển năng lực tư học có định hướng';
          const difText = q.difficultyScore 
            ? `Thang độ khó: ${q.difficultyScore}/10 (${q.level})` 
            : `Độ khó: 5/10 (${q.level})`;

          questionHtml += `
            <div class="outcome-badge">
              * Liên kết: YCCĐ Đạt: ${outcomesFull} | Năng lực rèn luyện: ${compsFull} | ${difText}
            </div>
            <div class="divider"></div>
          </div>
          `;
          return questionHtml;
        }).join('')}

        <!-- APPPENDIX SECTION IF REQUESTED -->
        ${inclAnswers ? `
          <div class="appendix-title">PHẦN II: KHÓA ĐÁP ÁN & LẬP LUẬN GIẢI CHI TIẾT</div>
          <table class="solutions-table">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">Mã câu</th>
                <th style="width: 20%;">Đáp số đúng</th>
                <th style="width: 70%;">Phân tích diễn giải chi tiết & Sư phạm</th>
              </tr>
            </thead>
            <tbody>
              ${listToExport.map((q, qIndex) => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">Câu ${qIndex + 1}</td>
                  <td style="font-weight: bold; text-align: center; color: #0284c7;">
                    ${q.correctAnswer} (${q.type})
                  </td>
                  <td>
                    ${q.explanation || 'Áp dụng lý thuyết cơ bản và các bước biến đổi suy luận logic để tìm kiếm đáp án.'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <table style="width: 100%; border:none; margin-top: 50px;">
          <tr>
            <td style="border:none; text-align: center; font-style: italic; font-size: 10pt; color: #64748b;">
              Archimedes Educational System &bull; Trọn vẹn phát triển tri thức học tập &bull; Bản in tự động xuất từ QuickQuiz
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Package as Word file
    const blob = new Blob(['\ufeff' + mhtml], { type: 'application/msword;charset=utf-8' });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `De_cuong_${activeSubject.name.replace(/\s+/g, '_')}_Lớp_${activeSubject.grade}_GDPT2018${inclAnswers ? '_kem_dap_an' : ''}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Xuất tệp Word (.docx) gọn đẹp thành công! Bạn có thể sử dụng Microsoft Word hoặc LibreOffice để biên tập trực tiếp!', 'success');
  };

  // Custom File Import handler
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImportFile(e.target.files[0]);
    }
  };

  const processImportFile = (file: File) => {
    const isTxt = file.name.endsWith('.txt');
    const isCsv = file.name.endsWith('.csv');
    if (!isTxt && !isCsv) {
      onToast('Vui lòng chỉ tải lên tài liệu định dạng tệp .csv hoặc .txt!', 'error');
      return;
    }
    setCsvFile(file); // Keep state named csvFile for simpler downstream code integration
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (isTxt) {
        parseTXTText(text);
      } else {
        parseCSVText(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Plain Text (TXT) Question Parser (Specimen-style matching user screenshot)
  const parseTXTText = (text: string) => {
    const blocks = text.split(/\n\s*\n/);
    const parsedData: any[] = [];

    const getActiveChapterAndLesson = () => {
      let activeChId = '';
      let activeLesId = '';

      if (selectedLessonIds.length > 0) {
        activeLesId = selectedLessonIds[0];
        const parentCh = activeSubject.chapters.find(c => c.lessons.some(l => l.id === activeLesId));
        activeChId = parentCh?.id || '';
      } else if (selectedChapterIds.length > 0) {
        activeChId = selectedChapterIds[0];
        const ch = activeSubject.chapters.find(c => c.id === activeChId);
        if (ch && ch.lessons.length > 0) {
          activeLesId = ch.lessons[0].id;
        }
      } else if (selectedTreeType === 'CHAPTER') {
        activeChId = selectedTreeId;
        const ch = activeSubject.chapters.find(c => c.id === selectedTreeId);
        if (ch && ch.lessons.length > 0) {
          activeLesId = ch.lessons[0].id;
        }
      } else if (selectedTreeType === 'LESSON') {
        activeLesId = selectedTreeId;
        const ch = activeSubject.chapters.find(c => c.lessons.some(l => l.id === selectedTreeId));
        if (ch) {
          activeChId = ch.id;
        }
      }

      if (!activeChId && activeSubject.chapters.length > 0) {
        activeChId = activeSubject.chapters[0].id;
      }
      if (!activeLesId && activeChId) {
        const ch = activeSubject.chapters.find(c => c.id === activeChId);
        if (ch && ch.lessons.length > 0) {
          activeLesId = ch.lessons[0].id;
        }
      }

      return { activeChId, activeLesId };
    };

    const { activeChId: fallbackChId, activeLesId: fallbackLesId } = getActiveChapterAndLesson();

    for (let b = 0; b < blocks.length; b++) {
      const blockText = blocks[b].trim();
      if (!blockText) continue;

      const lines = blockText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      if (lines.length === 0) continue;

      let currentQuestion: any = {
        id: `Q-IMP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        subjectId: activeSubject.id,
        chapterId: fallbackChId,
        lessonId: fallbackLesId,
        type: 'MCQ',
        level: 'Nhận biết',
        content: '',
        options: [],
        correctAnswer: '',
        explanation: '',
        source: 'Tệp tải lên',
        tags: ['Nhập từ TXT']
      };

      let currentZone: 'content' | 'explanation' | 'correctAnswer' | 'none' = 'none';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Metadata checks using regexes
        const chapterMatch = line.match(/^(?:Chương|Chuong|Chapter|Chung)\s*[:=]\s*(.*)$/i);
        const lessonMatch = line.match(/^(?:Chủ đề|Chu de|Lesson|Bài|Bai|Topic|Chude|Bải)\s*[:=]\s*(.*)$/i);
        const levelMatch = line.match(/^(?:Mức độ|Muc do|Mức nhận thức|Level|Muc)\s*[:=]\s*(.*)$/i);
        const typeMatch = line.match(/^(?:Dạng|Dang|Type|Loại|Loai)\s*[:=]\s*(.*)$/i);
        const answerMatch = line.match(/^(?:Đáp án|Dap an|Answer|Key|Đáp số|Dapso|Dapan)\s*[:=]\s*(.*)$/i);
        const explanationMatch = line.match(/^(?:Lời giải|Loi giai|Giải thích|Giai thich|Explanation|Huongdan|Hướng dẫn)\s*[:=]\s*(.*)$/i);
        
        // Starts with MCQ option (e.g., A. B. C.)
        const optionMatch = line.match(/^([A-H])(?:[\.\)\/])\s*(.*)$/i);

        // Starts with "Câu: " or "Câu 1: " or "Question: "
        const questionMatch = line.match(/^(?:Câu|Cau|Question|Q)\s*\d*[:\.\/]?\s*(.*)$/i);

        if (chapterMatch) {
          currentQuestion.rawChapter = chapterMatch[1].trim();
        } else if (lessonMatch) {
          currentQuestion.rawLesson = lessonMatch[1].trim();
        } else if (levelMatch) {
          const rawLvl = levelMatch[1].trim().toLowerCase();
          if (rawLvl.includes('cao') || rawLvl.includes('vận dụng cao') || rawLvl.includes('high')) {
            currentQuestion.level = 'Vận dụng cao';
          } else if (rawLvl.includes('vận dụng') || rawLvl.includes('apply')) {
            currentQuestion.level = 'Vận dụng';
          } else if (rawLvl.includes('hiểu') || rawLvl.includes('thông hiểu') || rawLvl.includes('understand')) {
            currentQuestion.level = 'Thông hiểu';
          } else {
            currentQuestion.level = 'Nhận biết';
          }
        } else if (typeMatch) {
          const rawType = typeMatch[1].trim().toUpperCase();
          if (rawType.includes('SHORT_ANSWER') || rawType.includes('SHORT') || rawType.includes('SHORT_ANSWER_SHORT') || rawType.includes('TỰ LUẬN NGẮN') || rawType.includes('TL')) {
            currentQuestion.type = 'SHORT_ANSWER';
          } else if (rawType.includes('TRUE_FALSE') || rawType.includes('ĐÚNG_SAI') || rawType.includes('ĐÚNG / SAI') || rawType.includes('ĐÚNG/SAI') || rawType.includes('TF')) {
            currentQuestion.type = 'TRUE_FALSE';
          } else if (rawType.includes('MATCHING') || rawType.includes('NỐI') || rawType.includes('NỐI CẶP')) {
            currentQuestion.type = 'MATCHING';
          } else if (rawType.includes('ESSAY') || rawType.includes('SHORT_ESSAY') || rawType.includes('TỰ LUẬN DÀI')) {
            currentQuestion.type = 'SHORT_ESSAY';
          } else if (rawType.includes('FILL') || rawType.includes('BLANK')) {
            currentQuestion.type = 'FILL_BLANK';
          } else {
            currentQuestion.type = 'MCQ';
          }
        } else if (answerMatch) {
          const ansVal = answerMatch[1].trim();
          if (ansVal.includes(',') && (ansVal.toLowerCase().includes('đúng') || ansVal.toLowerCase().includes('sai') || ansVal.toUpperCase().includes('T') || ansVal.toUpperCase().includes('F'))) {
            currentQuestion.type = 'TRUE_FALSE';
          }
          currentQuestion.correctAnswer = ansVal;
          currentZone = 'correctAnswer';
        } else if (explanationMatch) {
          currentQuestion.explanation = explanationMatch[1].trim();
          currentZone = 'explanation';
        } else if (optionMatch) {
          const letter = optionMatch[1].toUpperCase();
          const optVal = optionMatch[2].trim();
          currentQuestion.options.push(`${letter}. ${optVal}`);
          currentZone = 'none';
        } else if (questionMatch) {
          currentQuestion.content = questionMatch[1].trim();
          currentZone = 'content';
        } else {
          // If we are continuing content, explanation or answer
          if (currentZone === 'content') {
            currentQuestion.content += (currentQuestion.content ? '\n' : '') + line;
          } else if (currentZone === 'explanation') {
            currentQuestion.explanation += (currentQuestion.explanation ? '\n' : '') + line;
          } else if (currentZone === 'correctAnswer') {
            currentQuestion.correctAnswer += (currentQuestion.correctAnswer ? ' ' : '') + line;
          } else if (currentQuestion.options.length > 0) {
            // Append continuation to the last option
            const idx = currentQuestion.options.length - 1;
            currentQuestion.options[idx] += ' ' + line;
          } else {
            // Fallback: append to content
            currentQuestion.content += (currentQuestion.content ? '\n' : '') + line;
            currentZone = 'content';
          }
        }
      }

      if (currentQuestion.content) {
        // Sanity-check: if a question was parsed as TRUE_FALSE from answers but type was default MCQ
        const hasNoOptions = !currentQuestion.options || currentQuestion.options.length === 0;
        const isTfAnswer = currentQuestion.correctAnswer === 'Đúng' || currentQuestion.correctAnswer === 'Sai' || currentQuestion.correctAnswer === 'True' || currentQuestion.correctAnswer === 'False';
        if ((currentQuestion.correctAnswer.includes(',') || isTfAnswer || hasNoOptions) && currentQuestion.type === 'MCQ') {
          currentQuestion.type = 'TRUE_FALSE';
        }
        parsedData.forEach(p => {
          if (p.id === currentQuestion.id) {
            currentQuestion.id = `Q-IMP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          }
        });
        parsedData.push(currentQuestion);
      }
    }

    // Match raw values with actual curriculum Chapters and Lessons from activeSubject
    const normalizeStr = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
    };

    // Index extraction supporting both Arabic and Roman numerals
    const getIndex = (str: string): number | null => {
      const arabicMatch = str.match(/\d+/);
      if (arabicMatch) return parseInt(arabicMatch[0], 10);
      
      const parts = str.toLowerCase().split(/[^a-z]+/);
      const romanMap: { [key: string]: number } = {
         i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
         xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20
      };
      for (const part of parts) {
        if (romanMap[part]) {
          return romanMap[part];
        }
      }
      return null;
    };

    parsedData.forEach(q => {
      // Find chapter
      let matchedChapter: any = null;
      if (q.rawChapter) {
        const normInputCh = normalizeStr(q.rawChapter);
        
        // Match 1: Exact / substring of name or ID normalizations
        matchedChapter = activeSubject.chapters.find(c => {
          const normId = normalizeStr(c.id);
          const normName = normalizeStr(c.name);
          return normInputCh === normId || normInputCh === normName || normName.includes(normInputCh) || normInputCh.includes(normName);
        });

        // Match 2: Index-based match (e.g. Chapter I -> 1 -> T6-C1)
        if (!matchedChapter) {
          const rawIdx = getIndex(q.rawChapter);
          if (rawIdx !== null) {
            matchedChapter = activeSubject.chapters.find(c => {
              // Prioritize c.name as it contains human-readable numbering (e.g. "Chương I" or "Chương 3").
              // Skip c.id if it is a user-generated ID containing a timestamp.
              const isUserGen = c.id.includes('CH-') || c.id.length > 15;
              const cIdx = getIndex(c.name) !== null ? getIndex(c.name) : (isUserGen ? null : getIndex(c.id));
              return cIdx === rawIdx;
            });
          }
        }
      }

      // Fallback if not matched
      if (!matchedChapter) {
        matchedChapter = activeSubject.chapters.find(c => c.id === fallbackChId) || activeSubject.chapters[0];
      }

      if (matchedChapter) {
        q.chapterId = matchedChapter.id;

        // Find lesson
        let matchedLesson: any = null;
        if (q.rawLesson) {
          const normInputLes = normalizeStr(q.rawLesson);

          // Match 1: Exact / substring of name or ID normalizations
          matchedLesson = matchedChapter.lessons.find(l => {
            const normId = normalizeStr(l.id);
            const normName = normalizeStr(l.name);
            return normInputLes === normId || normInputLes === normName || normName.includes(normInputLes) || normInputLes.includes(normName);
          });

          // Match 2: Index-based match
          if (!matchedLesson) {
            const rawIdx = getIndex(q.rawLesson);
            if (rawIdx !== null) {
              matchedLesson = matchedChapter.lessons.find(l => {
                // Prioritize l.name as it contains human-readable numbering (e.g. "Bài 1" or "Bài 10").
                // Skip l.id if it is a user-generated ID containing a timestamp.
                const isUserGen = l.id.includes('LES-') || l.id.length > 15;
                const lIdx = getIndex(l.name) !== null ? getIndex(l.name) : (isUserGen ? null : getIndex(l.id));
                return lIdx === rawIdx;
              });
            }
          }
        }

        // If lesson not matched, check if active fallback lesson belongs to this chapter, else use first lesson
        if (!matchedLesson) {
          const activeLesInCh = matchedChapter.lessons.find(l => l.id === fallbackLesId);
          matchedLesson = activeLesInCh || matchedChapter.lessons[0] || null;
        }

        if (matchedLesson) {
          q.lessonId = matchedLesson.id;
        }
      }
    });

    const approvedParsedData = parsedData.filter(q => q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK' || q.type === 'SHORT_ESSAY');
    setParsedImportQuestions(approvedParsedData);
    onToast(`Đã sơ thảo ${approvedParsedData.length} câu hỏi tự động từ tệp TXT! Vui lòng xem trước dữ liệu bên dưới trước khi đồng ý nhập.`, 'success');
  };

  // Helper parser for quoted CSV
  const parseCSVText = (text: string) => {
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    // Correctly split characters ignoring linebreaks inside quoted cells
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentLine += '"'; // escaped double-quote
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === '\n' && !inQuotes) {
        lines.push(currentLine);
        currentLine = '';
      } else if (char === '\r' && !inQuotes) {
        // Carriage return skip
      } else {
        currentLine += char;
      }
    }
    if (currentLine) lines.push(currentLine);

    if (lines.length < 2) {
      onToast('Tệp rỗng hoặc không đúng định dạng chuẩn rèn luyện!', 'error');
      return;
    }

    // Split headers on comma or semicolon
    const headerLine = lines[0];
    const separator = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

    const parsedData: Partial<Question>[] = [];

    // Parse data rows
    for (let r = 1; r < lines.length; r++) {
      const rowText = lines[r];
      if (!rowText.trim()) continue;

      const cells: string[] = [];
      let cell = '';
      let cellInQuotes = false;

      for (let i = 0; i < rowText.length; i++) {
        const char = rowText[i];
        if (char === '"') {
          cellInQuotes = !cellInQuotes;
        } else if (char === separator && !cellInQuotes) {
          cells.push(cell.trim());
          cell = '';
        } else {
          cell += char;
        }
      }
      cells.push(cell.trim());

      // Create mapping object
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cells[idx]?.replace(/^"|"$/g, '') || '';
      });

      // Map spreadsheet key headers to applet models
      const content = obj['Nội_dung'] || obj['Noi_dung'] || obj['Content'] || '';
      const type = (obj['Dạng_câu_hỏi'] || obj['Dang_cau_hoi'] || obj['Type'] || 'MCQ') as QuestionType;
      const level = (obj['Mức_nhận_thức'] || obj['Muc_nhan_thuc'] || obj['Level'] || 'Nhận biết') as CognitiveLevel;
      const chId = obj['Mã_Chương'] || obj['Ma_Chuong'] || obj['ChapterId'] || activeSubject.chapters[0]?.id || '';
      const lesId = obj['Mã_Bài'] || obj['Ma_Bai'] || obj['LessonId'] || activeSubject.chapters[0]?.lessons[0]?.id || '';
      
      const optA = obj['Phương_án_A'] || obj['Phuong_an_A'] || obj['OptionA'] || '';
      const optB = obj['Phương_án_B'] || obj['Phuong_an_B'] || obj['OptionB'] || '';
      const optC = obj['Phương_án_C'] || obj['Phuong_an_C'] || obj['OptionC'] || '';
      const optD = obj['Phương_án_D'] || obj['Phuong_an_D'] || obj['OptionD'] || '';

      const answer = obj['Đáp_án_đúng'] || obj['Dap_an_dung'] || obj['CorrectAnswer'] || '';
      const explanation = obj['Giải_thích_chi_tiết'] || obj['Giai_thich_chi_tiet'] || obj['Explanation'] || '';
      const tagsString = obj['Thẻ_Tags'] || obj['Thẻ'] || obj['Tags'] || '';

      if (!content) continue; // Skip empty rows

      const options = optA || optB || optC || optD ? [
        optA ? `A. ${optA}` : '',
        optB ? `B. ${optB}` : '',
        optC ? `C. ${optC}` : '',
        optD ? `D. ${optD}` : '',
      ].filter(x => x !== '') : undefined;

      let finalType = type;
      if (type === 'MCQ') {
        const hasNoOptions = !options || options.length === 0;
        const isTfAnswer = answer === 'Đúng' || answer === 'Sai' || answer === 'True' || answer === 'False' || answer.includes(',');
        if (hasNoOptions || isTfAnswer) {
          finalType = 'TRUE_FALSE';
        }
      }

      parsedData.push({
        id: `Q-IMP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        subjectId: activeSubject.id,
        chapterId: chId,
        lessonId: lesId,
        type: finalType,
        level,
        content,
        options,
        correctAnswer: answer,
        explanation,
        source: 'Tệp tải lên',
        tags: tagsString ? tagsString.split(';').map((t: string) => t.trim()) : ['Tải lên bằng CSV']
      });
    }

    const approvedParsedData = parsedData.filter(q => q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK' || q.type === 'SHORT_ESSAY');
    setParsedImportQuestions(approvedParsedData);
    onToast(`Đã đọc sơ thảo ${approvedParsedData.length} câu hỏi. Xem lại bảng danh sách trước khi nhập!`, 'info');
  };

  const handleConfirmImport = () => {
    if (parsedImportQuestions.length === 0) return;
    
    // Add to state
    setQuestions(prev => [...(parsedImportQuestions as Question[]), ...prev]);
    onToast(`Đã đồng bộ thành công ${parsedImportQuestions.length} câu hỏi vào kho học liệu môn ${activeSubject.name}!`, 'success');
    setShowImportModal(false);
    setParsedImportQuestions([]);
    setCsvFile(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
      <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 1. COMPREHENSIVE HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">
              {activeSubject.book} (Lớp {activeSubject.grade})
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            📚 KHO CÂU HỎI TRỰC QUAN & KHOA HỌC
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Quản lý, tìm kiếm, chỉnh sửa và cấu hình sơ đồ phân phối chương trình môn <span className="font-extrabold text-slate-700">{activeSubject.name}</span>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCreateNewQuestion}
            className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shadow-emerald-100"
          >
            <Plus className="w-4 h-4" /> Biên soạn câu hỏi thủ công
          </button>
          
          <button
            onClick={() => {
              setTestImportFile(null);
              setParsedTestQuestions([]);
              setShowTestImportModal(true);
            }}
            className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shadow-indigo-100"
          >
            <FileText className="w-4 h-4" /> Mẫu đề & Tải đề lên (Tự luận/Trắc nghiệm)
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Nhập từ CSV / TXT
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Xuất dữ liệu CSV
          </button>
        </div>
      </div>

      {/* 2. LIVE DASHBOARD ANALYTICS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tổng câu học liệu</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl font-black text-slate-800">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-400 mb-1">câu hỏi</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 self-start px-2 py-0.5 rounded-md mt-2">
            Đang hiển thị {filteredQuestions.length} câu đã lọc
          </span>
        </div>

        {/* Cognitive Levels breakdown progress */}
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-slate-100 md:col-span-1 lg:col-span-2 flex flex-col justify-between">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Cấu trúc mức độ nhận thức (Ma trận rèn luyện)</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(stats.levels) as Array<keyof typeof stats.levels>).map(lvl => {
              const count = stats.levels[lvl];
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const barColor = lvl === 'Nhận biết' ? 'bg-emerald-500' :
                               lvl === 'Thông hiểu' ? 'bg-indigo-500' :
                               lvl === 'Vận dụng' ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={lvl} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]" title={lvl}>{lvl}</span>
                    <span className="text-xs font-extrabold text-slate-800">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`${barColor} h-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question formats breakdown */}
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cấu trúc hình thức câu hỏi</p>
          <div className="flex flex-col gap-1.5 mt-2 text-[10px] font-semibold text-slate-500">
            <div className="flex justify-between items-center">
              <span>Trắc nghiệm 4 lựa chọn (MCQ)</span>
              <span className="font-extrabold text-slate-800 text-xs">{stats.types.mcq} câu</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Đúng/Sai (True-False)</span>
              <span className="font-extrabold text-slate-800 text-xs">{stats.types.trueFalse} câu</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tự luận (TL)</span>
              <span className="font-extrabold text-indigo-650 text-xs">{stats.types.essay} câu</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Ghép cặp / Trả lời ngắn / Khác</span>
              <span className="font-extrabold text-slate-800 text-xs">{stats.types.shortAnswer + stats.types.other} câu</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUAL-WINDOW LAYOUT (DIRECTORY MAP VS DETAILED LIST) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: CURRICULUM TREE MAP (MULTI-SELECT BOXES) */}
        <div className="lg:col-span-1 bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-xs flex flex-col">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Cơ cấu chương trình</h3>
              </div>
              {(selectedChapterIds.length > 0 || selectedLessonIds.length > 0) && (
                <button
                  onClick={() => { setSelectedChapterIds([]); setSelectedLessonIds([]); }}
                  className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
                >
                  Xóa lọc ({selectedChapterIds.length + selectedLessonIds.length})
                </button>
              )}
            </div>
            
            {/* Quick multi-select controllers */}
            <div className="flex gap-2 justify-between items-center text-[10px] pt-1.5 border-t border-slate-200/50">
              <span className="text-slate-400 font-extrabold uppercase">Chọn nhiều ô (Chương/Bài):</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allCh = activeSubject.chapters.map(c => c.id);
                    const allLes = activeSubject.chapters.flatMap(c => c.lessons).map(l => l.id);
                    setSelectedChapterIds(allCh);
                    setSelectedLessonIds(allLes);
                    onToast('Đã chọn tất cả các chương và bài!', 'success');
                  }}
                  className="text-emerald-750 hover:text-emerald-850 font-bold transition-all"
                >
                  Chọn hết
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChapterIds([]);
                    setSelectedLessonIds([]);
                    onToast('Đã bỏ chọn toàn bộ chương mục!', 'info');
                  }}
                  className="text-slate-500 hover:text-slate-700 font-bold transition-all"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          </div>

          <div className="p-2 max-h-[500px] overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
            {/* General ALL node */}
            <button
              onClick={() => { setSelectedChapterIds([]); setSelectedLessonIds([]); setSelectedTreeType('ALL'); setSelectedTreeId('ALL'); }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                selectedChapterIds.length === 0 && selectedLessonIds.length === 0 
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold border-l-4 border-emerald-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <BookOpen className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Toàn bộ học chương (Tất cả)</span>
              </span>
              <span className="bg-slate-150 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[9px] min-w-[20px] text-center">
                {stats.total}
              </span>
            </button>

            {/* Chapters & Lessons Nested Mapping Tree with checkboxes */}
            {activeSubject.chapters.map(ch => {
              const isCollapsed = !expandedChapters[ch.id];
              const isChSelected = selectedChapterIds.includes(ch.id);
              const chCount = chapterQuestionCounts[ch.id] || 0;

              return (
                <div key={ch.id} className="flex flex-col border border-slate-100 rounded-xl bg-slate-50/20 last:mb-0">
                  {/* Chapter Header Box */}
                  <div
                    onClick={() => {
                      setSelectedChapterIds(prev => {
                        const next = prev.includes(ch.id) ? prev.filter(id => id !== ch.id) : [...prev, ch.id];
                        if (next.includes(ch.id)) {
                          setSelectedTreeType('CHAPTER');
                          setSelectedTreeId(ch.id);
                        } else if (next.length > 0) {
                          setSelectedTreeType('CHAPTER');
                          setSelectedTreeId(next[next.length - 1]);
                        } else {
                          setSelectedTreeType('ALL');
                          setSelectedTreeId('ALL');
                        }
                        return next;
                      });
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                      isChSelected 
                        ? 'bg-emerald-50/80 text-emerald-850 font-extrabold border-l-4 border-emerald-600' 
                        : 'text-slate-700 hover:bg-slate-105/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-grow" onClick={(e) => {
                      // Allow clicks to pass, except for the expand Chevron which we handle distinctly
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterExpand(ch.id, e);
                        }}
                        className="p-1 hover:bg-slate-200 rounded shrink-0 mr-0.5 text-slate-400 group-hover:text-slate-600"
                        title={isCollapsed ? "Mở rộng bài học" : "Thu gọn bài học"}
                      >
                        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <input 
                        type="checkbox"
                        checked={isChSelected}
                        onChange={() => {}} // handled by row onClick
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 shrink-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()} // let row click do the toggle
                      />

                      <span className="truncate select-none font-extrabold text-slate-800" title={ch.name}>{ch.name}</span>
                    </div>
                    
                    <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] min-w-[20px] text-center shrink-0 ml-1 ${
                      chCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {chCount}
                    </span>
                  </div>

                  {/* Lessons Listing inside Chapter if expanded */}
                  {!isCollapsed && ch.lessons && (
                    <div className="pl-6 pr-2 py-1.5 flex flex-col gap-1 border-t border-slate-100 bg-white rounded-b-xl">
                      {ch.lessons.map(les => {
                        const isLesSelected = selectedLessonIds.includes(les.id);
                        const lesCount = lessonQuestionCounts[les.id] || 0;

                        return (
                          <div
                            key={les.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLessonIds(prev => {
                                const next = prev.includes(les.id) ? prev.filter(id => id !== les.id) : [...prev, les.id];
                                if (next.includes(les.id)) {
                                  setSelectedTreeType('LESSON');
                                  setSelectedTreeId(les.id);
                                } else if (next.length > 0) {
                                  setSelectedTreeType('LESSON');
                                  setSelectedTreeId(next[next.length - 1]);
                                } else {
                                  setSelectedTreeType('ALL');
                                  setSelectedTreeId('ALL');
                                }
                                return next;
                              });
                            }}
                            className={`w-full text-left p-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isLesSelected
                                ? 'text-emerald-800 font-bold bg-emerald-50/60 border-l-2 border-emerald-500'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input 
                                type="checkbox"
                                checked={isLesSelected}
                                onChange={() => {}} // handled by click
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3 shrink-0 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="truncate max-w-[130px] select-none" title={les.name}>{les.name}</span>
                            </div>
                            <span className={`px-1.5 rounded-md text-[8px] font-bold shrink-0 min-w-[14px] text-center ${
                              lesCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {lesCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SEARCH, ADVANCED FILTER PANEL & QUESTIONS DETAILED VIEW */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col gap-3 shadow-xs">
            {/* Search Row */}
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh nội dung câu hỏi, đáp án, hoặc lời giải..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Reset button if any filter active */}
              {(selectedLevels.length > 0 || selectedTypes.length > 0 || selectedSources.length > 0 || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLevels([]);
                    setSelectedTypes([]);
                    setSelectedSources([]);
                  }}
                  className="py-2 px-3 text-xs bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  title="Xóa bỏ toàn bộ bộ lọc rèn luyện"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Faceted Parameters Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <FacetedMultiSelect
                label="Mức nhận thức"
                placeholder="Tất cả mức độ"
                options={COGNITIVE_LEVELS_OPTIONS}
                selectedValues={selectedLevels}
                onChange={setSelectedLevels}
              />

              <FacetedMultiSelect
                label="Dạng câu hỏi"
                placeholder="Tất cả định dạng"
                options={QUESTION_TYPES_OPTIONS}
                selectedValues={selectedTypes}
                onChange={setSelectedTypes}
              />

              <FacetedMultiSelect
                label="Nguồn học liệu"
                placeholder="Tất cả nguồn"
                options={SOURCES_OPTIONS}
                selectedValues={selectedSources}
                onChange={setSelectedSources}
              />
            </div>

            {/* Deduplication Switcher Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/50 mt-1 select-none">
              <label 
                className="flex items-center gap-2.5 cursor-pointer text-slate-600 hover:text-slate-900 transition-all font-bold text-[11px]"
                title="Các câu hỏi giống hệt nhau về chữ và công thức Toán sẽ tự động được gộp hiển thị làm một."
              >
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={hideDuplicates}
                    onChange={(e) => {
                      setHideDuplicates(e.target.checked);
                      onToast(
                        e.target.checked 
                          ? 'Đã bật chế độ tự động lọc và gộp câu hỏi trùng lặp!' 
                          : 'Đã tắt lọc câu hỏi trùng (hiển thị đầy đủ bản ghi)!',
                        'info'
                      );
                    }}
                    className="sr-only peer"
                    id="dedup-toggle-checkbox"
                  />
                  <div className="w-8 h-4 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </div>
                <span className="flex items-center gap-1">
                  <span className="text-slate-550">Chế độ câu hỏi trùng:</span>
                  <span className="text-emerald-700 font-extrabold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Chỉ lấy 1 câu</span>
                </span>
              </label>

              {hideDuplicates && rawFilteredMatchesCount - filteredQuestions.length > 0 && (
                <div className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-xl text-[10px] font-black border border-amber-200/35 flex items-center gap-1.5 animate-fadeIn">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-550"></span>
                  </span>
                  <span>Hệ thống đang ẩn bớt {rawFilteredMatchesCount - filteredQuestions.length} câu hỏi trùng lặp</span>
                </div>
              )}
            </div>
            
            {/* Context message: what directory node is active */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] bg-white border border-slate-100 rounded-xl px-3.5 py-2 font-bold text-slate-500 mt-3 select-none">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1 text-slate-600">
                  <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Thư mục tích lũy:</span>
                  <span className="text-emerald-700">
                    {selectedLessonIds.length === 1 ? (
                      `Bài: ${activeSubject.chapters.flatMap(c => c.lessons).find(l => l.id === selectedLessonIds[0])?.name || ''}`
                    ) : selectedLessonIds.length > 1 ? (
                      `${selectedLessonIds.length} bài học tích lũy`
                    ) : selectedChapterIds.length === 1 ? (
                      `Chương: ${activeSubject.chapters.find(c => c.id === selectedChapterIds[0])?.name || ''}`
                    ) : selectedChapterIds.length > 1 ? (
                      `${selectedChapterIds.length} chương chuyên đề`
                    ) : (
                      selectedTreeType === 'ALL' ? "Toàn bộ học phần" :
                      selectedTreeType === 'CHAPTER' ? `Chương: ${activeSubject.chapters.find(c => c.id === selectedTreeId)?.name || ''}` :
                      `Bài: ${activeSubject.chapters.flatMap(c => c.lessons).find(l => l.id === selectedTreeId)?.name || ''}`
                    )}
                  </span>
                </span>

                {filteredQuestions.length > 0 && (
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 md:pl-4">
                    <input
                      type="checkbox"
                      id="select-all-filtered"
                      checked={filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.includes(q.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const filteredIds = filteredQuestions.map(q => q.id);
                          setSelectedQuestionIds(prev => {
                            const next = [...prev];
                            filteredIds.forEach(id => {
                              if (!next.includes(id)) next.push(id);
                            });
                            return next;
                          });
                          onToast(`Đã chọn toàn bộ ${filteredQuestions.length} câu hỏi đang hiển thị theo bộ lọc!`, 'success');
                        } else {
                          const filteredIds = filteredQuestions.map(q => q.id);
                          setSelectedQuestionIds(prev => prev.filter(id => !filteredIds.includes(id)));
                          onToast('Đã bỏ chọn toàn bộ câu hỏi liên quan!', 'info');
                        }
                      }}
                      className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="select-all-filtered" className="text-slate-500 hover:text-emerald-700 cursor-pointer text-[10px] font-extrabold uppercase">
                      Chọn tất cả ({filteredQuestions.length} câu đã lọc)
                    </label>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span>Tìm thấy <span className="text-slate-800 font-black">{filteredQuestions.length}</span> / {subjectQuestions.length} câu học học liệu.</span>
                {filteredQuestions.length > 0 && (
                  <button 
                    onClick={() => {
                      setQuickTestTitle(`Đề rèn luyện nhanh - ${activeSubject.name}`);
                      setQuickTestCount(Math.min(5, filteredQuestions.length));
                      setShowQuickTestModal(true);
                    }}
                    className="flex items-center gap-1 text-indigo-700 hover:underline cursor-pointer bg-indigo-50 px-1.5 py-0.5 rounded-md"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" /> Tạo nhanh đề từ bộ lọc này ({filteredQuestions.length} câu)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* QUESTIONS VISUAL DETAILED CARD TREE LIST */}
          <div className="flex flex-col gap-3 min-h-[300px]">
            {/* VIEW MODE SELECTION & STATS GROUP BAR */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 rounded-xl text-indigo-950 font-black text-sm border border-indigo-100">🗂️</span>
                <div>
                  <h4 className="font-extrabold text-slate-800">CƠ CẤU BỐ TRÍ KHO CÂU HỎI</h4>
                  <p className="text-[10px] text-slate-400">Xem câu hỏi phân bổ trực quan theo Từng chương/bài rèn luyện, hoặc danh sách phẳng.</p>
                </div>
              </div>
              
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-203 gap-0.5 select-none self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'grouped' 
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Nhóm theo Chương/Bài
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('flat')}
                  className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'flat' 
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Danh sách phẳng
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS BAR WITH "CHỌN TẤT CẢ" & "XÓA TẤT CẢ" */}
            {filteredQuestions.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-black text-[10px]">⚡ Thao tác nhanh:</span>
                  <span className="text-[11px] font-bold text-slate-500">Bộ lọc khớp {filteredQuestions.length} câu</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const filteredIds = filteredQuestions.map(q => q.id);
                      setSelectedQuestionIds(prev => {
                        const next = [...prev];
                        filteredIds.forEach(id => {
                          if (!next.includes(id)) next.push(id);
                        });
                        return next;
                      });
                      onToast(`Đã chọn toàn bộ ${filteredQuestions.length} câu hỏi hiển thị!`, 'success');
                    }}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm text-[11px]"
                  >
                    <Check className="w-3.5 h-3.5" /> Chọn tất cả ({filteredQuestions.length} câu)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuestionIds(prev => {
                        const filteredIds = filteredQuestions.map(q => q.id);
                        return prev.filter(id => !filteredIds.includes(id));
                      });
                      onToast('Đã bỏ chọn tất cả câu hỏi thuộc bộ lọc này!', 'info');
                    }}
                    className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold rounded-xl transition-all cursor-pointer text-[11px]"
                  >
                    Bỏ chọn tất cả
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const currentFilteredIds = filteredQuestions.map(q => q.id);
                      setConfirmModal({
                        isOpen: true,
                        title: '⚠️ CẢNH BÁO QUAN TRỌNG',
                        message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN toàn bộ ${filteredQuestions.length} câu hỏi đang hiển thị theo bộ lọc không? Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi hệ thống và không thể hồi phục!`,
                        type: 'danger',
                        onConfirm: () => {
                          setQuestions(prev => prev.filter(q => !currentFilteredIds.includes(q.id)));
                          setSelectedQuestionIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
                          onToast(`Đã xóa vĩnh viễn ${filteredQuestions.length} câu hỏi khỏi hệ thống!`, 'success');
                          setConfirmModal(null);
                        }
                      });
                    }}
                    className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả ({filteredQuestions.length} câu)
                  </button>
                </div>
              </div>
            )}

            {/* WORD EXPORT QUICK TOOLBAR BAR */}
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 rounded-xl text-emerald-950 font-black text-sm">📝</span>
                <div>
                  <h4 className="font-extrabold text-slate-800">CÔNG CỤ XUẤT ĐỀ THI WORD</h4>
                  <p className="text-[10px] text-slate-400">Xuất học liệu chất lượng cao phục vụ trực tiếp công tác in ấn, phô-tô tại trường.</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => handleExportWordDocx(false)}
                  className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  📄 Xuất Đề Học Sinh (.doc)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportWordDocx(true)}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  🔑 Xuất Đề Kèm Đáp Án (.doc)
                </button>
              </div>
            </div>

            {/* SELECTION BAR ACTING DYNAMICALLY */}
            {selectedQuestionIds.length > 0 && (
              <div className="bg-emerald-600 text-white p-3.5 px-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-fadeIn text-xs transition-all border border-emerald-500/30">
                <div className="flex items-center gap-2 font-black">
                  <span className="bg-white/25 w-5 h-5 rounded-full flex items-center justify-center text-xs">✓</span>
                  <span>Đã lựa chọn {selectedQuestionIds.length} câu học liệu để thao tác bản ghi!</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleExportWordDocx(true)}
                    className="py-1.5 px-3.5 bg-white hover:bg-slate-50 text-emerald-950 font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-[11px]"
                  >
                    Tải đề đã chọn (.doc)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: '⚠️ XÁC NHẬN XÓA CÁC CÂU ĐÃ CHỌN',
                        message: `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${selectedQuestionIds.length} câu hỏi đã lựa chọn không? Hành động này sẽ loại bỏ dữ liệu hoàn toàn khỏi kho rèn luyện học liệu!`,
                        type: 'danger',
                        onConfirm: () => {
                          setQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
                          setSelectedQuestionIds([]);
                          onToast(`Đã xóa thành công ${selectedQuestionIds.length} câu hỏi khỏi ngân hàng học liệu!`, 'success');
                          setConfirmModal(null);
                        }
                      });
                    }}
                    className="py-1.5 px-3.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md border border-rose-450 text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa các câu đã chọn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuestionIds([]);
                      onToast('Đã hủy toàn bộ lựa chọn câu hỏi!', 'info');
                    }}
                    className="text-white/90 hover:text-white hover:underline font-extrabold text-[11px] px-1.5"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>
            )}

            {filteredQuestions.length === 0 ? (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-xs flex flex-col items-center justify-center gap-2.5">
                <LayoutGrid className="w-8 h-8 text-slate-300 animate-pulse" />
                <p className="font-extrabold text-slate-700 text-[13px]">Không tìm thấy câu hỏi học liệu phù hợp!</p>
                <p className="text-[11px] text-slate-450 max-w-sm leading-relaxed">
                  Thầy cô đang áp dụng bộ lọc (bài học/chương mục/độ khó...) không khớp với câu hỏi nào. Các câu hỏi đã chọn trong hàng chờ ({selectedQuestionIds.length} câu) vẫn được lưu an toàn.
                </p>
                {(selectedChapterIds.length > 0 || selectedLessonIds.length > 0 || searchQuery.trim() !== '' || selectedLevels.length > 0 || selectedTypes.length > 0 || selectedSources.length > 0) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChapterIds([]);
                      setSelectedLessonIds([]);
                      setSelectedLevels([]);
                      setSelectedTypes([]);
                      setSelectedSources([]);
                      setSearchQuery('');
                      onToast('Đã xóa các bộ lọc để hiển thị toàn bộ câu hỏi!', 'success');
                    }}
                    className="mt-1.5 py-2 px-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all cursor-pointer text-[11px] flex items-center gap-1.5 shadow-sm"
                  >
                    Xóa các bộ lọc & hiển thị toàn bộ câu hỏi
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Hãy nhấn nút "Biên soạn câu hỏi thủ công" hoặc đồng bộ phân bổ giáo án bằng AI để gia tăng ngân hàng đề!
                  </p>
                )}
              </div>
            ) : viewMode === 'grouped' ? (
              (() => {
                let questionIndex = 0;
                // Chapters to render must reside in filtered questions
                const activeChapters = activeSubject.chapters.filter(ch => {
                  return filteredQuestions.some(q => q.chapterId === ch.id);
                });

                // What if some questions don't belong to any chapters or are uncategorized?
                const uncategorizedQuestions = filteredQuestions.filter(q => {
                  return !activeSubject.chapters.some(ch => ch.id === q.chapterId);
                });

                return (
                  <div className="flex flex-col gap-5">
                    {activeChapters.map((ch, idx) => {
                      const chapterQs = filteredQuestions.filter(q => q.chapterId === ch.id);
                      
                      // Lessons that have questions
                      const activeLessons = ch.lessons.filter(les => {
                        return chapterQs.some(q => q.lessonId === les.id);
                      });

                      // Chapter questions with no lesson, or lesson not inside this chapter
                      const generalChapterQs = chapterQs.filter(q => {
                        return !ch.lessons.some(l => l.id === q.lessonId);
                      });

                      return (
                        <div key={ch.id} className="border border-slate-200 bg-indigo-50/5 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
                          {/* Beautiful Section Header for Chapter */}
                          <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="flex items-center justify-center w-7.5 h-7.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shrink-0 shadow-sm">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <h3 className="font-black text-slate-800 text-[12.5px] uppercase tracking-tight" title={ch.name}>
                                  Chương: {ch.name}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  Học phần chứa <span className="text-emerald-600">{chapterQs.length} câu hỏi</span> phù hợp
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Lessons inside Chapter */}
                          <div className="flex flex-col gap-4">
                            {activeLessons.map((les) => {
                              const lessonQs = chapterQs.filter(q => q.lessonId === les.id);
                              return (
                                <div key={les.id} className="bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-slate-55 pb-2 mb-1">
                                    <span className="font-black text-slate-705 text-[11px] flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Bài học: {les.name}
                                    </span>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
                                      {lessonQs.length} câu hỏi
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-3">
                                    {lessonQs.map(q => {
                                      questionIndex++;
                                      return renderSingleQuestionCard(q, questionIndex);
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {generalChapterQs.length > 0 && (
                              <div className="bg-white border border-slate-200/60 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                                <div className="flex items-center justify-between border-b border-slate-55 pb-2 mb-1">
                                  <span className="font-black text-slate-500 text-[11px] flex items-center gap-2 italic">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Câu hỏi tự do của Chương (Chưa phân bài chi tiết)
                                  </span>
                                  <span className="text-[10px] bg-amber-50 text-amber-800 font-extrabold px-2 py-0.5 rounded-md">
                                    {generalChapterQs.length} câu hỏi
                                  </span>
                                </div>
                                <div className="flex flex-col gap-3">
                                  {generalChapterQs.map(q => {
                                    questionIndex++;
                                    return renderSingleQuestionCard(q, questionIndex);
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Uncategorized chapter list */}
                    {uncategorizedQuestions.length > 0 && (
                      <div className="border border-slate-200 bg-amber-500/5 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex items-center justify-center w-7.5 h-7.5 rounded-xl bg-amber-653 text-white font-extrabold text-xs shrink-0 shadow-sm">
                              ?
                            </span>
                            <div className="truncate">
                              <h3 className="font-black text-slate-800 text-[12.5px] uppercase tracking-tight">
                                Câu hỏi chưa phân loại chương mục chính xác
                              </h3>
                              <p className="text-[10px] text-slate-400 font-bold">
                                Chứa <span className="text-amber-805">{uncategorizedQuestions.length} câu hỏi</span> tự do
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {uncategorizedQuestions.map(q => {
                            questionIndex++;
                            return renderSingleQuestionCard(q, questionIndex);
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              paginatedQuestions.map((q, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                return renderSingleQuestionCard(q, globalIndex);
              })
            )}
          </div>

          {/* PAGINATION NAVIGATION CONTROLS */}
          {viewMode === 'flat' && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
              <span className="text-[11px]">
                Hiển thị trang <span className="text-slate-700">{currentPage}</span> trên tổng số {totalPages}
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setCurrentPage(pNum)}
                    className={`w-8 h-8 rounded-xl text-xs transition-all cursor-pointer ${
                      currentPage === pNum 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ==================== GLOBAL INSIDE-MODAL: PREMIUM QUESTION CREATOR/EDITOR ==================== */}
      {showEditorModal && localEditingQuestion && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <form 
            onSubmit={handleSaveEditedQuestionSubmit}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-4 my-8 animate-fadeIn text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Plus className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase">CẬP NHẬT CÂU HỎI HỌC LIỆU</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowEditorModal(false); setLocalEditingQuestion(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Định dạng câu hỏi</label>
                <select
                  value={localEditingQuestion.type}
                  onChange={(e) => {
                    const newType = e.target.value as QuestionType;
                    const updated: any = { ...localEditingQuestion, type: newType };
                    if (newType === 'TRUE_FALSE') {
                      if (!localEditingQuestion.options || localEditingQuestion.options.length !== 4) {
                        updated.options = ['Phát biểu a', 'Phát biểu b', 'Phát biểu c', 'Phát biểu d'];
                      }
                      if (!localEditingQuestion.correctAnswer || !localEditingQuestion.correctAnswer.includes(',')) {
                        updated.correctAnswer = 'Đúng,Đúng,Đúng,Đúng';
                      }
                    } else if (newType === 'MCQ') {
                      if (!localEditingQuestion.options || localEditingQuestion.options.length !== 4) {
                        updated.options = ['A. ', 'B. ', 'C. ', 'D. '];
                      }
                      if (!localEditingQuestion.correctAnswer || localEditingQuestion.correctAnswer.includes(',')) {
                        updated.correctAnswer = 'A';
                      }
                    } else {
                      if (localEditingQuestion.correctAnswer.includes(',')) {
                        updated.correctAnswer = 'đáp án';
                      }
                    }
                    setLocalEditingQuestion(updated);
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="MCQ">Trắc nghiệm bốn lựa chọn (MCQ)</option>
                  <option value="TRUE_FALSE">Đúng / Sai (TRUE_FALSE)</option>
                  <option value="SHORT_ANSWER">Trả lời ngắn / Điền khuyết (SHORT_ANSWER)</option>
                  <option value="SHORT_ESSAY">Tự luận (TL - SHORT_ESSAY)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mức độ nhận thức</label>
                <select
                  value={localEditingQuestion.level}
                  onChange={(e) => setLocalEditingQuestion({ ...localEditingQuestion, level: e.target.value as CognitiveLevel })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="Nhận biết">Nhận biết</option>
                  <option value="Thông hiểu">Thông hiểu</option>
                  <option value="Vận dụng">Vận dụng</option>
                  <option value="Vận dụng cao">Vận dụng cao</option>
                </select>
              </div>
            </div>

            {/* Curriculum chapter & lessons dynamic linking */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mục Chương phạm vi</label>
                <select
                  value={localEditingQuestion.chapterId}
                  onChange={(e) => {
                    const chId = e.target.value;
                    const chObj = activeSubject.chapters.find(c => c.id === chId);
                    setLocalEditingQuestion({ 
                      ...localEditingQuestion, 
                      chapterId: chId,
                      lessonId: chObj?.lessons[0]?.id || ''
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {activeSubject.chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mục Bài học chi tiết</label>
                <select
                  value={localEditingQuestion.lessonId}
                  onChange={(e) => setLocalEditingQuestion({ ...localEditingQuestion, lessonId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {activeSubject.chapters
                    .find(c => c.id === localEditingQuestion.chapterId)
                    ?.lessons.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    )) || <option value="">Không cấu hình bài học</option>}
                </select>
              </div>
            </div>

            {/* Question main content */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Đề bài câu hỏi (Dùng dấu $...$ để viết công thức toán LaTeX)</label>
              <textarea 
                value={localEditingQuestion.content}
                onChange={(e) => setLocalEditingQuestion({ ...localEditingQuestion, content: e.target.value })}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs text-slate-700 min-h-[70px]"
                placeholder="Nhập đề bài câu hỏi học liệu. Ví dụ: Cho biểu thức toán $P = x^2 - 4x + 4$..."
              />
              <div className="mt-1 p-2 bg-emerald-50/30 border border-emerald-100 rounded-lg text-[10px] text-slate-500 leading-normal">
                <span className="font-extrabold text-emerald-800">Xem thử kết quả hiển thị LaTeX:</span>{' '}
                <MathRenderer text={localEditingQuestion.content || '(chưa viết nội dung...)'} />
              </div>
            </div>

            {/* Conditionally render MCQ Options selection inputs */}
            {localEditingQuestion.type === 'MCQ' && (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Thiết lập 4 phương án câu MCQ</span>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map(idx => {
                    const prefixChr = idx === 0 ? 'A' : idx === 1 ? 'B' : idx === 2 ? 'C' : 'D';
                    const list = localEditingQuestion.options || ['A. ', 'B. ', 'C. ', 'D. '];
                    return (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="font-black text-slate-400">{prefixChr}</span>
                        <input 
                          type="text"
                          required
                          value={list[idx] ? list[idx].replace(/^[A-H]\.\s*/, '') : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = [...list];
                            next[idx] = `${prefixChr}. ${val}`;
                            setLocalEditingQuestion({ ...localEditingQuestion, options: next });
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                          placeholder={`Phương án ${prefixChr}...`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {localEditingQuestion.type === 'TRUE_FALSE' && (
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Thiết lập 4 phát biểu Đúng / Sai (Mục a, b, c, d)
                </span>
                <div className="flex flex-col gap-2.5">
                  {[0, 1, 2, 3].map(idx => {
                    const label = idx === 0 ? 'a' : idx === 1 ? 'b' : idx === 2 ? 'c' : 'd';
                    const list = localEditingQuestion.options && localEditingQuestion.options.length === 4 
                      ? localEditingQuestion.options 
                      : ['Phát biểu a', 'Phát biểu b', 'Phát biểu c', 'Phát biểu d'];
                    const currentAnsList = (localEditingQuestion.correctAnswer || 'Đúng,Đúng,Đúng,Đúng').split(',');
                    const statementAns = currentAnsList[idx] || 'Đúng';

                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-150">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-extrabold text-indigo-700 uppercase">{label})</span>
                        </div>
                        <input 
                          type="text"
                          required
                          value={list[idx] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextOptions = [...list];
                            nextOptions[idx] = val;
                            setLocalEditingQuestion({ ...localEditingQuestion, options: nextOptions });
                          }}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                          placeholder={`Nội dung phát biểu ${label}...`}
                        />
                        <div className="flex bg-slate-150 rounded-lg p-0.5 shrink-0 direct-tf-select-box">
                          {['Đúng', 'Sai'].map(val => {
                            const isSelect = statementAns === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => {
                                  const nextAnsList = [...currentAnsList];
                                  while (nextAnsList.length < 4) nextAnsList.push('Đúng');
                                  nextAnsList[idx] = val;
                                  setLocalEditingQuestion({ 
                                    ...localEditingQuestion, 
                                    correctAnswer: nextAnsList.join(',') 
                                  });
                                }}
                                className={`px-2.5 py-1 text-[10px] font-black rounded-md cursor-pointer transition-all ${
                                  isSelect 
                                    ? val === 'Đúng' 
                                      ? 'bg-emerald-600 text-white shadow-xs' 
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-700 bg-transparent'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Answer Input and Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Đáp án đúng</label>
                {localEditingQuestion.type === 'MCQ' ? (
                  <select
                    value={localEditingQuestion.correctAnswer}
                    onChange={(e) => setLocalEditingQuestion({ ...localEditingQuestion, correctAnswer: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="A">A chính xác</option>
                    <option value="B">B chính xác</option>
                    <option value="C">C chính xác</option>
                    <option value="D">D chính xác</option>
                  </select>
                ) : localEditingQuestion.type === 'TRUE_FALSE' ? (
                  <div className="p-2 bg-indigo-50 border border-indigo-150 text-indigo-900 rounded-xl text-xs font-black flex items-center justify-center text-center leading-normal">
                     Đã đồng bộ ở 4 phát biểu trên: {localEditingQuestion.correctAnswer}
                  </div>
                ) : (
                  <input 
                    type="text" 
                    value={localEditingQuestion.correctAnswer}
                    onChange={(e) => setLocalEditingQuestion({ ...localEditingQuestion, correctAnswer: e.target.value })}
                    required
                    placeholder="E.g. 15, x = 3, etc."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Thẻ phân loại tags (Cách nhau bằng dấu chấm phẩy ;)</label>
                <input 
                  type="text"
                  value={localEditingQuestion.tags.join('; ')}
                  onChange={(e) => setLocalEditingQuestion({ 
                    ...localEditingQuestion, 
                    tags: e.target.value.split(';').map(t => t.trim()).filter(x => x !== '')
                  })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  placeholder="Tính toán; Hình học; vv."
                />
              </div>
            </div>

            {/* EXTRA: GDPT 2018 STANDARDS & DIFFICULTY RATING (1-10) */}
            <div className="p-4 bg-emerald-50/20 rounded-2xl border border-emerald-100/60 flex flex-col gap-4">
              <span className="block text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                ✓ Thiết lập Tiêu chuẩn GDPT 2018 & Độ khó Sư phạm
              </span>

              {/* 1. DIFFICULTY SCORE Matrix 1-10 */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Phân loại độ khó sư phạm (Thang điểm từ 1 đến 10)
                </label>
                <div className="flex flex-wrap gap-1 md:grid md:grid-cols-10 md:gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                    const isSelected = (localEditingQuestion.difficultyScore || 5) === num;
                    let colorClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                    if (isSelected) {
                      if (num <= 3) colorClass = 'bg-emerald-600 text-white font-extrabold ring-2 ring-emerald-200';
                      else if (num <= 6) colorClass = 'bg-amber-500 text-white font-extrabold ring-2 ring-amber-200';
                      else if (num <= 8) colorClass = 'bg-rose-600 text-white font-extrabold ring-2 ring-rose-200';
                      else colorClass = 'bg-purple-700 text-white font-extrabold ring-2 ring-purple-200';
                    }
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLocalEditingQuestion({ ...localEditingQuestion, difficultyScore: num })}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${colorClass}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>1: Quá dễ / Nhận biết nhanh</span>
                  <span className="font-bold text-slate-700">Giá trị chọn: {(localEditingQuestion.difficultyScore || 5)} / 10</span>
                  <span>10: Vận dụng cực cao / Đỉnh cao học sinh giỏi</span>
                </div>
              </div>

              {/* 2. YCCĐ Curriculum Outcomes Linkage */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Yêu cầu cần đạt liên kết (Chương trình GDPT 2018)
                </label>
                
                {/* Dynamically list standard outcomes of active lesson as toggle tags */}
                {(() => {
                  const currentCh = activeSubject.chapters.find(c => c.id === localEditingQuestion.chapterId);
                  const currentLsn = currentCh?.lessons.find(l => l.id === localEditingQuestion.lessonId);
                  const outcomesList = currentLsn?.learningOutcomes || [];

                  if (outcomesList.length === 0) {
                    return (
                      <p className="text-[10px] text-slate-400 italic">
                        Mục bài hiện tại chưa nạp sẵn YCCĐ mẫu. Vui lòng nhập thông tin YCCĐ tùy biến phía dưới.
                      </p>
                    );
                  }

                  const selectedOutcomes = localEditingQuestion.reqOutcomesGDPT2018 || [];

                  return (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {outcomesList.map((outcome, oIdx) => {
                        const isSelected = selectedOutcomes.includes(outcome);
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => {
                              const nextList = isSelected 
                                ? selectedOutcomes.filter(o => o !== outcome)
                                : [...selectedOutcomes, outcome];
                              setLocalEditingQuestion({ ...localEditingQuestion, reqOutcomesGDPT2018: nextList });
                            }}
                            className={`py-1 px-2.5 rounded-full text-[10px] text-left transition-all ${
                              isSelected 
                                ? 'bg-emerald-600 text-white font-extrabold shadow-xs shadow-emerald-50' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {outcome}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Free input for custom learning outcomes */}
                <input 
                  type="text"
                  placeholder="Hoặc nhập YCCĐ khác tự biên soạn (Phân tách bằng dấu phẩy)..."
                  value={(localEditingQuestion.reqOutcomesGDPT2018 || []).join(', ')}
                  onChange={(e) => {
                    const typed = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                    setLocalEditingQuestion({ ...localEditingQuestion, reqOutcomesGDPT2018: typed });
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              {/* 3. Predefined Core Subject Competencies */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Năng lực thành phần liên đới phát triển kì vọng
                </label>
                {(() => {
                  const subjectName = activeSubject.name;
                  const getComps = (name: string) => {
                    const lc = name.toLowerCase();
                    if (lc.includes('toán') || lc.includes('math')) {
                      return [
                        'Giải quyết vấn đề toán học',
                        'Tư duy và lập luận toán học',
                        'Mô hình hóa toán học',
                        'Giao tiếp toán học',
                        'Sử dụng công cụ phương tiện học toán'
                      ];
                    } else if (lc.includes('khoa học') || lc.includes('khtn') || lc.includes('vật lý') || lc.includes('vật lí') || lc.includes('hóa học') || lc.includes('sinh học')) {
                      return [
                        'Nhận thức khoa học tự nhiên',
                        'Tìm hiểu tự nhiên',
                        'Vận dụng kiến thức, kĩ năng đã học'
                      ];
                    } else if (lc.includes('văn') || lc.includes('tiếng việt') || lc.includes('ngữ văn')) {
                      return [
                        'Năng lực đọc hiểu văn bản',
                        'Năng lực viết văn sáng tạo',
                        'Năng lực nói và nghe tương tác',
                        'Năng lực cảm thụ thẩm mỹ ngôn ngữ'
                      ];
                    } else if (lc.includes('anh') || lc.includes('nguyện') || lc.includes('english')) {
                      return [
                        'Năng lực nghe hiểu (Listening)',
                        'Năng lực đọc hiểu (Reading)',
                        'Năng lực nói chủ động (Speaking)',
                        'Năng lực viết cú pháp (Writing)'
                      ];
                    }
                    return [
                      'Năng lực tự lực và tự học',
                      'Năng lực giải quyết vấn đề phức hợp',
                      'Năng lực giao tiếp đa phương tiện'
                    ];
                  };

                  const list = getComps(subjectName);
                  const selectedComps = localEditingQuestion.competenciesGDPT2018 || [];

                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((comp, cIdx) => {
                        const isSelected = selectedComps.includes(comp);
                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              const nextList = isSelected 
                                ? selectedComps.filter(c => c !== comp)
                                : [...selectedComps, comp];
                              setLocalEditingQuestion({ ...localEditingQuestion, competenciesGDPT2018: nextList });
                            }}
                            className={`py-1 px-2 rounded-full text-[9px] text-left transition-all ${
                              isSelected 
                                ? 'bg-emerald-600 text-white font-extrabold shadow-xs' 
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {comp}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Explanation Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Cách giải thích chi tiết (Hỗ trợ toán LaTeX $...$)</label>
              <textarea 
                value={localEditingQuestion.explanation}
                onChange={(e) => setLocalEditingQuestion({ ...localEditingQuestion, explanation: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] text-xs text-slate-600 focus:outline-none"
                placeholder="Nhập phương pháp rà soát đáp án của bài học rèn luyện..."
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button 
                type="button"
                onClick={() => { setShowEditorModal(false); setLocalEditingQuestion(null); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
              >
                ✓ Lưu câu hỏi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== GLOBAL MODAL: IMPORT QUESTIONS FROM CSV / TXT FILE ==================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl flex flex-col gap-4 animate-fadeIn text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 p-1.5 rounded-full border border-emerald-100">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase">Nhập hàng loạt câu hỏi từ tệp CSV hoặc TXT</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowImportModal(false); setParsedImportQuestions([]); setCsvFile(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed">
              Bạn có thể nhập đồng loạt hàng chục câu hỏi rèn luyện bằng cách tải lên tệp tin bảng tính <strong>Excel/CSV</strong> hoặc tệp tin văn bản thô <strong>TXT (dạng câu hỏi thô trắc nghiệm)</strong>. Hệ thống hỗ trợ tự động bóc tách cấu trúc cực nhanh!
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCSVSample}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Tải tệp mẫu rèn luyện CSV"
              >
                <Download className="w-3.5 h-3.5" /> Bản mẫu bảng biểu CSV
              </button>

              <button
                type="button"
                onClick={downloadTXTSample}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-250 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Tải tệp mẫu rèn luyện TXT"
              >
                <Download className="w-3.5 h-3.5" /> Bản mẫu văn bản thô TXT
              </button>
            </div>

            {/* Target Area for File drag/drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/50' 
                  : csvFile ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-200 hover:border-emerald-400 bg-slate-50/30'
              }`}
            >
              <Upload className={`w-8 h-8 ${csvFile ? 'text-indigo-500' : 'text-slate-400'}`} />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".csv,.txt" 
                className="hidden" 
              />
              {csvFile ? (
                <div className="flex flex-col gap-0.5 font-bold text-indigo-800">
                  <p>Tệp tin sẵn sàng: {csvFile.name}</p>
                  <p className="text-[10px] text-slate-400">Kích thước: {formatScore(csvFile.size / 1024)} KB - Nhấp để thay đổi tệp tin</p>
                </div>
              ) : (
                <div className="text-slate-500 leading-normal">
                  <p className="font-extrabold text-slate-700 text-xs">Phóng / kéo tệp tin CSV bảng tính hoặc TXT thô vào đây</p>
                  <p className="text-[10px] text-slate-400">Tự động phân tách cấu trúc rèn luyện, câu hỏi, lựa chọn, và đáp án đúng</p>
                </div>
              )}
            </div>

            {/* Data review step */}
            {parsedImportQuestions.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-black text-slate-700 text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sơ thảo danh sách phát hiện ({parsedImportQuestions.length} câu)
                </span>
                
                <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2">Nội dung câu</th>
                        <th className="p-2">Dạng câu</th>
                        <th className="p-2">Mức độ</th>
                        <th className="p-2">Đáp án</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parsedImportQuestions.map((pq, pI) => (
                        <tr key={pI} className="text-slate-700 hover:bg-slate-100">
                          <td className="p-2 font-semibold truncate max-w-[200px]" title={pq.content}>{pq.content}</td>
                          <td className="p-2 font-mono">{pq.type}</td>
                          <td className="p-2">{pq.level}</td>
                          <td className="p-2 font-bold text-center text-emerald-700">{pq.correctAnswer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-100 text-[10px] leading-relaxed text-amber-800 rounded-xl flex gap-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <p>
                    <strong>Lưu ý:</strong> Hãy đảm bảo <strong>Mã_Chương</strong> và <strong>Mã_Bài</strong> trong tệp khớp với cấu trúc sơ đồ môn học hiện tại để học liệu định phân chính xác!
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button 
                type="button"
                onClick={() => { setShowImportModal(false); setParsedImportQuestions([]); setCsvFile(null); }}
                className="py-2 px-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              
              <button 
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedImportQuestions.length === 0}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-100"
              >
                Đồng ý Nhập vào Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GLOBAL MODAL: QUICK COGNITIVE TEST BUILDER FROM FILTERS ==================== */}
      {showQuickTestModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form 
            onSubmit={handleQuickTestSubmit}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-fadeIn text-xs"
          >
            <div className="flex items-center gap-2 text-indigo-700 border-b border-indigo-100 pb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-sm uppercase">Tạo đề nhanh từ bộ lọc</h3>
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed">
              Bạn đang đóng gói đề thi lấy từ bộ lọc gồm có <strong className="text-slate-700 font-extrabold">{filteredQuestions.length} câu hỏi</strong> phù hợp. Nhập tham số để đề thi được khởi tạo ngay lập tức:
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Tiêu đề đề luyện tập</label>
              <input
                type="text"
                required
                value={quickTestTitle}
                onChange={(e) => setQuickTestTitle(e.target.value)}
                placeholder="Nhập tiêu đề học liệu thi tuyển..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Thời gian làm bài (Phút)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quickTestDuration}
                  onChange={(e) => setQuickTestDuration(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Số câu hỏi bốc ngẫu nhiên</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={filteredQuestions.length}
                  value={quickTestCount}
                  onChange={(e) => setQuickTestCount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button 
                type="button"
                onClick={() => setShowQuickTestModal(false)}
                className="flex-1 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              
              <button 
                type="submit"
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-1"
              >
                Đưa vào kho đề <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== GLOBAL MODAL: DOWNLOAD SAMPLE EXAM & UPLOAD EXAM ==================== */}
      {showTestImportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl flex flex-col gap-5 animate-fadeIn text-xs text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 p-1.5 rounded-full border border-indigo-100">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase">Cấu trúc mẫu & Tải lên tệp Đề thi hoàn chỉnh</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Cho phép nhập đồng loạt cả đề tự luận và trắc nghiệm chuẩn của Bộ GD&ĐT</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowTestImportModal(false); setParsedTestQuestions([]); setTestImportFile(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick explanation & Template Downloader */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-700 text-[11px] mb-1.5 uppercase flex items-center gap-1">
                    <span>📑</span> Bước 1: Xem cấu trúc đề thi mẫu
                  </h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
                    Đề thi có mẫu chuẩn bao gồm các câu hỏi <strong>Trắc nghiệm (MCQ)</strong>, <strong>Đúng/Sai (TF)</strong>, và <strong>Tự luận (TL)</strong>. 
                  </p>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[9px] text-indigo-950 mb-3 max-h-[140px] overflow-y-auto">
                    Chương: Đại số 10<br />
                    Bài: Ôn tập chương 1<br />
                    Mức độ: Nhận biết<br />
                    Dạng: TL<br />
                    Câu: Lập luận giải phương trình $x^2 - 4x + 3 = 0$.<br />
                    Đáp án: Nghiệm là $x_1=1, x_2=3$<br />
                    Lời giải: Phân tích thành nhân tử $(x-1)(x-3)=0$<br />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadExamTemplate}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" /> Tải tệp Đề thi Mẫu (.TXT)
                </button>
              </div>

              {/* Drag n Drop Upload Area */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsTestDragging(true); }}
                onDragLeave={() => setIsTestDragging(false)}
                onDrop={handleTestFileDrop}
                className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[225px] ${
                  isTestDragging ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 bg-white hover:bg-slate-50/50'
                }`}
                onClick={() => testFileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={testFileInputRef} 
                  onChange={handleTestFileSelect} 
                  accept=".txt" 
                  className="hidden" 
                />
                
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                
                {testImportFile ? (
                  <div className="animate-fadeIn">
                    <p className="text-xs font-bold text-slate-800">{testImportFile.name}</p>
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-1">✓ Đã nạp thành công ({parsedTestQuestions.length} câu)</p>
                  </div>
                ) : (
                  <div>
                    <h5 className="font-extrabold text-slate-700 text-xs mb-1">Bước 2: Tải lên đề thi của bạn</h5>
                    <p className="text-[11px] text-slate-400">Kéo & thả file hoặc nhấp để duyệt máy tính</p>
                    <p className="text-[9px] text-indigo-650 font-semibold mt-2.5 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">Chỉ chấp nhận định dạng .TXT thô</p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Custom Configurations & List Preview */}
            {parsedTestQuestions.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 animate-fadeIn">
                <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Bước 3: Cấu hình Đọc thông số đề thi
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Tiêu đề đề thi</label>
                    <input 
                      type="text" 
                      value={importTestTitle}
                      onChange={(e) => setImportTestTitle(e.target.value)}
                      placeholder="VD: Kiểm tra 1 tiết đại số"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Thời lượng làm bài</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={importTestDuration}
                        onChange={(e) => setImportTestDuration(Number(e.target.value))}
                        placeholder="45"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">Phút</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mục đích kiểm tra</label>
                    <select
                      value={importTestPurpose}
                      onChange={(e) => setImportTestPurpose(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên (15 phút)</option>
                      <option value="Kiểm tra định kỳ">Kiểm tra định kỳ (1 tiết)</option>
                      <option value="Kiểm tra học kỳ">Kiểm tra học sinh giỏi / Học kỳ</option>
                      <option value="Luyện thi tốt nghiệp">Thi thử tốt nghiệp THPT</option>
                    </select>
                  </div>
                </div>

                {/* Scratched Question List Preview */}
                <div className="flex flex-col gap-2">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Bản phác thảo danh sách câu hỏi ({parsedTestQuestions.length} câu)
                  </span>
                  
                  <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-[160px] overflow-y-auto">
                    <table className="w-full text-left text-[11px] text-slate-600 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500">
                          <th className="py-2 px-3">STT</th>
                          <th className="py-2 px-3">Hình thức</th>
                          <th className="py-2 px-3">Mức độ</th>
                          <th className="py-2 px-3">Nội dung câu hỏi tóm tắt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedTestQuestions.map((q, idx) => (
                          <tr key={q.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                                q.type === 'SHORT_ESSAY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                                q.type === 'MCQ' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                q.type === 'TRUE_FALSE' ? 'bg-orange-50 text-orange-700 border border-orange-150' :
                                'bg-slate-100 text-slate-705'
                              }`}>
                                {q.type === 'SHORT_ESSAY' ? 'Tự luận' :
                                 q.type === 'MCQ' ? 'Trắc nghiệm' :
                                 q.type === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Khác'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-550 font-bold">{q.level}</td>
                            <td className="py-2 px-3 truncate max-w-[320px] text-slate-800">{q.content}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-1">
              <button
                type="button"
                onClick={() => { setShowTestImportModal(false); setParsedTestQuestions([]); setTestImportFile(null); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-500 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={parsedTestQuestions.length === 0}
                onClick={handleConfirmTestImport}
                className={`px-5 py-2 text-white rounded-xl font-extrabold transition-all cursor-pointer shadow-md select-none flex items-center gap-1.5 ${
                  parsedTestQuestions.length > 0 
                    ? 'bg-indigo-650 hover:bg-indigo-700 shadow-indigo-100 animate-pulseOnce' 
                    : 'bg-slate-300 border border-slate-200 cursor-not-allowed text-slate-400'
                }`}
              >
                ✓ Lưu đề thi & Đồng bộ câu hỏi học liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION RE-USABLE DIALOG MODAL (Iframe Safe) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-slate-150 text-left">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase flex items-center gap-2 text-rose-600">
              <span>⚠️</span> {confirmModal.title}
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {confirmModal.message}
            </p>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-500 transition-all cursor-pointer text-center text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.onConfirm) {
                    confirmModal.onConfirm();
                  }
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold transition-all cursor-pointer text-center text-xs shadow-md shadow-rose-100"
              >
                Đồng ý Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
