import React, { useState } from 'react';
import { SubjectConfig, Question, Test, QuestionType, CognitiveLevel } from '../types';
import { MathRenderer } from './MathRenderer';
import { Sparkles, Check, FileText, ClipboardList, Download, Save, RefreshCw } from 'lucide-react';

interface TestGeneratorProps {
  activeSubject: SubjectConfig;
  questions: Question[];
  onSaveTest: (test: Test, parsedQs?: Question[]) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  apiKey: string;
}

export const TestGenerator: React.FC<TestGeneratorProps> = ({ 
  activeSubject, 
  questions, 
  onSaveTest, 
  onToast, 
  apiKey 
}) => {
  const [subTab, setSubTab] = useState<'ai' | 'manual' | 'file'>('ai');

  // Question Format Points (Bốn lựa chọn, Đúng/Sai, Điền từ ngắn,...)
  const [formatPoints, setFormatPoints] = useState<Record<string, number>>({
    MCQ: 0.25,
    TRUE_FALSE: 1.0,
    SHORT_ANSWER: 1.0,
    SHORT_ESSAY: 1.0,
    FILL_BLANK: 1.0,
    MATCHING: 1.0,
  });

  // AI Params
  const [aiParams, setAiParams] = useState({
    title: '',
    purpose: 'Kiểm tra thường xuyên',
    numQuestions: 15,
    duration: 15,
    cognitivePercent: { 'Nhận biết': 40, 'Thông hiểu': 30, 'Vận dụng': 20, 'Vận dụng cao': 10 },
    formats: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'SHORT_ESSAY'] as QuestionType[],
    formatPercent: { MCQ: 50, TRUE_FALSE: 20, SHORT_ANSWER: 15, SHORT_ESSAY: 15 } as Record<string, number>,
    formatCount: { MCQ: 8, TRUE_FALSE: 3, SHORT_ANSWER: 2, SHORT_ESSAY: 2 } as Record<string, number>,
    configMode: 'count' as 'percent' | 'count',
    useRealLifeScenarios: true,
  });

  const updateFormatParams = (newFormats: QuestionType[], newCounts: Record<string, number>, newPercents: Record<string, number>, mode: 'percent' | 'count') => {
    let numQs = aiParams.numQuestions;
    let percents = { ...newPercents };
    let counts = { ...newCounts };

    if (mode === 'count') {
      numQs = newFormats.reduce((sum, fmt) => sum + (counts[fmt] || 0), 0);
      newFormats.forEach(fmt => {
        percents[fmt] = numQs > 0 ? Math.round(((counts[fmt] || 0) / numQs) * 100) : 0;
      });
      const activePercents = newFormats.filter(fmt => percents[fmt] > 0);
      if (activePercents.length > 0) {
        const sumP = activePercents.reduce((sum, fmt) => sum + percents[fmt], 0);
        if (sumP !== 100 && sumP > 0) {
          percents[activePercents[0]] += (100 - sumP);
        }
      }
    } else {
      // In percent mode, make sure the sum of count allocations EXACTLY equals numQs
      const totalPct = newFormats.reduce((sum, fmt) => sum + (percents[fmt] || 0), 0);
      let allocated = 0;
      const activeFormats = newFormats.filter(fmt => (percents[fmt] || 0) > 0);

      if (activeFormats.length > 0) {
        const tempCounts: Record<string, number> = {};
        activeFormats.forEach(fmt => {
          const pct = percents[fmt] || 0;
          const pctRatio = totalPct > 0 ? (pct / totalPct) : (1 / activeFormats.length);
          tempCounts[fmt] = Math.floor(pctRatio * numQs);
          allocated += tempCounts[fmt];
        });

        let remainder = numQs - allocated;
        let i = 0;
        while (remainder > 0 && activeFormats.length > 0) {
          const fmt = activeFormats[i % activeFormats.length];
          tempCounts[fmt] = (tempCounts[fmt] || 0) + 1;
          remainder--;
          i++;
        }

        Object.keys(counts).forEach(k => {
          counts[k] = tempCounts[k] || 0;
        });
      } else {
        Object.keys(counts).forEach(k => { counts[k] = 0; });
      }
    }

    setAiParams(prev => ({
      ...prev,
      formats: newFormats,
      formatCount: counts,
      formatPercent: percents,
      numQuestions: numQs,
      configMode: mode,
    }));
  };
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Selected Chapters & Lessons for AI generation (Support Selecting Multiple)
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);

  // Manual Builder
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualDuration, setManualDuration] = useState<number>(15);
  const [manualPurpose, setManualPurpose] = useState<string>('Kiểm tra thường xuyên');
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);

  // File Import
  const [rawText, setRawText] = useState<string>('');

  // AI TEST GENERATION ACTION
  const handleAIGenerateTest = async () => {
    setIsGenerating(true);
    
    // Join names of all selected Chapters and Lessons to feed the AI prompt nicely
    const chName = activeSubject.chapters
      .filter(c => selectedChapters.includes(c.id))
      .map(c => c.name)
      .join(", ") || 'Tài liệu toàn chương trình';

    const lesName = activeSubject.chapters
      .filter(c => selectedChapters.includes(c.id))
      .flatMap(c => c.lessons)
      .filter(l => selectedLessons.includes(l.id))
      .map(l => l.name)
      .join(", ") || 'Tất cả các bài trong mục chuyên đề';

    try {
      const response = await fetch('/api/gemini/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: activeSubject.name,
          grade: activeSubject.grade,
          book: activeSubject.book,
          chapterName: chName,
          lessonName: lesName,
          numQuestions: aiParams.numQuestions,
          duration: aiParams.duration,
          purpose: aiParams.purpose,
          formats: aiParams.formats,
          cognitivePercent: aiParams.cognitivePercent,
          formatPercent: aiParams.formatPercent,
          formatCount: aiParams.configMode === 'count' ? aiParams.formatCount : undefined,
          useRealLifeScenarios: aiParams.useRealLifeScenarios,
          clientApiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const generatedData = await response.json();
      if (generatedData && generatedData.questions) {
        const newQuestions: Question[] = generatedData.questions.map((q: any, idx: number) => {
          const qType = q.type || 'MCQ';
          const assignedPoints = formatPoints[qType] !== undefined ? formatPoints[qType] : 1.0;
          return {
            id: q.id || `AI-Q-${Date.now()}-${idx}`,
            subjectId: activeSubject.id,
            chapterId: selectedChapters[0] || activeSubject.chapters[0]?.id || '',
            lessonId: selectedLessons[0] || (selectedChapters[0] ? (activeSubject.chapters.find(c => c.id === selectedChapters[0])?.lessons[0]?.id || '') : '') || activeSubject.chapters[0]?.lessons[0]?.id || '',
            type: qType,
            level: q.level || 'Thông hiểu',
            content: q.content,
            options: q.options || undefined,
            matchingRight: q.matchingRight || undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Không có hướng dẫn giải.',
            learningOutcome: q.learningOutcome || 'Chuẩn yêu cầu cần đạt.',
            source: 'AI' as const,
            tags: ['AI Sinh Đề', aiParams.purpose],
            points: assignedPoints,
          };
        });

        const newTest: Test = {
          id: `TEST-AI-${Date.now()}`,
          title: generatedData.title || aiParams.title || `${aiParams.purpose} ${activeSubject.name} - ${activeSubject.grade}`,
          subjectId: activeSubject.id,
          grade: activeSubject.grade,
          chapterId: selectedChapters[0] || undefined,
          lessonId: selectedLessons[0] || undefined,
          duration: aiParams.duration,
          purpose: aiParams.purpose,
          questions: newQuestions,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'Nháp',
        };

        onSaveTest(newTest, newQuestions);
        onToast('Đã sinh đề thi và câu hỏi chi tiết từ Gemini thành công!', 'success');
      } else {
        throw new Error('Dữ liệu AI sinh không đúng tiêu chuẩn câu hỏi.');
      }
    } catch (error: any) {
      console.error(error);
      onToast(`Lỗi tạo đề AI: ${error.message || error}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // GENERATE FROM LOCAL QUESTION BANK (Đề thi lấy từ Kho câu hỏi)
  const handleGenerateFromQuestionBank = () => {
    const title = aiParams.title.trim() || `Đề thi ${aiParams.purpose} ${activeSubject.name} - Kho câu hỏi`;
    let eligibleQs = questions.filter(q => q.subjectId === activeSubject.id);

    // Filter by selected chapters if some are selected
    if (selectedChapters.length > 0) {
      eligibleQs = eligibleQs.filter(q => selectedChapters.includes(q.chapterId));
    }

    // Filter by selected lessons if some are selected
    if (selectedLessons.length > 0) {
      eligibleQs = eligibleQs.filter(q => selectedLessons.includes(q.lessonId));
    }

    // Filter by selected formats if selected
    if (aiParams.formats.length > 0) {
      eligibleQs = eligibleQs.filter(q => aiParams.formats.includes(q.type));
    }

    if (eligibleQs.length === 0) {
      onToast('Không tìm thấy câu hỏi tương thích theo các chương/bài/dạng đã chọn trong Kho học liệu!', 'error');
      return;
    }

    // Attempt to follow format percentage proportions if specified
    let selectedQs: Question[] = [];
    const formatsWithPcts = aiParams.formats.filter(fmt => (aiParams.formatPercent?.[fmt] || 0) > 0);
    
    if (formatsWithPcts.length > 0) {
      // Group eligible questions by format type
      const qsByFormat: Record<string, Question[]> = {};
      aiParams.formats.forEach(f => {
        qsByFormat[f] = eligibleQs.filter(q => q.type === f).sort(() => 0.5 - Math.random());
      });

      // Calculate desired counts based on percentages or absolute counts
      const totalPct = formatsWithPcts.reduce((sum, f) => sum + (aiParams.formatPercent?.[f] || 0), 0);
      
      const desiredCounts = formatsWithPcts.map(f => {
        if (aiParams.configMode === 'count') {
          return { format: f, desired: aiParams.formatCount?.[f] || 0 };
        }
        const pct = aiParams.formatPercent?.[f] || 0;
        const normalizedPct = totalPct > 0 ? (pct / totalPct) : (1 / formatsWithPcts.length);
        const count = Math.round(normalizedPct * aiParams.numQuestions);
        return { format: f, desired: count };
      });

      // Adjust total selected count to match numQuestions exactly
      let sumDesired = desiredCounts.reduce((sum, item) => sum + item.desired, 0);
      while (sumDesired !== aiParams.numQuestions && desiredCounts.length > 0) {
        if (sumDesired < aiParams.numQuestions) {
          desiredCounts[0].desired += 1;
          sumDesired += 1;
        } else {
          const itemToReduce = desiredCounts.find(d => d.desired > 0);
          if (itemToReduce) {
            itemToReduce.desired -= 1;
            sumDesired -= 1;
          } else {
            break;
          }
        }
      }

      // Pick the questions!
      desiredCounts.forEach(item => {
        const available = qsByFormat[item.format] || [];
        const toTake = Math.min(available.length, item.desired);
        selectedQs.push(...available.slice(0, toTake));
      });

      // If we couldn't satisfy the exact targets, backfill from remaining eligible questions
      if (selectedQs.length < aiParams.numQuestions) {
        const selectedIds = new Set(selectedQs.map(q => q.id));
        const remainingPool = eligibleQs
          .filter(q => !selectedIds.has(q.id))
          .sort(() => 0.5 - Math.random());
        const extraNeeded = aiParams.numQuestions - selectedQs.length;
        selectedQs.push(...remainingPool.slice(0, extraNeeded));
      }
    } else {
      // Simple fallback shuffle
      const shuffled = [...eligibleQs].sort(() => 0.5 - Math.random());
      selectedQs = shuffled.slice(0, aiParams.numQuestions);
    }

    if (selectedQs.length < aiParams.numQuestions) {
      onToast(`Hệ thống chỉ tìm thấy ${eligibleQs.length} câu thỏa mãn. Đã nạp toàn bộ ${eligibleQs.length} câu vào đề!`, 'info');
    }

    const newTest: Test = {
      id: `TEST-BANK-${Date.now()}`,
      title: title,
      subjectId: activeSubject.id,
      grade: activeSubject.grade,
      chapterId: selectedChapters[0] || undefined,
      lessonId: selectedLessons[0] || undefined,
      duration: aiParams.duration,
      purpose: aiParams.purpose,
      questions: selectedQs.map(q => ({
        ...q,
        points: formatPoints[q.type] !== undefined ? formatPoints[q.type] : (q.points !== undefined ? q.points : 1.0)
      })),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Nháp',
    };

    onSaveTest(newTest);
    onToast(`Đã biên soạn thành công đề thi ${selectedQs.length} câu tự động trích lọc từ Kho học liệu!`, 'success');
  };

  // MANUAL GENERATION
  const handleBuildManualTest = () => {
    if (!manualTitle.trim()) {
      onToast('Vui lòng nhập tên đề kiểm tra.', 'error');
      return;
    }
    if (selectedQIds.length === 0) {
      onToast('Vui lòng chọn ít nhất 1 câu hỏi đầu từ ngân hàng.', 'error');
      return;
    }

    const selectedQs = questions.filter((q) => selectedQIds.includes(q.id));
    const newTest: Test = {
      id: `TEST-MAN-${Date.now()}`,
      title: manualTitle,
      subjectId: activeSubject.id,
      grade: activeSubject.grade,
      duration: manualDuration,
      purpose: manualPurpose,
      questions: selectedQs.map(q => ({
        ...q,
        points: formatPoints[q.type] !== undefined ? formatPoints[q.type] : (q.points !== undefined ? q.points : 1.0)
      })),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Nháp',
    };

    onSaveTest(newTest);
    setManualTitle('');
    setSelectedQIds([]);
    onToast('Tạo đề thi thủ công thành công!', 'success');
  };

  // RAW FILE (.TXT) IMPORT
  const handleImportText = () => {
    if (!rawText.trim()) {
      onToast('Vui lòng nhập nội dung văn bản đúng định dạng.', 'error');
      return;
    }

    try {
      const lines = rawText.split('\n');
      let currentQ: Partial<Question> = {
        id: `Q-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        subjectId: activeSubject.id,
        source: 'Tệp tải lên',
        tags: ['Nhập từ Bản mẫu'],
      };
      
      const parsedList: Question[] = [];
      let tempOpts: string[] = [];

      lines.forEach((line) => {
        const tr = line.trim();
        if (tr.startsWith('[Chương]:')) {
          const name = tr.replace('[Chương]:', '').trim();
          const found = activeSubject.chapters.find((c) => c.name.includes(name));
          currentQ.chapterId = found ? found.id : (activeSubject.chapters[0]?.id || '');
        } else if (tr.startsWith('[Bài]:')) {
          const name = tr.replace('[Bài]:', '').trim();
          const found = activeSubject.chapters.flatMap((c) => c.lessons).find((l) => l.name.includes(name));
          currentQ.lessonId = found ? found.id : (activeSubject.chapters[0]?.lessons[0]?.id || '');
        } else if (tr.startsWith('[Dạng]:')) {
          currentQ.type = tr.replace('[Dạng]:', '').trim() as QuestionType;
        } else if (tr.startsWith('[Mức độ]:')) {
          currentQ.level = tr.replace('[Mức độ]:', '').trim() as CognitiveLevel;
        } else if (tr.startsWith('[Câu hỏi]:')) {
          currentQ.content = tr.replace('[Câu hỏi]:', '').trim();
        } else if (tr.startsWith('[A]:')) {
          tempOpts.push('A. ' + tr.replace('[A]:', '').trim());
        } else if (tr.startsWith('[B]:')) {
          tempOpts.push('B. ' + tr.replace('[B]:', '').trim());
        } else if (tr.startsWith('[C]:')) {
          tempOpts.push('C. ' + tr.replace('[C]:', '').trim());
        } else if (tr.startsWith('[D]:')) {
          tempOpts.push('D. ' + tr.replace('[D]:', '').trim());
        } else if (tr.startsWith('[Đáp án]:')) {
          currentQ.correctAnswer = tr.replace('[Đáp án]:', '').trim();
        } else if (tr.startsWith('[Lời giải]:')) {
          currentQ.explanation = tr.replace('[Lời giải]:', '').trim();
          if (tempOpts.length > 0) {
            currentQ.options = tempOpts;
          }
          if (currentQ.content && currentQ.correctAnswer) {
            parsedList.push(currentQ as Question);
          }
          // Reset for next question
          currentQ = {
            id: `Q-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            subjectId: activeSubject.id,
            chapterId: currentQ.chapterId,
            lessonId: currentQ.lessonId,
            source: 'Tệp tải lên',
            tags: ['Nhập từ Bản mẫu'],
          };
          tempOpts = [];
        }
      });

      if (parsedList.length === 0) {
        throw new Error('Vui lòng kiểm tra lại cấu trúc vạch đầu dòng.');
      }

      const withCustomPoints = parsedList.map(q => ({
        ...q,
        points: formatPoints[q.type] !== undefined ? formatPoints[q.type] : 1.0
      }));

      const newTest: Test = {
        id: `TEST-IMP-${Date.now()}`,
        title: `Đề thi nhập khẩu từ File - ${new Date().toLocaleDateString('vi-VN')}`,
        subjectId: activeSubject.id,
        grade: activeSubject.grade,
        duration: 20,
        purpose: 'Kiểm tra thường xuyên',
        questions: withCustomPoints,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Nháp',
      };

      onSaveTest(newTest, withCustomPoints);
      setRawText('');
      onToast(`Khởi tạo đề thi với ${parsedList.length} câu hỏi thành công!`, 'success');

    } catch (error: any) {
      onToast(`Lỗi định dạng cấu trúc: ${error.message || error}`, 'error');
    }
  };

  const filteredQuestions = questions.filter((q) => q.subjectId === activeSubject.id);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">
            BIÊN SOẠN & THIẾT KẾ ĐỀ TRẮC NGHIỆM ĐA TRẢI NGHIỆM
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Hỗ trợ tạo đề thi tự động bằng trí tuệ nhân tạo Gemini, hoặc tuyển lọc tích hợp lấy câu hỏi sẵn có từ Kho học liệu học liệu riêng.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 rounded-2xl w-max">
        <button 
          onClick={() => setSubTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'ai' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🤖 Đề Thi Tự Động / AI
        </button>
        <button 
          onClick={() => setSubTab('manual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'manual' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Tạo Đề Lấy Sẵn Thủ Công
        </button>
        <button 
          onClick={() => setSubTab('file')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'file' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📥 Nhập Từ Văn Bản .TXT
        </button>
      </div>

      {/* CONTENT TAB 1: AI GENERATOR / AUTOMATED */}
      {subTab === 'ai' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* L: PARAM FORM */}
          <div className="flex flex-col gap-4">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Thông số giáo vụ</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">TIÊU ĐỀ LẬP ĐỀ THI</label>
              <input 
                type="text"
                value={aiParams.title}
                onChange={(e) => setAiParams({ ...aiParams, title: e.target.value })}
                placeholder="Ví dụ: Đề khảo sát kiểm tra Số 1..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">SỐ LƯỢNG CÂU HỎI (Nhập số)</label>
                <input 
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={aiParams.numQuestions}
                  disabled={aiParams.configMode === 'count'}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    const val = isNaN(parsed) || parsed < 1 ? 1 : parsed;
                    
                    // Automatically trigger calculation of counts based on percents and the new numQuestions
                    const totalPct = aiParams.formats.reduce((sum, fmt) => sum + (aiParams.formatPercent?.[fmt] || 0), 0);
                    let allocated = 0;
                    const activeFormats = aiParams.formats.filter(fmt => (aiParams.formatPercent?.[fmt] || 0) > 0);
                    const counts = { ...aiParams.formatCount };

                    if (activeFormats.length > 0) {
                      const tempCounts: Record<string, number> = {};
                      activeFormats.forEach(fmt => {
                        const pct = aiParams.formatPercent?.[fmt] || 0;
                        const pctRatio = totalPct > 0 ? (pct / totalPct) : (1 / activeFormats.length);
                        tempCounts[fmt] = Math.floor(pctRatio * val);
                        allocated += tempCounts[fmt];
                      });

                      let remainder = val - allocated;
                      let i = 0;
                      while (remainder > 0 && activeFormats.length > 0) {
                        const fmt = activeFormats[i % activeFormats.length];
                        tempCounts[fmt] = (tempCounts[fmt] || 0) + 1;
                        remainder--;
                        i++;
                      }

                      Object.keys(counts).forEach(k => {
                        counts[k] = tempCounts[k] || 0;
                      });
                    }

                    setAiParams({ 
                      ...aiParams, 
                      numQuestions: val,
                      formatCount: counts
                    });
                  }}
                  placeholder="Ví dụ: 10..."
                  className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-bold ${
                    aiParams.configMode === 'count' ? 'opacity-70 bg-slate-100 cursor-not-allowed text-teal-800' : ''
                  }`}
                />
                {aiParams.configMode === 'count' && (
                  <span className="text-[9px] text-teal-700 font-extrabold block mt-1">
                    ✓ Tính tự động theo Số câu dưới
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">THỜI GIAN LÀM BÀI</label>
                <select 
                  value={aiParams.duration}
                  onChange={(e) => setAiParams({ ...aiParams, duration: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <option value={5}>5 phút</option>
                  <option value={10}>10 phút</option>
                  <option value={15}>15 phút</option>
                  <option value={20}>20 phút</option>
                  <option value={30}>30 phút</option>
                  <option value={45}>45 phút</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút</option>
                </select>
              </div>
            </div>

            {/* UPGRADE: CHAPTERS MULTI-SELECT CHECKBOX GRID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">CHƯƠNG CHỌN (Tích chọn một hoặc nhiều chương)</label>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {activeSubject.chapters.map(ch => {
                  const isChecked = selectedChapters.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedChapters(prev => prev.filter(id => id !== ch.id));
                          const lessonIdsOfChapter = ch.lessons.map(l => l.id);
                          setSelectedLessons(prev => prev.filter(id => !lessonIdsOfChapter.includes(id)));
                        } else {
                          setSelectedChapters(prev => [...prev, ch.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 select-none ${
                        isChecked 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-white' : 'bg-slate-300'}`}></span>
                      <span className="truncate max-w-[170px]">{ch.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPGRADE: LESSONS MULTI-SELECT CHECKBOX GRID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">BÀI HỌC CHỌN (Tích chọn một hoặc nhiều bài)</label>
              <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {selectedChapters.length === 0 ? (
                  <span className="text-[11px] text-slate-400 font-bold p-1 italic">Vui lòng bấm chọn ít nhất một "Chương học" ở trên để hiển thị danh mục...</span>
                ) : (
                  activeSubject.chapters
                    .filter(ch => selectedChapters.includes(ch.id))
                    .flatMap(ch => ch.lessons.map(le => ({ ...le, chName: ch.name })))
                    .map(le => {
                      const isChecked = selectedLessons.includes(le.id);
                      return (
                        <button
                          key={le.id}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedLessons(prev => prev.filter(id => id !== le.id));
                            } else {
                              setSelectedLessons(prev => [...prev, le.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 select-none ${
                            isChecked 
                              ? 'bg-teal-600 border-teal-600 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-white' : 'bg-slate-300'}`}></span>
                          <span className="truncate max-w-[190px]" title={`${le.chName} - ${le.name}`}>{le.name}</span>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* UPGRADE: EXAM REQUEST TYPE */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">DẠNG ĐỀ YÊU CẦU</label>
              <select 
                value={aiParams.purpose}
                onChange={(e) => setAiParams({ ...aiParams, purpose: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="Kiểm tra bài cũ">Kiểm tra bài cũ</option>
                <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên</option>
                <option value="Kiểm tra giữa kì">Kiểm tra giữa kì</option>
                <option value="Kiểm tra cuối kì">Kiểm tra cuối kì</option>
                <option value="Kiểm tra miệng đột xuất">Kiểm tra miệng đột xuất</option>
                <option value="Khảo sát đầu học kỳ">Khảo sát đầu học kỳ</option>
                <option value="Ôn tập bồi dưỡng">Ôn tập bồi dưỡng</option>
              </select>
            </div>
          </div>

          {/* R: COGNITIVE LEVEL PARAMETERS */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Cơ cấu mức nhận thức</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(aiParams.cognitivePercent).map((lvl) => (
                <div key={lvl} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{lvl}</span>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="10" 
                      value={aiParams.cognitivePercent[lvl as keyof typeof aiParams.cognitivePercent]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAiParams({
                          ...aiParams,
                          cognitivePercent: {
                            ...aiParams.cognitivePercent,
                            [lvl]: val
                          }
                        });
                      }}
                      className="accent-emerald-600 h-1 bg-slate-200 rounded flex-grow cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 min-w-[32px] text-right">
                      {aiParams.cognitivePercent[lvl as keyof typeof aiParams.cognitivePercent]}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="flex border-b border-slate-200 pb-2 mb-3 items-center justify-between">
                <span className="block text-xs font-bold text-slate-500 uppercase">Loại định dạng câu hỏi trong đề</span>
                
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => updateFormatParams(aiParams.formats, aiParams.formatCount, aiParams.formatPercent, 'percent')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${aiParams.configMode === 'percent' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Tính theo Tỷ lệ (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFormatParams(aiParams.formats, aiParams.formatCount, aiParams.formatPercent, 'count')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${aiParams.configMode === 'count' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Tính theo Số câu
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-slate-400">THIẾT LẬP PHÂN LOẠI</span>
                {aiParams.configMode === 'count' ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    TỔNG SỐ CÂU: {aiParams.numQuestions} câu
                  </span>
                ) : (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    Object.keys(aiParams.formatPercent || {}).filter(k => aiParams.formats.includes(k as QuestionType)).reduce((s, k) => s + (aiParams.formatPercent?.[k] || 0), 0) === 100 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-850 animate-pulse'
                  }`}>
                    TỔNG TỶ LỆ: {Object.keys(aiParams.formatPercent || {}).filter(k => aiParams.formats.includes(k as QuestionType)).reduce((s, k) => s + (aiParams.formatPercent?.[k] || 0), 0)}%
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-bold font-sans">
                  {['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'SHORT_ESSAY'].map((fmt) => {
                    const isChecked = aiParams.formats.includes(fmt as QuestionType);
                    const currentPercent = aiParams.formatPercent?.[fmt] || 0;
                    const currentCount = aiParams.formatCount?.[fmt] || 0;
                    
                    return (
                      <div key={fmt} className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isChecked ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}>
                        <label className="flex items-start gap-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                            onChange={(e) => {
                              const active = e.target.checked;
                              const fmts = [...aiParams.formats];
                              const counts = { ...(aiParams.formatCount || { MCQ: 5, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                              const percents = { ...(aiParams.formatPercent || { MCQ: 100, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                              
                              if (active) {
                                if (!fmts.includes(fmt as QuestionType)) fmts.push(fmt as QuestionType);
                                counts[fmt] = counts[fmt] || 5; 
                                const sumSelected = Object.keys(percents).filter(k => fmts.includes(k as QuestionType) && k !== fmt).reduce((s, k) => s + percents[k], 0);
                                percents[fmt] = sumSelected < 100 ? (100 - sumSelected) : 20;
                              } else {
                                const i = fmts.indexOf(fmt as QuestionType);
                                if (i !== -1) fmts.splice(i, 1);
                                counts[fmt] = 0;
                                percents[fmt] = 0;
                              }
                              
                              updateFormatParams(fmts, counts, percents, aiParams.configMode || 'count');
                            }}
                          />
                          <span className="truncate leading-tight">{
                            fmt === 'MCQ' ? 'Bốn lựa chọn' :
                            fmt === 'TRUE_FALSE' ? 'Đúng/Sai' :
                            fmt === 'SHORT_ANSWER' ? 'Điền từ ngắn' :
                            fmt === 'MATCHING' ? 'Ghép cặp' : 'Tự luận'
                          }</span>
                        </label>
                        
                        {isChecked && (
                          <div className="mt-2 text-right">
                            {aiParams.configMode === 'count' ? (
                              <div className="flex items-center justify-end gap-1 bg-emerald-50 rounded-lg p-0.5 border border-emerald-100 max-w-max ml-auto shadow-xs">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const counts = { ...(aiParams.formatCount || { MCQ: 5, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                                    counts[fmt] = Math.max(1, (counts[fmt] || 1) - 1);
                                    updateFormatParams(aiParams.formats, counts, aiParams.formatPercent, 'count');
                                  }}
                                  className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-50 cursor-pointer shadow-xs select-none"
                                >
                                  -
                                </button>
                                <span className="text-[10px] px-1.5 font-bold font-mono text-emerald-950">
                                  {currentCount} câu
                                </span>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const counts = { ...(aiParams.formatCount || { MCQ: 5, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                                    counts[fmt] = (counts[fmt] || 0) + 1;
                                    updateFormatParams(aiParams.formats, counts, aiParams.formatPercent, 'count');
                                  }}
                                  className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-50 cursor-pointer shadow-xs select-none"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                {currentPercent}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Range Sliders for Active Formats */}
                {aiParams.formats.length > 0 && (
                  <div className="mt-2.5 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-2.5 animate-fadeIn font-sans">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {aiParams.configMode === 'count' ? 'Cấu hình số câu dạng đề:' : 'Thiết lập tỷ lệ chi tiết:'}
                    </span>
                    <div className="space-y-3">
                      {aiParams.formats.map((fmt) => {
                        const currentPercent = aiParams.formatPercent?.[fmt] || 0;
                        const currentCount = aiParams.formatCount?.[fmt] || 0;
                        const label = fmt === 'MCQ' ? 'Bốn lựa chọn' :
                                      fmt === 'TRUE_FALSE' ? 'Đúng/Sai' :
                                      fmt === 'SHORT_ANSWER' ? 'Điền từ ngắn' :
                                      fmt === 'MATCHING' ? 'Ghép cặp' : 'Tự luận';
                        
                        return (
                          <div key={fmt} className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-center text-xs text-slate-700">
                              <span className="font-semibold">{label}</span>
                              <span className="font-extrabold font-mono text-slate-850">
                                {aiParams.configMode === 'count' ? `${currentCount} câu (${currentPercent}%)` : `${currentPercent}%`}
                              </span>
                            </div>
                            {aiParams.configMode === 'count' ? (
                              <input 
                                type="range"
                                min="1"
                                max="50"
                                step="1"
                                value={currentCount}
                                className="accent-emerald-600 h-1 bg-slate-100 rounded w-full cursor-pointer"
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const counts = { ...(aiParams.formatCount || { MCQ: 5, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                                  counts[fmt] = val;
                                  updateFormatParams(aiParams.formats, counts, aiParams.formatPercent, 'count');
                                }}
                              />
                            ) : (
                              <input 
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={currentPercent}
                                className="accent-emerald-600 h-1 bg-slate-100 rounded w-full cursor-pointer"
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const percents = { ...(aiParams.formatPercent || { MCQ: 100, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                                  percents[fmt] = val;
                                  updateFormatParams(aiParams.formats, aiParams.formatCount, percents, 'percent');
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick helper to even out proportions */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const fmtsCount = aiParams.formats.length;
                          if (fmtsCount === 0) return;
                          
                          if (aiParams.configMode === 'count') {
                            const counts = { ...(aiParams.formatCount || { MCQ: 5, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                            aiParams.formats.forEach((f) => {
                              counts[f] = 5;
                            });
                            updateFormatParams(aiParams.formats, counts, aiParams.formatPercent, 'count');
                          } else {
                            const base = Math.floor(100 / fmtsCount);
                            const remainder = 100 % fmtsCount;
                            const percents = { ...(aiParams.formatPercent || { MCQ: 100, TRUE_FALSE: 0, SHORT_ANSWER: 0, SHORT_ESSAY: 0 }) };
                            
                            Object.keys(percents).forEach(k => { percents[k] = 0; });
                            aiParams.formats.forEach((fmt, idx) => {
                              percents[fmt] = base + (idx < remainder ? 1 : 0);
                            });
                            updateFormatParams(aiParams.formats, aiParams.formatCount, percents, 'percent');
                          }
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer hover:bg-slate-50 px-2.5 py-1 rounded-lg"
                      >
                        {aiParams.configMode === 'count' ? 'Đặt đều: 5 câu / dạng' : 'Chia đều tỷ lệ (%)'}
                      </button>

                      {aiParams.configMode === 'percent' && Object.keys(aiParams.formatPercent || {}).filter(k => aiParams.formats.includes(k as QuestionType)).reduce((s, k) => s + (aiParams.formatPercent?.[k] || 0), 0) !== 100 && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                          Khuyên dùng: Tổng cần bằng 100%
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* THIẾT LẬP ĐIỂM SỐ THEO LOẠI CÂU HỎI */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-3 mt-1 text-left">
              <div className="flex items-center gap-2 text-indigo-800">
                <span className="text-sm">🎯</span>
                <span className="block text-[11px] font-extrabold uppercase tracking-wider">
                  Thiết lập điểm theo loại câu hỏi
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full font-bold ml-auto font-sans">Định cấu hình</span>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
                Chủ động gán điểm cơ sở cho từng dạng câu khi sinh hoặc trích lọc đề mới để phân chia trọng số:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* MCQ */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/85 flex flex-col gap-1.5 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide truncate">Bốn lựa chọn</span>
                  <div className="flex items-center justify-between gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200 shadow-3xs">
                    <button 
                      type="button"
                      onClick={() => setFormatPoints(prev => ({ ...prev, MCQ: Math.max(0, Math.round((prev.MCQ - 0.25) * 100) / 100) }))}
                      className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-750 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-100 cursor-pointer select-none"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-black font-mono text-slate-800">
                      {formatPoints.MCQ}đ
                    </span>
                    <button 
                      type="button"
                      onClick={() => setFormatPoints(prev => ({ ...prev, MCQ: Math.round((prev.MCQ + 0.25) * 100) / 100 }))}
                      className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-750 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-100 cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* TRUE_FALSE */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/85 flex flex-col gap-1.5 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide truncate">Đúng / Sai</span>
                  <div className="flex items-center justify-between gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200 shadow-3xs">
                    <button 
                      type="button"
                      onClick={() => setFormatPoints(prev => ({ ...prev, TRUE_FALSE: Math.max(0, Math.round((prev.TRUE_FALSE - 0.25) * 100) / 100) }))}
                      className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-750 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-100 cursor-pointer select-none"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-black font-mono text-slate-800">
                      {formatPoints.TRUE_FALSE}đ
                    </span>
                    <button 
                      type="button"
                      onClick={() => setFormatPoints(prev => ({ ...prev, TRUE_FALSE: Math.round((prev.TRUE_FALSE + 0.25) * 100) / 100 }))}
                      className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-750 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-100 cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* SHORT_ANSWER */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/85 flex flex-col gap-1.5 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide truncate">Điền từ ngắn</span>
                  <div className="flex items-center justify-between gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200 shadow-3xs">
                    <button 
                      type="button"
                      onClick={() => setFormatPoints(prev => {
                        const nextV = Math.max(0, Math.round((prev.SHORT_ANSWER - 0.25) * 100) / 100);
                        return { ...prev, SHORT_ANSWER: nextV, FILL_BLANK: nextV };
                      })}
                      className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-750 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-100 cursor-pointer select-none"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-black font-mono text-slate-800">
                      {formatPoints.SHORT_ANSWER}đ
                    </span>
                    <button 
                      type="button"
                      onClick={() => setFormatPoints(prev => {
                        const nextV = Math.round((prev.SHORT_ANSWER + 0.25) * 100) / 100;
                        return { ...prev, SHORT_ANSWER: nextV, FILL_BLANK: nextV };
                      })}
                      className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-750 flex items-center justify-center font-extrabold text-[10px] hover:bg-slate-100 cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* ESTIMATED GRAND TOTAL */}
              <div className="text-[10.5px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl flex items-center justify-between font-sans mt-0.5">
                <span className="flex items-center gap-1">📊 Tổng điểm gốc trong đề thi mới:</span>
                <span className="font-extrabold text-indigo-900 font-mono">
                  {(() => {
                    let total = 0;
                    aiParams.formats.forEach(f => {
                      const count = aiParams.formatCount[f] || 0;
                      const pts = formatPoints[f] || 1.0;
                      total += count * pts;
                    });
                    const isExactly10 = Math.abs(total - 10.0) < 0.05;
                    return (
                      <span className={isExactly10 ? "text-emerald-700" : "text-amber-700"}>
                        {total.toFixed(2)}đ{isExactly10 ? " (Chuẩn 10.0đ ✅)" : " (Sẽ quy về hệ 10 ⚠️)"}
                      </span>
                    );
                  })()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
              <input 
                type="checkbox" 
                id="scenario"
                checked={aiParams.useRealLifeScenarios}
                onChange={(e) => setAiParams({ ...aiParams, useRealLifeScenarios: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="scenario" className="text-xs text-slate-600 font-bold cursor-pointer">
                Tải các câu hỏi chứa tình huống thực tế giáo khoa xã hội
              </label>
            </div>

            {/* UPGRADE: DOUBLE GENERATION CAPABILITY ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleAIGenerateTest}
                disabled={isGenerating || aiParams.formats.length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:from-slate-400 text-white font-extrabold text-[11px] md:text-xs rounded-xl tracking-wide shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? 'AI đang viết đề...' : 'Tạo Đề Bằng AI'}
              </button>

              <button
                type="button"
                onClick={handleGenerateFromQuestionBank}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-[11px] md:text-xs rounded-xl tracking-wide shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Đề thi lấy từ Kho câu hỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: MANUAL BUILDER */}
      {subTab === 'manual' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">TÊN ĐỀ KIỂM TRA</label>
              <input 
                type="text" 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Nhập tên đề kiểm tra..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">THỜI GIAN (PHÚT)</label>
              <input 
                type="number" 
                value={manualDuration}
                onChange={(e) => setManualDuration(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">DANH MỤC ĐỀ</label>
              <select 
                value={manualPurpose}
                onChange={(e) => setManualPurpose(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-semibold cursor-pointer"
              >
                <option value="Kiểm tra bài cũ">Kiểm tra bài cũ</option>
                <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên</option>
                <option value="Kiểm tra giữa kì">Kiểm tra giữa kì</option>
                <option value="Kiểm tra cuối kì">Kiểm tra cuối kì</option>
                <option value="Kiểm tra miệng đột xuất">Kiểm tra miệng đột xuất</option>
                <option value="Khảo sát đầu học kỳ">Khảo sát đầu học kỳ</option>
                <option value="Ôn tập bồi dưỡng">Ôn tập bồi dưỡng</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs py-1 px-3 bg-emerald-50 rounded-xl border border-emerald-200/50">
            <span className="font-bold text-emerald-800">Đã tích chọn {selectedQIds.length} câu hỏi</span>
            <button 
              onClick={() => setSelectedQIds(filteredQuestions.map(q => q.id))}
              className="text-emerald-700 hover:underline font-bold"
            >
              Chọn tất cả
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">Chọn</th>
                  <th className="p-3">Mã câu</th>
                  <th className="p-3">Dạng - Mức độ</th>
                  <th className="p-3">Nội dung câu hỏi tóm lược</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all">
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedQIds.includes(q.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                        onChange={(e) => {
                          const val = e.target.checked;
                          setSelectedQIds(prev =>
                            val ? [...prev, q.id] : prev.filter(i => i !== q.id)
                          );
                        }}
                      />
                    </td>
                    <td className="p-3 font-mono text-slate-500 font-bold">{q.id}</td>
                    <td className="p-3 font-semibold text-slate-700">
                      <div className="flex flex-col">
                        <span>{q.type}</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50/75 px-1 py-0.2 rounded w-max mt-0.5">{q.level}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      <MathRenderer text={q.content} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={handleBuildManualTest}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all"
            >
              ✓ Xác Nhận Tạo Đề Kiểm Tra
            </button>
          </div>
        </div>
      )}

      {/* CONTENT TAB 3: FILE IMPORT */}
      {subTab === 'file' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn text-xs">
          <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">📋 Mẫu tệp .TXT hợp lệ:</span>
            <div className="bg-slate-900 border border-slate-800 text-emerald-400 p-3.5 rounded-xl font-mono text-[10px] space-y-1 select-all cursor-pointer">
              <p>{"[Chương]: Chương I"}</p>
              <p>{"[Bài]: Bài 1: Tập hợp"}</p>
              <p>{"[Dạng]: MCQ"}</p>
              <p>{"[Mức độ]: Nhận biết"}</p>
              <p>{"[Câu hỏi]: Cho tập hợp $A = \\\\{1; 2\\\\}$ ?"}</p>
              <p>{"[A]: 1 phần tử"}</p>
              <p>{"[B]: 2 phần tử"}</p>
              <p>{"[C]: 3 phần tử"}</p>
              <p>{"[Đáp án]: B"}</p>
              <p>{"[Lời giải]: Liệt kê có 1 và 2 tức có 2 phần tử."}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-700">Dán dữ liệu thô:</span>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Dán nội dung tệp soạn thảo văn bản đúng mẫu vào đây để bóc tách..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl min-h-[160px] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
            />
            <button
              onClick={handleImportText}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase cursor-pointer"
            >
              ✓ Đồng Bộ Và Sinh Đề Từ File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
