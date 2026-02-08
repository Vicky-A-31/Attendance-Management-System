import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Layout from '../../components/Layout';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Upload
} from 'lucide-react';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    isActive: 'all'
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    department: '',
    year: '',
    parentPhone: '',
    address: '',
    dateOfBirth: '',
    bloodGroup: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Bulk import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState(null);
  
  // Separate state for total counts
  const [totalCounts, setTotalCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  const departments = ['BCA', 'MCA', 'BBA', 'MBA', 'B.Com', 'M.Com', 'BA Tamil', 'BA English', 'B.Sc Physics', 'B.Sc Mathematics', 'B.Sc Data Science', 'M.Sc Computer Science', 'MA Tamil', 'B.Com Bank Management', 'B.Com (CA)', 'Hospital Administration', 'B.Sc AI & ML', 'Other'];
  const years = ['1st Year', '2nd Year', '3rd Year'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Combined effect for initial load and filter changes with debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents();
    }, searchTerm ? 500 : 0); // Only debounce if searching

    return () => clearTimeout(handler);
  }, [filters.department, filters.year, filters.isActive, searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.year) params.year = filters.year;
      if (filters.isActive !== 'all') params.isActive = filters.isActive;
      if (searchTerm) params.search = searchTerm;
      
      const response = await adminAPI.getAllStudents(params);
      setStudents(response.data.data || []);
      
      // Use stats from backend if available
      if (response.data.stats) {
        setTotalCounts(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showMessage('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      department: '',
      year: '',
      isActive: 'all'
    });
    setSearchTerm('');
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleOpenModal = (mode, student = null) => {
    setModalMode(mode);
    setSelectedStudent(student);
    if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        rollNo: '',
        department: '',
        year: '',
        parentPhone: '',
        address: '',
        dateOfBirth: '',
        bloodGroup: '',
        isActive: true
      });
    } else if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        rollNo: student.rollNo || '',
        department: student.department || '',
        year: student.year || '',
        parentPhone: student.parentPhone || '',
        address: student.address || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
        bloodGroup: student.bloodGroup || '',
        isActive: student.isActive !== undefined ? student.isActive : true
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.rollNo.trim()) errors.rollNo = 'Roll number is required';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.year) errors.year = 'Year is required';
    if (!formData.parentPhone.trim()) errors.parentPhone = 'Parent phone is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      if (modalMode === 'add') {
        const response = await adminAPI.createStudent(formData);
        console.log('Student created:', response.data);
        showMessage('success', 'Student added successfully');
        fetchStudents();
        handleCloseModal();
      } else if (modalMode === 'edit') {
        const response = await adminAPI.updateStudent(selectedStudent._id, formData);
        console.log('Student updated:', response.data);
        showMessage('success', 'Student updated successfully');
        fetchStudents();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error saving student:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      // Show error in modal instead of closing it
      let errorMessage = 'Failed to save student';
      
      // Check for validation errors array
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
      } 
      // Check for single error message
      else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      // Check for message field
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      // Fallback to error message
      else if (error.message) {
        errorMessage = error.message;
      }
      
      setFormErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
      
      // Also show in page message
      showMessage('error', errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    try {
      console.log('Deleting student ID:', studentId);
      console.log('Calling API with params:', { params: { permanent: 'true' } });
      
      // Hard delete - permanently remove from database
      const response = await adminAPI.deleteStudent(studentId, { params: { permanent: 'true' } });
      
      console.log('Delete response:', response);
      showMessage('success', 'Student permanently deleted');
      fetchStudents();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      console.error('Error response:', error.response);
      showMessage('error', error.response?.data?.error || 'Failed to delete student');
    }
  };

  // Bulk Import Handlers
  const handleBulkImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(fileExtension)) {
        showMessage('error', 'Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }
      
      setBulkImportFile(file);
      setBulkImportResults(null);
    }
  };

  const handleBulkImportSubmit = async () => {
    if (!bulkImportFile) {
      showMessage('error', 'Please select a file to upload');
      return;
    }

    setBulkImportLoading(true);
    setBulkImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', bulkImportFile);

      const response = await adminAPI.bulkImportStudents(formData);
      
      setBulkImportResults(response.data.data);
      showMessage('success', response.data.message || 'Import completed successfully');
      
      // Refresh student list
      fetchStudents();
      
      // Reset file input
      setBulkImportFile(null);
    } catch (error) {
      console.error('Bulk import error:', error);
      showMessage('error', error.response?.data?.error || 'Failed to import students');
      setBulkImportResults(null);
    } finally {
      setBulkImportLoading(false);
    }
  };

  const handleCloseBulkImportModal = () => {
    setShowBulkImportModal(false);
    setBulkImportFile(null);
    setBulkImportResults(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Backend now handles all filtering, so we just use the students directly
  const filteredStudents = students;

  const stats = {
    total: totalCounts.total,
    active: totalCounts.active,
    inactive: totalCounts.inactive,
    filtered: totalCounts.filtered || students.length
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Student Directory</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Manage student records and performance data
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Bulk Import
            </button>
            <button
              onClick={() => handleOpenModal('add')}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Student
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} animate-fade-in`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="font-bold text-sm tracking-tight">{message.text}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">{stats.active}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inactive</p>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">{stats.inactive}</p>
              </div>
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Filtered</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">{stats.filtered}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="input w-full"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                className="input w-full"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status:</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, isActive: 'all' }))}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                    filters.isActive === 'all'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, isActive: 'active' }))}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                    filters.isActive === 'active'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, isActive: 'inactive' }))}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                    filters.isActive === 'inactive'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:ml-auto">
              <button
                onClick={resetFilters}
                className="flex-1 sm:flex-none btn-secondary text-[10px] py-1.5 px-4 uppercase font-black tracking-widest"
              >
                Reset
              </button>
              <button
                onClick={fetchStudents}
                className="flex-1 sm:flex-none btn-primary text-[10px] py-1.5 px-4 uppercase font-black tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner"></div>
              <span className="ml-3 text-slate-600 font-bold uppercase tracking-widest text-xs">Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-bold">No students found</p>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm || filters.department || filters.year
                  ? 'Try adjusting your filters'
                  : 'Click "Add Student" to create your first student record'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td className="font-mono font-semibold">{student.rollNo}</td>
                      <td className="font-medium">{student.name}</td>
                      <td className="text-slate-600">{student.email}</td>
                      <td>
                        <span className="badge-primary">{student.department}</span>
                      </td>
                      <td>
                        <span className="badge-secondary">{student.year}</span>
                      </td>

                      <td>
                        {student.isActive ? (
                          <span className="badge-success">Active</span>
                        ) : (
                          <span className="badge-danger">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal('view', student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal('edit', student)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800">
                  {modalMode === 'add' ? 'Add New Student' : modalMode === 'edit' ? 'Edit Student' : 'Student Details'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.name ? 'input-error' : ''}`}
                      placeholder="Enter student name"
                    />
                    {formErrors.name && (
                      <p className="error-message">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.email ? 'input-error' : ''}`}
                      placeholder="student@example.com"
                    />
                    {formErrors.email && (
                      <p className="error-message">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Roll Number */}
                  <div>
                    <label className="label">Roll Number *</label>
                    <input
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.rollNo ? 'input-error' : ''}`}
                      placeholder="CS001"
                    />
                    {formErrors.rollNo && (
                      <p className="error-message">{formErrors.rollNo}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="label">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.department ? 'input-error' : ''}`}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {formErrors.department && (
                      <p className="error-message">{formErrors.department}</p>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="label">Year *</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.year ? 'input-error' : ''}`}
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {formErrors.year && (
                      <p className="error-message">{formErrors.year}</p>
                    )}
                  </div>

                  {/* Parent Phone */}
                  <div>
                    <label className="label">Parent Phone *</label>
                    <input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.parentPhone ? 'input-error' : ''}`}
                      placeholder="+91 9876543210"
                    />
                    {formErrors.parentPhone && (
                      <p className="error-message">{formErrors.parentPhone}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="label">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.dateOfBirth ? 'input-error' : ''}`}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="error-message">{formErrors.dateOfBirth}</p>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="label">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className="input"
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="label">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={modalMode === 'view'}
                      className={`input ${formErrors.address ? 'input-error' : ''}`}
                      rows="3"
                      placeholder="Enter full address"
                    ></textarea>
                    {formErrors.address && (
                      <p className="error-message">{formErrors.address}</p>
                    )}
                  </div>

                  {/* Active Status */}
                  {modalMode !== 'add' && (
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                          disabled={modalMode === 'view'}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Active Student</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* General Error Message */}
                {formErrors.general && (
                  <div className="alert-danger animate-fade-in mt-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-medium">{formErrors.general}</p>
                    </div>
                  </div>
                )}

                {modalMode !== 'view' && (
                  <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn-secondary flex-1"
                      disabled={submitLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <>
                          <div className="spinner border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        modalMode === 'add' ? 'Add Student' : 'Update Student'
                      )}
                    </button>
                  </div>
                )}
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content max-w-md">
              <div className="p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 text-center mb-3">
                  Delete Student?
                </h3>
                <p className="text-slate-600 text-center mb-2">
                  Are you sure you want to permanently delete:
                </p>
                <p className="text-lg font-semibold text-slate-800 text-center mb-4">
                  {deleteConfirm.name}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm._id)}
                    className="btn-danger flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImportModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Bulk Import Students</h2>
                  <p className="text-sm text-slate-500 mt-1">Upload CSV or Excel file to import multiple students</p>
                </div>
                <button
                  onClick={handleCloseBulkImportModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="modal-body">
                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary-500 transition-colors">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleBulkImportFileChange}
                        className="hidden"
                        disabled={bulkImportLoading}
                      />
                      <span className="btn-primary inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Choose File
                      </span>
                    </label>
                    <p className="text-sm text-slate-500 mt-3">
                      Supported formats: CSV, Excel (.xlsx, .xls)
                    </p>
                    {bulkImportFile && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          Selected: {bulkImportFile.name}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Size: {(bulkImportFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Template Download */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">Need a template?</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Download our template file to see the required format and column structure.
                        </p>
                        <a
                          href="/student-import-template.csv"
                          download
                          className="inline-flex items-center gap-2 mt-2 text-xs font-bold text-amber-900 hover:text-amber-700 underline"
                        >
                          <Download className="w-3 h-3" />
                          Download CSV Template
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Import Results */}
                  {bulkImportResults && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="text-xs font-bold text-emerald-600 uppercase">Success</p>
                              <p className="text-2xl font-black text-emerald-900">{bulkImportResults.successCount}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-rose-600" />
                            <div>
                              <p className="text-xs font-bold text-rose-600 uppercase">Errors</p>
                              <p className="text-2xl font-black text-rose-900">{bulkImportResults.errorCount}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {bulkImportResults.errors && bulkImportResults.errors.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                          <p className="text-sm font-bold text-slate-700 mb-3">Error Details:</p>
                          <div className="space-y-2">
                            {bulkImportResults.errors.map((error, index) => (
                              <div key={index} className="bg-white border border-rose-200 rounded-lg p-3">
                                <p className="text-xs font-semibold text-rose-900">{error.error}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                  {error.data.name || error.data.email || 'Unknown record'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={handleCloseBulkImportModal}
                    className="btn-secondary flex-1"
                    disabled={bulkImportLoading}
                  >
                    {bulkImportResults ? 'Close' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleBulkImportSubmit}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={!bulkImportFile || bulkImportLoading}
                  >
                    {bulkImportLoading ? (
                      <>
                        <div className="spinner border-white"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import Students
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
