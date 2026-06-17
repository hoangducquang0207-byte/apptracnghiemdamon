import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// HELPER: Initialize GoogleGenAI with either client-provided key or system key
function getGeminiClient(clientApiKey?: string) {
  const key = clientApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY không tồn tại trên hệ thống và không được cung cấp từ client.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API: Check system key readiness
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasSystemApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// API: Analyze Syllabus Text
app.post("/api/gemini/analyze-syllabus", async (req, res) => {
  const { syllabusText, clientApiKey } = req.body;

  if (!syllabusText || !syllabusText.trim()) {
    res.status(400).json({ error: "Syllabus text is required" });
    return;
  }

  try {
    const ai = getGeminiClient(clientApiKey);
    const systemInstruction = 
      "Bạn là một chuyên gia thiết kế chương trình đào tạo tại Việt Nam. " +
      "Nhiệm vụ của bạn là đọc kỹ văn bản giáo trình hoặc phân phối chương trình, " +
      "sau đó trích xuất thông tin thành cấu trúc chương và bài học chi tiết dưới dạng JSON sạch hoàn hảo.";

    const prompt = `
Hãy đọc đoạn văn bản sau đây và trích xuất cấu trúc chương trình học.
Yêu cầu trả về đúng định dạng JSON có cấu trúc chính xác như sơ đồ mẫu sau, không chứa các ký tự giải thích hay tệp mã markdown bên ngoài:
[
  {
    "name": "Tên chương (ví dụ: Chương I: Tập hợp các số tự nhiên)",
    "lessons": [
      {
        "name": "Bài 1: Tập hợp và phần tử",
        "learningOutcomes": ["Mô tả kết quả đạt được 1", "Mô tả kết quả đạt được 2"]
      }
    ]
  }
]

VĂN BẢN CHƯƠNG TRÌNH:
"""
${syllabusText}
"""
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Tên chương" },
              lessons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Tên bài học" },
                    learningOutcomes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Các kết quả học tập"
                    }
                  },
                  required: ["name"]
                }
              }
            },
            required: ["name", "lessons"]
          }
        }
      }
    });

    const text = response.text;
    res.json(JSON.parse(text || "[]"));
  } catch (error: any) {
    console.error("Analyze syllabus error:", error);
    res.status(500).json({ error: error.message || "Không thể phân tích giáo trình bằng AI" });
  }
});

// API: Generate Exam/Practice Test
app.post("/api/gemini/generate-test", async (req, res) => {
  const { 
    subjectName, 
    grade, 
    book, 
    chapterName, 
    lessonName, 
    numQuestions, 
    duration, 
    purpose, 
    formats, 
    cognitivePercent, 
    formatPercent,
    formatCount,
    useRealLifeScenarios, 
    clientApiKey 
  } = req.body;

  try {
    const ai = getGeminiClient(clientApiKey);
    const systemInstruction = 
      "Bạn là một AI thiết kế đề thi xuất sắc cho các trường trung học cơ sở tại Việt Nam, đặc biệt thành thạo các môn Toán học, Vật lí, Hóa học và Khoa học tự nhiên. " +
      "Bạn luôn trả về kết quả dưới định dạng JSON hợp lệ, sạch sẽ tuyệt đối, không chứa văn bản bao bọc bên ngoài. " +
      "Bạn tuân thủ nghiêm ngặt và chuẩn xác tuyệt đối các định dạng công thức toán học, vật lí, hóa học dưới dạng công thức Equation chuẩn: " +
      "BẮT BUỘC dùng kí pháp LaTeX bọc trong một cặp dấu đô-la đơn ($...$) đối với mọi biến số, số lượng, phân số, căn số, phương trình, số đo, kí hiệu so sánh, hay biểu thức toán học trong cả nội dung câu hỏi, tùy chọn đáp án, đáp án đúng và lời giải chi tiết. " +
      "Ví dụ: Hãy dùng '$x^2 - 4x + 4 = 0$' thay vì x^2-4x+4=0; '$x = 2$' hoặc '$x \\in \\mathbb{R}$'; '$\\frac{3}{4}$' thay vì 3/4; '$\\sqrt{2}$' thay vì căn 2; '$\\ge$' thay vì >=; '$10\\text{ cm}^2$'; '$Fe_2O_3$'; v.v.";

    const formatInstructions = formats.map((fmt: string) => {
      const pct = formatPercent && formatPercent[fmt] !== undefined ? formatPercent[fmt] : Math.round(100 / formats.length);
      const name = fmt === 'MCQ' ? 'Bốn lựa chọn' :
                   fmt === 'TRUE_FALSE' ? 'Đúng/Sai' :
                   fmt === 'SHORT_ANSWER' ? 'Điền từ ngắn' :
                   fmt === 'MATCHING' ? 'Ghép cặp' : 'Tự luận';
      const countPart = formatCount && formatCount[fmt] !== undefined ? `, BẮT BUỘC có đúng ${formatCount[fmt]} câu dạng này` : '';
      return `- ${fmt} (${name}): ${pct}%${countPart}`;
    }).join("\n");

    const prompt = `
Hãy thiết kế một đề kiểm tra hoàn chỉnh cho:
Môn học: ${subjectName} Lớp: ${grade}
Bộ sách: ${book}
Chương học: ${chapterName || "Tổng hợp kiến thức"}
Bài học: ${lessonName || "Tất cả các bài trong chương"}
Số lượng câu hỏi: ${numQuestions} câu
Thời gian làm bài: ${duration} phút
Mục đích: ${purpose}
Các dạng câu hỏi được phép sử dụng và tỉ trọng số lượng tương ứng:
${formatInstructions}
Phân bố mức độ nhận thức:
- Nhận biết: ${cognitivePercent["Nhận biết"] || 30}%
- Thông hiểu: ${cognitivePercent["Thông hiểu"] || 30}%
- Vận dụng: ${cognitivePercent["Vận dụng"] || 30}%
- Vận dụng cao: ${cognitivePercent["Vận dụng cao"] || 10}%

Sử dụng tình huống thực tế đời sống: ${useRealLifeScenarios ? "CÓ" : "KHÔNG"}

BẮT BUỘC SỬ DỤNG CÔNG THỨC TRONG KHUNG ĐÔ LA CHUẨN ($...$) CHO TOÀN BỘ CÁC BIỂU THỨC SỐ HỌC, BIẾN SỐ, ĐƠN VỊ, TẬP HỢP, HÓA CHẤT, FRAC, CĂN, MŨ.
Yêu cầu trả về đúng định dạng JSON có cấu trúc chính xác như sau:
{
  "title": "Tên đề kiểm tra phù hợp và trang trọng",
  "questions": [
    {
      "id": "AI-Q-integer-sequential",
      "type": "Dạng câu hỏi (chọn một trong các loại có trong danh sách được phép: MCQ, TRUE_FALSE, SHORT_ANSWER, FILL_BLANK, MATCHING, SHORT_ESSAY)",
      "level": "Mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao)",
      "content": "Nội dung câu hỏi (sử dụng dấu $ để bọc MỌI số đo, biến số, biểu thức, ví dụ: 'Cho biểu thức $P = \\frac{x + 1}{\\sqrt{x} - 2}$ với $x \\ge 0$' hoặc 'Tìm giá trị của $x$ để...')",
      "options": ["Phát biểu a (ví dụ: Phương trình $x + y = 6$ có vô số nghiệm nguyên dương)", "Phát biểu b...", "Phát biểu c...", "Phát biểu d..."],
      "matchingRight": ["Cực 1 vế phải", "Cực 2 vế phải"],
      "correctAnswer": "Đáp án đúng (Nếu MCQ chọn 'A'/'B'/'C'/'D'; Nếu TRUE_FALSE chọn chuỗi 4 đáp án ngăn cách bằng dấu phẩy tương ứng 4 phát biểu ở 'options', ví dụ 'Đúng,Sai,Đúng,Sai'; Nếu SHORT_ANSWER/FILL_BLANK chọn cụm từ viết hoa/thường chuẩn hoặc giá trị như $x = 2$; Nếu MATCHING chọn chuỗi cặp ví dụ '0-1, 1-0...'; Nếu SHORT_ESSAY chọn nội dung lời tự luận đáp án tóm tắt)",
      "explanation": "Giải thích chi chiết vì sao đáp án này là đúng, sử dụng đầy đủ công thức toán chuẩn $...$",
      "learningOutcome": "Chuẩn kiến thức kiểm tra của câu hỏi"
    }
  ]
}

Lưu ý quan trọng cho các loại dạng câu hỏi:
- MCQ: options phải có chính xác 4 lựa chọn, bắt đầu với A., B., C., D. và matchingRight đặt là null. Nếu phương án có chứa toán thức phải viết bằng kí pháp LaTeX ở trong cặp $.
- TRUE_FALSE: options phải chứ ĐÚNG 4 phát biểu tương ứng với ý a, b, c, d (không có tiền tố a,b,b,d hoặc nếu có cũng không bắt buộc), matchingRight đặt là null. correctAnswer BẮT BUỘC là 4 đáp án Đúng hoặc Sai ngăn cách bởi dấu phẩy tương ứng với 4 phát biểu trong options, ví dụ: "Đúng,Sai,Đúng,Sai" hoặc "Sai,Sai,Đúng,Đúng".
- SHORT_ANSWER / FILL_BLANK: options và matchingRight đặt là null. correctAnswer là câu trả lời ngắn chính xác để so khớp tự động, ưu tiên bọc gọn biểu thức trong $.
- MATCHING: options là danh sách vế trái (mảng chuỗi). matchingRight là danh sách vế phải lộn xộn (mảng chuỗi). correctAnswer là liên kết chỉ mục dạng "0-1, 1-0, 2-2" (vết trái 0 nối vế phải 1, vế trái 1 nối vế phải 0, vế trái 2 nối vế phải 2).
- SHORT_ESSAY: options và matchingRight đặt là null. correctAnswer là dàn ý ý chính của lời giải kèm biểu thức toán học bọc $.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Tiêu đề đề thi" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  level: { type: Type.STRING },
                  content: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Phương án cho MCQ"
                  },
                  matchingRight: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Vế ghép phải cho MATCHING"
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  learningOutcome: { type: Type.STRING }
                },
                required: ["type", "level", "content", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    const text = response.text;
    res.json(JSON.parse(text || "{}"));
  } catch (error: any) {
    console.error("Generate content error:", error);
    res.status(500).json({ error: error.message || "Không thể tạo đề thi bằng trí tuệ nhân tạo AI" });
  }
});

