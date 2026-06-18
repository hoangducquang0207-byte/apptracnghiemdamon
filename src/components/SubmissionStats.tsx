// src/components/SubmissionStats.tsx
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  BookOpen, 
  Users, 
  FileSpreadsheet, 
  Send, 
  TrendingUp, 
  Filter,
  BarChart2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { SubjectConfig, Student, Test, Assignment, QuizAttempt, UserRole } from '../types';

interface SubmissionStatsProps {
  subjects: SubjectConfig[];
  activeSubject: SubjectConfig;
  students: Student[];
  tests: Test[];
  assignments: Assignment[];
  attempts: QuizAttempt[];
  classes: string[];
  role: UserRole;
  currentStudent?: Student;
  onToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  onViewAttempt: (attempt: QuizAttempt) => void;
}

export const SubmissionStats: React.FC<SubmissionStatsProps> = ({
  subjects,
  activeSubject,
  students,
  tests,
  assignments,
  attempts,
  classes,
  role,
  currentStudent,
  onToast,
  onViewAttempt
}) => {
  // Filters state
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'subject-view' | 'class-view' | 'detail-log'>('subject-view');

  // Compute stats
  const statsSummary = useMemo(() => {
    const totalAssignments = assignments.length;
    const totalSubmissions = attempts.length;
    
    // Unsubmitted status count
    let completedCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const now = new Date();

    if (role === 'teacher') {
      // Calculate how many assignments could map to each student
      assignments.forEach(asg => {
        const classStudents = students.filter(s => s.className === asg.className);
        classStudents.forEach(std => {
          const hasAttempt = attempts.some(att => att.testId === asg.testId && att.studentId === std.id);
          const deadlineDate = new Date(asg.deadline);
          if (hasAttempt) {
            completedCount++;
          } else if (now > deadlineDate) {
            overdueCount++;
          } else {
            pendingCount++;
          }
        });
      });
    } else if (currentStudent) {
      // For a specific student
      const studentClass = currentStudent.className;
      const studentAssignments = assignments.filter(asg => asg.className === studentClass);
      
      studentAssignments.forEach(asg => {
        const hasAttempt = attempts.some(att => att.testId === asg.testId && att.studentId === currentStudent.id);
        const deadlineDate = new Date(asg.deadline);
        if (hasAttempt) {
          completedCount++;
        } else if (now > deadlineDate) {
          overdueCount++;
        } else {
          pendingCount++;
        }
      });
    }

    const totalPossibleSubmissions = completedCount + pendingCount + overdueCount;
    const rate = totalPossibleSubmissions > 0 ? (completedCount / totalPossibleSubmissions) * 100 : 0;

    return {
      totalAssignments,
      totalSubmissions,
      completedCount,
      pendingCount,
      overdueCount,
      rate
    };
  }, [assignments, attempts, students, role, currentStudent]);

  // Group by Subject
  const subjectStats = useMemo(() => {
    return subjects.map(sub => {
      const subAssignments = assignments.filter(a => a.subjectId === sub.id);
      let possible = 0;
      let submitted = 0;

      subAssignments.forEach(asg => {
        const classStudents = students.filter(s => s.className === asg.className);
        possible += classStudents.length;

        classStudents.forEach(std => {
          const hasSubmit = attempts.some(at => at.testId === asg.testId && at.studentId === std.id);
          if (hasSubmit) submitted++;
        });
      });

      const rate = possible > 0 ? (submitted / possible) * 100 : 0;
      return {
        subject: sub,
        assignmentsCount: subAssignments.length,
        possible,
        submitted,
        rate
      };
    });
  }, [subjects, assignments, students, attempts]);

  // Group by Class
  const classStats = useMemo(() => {
    return classes.map(clsName => {
      const classAssignments = assignments.filter(a => a.className === clsName);
      let possible = 0;
      let submitted = 0;

      const classStudents = students.filter(s => s.className === clsName);
      possible = classAssignments.length * classStudents.length;

      classAssignments.forEach(asg => {
        classStudents.forEach(std => {
          const hasSubmit = attempts.some(at => at.testId === asg.testId && at.studentId === std.id);
          if (hasSubmit) submitted++;
        });
      });

      const rate = possible > 0 ? (submitted / possible) * 100 : 0;
      return {
        className: clsName,
        studentCount: classStudents.length,
        assignmentsCount: classAssignments.length,
        possible,
        submitted,
        rate
      };
    });
  }, [classes, assignments, students, attempts]);

  // Detailed student row submission details based on filter selector
  const detailGridData = useMemo(() => {
    const targetClass = selectedClass || (classes.length > 0 ? classes[0] : '');
    const activeSub = selectedSubjectId || activeSubject.id;

    if (!targetClass) return [];

    const targetStudents = students.filter(s => 
      s.className === targetClass && 
      (searchStudent ? s.name.toLowerCase().includes(searchStudent.toLowerCase()) : true)
    );

    const targetAssignments = assignments.filter(asg => 
      asg.className === targetClass && 
      (activeSub ? asg.subjectId === activeSub : true)
    );

    return targetStudents.map(student => {
      const studentSubmissions = targetAssignments.map(asg => {
        const studentAttempt = attempts.find(at => at.testId === asg.testId && at.studentId === student.id);
        const deadlineDate = new Date(asg.deadline);
        const isOverdue = new Date() > deadlineDate;

        let status: 'completed' | 'pending' | 'overdue' = 'pending';
        if (studentAttempt) {
          status = 'completed';
        } else if (isOverdue) {
          status = 'overdue';
        }

        return {
          assignmentId: asg.id,
          title: asg.testTitle,
          deadline: asg.deadline,
          status,
          score: studentAttempt?.score,
          attempt: studentAttempt
        };
      });

      const completed = studentSubmissions.filter(s => s.status === 'completed').length;
      const total = studentSubmissions.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        student,
        submissions: studentSubmissions,
        completed,
        total,
        completionRate
      };
    });
  }, [selectedClass, selectedSubjectId, searchStudent, activeSubject, students, assignments, attempts, classes]);

  // Trigger quick poke/reminder simulation
  const handlePokeStudent = (studentName: string, assignmentTitle: string) => {
    onToast(`Đã gửi thông báo nhắc nhở làm bài "${assignmentTitle}" đến em ${studentName}! 📧`, 'success');
  };

  // Export filtered detailed stats to CSV format
  const handleExportCSV = () => {
    const targetClass = selectedClass || (classes.length > 0 ? classes[0] : 'Tat_ca_lop');
    const activeSubObj = subjects.find(s => s.id === (selectedSubjectId || activeSubject.id));
    const subName = activeSubObj ? activeSubObj.name : 'Tat_ca_mon';

    if (detailGridData.length === 0) {
      onToast('Không có dữ liệu chi tiết để xuất tệp CSV!', 'error');
      return;
    }

    const headers = [
      "Học sinh",
      "Lớp học",
      "Môn học phổ cập",
      "Tổng số bài giao",
      "Đã nộp",
      "Tỷ lệ hoàn thành (%)"
    ];

    const rows = detailGridData.map(d => {
      return [
        `"${d.student.name}"`,
        `"${d.student.className}"`,
        `"${subName}"`,
        d.total,
        d.completed,
        d.completionRate.toFixed(1)
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ThongKe_NopBai_Lop_${targetClass}_Mon_${subName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Đã xuất báo cáo thống kê nộp bài hoàn thành xuất sắc dưới dạng CSV! 📊', 'success');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6" id="submission-stats-layout">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> THỐNG KÊ CHI TIẾT NỘP BÀI
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Theo dõi thời gian thực kết quả tự học, làm bài của toàn bộ học viên lớp học bộ môn.</p>
        </div>

        {/* TAB CONTROLS FOR TEACHER */}
        {role === 'teacher' && (
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold leading-none shrink-0 border border-slate-250/20">
            <button
              onClick={() => setActiveTab('subject-view')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'subject-view' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Môn học 📘
            </button>
            <button
              onClick={() => setActiveTab('class-view')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'class-view' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Quản lý Lớp 🏫
            </button>
            <button
              onClick={() => setActiveTab('detail-log')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'detail-log' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Xem chi tiết lẻ 🔍
            </button>
          </div>
        )}
      </div>

      {/* GLOBAL KEY SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1 shadow-2xs">
          <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Hoàn thành nộp bài</span>
          <span className="text-xl font-black text-slate-800 flex items-baseline gap-1 mt-1">
            {statsSummary.rate.toFixed(1)}%
            <span className="text-xs font-semibold text-slate-400">tổng phổ</span>
          </span>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${statsSummary.rate}%` }} 
            />
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex flex-col gap-1 shadow-2xs">
          <span className="text-emerald-700 text-[9px] font-bold uppercase tracking-wider block">Đã hoàn thành</span>
          <span className="text-xl font-black text-emerald-800 flex items-baseline mt-1">
            {statsSummary.completedCount}
            <span className="text-xs font-bold text-emerald-600/70 ml-1">lượt làm bài</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-medium block mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 shrink-0" /> Tiến độ đang tốt
          </span>
        </div>

        <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl flex flex-col gap-1 shadow-2xs">
          <span className="text-amber-700 text-[9px] font-bold uppercase tracking-wider block">Chờ nộp bài</span>
          <span className="text-xl font-black text-amber-800 flex items-baseline mt-1">
            {statsSummary.pendingCount}
            <span className="text-xs font-bold text-amber-600/70 ml-1">nhiệm vụ chờ</span>
          </span>
          <span className="text-[10px] text-amber-600 font-medium block mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" /> Sắp đến hạn nộp
          </span>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl flex flex-col gap-1 shadow-2xs">
          <span className="text-rose-700 text-[9px] font-bold uppercase tracking-wider block">Quá hạn nộp</span>
          <span className="text-xl font-black text-rose-800 flex items-baseline mt-1">
            {statsSummary.overdueCount}
            <span className="text-xs font-bold text-rose-600/70 ml-1">mã lỗi muộn</span>
          </span>
          <span className="text-[10px] text-rose-600 font-medium block mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" /> Cần đôn đốc khẩn
          </span>
        </div>
      </div>

      {/* TEACHER: GROUPED VIEW BY SUBJECTS */}
      {role === 'teacher' && activeTab === 'subject-view' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-700">Tỷ lệ nộp bài theo từng Môn học</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase">Đồng bộ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectStats.map(({ subject, assignmentsCount, possible, submitted, rate }) => (
              <div key={subject.id} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-3xs flex flex-col gap-3 hover:border-slate-300 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                      📙 {subject.name.toUpperCase()} LỚP {subject.grade}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">{subject.book} • Sĩ số môn</p>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50/85 border border-emerald-100/50 px-2.5 py-0.5 rounded-lg">
                    {rate.toFixed(1)}% hoàn thành
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" 
                    style={{ width: `${rate}%` }} 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 mt-1">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block font-bold text-slate-700">{assignmentsCount}</span>
                    <span>Đã giao</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block font-bold text-emerald-600">{submitted}</span>
                    <span>Lượt nộp</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block font-bold text-rose-500">{possible - submitted}</span>
                    <span>Chưa nộp</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHER: GROUPED VIEW BY CLASSES */}
      {role === 'teacher' && activeTab === 'class-view' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-700">Tỷ lệ nộp bài theo từng Lớp được giao</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-bold uppercase border border-slate-200">Thời gian thực</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classStats.map(({ className, studentCount, assignmentsCount, possible, submitted, rate }) => (
              <div key={className} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-3xs flex flex-col gap-3 hover:border-slate-300 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">
                      🏫 LỚP {className}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">Sĩ số: <strong>{studentCount} học sinh</strong> • Nhiệm vụ: {assignmentsCount} bài</p>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                    {rate.toFixed(1)}% đã nộp
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${rate}%` }} 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 mt-1">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block font-bold text-slate-700">{possible}</span>
                    <span>Chỉ tiêu mục</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block font-bold text-emerald-600">{submitted}</span>
                    <span>Đã nộp</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="block font-bold text-rose-500">{possible - submitted}</span>
                    <span>Thiếu bài</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHER: DETAILED SINGLE STUDENT TRACKER */}
      {role === 'teacher' && activeTab === 'detail-log' && (
        <div className="flex flex-col gap-4">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Chọn Lớp rèn luyện</label>
              <select
                value={selectedClass || (classes.length > 0 ? classes[0] : '')}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                {classes.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Chọn Môn học</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="">-- Tất cả các môn học --</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} (Khối {sub.grade})</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Tìm kiếm tên học sinh</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Nhập họ và tên học sinh cần tra cứu..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* EXPORT AND HEADER DETAILS */}
          <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-dotted border-slate-200 text-xs">
            <span className="text-slate-500">
              Nhấp <strong>Gửi nhắc nhở</strong> để hệ thống tự động đốc thúc học sinh nộp đề chưa hoàn thiện.
            </span>
            <button
              onClick={handleExportCSV}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Bảng Điểm CSV
            </button>
          </div>

          {/* GRID TABLE */}
          {detailGridData.length === 0 ? (
            <div className="py-12 bg-slate-50 text-center rounded-2xl italic text-slate-400 text-xs">
              Không tìm thấy học sinh nào thuộc phân lớp đã chọn!
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold pb-2 bg-slate-100/60 uppercase text-[9px] tracking-wider border-b border-slate-100">
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Số lượng nộp bài</th>
                    <th className="p-3">Tiến trình làm bài thi tự luận & trắc nghiệm</th>
                    <th className="p-3 text-right">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailGridData.map(({ student, submissions, completed, total, completionRate }) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <strong className="text-slate-800 text-xs block">{student.name}</strong>
                        <span className="text-[10px] text-slate-400 font-medium">Lớp {student.className}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-slate-600">
                        {completed} / {total} bài tập
                      </td>
                      <td className="p-3">
                        {total === 0 ? (
                          <span className="text-slate-400 italic text-[10px]">Chưa giao bài rèn luyện.</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {submissions.map((sub, index) => (
                              <div 
                                key={sub.assignmentId} 
                                className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-[10.5px] leading-tight ${
                                  sub.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                    : sub.status === 'overdue'
                                      ? 'bg-rose-50 text-rose-800 border-rose-100'
                                      : 'bg-amber-50 text-amber-800 border-amber-100'
                                }`}
                              >
                                <span className="font-bold">#Bài {index + 1}:</span>
                                <span className="max-w-[120px] truncate font-medium">{sub.title}</span>
                                
                                {sub.status === 'completed' ? (
                                  <button
                                    onClick={() => sub.attempt && onViewAttempt(sub.attempt)}
                                    className="bg-emerald-600 text-white font-bold rounded px-1.5 py-0.5 hover:bg-emerald-700 transition-all text-[9.5px]"
                                    title="Xem kết quả rèn luyện chi tiết"
                                  >
                                    {sub.score !== undefined ? `${sub.score.toFixed(1)}đ` : '✓'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePokeStudent(student.name, sub.title)}
                                    className="bg-amber-500 hover:bg-amber-600 text-white rounded p-0.5 shrink-0 transition-all"
                                    title="Gửi nhắc nhở làm đề gấp"
                                  >
                                    <Send className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded font-black text-[10.5px] ${
                          completionRate >= 80 
                            ? 'bg-emerald-100 text-emerald-800'
                            : completionRate >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {completionRate.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STUDENT: INDIVIDUAL SUBMISSION VIEW */}
      {role === 'student' && currentStudent && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
            <h3 className="font-extrabold text-xs text-slate-700 mb-2.5 flex items-center gap-1 uppercase">
              <BookOpen className="w-4 h-4 text-emerald-600" /> Trạng thái làm bài rèn luyện của em
            </h3>

            {(() => {
              const studentAssignments = assignments.filter(a => a.className === currentStudent.className);
              if (studentAssignments.length === 0) {
                return (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có bài tập nào được giao cho lớp học của em.</p>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentAssignments.map((asg) => {
                    const studentAttempts = attempts.filter(att => att.testId === asg.testId && att.studentId === currentStudent.id);
                    const isSubmitted = studentAttempts.length > 0;
                    const isOverdue = new Date() > new Date(asg.deadline);

                    return (
                      <div 
                        key={asg.id} 
                        className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                          isSubmitted 
                            ? 'bg-emerald-50/20 border-emerald-105/50' 
                            : isOverdue 
                              ? 'bg-rose-50/20 border-rose-105/50' 
                              : 'bg-slate-50/50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block tracking-normal">
                              📘 {subjects.find(s => s.id === asg.subjectId)?.name || 'Hệ thống'} • KHỐI {subjects.find(s => s.id === asg.subjectId)?.grade || ''}
                            </span>
                            <h4 className="font-black text-xs text-slate-800 leading-snug mt-1">{asg.testTitle}</h4>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider ${
                            isSubmitted 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isOverdue 
                                ? 'bg-rose-100 text-rose-800 animate-pulse' 
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isSubmitted ? 'Đã nộp bài' : isOverdue ? 'Quá hạn' : 'Đang chờ nộp'}
                          </span>
                        </div>

                        {/* ATTEMPT INFO OR DEADLINE */}
                        {isSubmitted ? (
                          <div className="flex flex-col gap-1.5 p-2 bg-white rounded-lg border border-emerald-100 text-[10.5px]">
                            {studentAttempts.map((att, i) => (
                              <div key={att.id} className="flex justify-between items-center">
                                <span className="font-bold text-slate-700">Lần thi {i + 1}: <strong className="text-emerald-700">{att.score.toFixed(1)} / 10đ</strong></span>
                                <button
                                  onClick={() => onViewAttempt(att)}
                                  className="text-[9.5px] font-bold text-indigo-600 hover:underline"
                                >
                                  Xem đáp án & chi tiết Lời giải 💡
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10.5px] text-slate-500 leading-normal flex items-center gap-1 italic">
                            <Clock className="w-3.5 h-3.5 shrink-0" /> Hạn chót hoàn thành: {new Date(asg.deadline).toLocaleString('vi-VN')}
                          </p>
                        )}
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
  );
};
