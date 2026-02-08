import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { staffAPI } from '../../services/api';
import { Calendar, Save, AlertCircle, Filter, BookOpen, CheckCircle, RefreshCw, XCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StaffAttendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    period: '1',
    subject: user?.subjects?.[0] || '',
    department: ''
  });
  const [selectedDept, setSelectedDept] = useState('');

  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (user?.subjects?.length > 0 && !formData.subject) {
      setFormData(prev => ({ ...prev, subject: user.subjects[0] }));
    }
    
    // Pick first assignment as default
    if (user?.assignments?.length > 0) {
      if (!selectedDept) setSelectedDept(user.assignments[0].department);
      if (!selectedYear) setSelectedYear(user.assignments[0].yearTaught[0]);
    } else if (user?.department && user?.yearTaught?.length > 0) {
      // Fallback for old structure
      if (!selectedDept) setSelectedDept(user.department);
      if (!selectedYear) setSelectedYear(user.yearTaught[0]);
    }
  }, [user]);

  // Fetch existing attendance for the selected period/subject
  useEffect(() => {
    if (students.length > 0 && formData.period && formData.subject) {
      loadExistingAttendance();
    }
  }, [formData.period, formData.subject, students, selectedDept, selectedYear]);

  const loadExistingAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await staffAPI.getAttendanceByDate(today);
      if (response.data.success && response.data.data.attendance) {
        const periodAttendance = response.data.data.attendance[formData.period] || [];
        
        // Only consider attendance for the current subject AND currently shown students
        const currentFilteredIds = new Set(filteredStudents.map(s => s._id));
        const subjectAttendance = periodAttendance.filter(record => {
          const studentId = record.studentId?._id || record.studentId;
          return record.subject === formData.subject && currentFilteredIds.has(studentId);
        });

        if (subjectAttendance.length > 0) {
          const newAttendance = { ...attendance };
          // Initialize all as Present first (resetting previous period's view)
          students.forEach(s => {
            newAttendance[s._id] = 'Present';
          });
          
          // Apply existing records
          subjectAttendance.forEach(record => {
            if (record.studentId && record.studentId._id) {
              newAttendance[record.studentId._id] = record.status;
            } else if (typeof record.studentId === 'string') {
              newAttendance[record.studentId] = record.status;
            }
          });
          setAttendance(newAttendance);
          setIsAttendanceMarked(true); // Set flag if attendance found
          setMessage({ type: 'info', text: 'Attendance for this period/subject is already marked. You can\'t edit it now.' });
        } else {
          // Reset to default present if no attendance for this subject/period
          const initialAttendance = {};
          students.forEach(student => {
            initialAttendance[student._id] = 'Present';
          });
          setAttendance(initialAttendance);
          setIsAttendanceMarked(false); // Reset flag
          setMessage(null); // Clear info message if no existing attendance
        }
      } else {
        // If no attendance data for today, reset to all present
        const initialAttendance = {};
        students.forEach(student => {
          initialAttendance[student._id] = 'Present';
        });
        setAttendance(initialAttendance);
        setIsAttendanceMarked(false);
        setMessage(null);
      }
    } catch (error) {
      console.error('Error loading existing attendance:', error);
      setIsAttendanceMarked(false);
      setMessage(null);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAssignedStudents();
      const studentList = response.data.data;
      setStudents(studentList);
      
      // Initialize all as present
      const initialAttendance = {};
      studentList.forEach(student => {
        initialAttendance[student._id] = 'Present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      setMessage({ type: 'error', text: 'Please enter subject name' });
      return;
    }

    try {
      setSubmitting(true);
      const filteredStudents = selectedYear === 'All' 
        ? students 
        : students.filter(s => s.year === selectedYear);

      if (filteredStudents.length === 0) {
        setMessage({ type: 'error', text: 'No students to mark attendance for' });
        return;
      }

      const attendanceData = filteredStudents.map(student => ({
        studentId: student._id,
        status: attendance[student._id] || 'Present'
      }));

      await staffAPI.markAttendance({
        date: formData.date,
        period: parseInt(formData.period),
        subject: formData.subject,
        attendanceData
      });

      setMessage({ 
        type: 'success', 
        text: 'Attendance marked successfully! Notifications sent to parents of absent students.' 
      });

      // Reset form
      setTimeout(() => {
        setMessage(null);
      }, 5000);

    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to mark attendance' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.department === selectedDept && s.year === selectedYear
  );

  // Get available years for selected department
  const availableYears = user?.assignments?.find(a => a.department === selectedDept)?.yearTaught || 
                         (user?.department === selectedDept ? user.yearTaught : []);

  const presentCount = filteredStudents.filter(student => attendance[student._id] === 'Present').length;
  const absentCount = filteredStudents.length - presentCount;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Mark Attendance</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Select class details and mark absent students
            </p>
          </div>
          <button 
            onClick={fetchStudents}
            className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
            title="Refresh Students"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>

        {/* Filters Card */}
        <div className="card">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input font-bold"
                required
              >
                <option value="">Select subject</option>
                {user?.subjects?.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="input font-bold"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                  <option key={p} value={p}>Period {p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  const dept = e.target.value;
                  setSelectedDept(dept);
                  // Update year as well
                  const deptAssign = user?.assignments?.find(a => a.department === dept);
                  if (deptAssign && deptAssign.yearTaught.length > 0) {
                    setSelectedYear(deptAssign.yearTaught[0]);
                  } else if (user?.department === dept && user?.yearTaught?.length > 0) {
                    setSelectedYear(user.yearTaught[0]);
                  }
                }}
                className="input"
                required
              >
                {/* Unique departments from assignments */}
                {[...new Set([
                  ...(user?.assignments?.map(a => a.department) || []),
                  ...(user?.department ? [user.department] : [])
                ])].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input"
                required
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {/* Summary Chips */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total</p>
              <p className="text-xl font-black text-slate-800 tracking-tight">{filteredStudents.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-1">Present</p>
              <p className="text-xl font-black text-emerald-600 tracking-tight">{presentCount}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-center">
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-1">Absent</p>
              <p className="text-xl font-black text-rose-600 tracking-tight">{absentCount}</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-8`}>
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="font-bold text-sm tracking-tight">{message.text}</span>
            </div>
          )}

          {/* Student List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Fetching Student List...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-20 px-4 text-slate-500 font-bold uppercase tracking-widest text-xs">
              No students assigned to your classes
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Mark Attendance</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">{selectedDept}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <span className="text-xs font-bold text-primary-600">{filteredStudents.length} Students</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredStudents.map(student => (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => toggleAttendance(student._id)}
                    className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-300 transform active:scale-95 ${
                      attendance[student._id] === 'Present'
                        ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-black text-slate-800 leading-tight group-hover:text-primary-700 transition-colors">{student.name}</p>
                        <p className="text-xs font-mono font-bold text-slate-400 mt-1">{student.rollNo}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.year}</span>
                          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.department.split(' ')[0]}</span>
                        </div>
                      </div>
                      <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all
                        ${attendance[student._id] === 'Present' 
                          ? 'bg-emerald-500 border-emerald-400 text-white translate-x-1' 
                          : 'bg-rose-500 border-rose-400 text-white -translate-x-1'}
                      `}>
                        {attendance[student._id] === 'Present' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                    </div>
                    
                    {/* Visual indicator of selection */}
                    <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 rounded-b-2xl ${
                      attendance[student._id] === 'Present' ? 'bg-emerald-500 w-full' : 'bg-rose-500 w-full'
                    }`} />
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting || filteredStudents.length === 0 || isAttendanceMarked}
                className={`
                  relative overflow-hidden group
                  w-full py-4 rounded-2xl font-black text-xl tracking-tight transition-all duration-300
                  ${isAttendanceMarked 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0'}
                `}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {submitting ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Marking...</span>
                    </>
                  ) : isAttendanceMarked ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                      <span>Attendance Recorded Today</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      <span>Submit Attendance</span>
                    </>
                  )}
                </div>
              </button>
            </>
          )}
        </form>
      </div>
    </Layout>
  );
}