// API: Analyze Class Performance Report
app.post("/api/gemini/analyze-report", async (req, res) => {
  const { className, subjectName, grade, averageScore, scoreList, clientApiKey } = req.body;

  try {
    const ai = getGeminiClient(clientApiKey);
    const systemInstruction = 
      "Bạn là một cố vấn sư phạm trung học chuyên nghiệp tại Việt Nam. " +
      "Nhiệm vụ của bạn là phân tích điểm học sinh và đưa ra lời khuyên thiết thực, trực diện nhất giúp giáo viên bồi dưỡng học sinh.";

    const prompt = `
Phân tích kết quả học tập của học kỳ này:
Lớp: ${className}
Môn: ${subjectName} Lớp ${grade}
Điểm số trung bình lớp: ${averageScore} / 10

Danh sách điểm chi tiết một số học sinh tiêu biểu:
${scoreList.join("\n")}

Hãy trả về phản hồi dưới định dạng JSON chuẩn mực sau đây:
{
  "strengths": "Tóm tắt ưu điểm học tập nổi trội của cả lớp (ngắn gọn, xúc tích)",
  "weaknesses": "Lỗ hổng năng lực hoặc bài học còn kém cần cải thiện",
  "recommendations": "Lời khuyên, chiến lược phụ đạo cụ thể hoặc các đề xuất rèn luyện sắp tới",
  "unsupportiveStudents": [
    {
      "name": "Họ và tên học sinh cần phụ trợ đặc biệt do điểm còn thấp",
      "score": 4.5,
      "topic": "Chủ đề kiến thức tương ứng cần tăng cường ôn luyện lại"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.STRING, description: "Điểm mạnh của lớp" },
            weaknesses: { type: Type.STRING, description: "Lỗ hổng kiến thức" },
            recommendations: { type: Type.STRING, description: "Chiến thuật bồi dưỡng" },
            unsupportiveStudents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  topic: { type: Type.STRING }
                },
                required: ["name", "score", "topic"]
              }
            }
          },
          required: ["strengths", "weaknesses", "recommendations", "unsupportiveStudents"]
        }
      }
    });

    const text = response.text;
    res.json(JSON.parse(text || "{}"));
  } catch (error: any) {
    console.error("Analyze report error:", error);
    res.status(500).json({ error: error.message || "Không thể phân tích báo cáo lớp học bằng AI" });
  }
});

// Setup Vite Dev server or Serve compiled Frontend assets
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve HTML entry for SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

setupServer();
