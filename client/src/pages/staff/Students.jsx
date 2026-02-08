import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  GraduationCap,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

export default function StaffStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get available assignments
  const assignments = user?.assignments || (user?.department ? [{ department: user.department, yearTaught: user.yearTaught }] : []);
  const availableDepts = [...new Set(assignments.map(a => a.department))];
  const availableYears = assignments.find(a => a.department === selectedDept)?.yearTaught || [];

  useEffect(() => {
    fetchAssignedStudents();
  }, [selectedDept, selectedYear, searchTerm]);

  const fetchAssignedStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.department = selectedDept;
      if (selectedYear) params.year = selectedYear;
      if (searchTerm) params.search = searchTerm;
      
      const response = await staffAPI.getAssignedStudents(params);
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      showMessage('error', 'Failed to load your assigned students');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Students</h1>
            <p className="text-slate-600 mt-1">
              View and manage students assigned to your classes
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg border border-primary-100">
            <UserCheck className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">
              Total Assigned: {students.length}
            </span>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`${message.type === 'success' ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
            <p>{message.text}</p>
          </div>
        )}

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            {/* Dept Filter */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedYear(''); // Reset year when dept changes
                }}
                className="input w-full"
              >
                <option value="">All My Departments</option>
                {availableDepts.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input w-full"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner"></div>
              <span className="ml-3 text-slate-600">Loading your students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-600 text-lg font-medium">No students found</p>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm || selectedYear
                  ? 'Try adjusting your search or filters'
                  : 'No students are currently assigned to your classes'}
              </p>
              <button 
                onClick={fetchAssignedStudents}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Refresh List
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Roll Number</th>
                    <th>Year / Batch</th>
                    <th>Contact Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 border border-slate-200 shadow-inner">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 leading-tight">{student.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">{student.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono font-black text-primary-600">
                        {student.rollNo}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="badge badge-secondary text-[10px]">{student.year}</span>
                          {student.batch && (
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {student.batch}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" /> {student.email}
                          </div>
                          {student.parentPhone && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 ml-4">
                              <span className="font-bold opacity-70">P:</span> {student.parentPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${student.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help Tip */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3">
          <GraduationCap className="w-6 h-6 text-indigo-600 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-bold text-indigo-900 mb-1">Class Assignment Tip</h4>
            <p className="text-indigo-800 opacity-80">
              You are viewing students assigned to your {selectedDept || 'assigned departments'} 
              {selectedYear ? ` for ${selectedYear}` : ' across all years you teach'}. 
              If you believe any students are missing, please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
