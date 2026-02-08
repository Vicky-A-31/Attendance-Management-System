import { useState, useEffect } from 'react';
import { adminAPI, reportAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Briefcase
} from 'lucide-react';

export default function AdminAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    attendancePercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    year: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  const departments = ['BCA', 'MCA', 'BBA', 'MBA', 'B.Com', 'M.Com', 'BA Tamil', 'BA English', 'B.Sc Physics', 'B.Sc Mathematics', 'B.Sc Data Science', 'M.Sc Computer Science', 'MA Tamil', 'B.Com Bank Management', 'B.Com (CA)', 'Hospital Administration', 'B.Sc AI & ML', 'Other'];
  const years = ['1st Year', '2nd Year', '3rd Year'];

  useEffect(() => {
    fetchData();
  }, [filters, pagination.page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        ...filters,
        page: pagination.page,
        limit: 50
      };

      // Fetch Stats and Records in parallel
      const [statsRes, recordsRes] = await Promise.all([
        adminAPI.getAttendanceOverview(filters),
        adminAPI.getAllAttendanceRecords(params)
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (recordsRes.data.success) {
        setAttendance(recordsRes.data.data);
        setPagination(prev => ({
          ...prev,
          pages: recordsRes.data.pagination.pages,
          total: recordsRes.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      department: '',
      year: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = () => {
    const exportUrl = reportAPI.getDetailedReportPDF(filters);
    window.open(exportUrl, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Attendance Overview</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Analyze attendance data and generate detailed reports
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            disabled={attendance.length === 0}
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{stats.totalRecords}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Present</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{stats.presentCount}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Absent</p>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">{stats.absentCount}</p>
              </div>
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Attendance</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">{stats.attendancePercentage}%</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="input w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="input w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</label>
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="input w-full"
              >
                <option value="">All Departments</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="input w-full"
              >
                <option value="">All Years</option>
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing {attendance.length} of {pagination.total} records
            </span>
            <div className="flex gap-2">
              <button 
                onClick={resetFilters}
                className="btn-secondary text-sm py-2"
              >
                Reset Filters
              </button>
              <button 
                onClick={fetchData}
                className="btn-primary text-sm py-2 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner mb-4"></div>
              <p className="text-slate-500 font-medium">Crunching attendance data...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-20">
              <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No records found</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                No attendance records match your current filters. Try adjusting the dates or department.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date / Period</th>
                    <th>Student Details</th>
                    <th>Staff / Subject</th>
                    <th>Status</th>
                    <th>Info</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {new Date(record.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-primary-600 font-semibold mt-1 bg-primary-50 w-fit px-2 py-0.5 rounded">
                          Period {record.period}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {record.studentId?.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{record.studentId?.name || 'Deleted Student'}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-tight">
                              {record.studentId?.rollNo} • {record.studentId?.department} • {record.studentId?.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-700">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span className="font-medium">{record.staffId?.name || 'Unknown Staff'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>{record.subject || 'No Subject'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`flex items-center gap-1.5 font-bold text-xs ${
                          record.status === 'Present' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {record.status === 'Present' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {record.status}
                        </div>
                      </td>
                      <td>
                        <div className="text-[10px] text-slate-400 italic">
                          ID: {record._id.substring(record._id.length - 6)}...
                          {record.notificationSent && (
                            <div className="text-blue-500 mt-1 flex items-center gap-1 not-italic">
                              <FileText className="w-3 h-3" /> Parents Notified
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="p-2 rounded hover:bg-white disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <div className="flex gap-1">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      pagination.page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-white text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="p-2 rounded hover:bg-white disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
