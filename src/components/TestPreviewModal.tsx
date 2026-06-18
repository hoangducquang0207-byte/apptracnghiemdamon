import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Test, SubjectConfig, Question, normalizeQuestion } from '../types';
import { MathRenderer } from './MathRenderer';
import { Printer, Eye, EyeOff, X, FileText, CheckCircle2, Download } from 'lucide-react';

const convertToWordMathML = (text: string | undefined): string => {
  if (!text) return '';
  try {
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
          if (match) {
            let clean = match[0]
              .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '')
              .replace(/<semantics>/g, '')
              .replace(/<\/semantics>/g, '');
            if (!clean.includes('xmlns="http://www.w3.org/1998/Math/MathML"')) {
              clean = clean.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"');
            }
            return clean;
          }
          return part;
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
          if (match) {
            let clean = match[0]
              .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '')
              .replace(/<semantics>/g, '')
              .replace(/<\/semantics>/g, '');
            if (!clean.includes('xmlns="http://www.w3.org/1998/Math/MathML"')) {
              clean = clean.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"');
            }
            return clean;
          }
          return part;
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

interface TestPreviewModalProps {
  test: Test;
  activeSubject: SubjectConfig;
  onClose: () => void;
}

export const TestPreviewModal: React.FC<TestPreviewModalProps> = ({
  test,
  activeSubject,
  onClose,
}) => {
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [showPrintHint, setShowPrintHint] = useState<boolean>(false);
  const examCode = test.id ? parseInt(test.id.replace(/[^0-9]/g, '')) % 900 + 101 : 205;

  const handlePrint = () => {
    setShowPrintHint(true);
    try {
      window.print();
    } catch (err) {
      console.error("Window print was blocked by iframe sandbox restriction:", err);
    }
    // Always trigger downloading the self-printing HTML file to guarantee and secure the user's workflow offline!
    handleDownloadHtml(true);
  };

  const handleDownloadHtml = (autoPrint = false) => {
    // Process and normalize questions as done in rendering
    const normalizedQuestions = (test.questions || []).map(normalizeQuestion);

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
    
    // Generate each sections HTML string
    let downloadGlobalQNum = 0;
    const sectionsHtml = sections.map((sec, secIdx) => {
      const questionsListHtml = sec.questions.map((q, idx) => {
        const currentQNum = ++downloadGlobalQNum;
        let questionBody = '';

        if (q.type === 'MCQ' && q.options && q.options.length > 0) {
          questionBody = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pl-4 text-xs font-sans text-slate-700">
              ${q.options.map(opt => `<div class="flex items-start"><span>${convertToWordMathML(opt)}</span></div>`).join('')}
            </div>
          `;
        } else if (q.type === 'TRUE_FALSE' && q.options && q.options.length > 0) {
          const alphaLabels = ['a', 'b', 'c', 'd'];
          questionBody = `
            <div class="mt-2 pl-4 text-xs font-sans text-slate-700 space-y-1.5" style="max-width: 650px;">
              ${q.options.map((opt, oI) => {
                const cleanOpt = opt.replace(/^[a-zA-Z0-9]\.\s*|^[a-zA-Z0-9]\)\s*/, '');
                return `
                  <div class="flex items-start justify-between gap-4 p-1.5 bg-slate-50 border border-slate-100/60 rounded-lg">
                    <div class="flex-1">
                      <strong class="text-indigo-950 font-bold mr-1">${alphaLabels[oI]})</strong> ${convertToWordMathML(cleanOpt)}
                    </div>
                    <div class="flex items-center gap-3 text-[10px] text-slate-500 shrink-0 font-bold whitespace-nowrap pl-4">
                      <span class="flex items-center gap-1">
                        <span style="width:10px; height:10px; border-radius:50%; border:1px solid #777; display:inline-block;"></span> Đúng
                      </span>
                      <span class="flex items-center gap-1">
                        <span style="width:10px; height:10px; border-radius:50%; border:1px solid #777; display:inline-block;"></span> Sai
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        } else if (q.type === 'MATCHING' && q.options && q.matchingRight) {
          questionBody = `
            <div class="grid grid-cols-2 gap-4 mt-2 pl-4 max-w-lg text-xs font-sans text-slate-700">
              <div class="space-y-1">
                <span class="block text-[10px] text-slate-400 font-extrabold uppercase">Cột vế trái:</span>
                ${q.options.map((opt, oI) => `<div class="p-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">${oI}) ${convertToWordMathML(opt)}</div>`).join('')}
              </div>
              <div class="space-y-1">
                <span class="block text-[10px] text-slate-400 font-extrabold uppercase">Cột vế phải:</span>
                ${q.matchingRight.map((mr, mrI) => `<div class="p-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">${mrI}) ${convertToWordMathML(mr)}</div>`).join('')}
              </div>
            </div>
          `;
        } else if (q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK' || q.type === 'SHORT_ESSAY') {
          questionBody = `
            <div class="pl-4 mt-2 text-xs text-slate-400 italic font-sans">
              ............................................................................................................................................................................................................
            </div>
          `;
        }

        let answersHtml = '';
        if (showAnswers) {
          const renderedCorrectAnswer = convertToWordMathML(q.correctAnswer);
          const renderedExplanation = convertToWordMathML(q.explanation);
          answersHtml = `
            <div class="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-sans">
              <div class="flex items-center gap-1.5 font-extrabold text-emerald-800">
                <span>✓ Đáp án chuẩn: </span>
                <span class="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">${renderedCorrectAnswer}</span>
              </div>
              <div class="text-slate-700 mt-1 leading-relaxed">
                <strong>Lời giải chi tiết: </strong> ${renderedExplanation}
              </div>
              ${q.learningOutcome ? `<div class="text-[10px] text-slate-400 mt-1"><strong>Mục tiêu: </strong> ${q.learningOutcome}</div>` : ''}
            </div>
          `;
        }

        return `
          <div class="flex flex-col gap-1 py-1.5 break-inside-avoid">
            <div class="font-extrabold text-slate-800 leading-normal">
              <span>Câu ${currentQNum}. </span>
              <span>${convertToWordMathML(q.content)}</span>
              <span class="ml-1.5 font-normal text-[9px] font-sans text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded-full no-print">${q.level}</span>
              <span class="ml-1 font-extrabold text-[9px] font-sans text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-full">(${q.points !== undefined ? q.points : 1.0}đ)</span>
            </div>
            ${questionBody}
            ${answersHtml}
          </div>
        `;
      }).join('<div class="h-4"></div>');

      return `
        <div class="space-y-4">
          <div class="border-l-4 border-emerald-600 pl-2.5 py-0.5 font-sans font-extrabold text-emerald-900 text-sm uppercase tracking-wide">
            PHẦN ${romanNumerals[secIdx]}: ${sec.title}
          </div>
          ${sec.description ? `<div class="text-xs text-slate-500 italic pl-3 font-sans">(${sec.description})</div>` : ''}
          <div class="space-y-4 pl-2.5">
            ${questionsListHtml}
          </div>
        </div>
      `;
    }).join('<div class="h-8"></div>');

    const schoolNameStr = activeSubject.schoolName ? activeSubject.schoolName.toUpperCase() : 'TRƯỜNG THCS ARCHIMEDES ACADEMY';
    const purposeStr = test.purpose ? test.purpose.toUpperCase() : 'ĐỀ KHẢO SÁT CHẤT LƯỢNG';
    const subjectNameStr = activeSubject.name.toUpperCase();
    
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${test.title || 'Mẫu Đề Thi Chuẩn Quốc Gia'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
    body {
      font-family: 'Playfair Display', Georgia, serif;
      background: #ffffff;
      color: #1a1a1a;
    }
    .font-sans {
      font-family: 'Inter', system-ui, sans-serif !important;
    }
    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      @page {
        size: A4;
        margin: 1.5cm;
      }
    }
    .break-inside-avoid {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body class="p-4 md:p-8 max-w-4xl mx-auto">
  
  <!-- CONTROL PANEL BANNER -->
  <div class="no-print mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-indigo-950">
    <div>
      <h4 class="font-extrabold text-sm text-indigo-900 mb-0.5">📚 Bản In Offline Hỗ Trợ Đầy Đủ Công Thức Toán Học / Vật Lý</h4>
      <p class="text-indigo-600 font-medium">Được tối ưu để in trực tiếp bằng trình duyệt mà không lo bị lệch dòng hay vỡ khung.</p>
    </div>
    <div class="flex gap-2 shrink-0">
      <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 header-btn">
        🖨️ Click Để In Đề Thi / Lưu PDF
      </button>
    </div>
  </div>

  <div class="p-6 md:p-10 border border-slate-150 rounded-3xl bg-white shadow-xs print:border-none print:shadow-none print:p-0">
    
    <!-- HEADER -->
    <div class="grid grid-cols-2 gap-4 pb-6 border-b-2 border-double border-slate-400 text-xs md:text-sm text-center font-sans font-bold">
      <div class="flex flex-col gap-1">
        <span class="uppercase tracking-wide">TRƯỜNG: ${schoolNameStr}</span>
        <div style="width: 80px; height: 1.5px; background: #ccc; margin: 4px auto;"></div>
        <span class="text-emerald-800 text-xs font-black uppercase tracking-wider">MÃ ĐỀ THI: ${examCode}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="uppercase tracking-wide">${purposeStr}</span>
        <span>MÔN HỌC: ${subjectNameStr} - LỚP: ${test.grade}</span>
        <span class="font-normal italic text-slate-500 text-[11px]">Thời gian làm bài: ${test.duration} phút (Không kể phát đề)</span>
      </div>
    </div>

    <!-- STUDENT IDENTITY TABLE -->
    <table class="w-full mt-4 text-xs md:text-sm font-sans mb-8">
      <tbody>
        <tr>
          <td class="py-2" style="width: 70%; border-bottom: 1px dashed #ccc;">
            Họ và tên thí sinh: ............................................................................
          </td>
          <td class="py-2" style="width: 15%; border-bottom: 1px dashed #ccc;">
            Lớp: .............................
          </td>
          <td class="py-2" style="width: 15%; border-bottom: 1px dashed #ccc;">
            SBD: .............................
          </td>
        </tr>
      </tbody>
    </table>

    <!-- GUIDELINES -->
    <div class="text-center italic text-xs md:text-sm text-slate-500 mb-6 font-sans">
      (Thí sinh làm bài trực tiếp vào phiếu trả lời hoặc giấy làm bài riêng. Không sử dụng tài liệu.)
    </div>

    <!-- QUESTIONS CONTENT -->
    <div class="space-y-8 mt-4 text-sm leading-relaxed">
      ${sectionsHtml}
    </div>

    <!-- FOOTER SIGNATURE -->
    <div class="mt-14 pt-6 border-t border-dashed border-slate-200 flex flex-col items-center gap-1 text-center font-sans">
      <span class="font-bold text-xs md:text-sm tracking-wide uppercase">---------------- HẾT ----------------</span>
      <span class="text-xs text-slate-400 italic">Thí sinh không bắt đầu sử dụng tài liệu. Giám thị không giải thích gì thêm trong phòng thi.</span>
    </div>

  </div>

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\\\(', right: '\\\\)', display: false},
          {left: '\\\\[', right: '\\\\]', display: true}
        ],
        throwOnError : false
      });
      ${autoPrint ? `
      // Auto-trigger native print dialog for sandboxed iframe fallback
      setTimeout(function() {
        window.print();
      }, 700);
      ` : ''}
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = autoPrint 
      ? `IN_DE_THI_${test.title.replace(/\s+/g, '_') || 'TuDong'}.html`
      : `DeThi_${test.title.replace(/\s+/g, '_') || 'QuocGia'}.html`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="test-preview-modal-root" className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto print:static print:bg-white print:p-0">
      
      {/* Dynamic override for printer window sizing & hides parent UI elements completely */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide parent application layout */
          #root > div.min-h-screen > *:not(#test-preview-modal-root) {
            display: none !important;
          }
          
          html, body {
            background: white !important;
            color: black !important;
            overflow: visible !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #test-preview-modal-root {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            z-index: auto !important;
            backdrop-filter: none !important;
          }

          #test-preview-card {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #printable-test-sheet {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }

          .print\\:hidden, button, header, [class*="print:hidden"] {
            display: none !important;
          }

          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}} />
      <div id="test-preview-card" className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:rounded-none print:max-h-none print:overflow-visible">
        
        {/* ACTION BAR (Hidden during printing) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base">Mẫu Đề Thi Chuẩn Quốc Gia</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showAnswers 
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswers ? 'Ẩn đáp án chi tiết' : 'Hiện đáp án chi tiết'}
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải tệp HTML in ấn ngoại tuyến dự phòng cực chuẩn nếu tính năng In trực tiếp bị iFrame sandboxed chặn"
            >
              <Download className="w-4 h-4" />
              <span>In Offline (.HTML)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In trực tiếp / Lưu PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-all cursor-pointer"
              title="Đóng bản xem trước"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PAPER SHEET BODY (Scrollable on UI, pristine on physical A4 printouts) */}
        <div id="printable-test-sheet" className="flex-grow overflow-y-auto p-6 md:p-10 font-serif leading-relaxed text-slate-900 bg-white selection:bg-indigo-100 print:overflow-visible print:p-0 print:text-black">
          
          {showPrintHint && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-3xl text-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn print:hidden shadow-xs shrink-0 font-sans">
              <div className="flex-grow space-y-1">
                <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-1.5 leading-none">
                  ⚡ Đã bắt đầu tiến trình In trực tiếp & Xuất tệp PDF!
                </h4>
                <p className="text-xs text-indigo-700 leading-relaxed font-semibold">
                  Do chính sách bảo mật Sandbox của khung nhúng trình duyệt (iFrame) có thể chặn hộp thoại In trực tiếp: 
                  <strong className="text-indigo-900 font-black"> Hệ thống đã kích hoạt tải xuống tệp tự động mở nhanh hộp thoại In (.html) dự phòng.</strong>
                </p>
                <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                  👉 Bạn chỉ việc <strong className="text-slate-800 font-extrabold">nháy đúp chuột vào tệp HTML vừa tải về</strong> trên máy tính, tệp sẽ tự động kích hoạt hộp thoại căn lề in chuẩn 100% tức thì!
                </div>
              </div>
              <button
                onClick={() => setShowPrintHint(false)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Đã hiểu
              </button>
            </div>
          )}
          
          {/* HEADER ROW AS PRESCRIBED BY NATIONAL SCHOOL GUIDELINES */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b-2 border-double border-slate-350 text-xs md:text-sm text-center font-bold">
            <div className="flex flex-col gap-1">
              <span className="uppercase text-[11px] md:text-xs text-slate-700 tracking-wide print:text-black">
                TRƯỜNG: {activeSubject.schoolName ? activeSubject.schoolName.toUpperCase() : 'THCS ARCHIMEDES ACADEMY'}
              </span>
              <div className="w-24 h-0.5 bg-slate-200 mx-auto mt-1 print:border-b"></div>
              <span className="text-[10px] md:text-xs font-extrabold mt-1 uppercase text-emerald-800 print:text-black tracking-wider">
                MÃ ĐỀ THI: {examCode}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="uppercase text-[11px] md:text-xs text-slate-800 tracking-wide print:text-black">
                {test.purpose ? test.purpose.toUpperCase() : 'ĐỀ KHẢO SÁT CHẤT LƯỢNG'}
              </span>
              <span className="text-[10px] md:text-[11px] font-semibold text-slate-600 print:text-black">
                MÔN HỌC: {activeSubject.name.toUpperCase()} - LỚP: {test.grade}
              </span>
              <span className="text-[10px] md:text-[11px] font-normal italic text-slate-500 print:text-black">
                Thời gian làm bài: {test.duration} phút (Không kể thời gian phát đề)
              </span>
            </div>
          </div>

          {/* STUDENT IDENTIFICATION BOX */}
          <table className="w-full mt-4 border-collapse text-xs md:text-sm font-sans mb-8 print:text-black">
            <tbody>
              <tr>
                <td className="py-2 w-[70%] border-b border-dashed border-slate-300">
                  Họ và tên thí sinh: ............................................................................
                </td>
                <td className="py-2 w-[15%] border-b border-dashed border-slate-300">
                  Lớp: .............................
                </td>
                <td className="py-2 w-[15%] border-b border-dashed border-slate-300">
                  SBD: .............................
                </td>
              </tr>
            </tbody>
          </table>

          {/* GUIDELINE SENTENCE */}
          <div className="text-center italic text-xs md:text-sm text-slate-500 mb-6 font-sans print:text-black">
            (Thí sinh làm bài trực tiếp vào phiếu trả lời hoặc giấy làm bài riêng. Không sử dụng tài liệu.)
          </div>

          {/* QUESTION CONTAINER */}
          <div className="space-y-6 md:space-y-8 text-neutral-800 text-[13px] md:text-sm print:text-black">
            
            {(() => {
              const normalizedQuestions = (test.questions || []).map(normalizeQuestion);

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
              let globalQNum = 0;

              return sections.map((sec, secIdx) => (
                <div key={sec.id} className="space-y-4 md:space-y-5">
                  {/* Section Title */}
                  <div className="border-l-4 border-emerald-600 pl-2.5 py-0.5 font-sans font-extrabold text-emerald-990 text-xs md:text-sm uppercase tracking-wide print:border-l-4 print:text-black">
                    PHẦN {romanNumerals[secIdx]}: {sec.title}
                  </div>
                  {sec.description && (
                    <div className="text-[11px] md:text-xs text-slate-500 italic pl-3 font-sans print:text-black">
                      ({sec.description})
                    </div>
                  )}

                  <div className="space-y-6 pl-2.5">
                    {sec.questions.map((q, idx) => {
                      const currentQNum = ++globalQNum;
                      return (
                        <div key={q.id} className="group relative flex flex-col gap-2 p-1 rounded-2xl transition-all break-inside-avoid page-break-inside-avoid">
                          
                          {/* Question Content */}
                          <div className="font-extrabold text-slate-800 leading-normal">
                            <span>Câu {currentQNum}. </span>
                            <MathRenderer text={q.content} />
                            <span className="ml-1.5 font-normal text-[10px] font-sans text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded-full tracking-wide inline-block print:hidden">
                              {q.level}
                            </span>
                            <span className="ml-1 font-extrabold text-[10px] font-sans text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full tracking-wide inline-block print:inline-block">
                              ({q.points !== undefined ? q.points : 1.0}đ)
                            </span>
                          </div>

                          {/* MCQ OPTIONS */}
                          {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 text-xs md:text-sm font-sans text-slate-700">
                              {q.options.map((opt, oIdx) => {
                                return (
                                  <div key={oIdx} className="flex items-start gap-1">
                                    <span className="font-black text-slate-805 shrink-0"></span>
                                    <MathRenderer text={opt} />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* TRUE / FALSE OPTION BOX */}
                          {q.type === 'TRUE_FALSE' && (
                            q.options && q.options.length > 0 ? (
                              <div className="pl-4 mt-2 mb-2 w-full max-w-2xl border border-slate-200 rounded-xl p-3 bg-slate-50/30 font-sans text-xs md:text-sm print:bg-transparent print:border-neutral-300">
                                <div className="grid grid-cols-1 gap-2.5">
                                  {q.options.map((opt, oI) => {
                                    const alpha = ['a', 'b', 'c', 'd'];
                                    return (
                                      <div key={oI} className="flex justify-between items-start gap-4">
                                        <div className="flex gap-1.5 leading-relaxed text-slate-700 print:text-black">
                                          <span className="font-extrabold uppercase shrink-0 text-slate-400 print:text-black">{alpha[oI]})</span>
                                          <MathRenderer text={opt.replace(/^[a-zA-Z0-9]\.\s*|^[a-zA-Z0-9]\)\s*/, '')} />
                                        </div>
                                        <div className="flex gap-3 shrink-0 pt-0.5 select-none text-[11px] font-medium text-slate-500">
                                          <div className="flex items-center gap-1">
                                            <span className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block shrink-0 print:border-neutral-600"></span>
                                            <span className="print:text-black">Đúng</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block shrink-0 print:border-neutral-600"></span>
                                            <span className="print:text-black">Sai</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-4 pl-4 text-[11px] md:text-xs font-sans text-slate-600">
                                <div className="flex items-center gap-1">
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0"></span>
                                  <span>Đúng</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0"></span>
                                  <span>Sai</span>
                                </div>
                              </div>
                            )
                          )}

                          {/* MATCHING BOX */}
                          {q.type === 'MATCHING' && q.options && q.matchingRight && (
                            <div className="grid grid-cols-2 gap-4 pl-4 max-w-lg mt-1 font-sans text-xs md:text-sm text-slate-700">
                              <div className="space-y-1">
                                <span className="block text-[10px] text-slate-400 font-extrabold uppercase">Cột vế trái:</span>
                                {q.options.map((opt, oI) => (
                                  <div key={oI} className="p-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">{oI}) <MathRenderer text={opt} /></div>
                                ))}
                              </div>
                              <div className="space-y-1">
                                <span className="block text-[10px] text-slate-400 font-extrabold uppercase">Cột vế phải:</span>
                                {q.matchingRight.map((mr, mrI) => (
                                  <div key={mrI} className="p-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">{mrI}) <MathRenderer text={mr} /></div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* SHORT ANSWER OR ESSAY TEXTBOX MOCKUP */}
                          {(q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK' || q.type === 'SHORT_ESSAY') && (
                            <div className="pl-4 mt-1 font-sans text-xs text-slate-400 italic">
                              ............................................................................................................................................................................................................
                            </div>
                          )}

                          {/* ANSWER SHEET DETAILS & DETAILED DISCUSSION */}
                          {showAnswers && (
                            <div className="mt-2.5 p-3 bg-emerald-50/75 border border-emerald-200/50 rounded-xl space-y-1.5 text-xs font-sans animate-fadeIn print:bg-slate-50 print:border-slate-300">
                              <div className="flex items-center gap-1.5 font-extrabold text-emerald-800 print:text-black">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 print:text-black shrink-0" />
                                <span>Đáp án chuẩn: </span>
                                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide leading-none">
                                  {q.type === 'TRUE_FALSE' && q.options && q.options.length > 0 ? (
                                    q.correctAnswer.split(',').map((p, pI) => `${['a','b','c','d'][pI] || pI}) ${p}`).join(' | ')
                                  ) : q.correctAnswer}
                                </span>
                              </div>
                              <div className="text-slate-650 leading-relaxed text-[11px] md:text-xs">
                                <strong>Lời giải chi tiết: </strong>
                                <MathRenderer text={q.explanation} />
                              </div>
                              {q.learningOutcome && (
                                <div className="text-[10px] text-slate-400">
                                  <strong>Mục tiêu: </strong>
                                  {q.learningOutcome}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* SIGNATURE SECTION AT THE BOTTOM OF THE SHEET */}
          <div className="mt-14 pt-6 border-t border-dashed border-slate-200 flex flex-col items-center gap-1 text-center font-sans">
            <span className="font-extrabold text-xs md:text-sm text-slate-700 tracking-wide uppercase">---------------- HẾT ----------------</span>
            <span className="text-[11px] text-slate-400 italic">Thí sinh không bắt đầu sử dụng tài liệu. Giám thị không giải thích gì thêm trong phòng thi.</span>
          </div>

        </div>
        
      </div>
    </div>
  );
};
