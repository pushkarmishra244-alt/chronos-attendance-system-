import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { AttendanceRecord, ClassDepartment, AttendanceStatus } from '../types';
import { FolderUp, FileSpreadsheet, FileDown, Search, Filter, Calendar, Award } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

interface FiltersState {
  classId: string;
  status: string;
  startDate: string;
  endDate: string;
  search: string;
}

export default function ReportsView() {
  const [classes, setClasses] = useState<ClassDepartment[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, present: 0, late: 0, absent: 0, presentRate: 0 });
  
  const [filters, setFilters] = useState<FiltersState>({
    classId: '',
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  // Load classes on mount
  useEffect(() => {
    api.getClasses()
      .then(setClasses)
      .catch(err => console.error('Error fetching classes:', err));
  }, []);

  // Run report search when filters change
  useEffect(() => {
    fetchReport();
  }, [filters.classId, filters.status, filters.startDate, filters.endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.classId) params.classId = filters.classId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await api.getReport(params);
      
      // Perform client side search text matches (filters by student name or email)
      let list = data.records;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter((r: any) => 
          r.userName.toLowerCase().includes(query) || 
          r.userEmail.toLowerCase().includes(query) ||
          r.subjectName.toLowerCase().includes(query)
        );
      }

      setRecords(list);

      // Re-calculate local stats after search matches
      const total = list.length;
      const present = list.filter((r: any) => r.status === 'present').length;
      const late = list.filter((r: any) => r.status === 'late').length;
      const absent = list.filter((r: any) => r.status === 'absent').length;
      const rate = total > 0 ? ((present + late) / total) * 100 : 0;

      setSummary({ total, present, late, absent, presentRate: Math.round(rate) });
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      classId: '',
      status: '',
      startDate: '',
      endDate: '',
      search: '',
    });
  };

  // --- EXPORT SCRIPT TRIGGERS ---

  const exportToCSV = () => {
    if (records.length === 0) return;
    const header = ['Date', 'Student Name', 'Student Email', 'Class/Department', 'Subject', 'Teacher', 'Session Type', 'Status', 'Marked At', 'Comment'];
    const rows = records.map((r: any) => [
      r.date,
      r.userName,
      r.userEmail,
      r.className,
      r.subjectName,
      r.teacherName,
      r.type.toUpperCase(),
      r.status.toUpperCase(),
      new Date(r.markedAt).toLocaleString(),
      r.comment || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [header.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (records.length === 0) return;
    
    const formattedData = records.map((r: any) => ({
      Date: r.date,
      'Student Name': r.userName,
      'Student Email': r.userEmail,
      'Class / Department': r.className,
      Subject: r.subjectName,
      Teacher: r.teacherName,
      'Session Type': r.type.toUpperCase(),
      Status: r.status.toUpperCase(),
      'Checked-In At': new Date(r.markedAt).toLocaleString(),
      Comment: r.comment || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Metrics');
    
    // Auto-fit column widths
    const max_width = formattedData.reduce((w, r) => Math.max(w, Object.keys(r).reduce((acc, key) => Math.max(acc, r[key as keyof typeof r]?.toString().length || 0), 10)), 15);
    worksheet['!cols'] = Object.keys(formattedData[0]).map(() => ({ wch: max_width }));

    XLSX.writeFile(workbook, `Attendance_Ledger_Spreadsheet_${Date.now()}.xlsx`);
  };

  const exportToPDF = () => {
    if (records.length === 0) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Write title header card
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("ATTENDANCE MANAGEMENT SYSTEM - LEDGER RECORD LIST", 15, 18);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString()} UTC | Attendance Threshold Requirement: 75%`, 14, 25);
    
    // Filter coordinates
    let clsName = filters.classId ? classes.find(c => c.id === filters.classId)?.name || 'All' : 'All Classes';
    let statusName = filters.status ? filters.status.toUpperCase() : 'All Statuses';
    let datesLabel = (filters.startDate || filters.endDate) ? `Range: ${filters.startDate || 'Beginning'} to ${filters.endDate || 'Current'}` : 'All Dates';
    doc.text(`Filters applied -> Dept: ${clsName} | Status: ${statusName} | ${datesLabel}`, 14, 30);

    // Draw Stats Table Summaries
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 34, 268, 12, 'F');
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Total Records: ${summary.total}  |  Present Rate: ${summary.presentRate}%  |  Presents: ${summary.present}  |  Absents: ${summary.absent}  |  Lates: ${summary.late}`, 20, 42);

    // Draw grid headers
    const cols = ['Date', 'Student', 'Class Department', 'Subject Name', 'Type', 'Status', 'Marked At'];
    const colWidths = [22, 55, 45, 45, 20, 22, 45]; // Total A4 bounds: approx ~270 width
    
    let currentY = 56;
    doc.setFillColor(30, 41, 59);
    doc.rect(14, currentY - 5, 268, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    
    let currentX = 14;
    cols.forEach((col, index) => {
      doc.text(col, currentX + 2, currentY);
      currentX += colWidths[index];
    });

    // Draw grid rows
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    currentY += 8;

    records.forEach((r, idx) => {
      // Check page breaks
      if (currentY > 185) {
        doc.addPage();
        currentY = 25;
        // Re-draw headers
        doc.setFillColor(30, 41, 59);
        doc.rect(14, currentY - 5, 268, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("Helvetica", "bold");
        let headX = 14;
        cols.forEach((col, index) => {
          doc.text(col, headX + 2, currentY);
          headX += colWidths[index];
        });
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        currentY += 8;
      }

      // Draw Row zebra striping
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY - 5, 268, 7.5, 'F');
      }

      // Set colors according to status check
      let statusTextX = 0;
      let targetX = 14;
      
      const valDate = r.date;
      const valStudent = `${r.userName} (${r.userEmail})`;
      const valClass = r.className;
      const valSubject = r.subjectName;
      const valType = r.type.toUpperCase();
      const valStatus = r.status.toUpperCase();
      const valMarked = new Date(r.markedAt).toLocaleTimeString();

      // Row values drawer
      doc.text(truncateText(valDate, 20), targetX + 2, currentY);
      targetX += colWidths[0];
      doc.text(truncateText(valStudent, 40), targetX + 2, currentY);
      targetX += colWidths[1];
      doc.text(truncateText(valClass, 28), targetX + 2, currentY);
      targetX += colWidths[2];
      doc.text(truncateText(valSubject, 28), targetX + 2, currentY);
      targetX += colWidths[3];
      doc.text(truncateText(valType, 18), targetX + 2, currentY);
      targetX += colWidths[4];

      // Draw color indicator for status
      if (r.status === 'present') doc.setTextColor(22, 163, 74); // green-600
      else if (r.status === 'absent') doc.setTextColor(220, 38, 38); // red-600
      else doc.setTextColor(217, 119, 6); // amber-600

      doc.setFont("Helvetica", "bold");
      doc.text(valStatus, targetX + 2, currentY);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);

      targetX += colWidths[5];
      doc.text(valMarked, targetX + 2, currentY);
      
      currentY += 7.5;
    });

    // Save outputs
    doc.save(`Attendance_Record_Export_${Date.now()}.pdf`);
  };

  const truncateText = (str: string, maxLen: number) => {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
  };

  return (
    <div className="space-y-6">
      {/* Search Header and Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 p-6 shadow-sm transition-colors font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-850 pb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-805 dark:text-slate-100 font-sans flex items-center gap-2">
              <FolderUp className="w-5 h-5 text-[#0058be]" /> Attendance Archive Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-1">Surgical filtering, tracking metrics, and professional reports exports.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-slate-150 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              CSV Ledger
            </button>
            <button
              onClick={exportToExcel}
              disabled={records.length === 0}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors animate-fade-in"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX Excel
            </button>
            <button
              onClick={exportToPDF}
              disabled={records.length === 0}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 bg-[#0058be] text-white rounded-xl hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all shadow-[#0058be]/10"
            >
              <FileDown className="w-3.5 h-3.5" /> PDF Ledger Report
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-5 font-sans">
          {/* Query search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchReport(); }}
              className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:outline-none focus:ring-1 focus:ring-[#0058be] transition-colors"
            />
          </div>

          {/* Class Select filters */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
              className="w-full text-xs pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:outline-none focus:ring-1 focus:ring-[#0058be] cursor-pointer appearance-none transition-colors"
            >
              <option value="">All Departments</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status filters */}
          <div className="relative">
            < Award className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full text-xs pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:outline-none focus:ring-1 focus:ring-[#0058be] cursor-pointer appearance-none transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
              <option value="late">Late Only</option>
            </select>
          </div>

          {/* Start range picker */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              placeholder="From Date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-705 dark:text-slate-201 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:outline-none focus:ring-1 focus:ring-[#0058be] cursor-pointer transition-colors"
            />
          </div>

          {/* End range picker */}
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              placeholder="To Date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-705 dark:text-slate-201 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:outline-none focus:ring-1 focus:ring-[#0058be] cursor-pointer transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 font-sans">
          <button
            onClick={fetchReport}
            className="text-xs font-semibold text-[#0058be] dark:text-blue-400 hover:underline cursor-pointer"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="text-[11px] text-slate-450 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-colors">
          <span className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Records Found</span>
          <span className="text-2xl font-bold font-sans text-slate-805 dark:text-slate-100">{summary.total}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-colors">
          <span className="text-[10px] text-emerald-500 font-mono tracking-wide uppercase">Presents</span>
          <span className="text-2xl font-bold font-sans text-emerald-600 dark:text-emerald-400">{summary.present}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-colors">
          <span className="text-[10px] text-amber-500 font-mono tracking-wide uppercase">Lates</span>
          <span className="text-2xl font-bold font-sans text-amber-500 dark:text-amber-400">{summary.late}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm transition-colors">
          <span className="text-[10px] text-rose-500 font-mono tracking-wide uppercase">Absents</span>
          <span className="text-2xl font-bold font-sans text-rose-600 dark:text-rose-400">{summary.absent}</span>
        </div>
        <div className="bg-[#0058be] text-white p-4 rounded-2xl flex flex-col justify-between shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[10px] text-blue-100 font-mono tracking-wide uppercase">Class Presence</span>
          <span className="text-2xl font-bold font-sans">{summary.presentRate}%</span>
        </div>
      </div>

      {/* Grid Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850 shadow-sm overflow-hidden transition-colors font-sans">
        <div className="px-6 py-4.5 border-b border-slate-150 dark:border-slate-850">
          <h3 className="text-sm font-semibold text-slate-805 dark:text-slate-100 font-sans">Archived Attendance Log</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-150 border-t-[#0058be] animate-spin mx-auto" />
            <p className="text-xs text-slate-450">Filtering database ledger logs dynamically...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-slate-400">No attendance matches found for selected visual boundaries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800/80">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Subject</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Session Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Marked At</th>
                  <th className="px-6 py-3.5">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                    <td className="px-6 py-4.5 font-mono whitespace-nowrap text-slate-500">{r.date}</td>
                    <td className="px-6 py-4.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[185px]" title={r.userName}>{r.userName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-[185px]" title={r.userEmail}>{r.userEmail}</div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">{r.className}</td>
                    <td className="px-6 py-4.5 whitespace-nowrap">{r.subjectName}</td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px] text-slate-500 uppercase">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {r.status === 'present' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/10">
                          Present
                        </span>
                      )}
                      {r.status === 'late' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/10 animate-pulse">
                          Late
                        </span>
                      )}
                      {r.status === 'absent' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/10">
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 font-mono whitespace-nowrap text-slate-500">
                      {new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4.5 text-slate-400 italic font-sans truncate max-w-[150px]" title={r.comment}>
                      {r.comment || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
