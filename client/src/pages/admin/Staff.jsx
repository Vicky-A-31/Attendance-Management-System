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
  RefreshCw,
  BookOpen,
  Briefcase,
  Upload,
  Download,
  XCircle
} from 'lucide-react';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    isActive: 'all'
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    yearTaught: [],
    assignments: [{ department: '', yearTaught: [] }],
    subjects: [''],
    address: '',
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
  
  const [totalCounts, setTotalCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  const departments = ['BCA', 'MCA', 'BBA', 'MBA', 'B.Com', 'M.Com', 'BA Tamil', 'BA English', 'B.Sc Physics', 'B.Sc Mathematics', 'B.Sc Data Science', 'M.Sc Computer Science', 'MA Tamil', 'B.Com Bank Management', 'B.Com (CA)', 'Hospital Administration', 'B.Sc AI & ML', 'Other'];
  const years = ['1st Year', '2nd Year', '3rd Year'];

  // Combined effect for initial load and filter changes with debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStaff();
    }, searchTerm ? 500 : 0); // Only debounce if searching

    return () => clearTimeout(handler);
  }, [filters.department, filters.isActive, searchTerm]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.isActive !== 'all') params.isActive = filters.isActive;
      if (searchTerm) params.search = searchTerm;
      
      const response = await adminAPI.getAllStaff(params);
      setStaff(response.data.data || []);
      
      // Use stats from backend if available
      if (response.data.stats) {
        setTotalCounts(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      showMessage('error', 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      department: '',
      isActive: 'all'
    });
    setSearchTerm('');
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleOpenModal = (mode, staffMember = null) => {
    setModalMode(mode);
    setSelectedStaff(staffMember);
    if (mode === 'add') {
      setFormData({
        department: '',
        yearTaught: [],
        assignments: [{ department: '', yearTaught: [] }],
        subjects: [''],
        address: '',
        isActive: true
      });
    } else if (staffMember) {
      setFormData({
        name: staffMember.name || '',
        email: staffMember.email || '',
        phone: staffMember.phone || '',
        department: staffMember.department || '',
        yearTaught: staffMember.yearTaught || [],
        assignments: staffMember.assignments && staffMember.assignments.length > 0 
          ? staffMember.assignments 
          : [{ department: staffMember.department || '', yearTaught: staffMember.yearTaught || [] }],
        subjects: staffMember.subjects && staffMember.subjects.length > 0 ? staffMember.subjects : [''],
        address: staffMember.address || '',
        isActive: staffMember.isActive !== undefined ? staffMember.isActive : true
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';

    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    
    // Validate assignments
    const validAssignments = formData.assignments.filter(a => a.department && a.yearTaught.length > 0);
    if (validAssignments.length === 0) {
      errors.assignments = 'At least one complete assignment (Department + Year) is required';
    }

    const validSubjects = formData.subjects.filter(s => s.trim() !== '');
    if (validSubjects.length === 0) {
      errors.subjects = 'At least one subject is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      // Clean up data for submission
      const submissionData = {
        ...formData,
        subjects: formData.subjects.filter(s => s.trim() !== ''),
        assignments: formData.assignments.filter(a => a.department && a.yearTaught.length > 0)
      };

      // Remove legacy fields if we have assignments
      if (submissionData.assignments.length > 0) {
        delete submissionData.department;
        delete submissionData.yearTaught;
      }

      // In edit mode, if password is empty, don't send it
      if (modalMode === 'edit' && !submissionData.password) {
        delete submissionData.password;
      }

      if (modalMode === 'add') {
        await adminAPI.createStaff(submissionData);
        showMessage('success', 'Staff member added successfully');
      } else if (modalMode === 'edit') {
        await adminAPI.updateStaff(selectedStaff._id, submissionData);
        showMessage('success', 'Staff member updated successfully');
      }
      
      fetchStaff();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving staff:', error);
      let errorMessage = 'Failed to save staff member';
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setFormErrors(prev => ({ ...prev, general: errorMessage }));
      showMessage('error', errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (staffId) => {
    try {
      await adminAPI.deleteStaff(staffId, { params: { permanent: 'true' } });
      showMessage('success', 'Staff member permanently deleted');
      fetchStaff();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
      showMessage('error', error.response?.data?.error || 'Failed to delete staff member');
    }
  };

  // Bulk Import Handlers
  const handleBulkImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

      const response = await adminAPI.bulkImportStaff(formData);
      
      setBulkImportResults(response.data.data);
      showMessage('success', response.data.message || 'Import completed successfully');
      
      fetchStaff();
      setBulkImportFile(null);
    } catch (error) {
      console.error('Bulk import error:', error);
      showMessage('error', error.response?.data?.error || 'Failed to import staff');
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
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...formData.assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setFormData(prev => ({ ...prev, assignments: newAssignments }));
    if (formErrors.assignments) setFormErrors(prev => ({ ...prev, assignments: '' }));
  };

  const addAssignmentField = () => {
    setFormData(prev => ({
      ...prev,
      assignments: [...prev.assignments, { department: '', yearTaught: [] }]
    }));
  };

  const removeAssignmentField = (index) => {
    if (formData.assignments.length > 1) {
      const newAssignments = [...formData.assignments];
      newAssignments.splice(index, 1);
      setFormData(prev => ({ ...prev, assignments: newAssignments }));
    }
  };

  const handleYearToggle = (assignmentIndex, year) => {
    setFormData(prev => {
      const newAssignments = [...prev.assignments];
      const currentYears = [...newAssignments[assignmentIndex].yearTaught];
      const index = currentYears.indexOf(year);
      
      if (index > -1) {
        currentYears.splice(index, 1);
      } else {
        currentYears.push(year);
      }
      
      newAssignments[assignmentIndex] = { 
        ...newAssignments[assignmentIndex], 
        yearTaught: currentYears 
      };
      
      return { ...prev, assignments: newAssignments };
    });
    if (formErrors.assignments) setFormErrors(prev => ({ ...prev, assignments: '' }));
  };

  const handleSubjectChange = (index, value) => {
    const newSubjects = [...formData.subjects];
    newSubjects[index] = value;
    setFormData(prev => ({ ...prev, subjects: newSubjects }));
    if (formErrors.subjects) setFormErrors(prev => ({ ...prev, subjects: '' }));
  };

  const addSubjectField = () => {
    setFormData(prev => ({ ...prev, subjects: [...prev.subjects, ''] }));
  };

  const removeSubjectField = (index) => {
    if (formData.subjects.length > 1) {
      const newSubjects = [...formData.subjects];
      newSubjects.splice(index, 1);
      setFormData(prev => ({ ...prev, subjects: newSubjects }));
    }
  };

  const stats = {
    total: totalCounts.total,
    active: totalCounts.active,
    inactive: totalCounts.inactive,
    filtered: totalCounts.filtered || staff.length
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Staff Directory</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Manage faculty members and department assignments
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
              Add New Faculty
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
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
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
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
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

        {/* Filters Card */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search faculty by name or email..."
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
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
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
                onClick={fetchStaff}
                className="flex-1 sm:flex-none btn-primary text-[10px] py-1.5 px-4 uppercase font-black tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner"></div>
              <span className="ml-3 text-slate-600 font-bold uppercase tracking-widest text-xs">Loading staff...</span>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-bold">No staff members found</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Email / Phone</th>
                    <th>Department</th>
                    <th>Years Taught</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="font-semibold text-slate-800">{s.name}</div>
                      </td>
                      <td>
                        <div className="text-sm text-slate-600">{s.email}</div>
                        <div className="text-xs text-slate-500">{s.phone}</div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {s.assignments && s.assignments.length > 0 ? (
                            [...new Set(s.assignments.map(a => a.department))].map((dept, idx) => (
                              <span key={idx} className="badge-primary text-[10px]">
                                {dept}
                              </span>
                            ))
                          ) : (
                            s.department && <span className="badge-primary">{s.department}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {s.assignments && s.assignments.length > 0 ? (
                            [...new Set(s.assignments.flatMap(a => a.yearTaught))].sort().map(year => (
                              <span key={year} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {year}
                              </span>
                            ))
                          ) : (
                            s.yearTaught && s.yearTaught.map(year => (
                              <span key={year} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {year}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-${s.isActive ? 'success' : 'danger'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleOpenModal('view', s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleOpenModal('edit', s)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(s)} className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-200 z-10">
                <h2 className="text-2xl font-bold text-slate-800">
                  {modalMode === 'add' ? 'Add New Staff' : modalMode === 'edit' ? 'Edit Staff' : 'Staff Details'}
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
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700 border-l-4 border-primary-500 pl-2">Basic Information</h3>
                    <div>
                      <label className="label">Full Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={modalMode === 'view'} className={`input ${formErrors.name ? 'input-error' : ''}`} placeholder="Enter full name" />
                      {formErrors.name && <p className="error-message">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={modalMode === 'view'} className={`input ${formErrors.email ? 'input-error' : ''}`} placeholder="staff@college.com" />
                      {formErrors.email && <p className="error-message">{formErrors.email}</p>}
                    </div>
                    <div>
                      <label className="label">Phone Number *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={modalMode === 'view'} className={`input ${formErrors.phone ? 'input-error' : ''}`} placeholder="+91 9876543210" />
                      {formErrors.phone && <p className="error-message">{formErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-700 border-l-4 border-primary-500 pl-2">Assignments (Department & Years)</h3>
                      {modalMode !== 'view' && (
                        <button type="button" onClick={addAssignmentField} className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                          <Plus className="w-4 h-4" /> Add Assignment
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {formData.assignments.map((assignment, assignIdx) => (
                        <div key={assignIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                          {modalMode !== 'view' && formData.assignments.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeAssignmentField(assignIdx)}
                              className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 border border-red-100 rounded-full shadow-sm hover:bg-red-50 transition-colors z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="label">Department *</label>
                              <select 
                                value={assignment.department} 
                                onChange={(e) => handleAssignmentChange(assignIdx, 'department', e.target.value)}
                                disabled={modalMode === 'view'}
                                className="input"
                              >
                                <option value="">Select Department</option>
                                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                              </select>
                            </div>
                            
                            <div className="md:col-span-2">
                              <label className="label">Years Taught *</label>
                              <div className="flex flex-wrap gap-4 mt-2">
                                {years.map(year => (
                                  <label key={year} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      checked={assignment.yearTaught.includes(year)}
                                      onChange={() => handleYearToggle(assignIdx, year)}
                                      disabled={modalMode === 'view'}
                                      className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-700 group-hover:text-primary-600 transition-colors">{year}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {formErrors.assignments && <p className="error-message">{formErrors.assignments}</p>}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="label">Home Address *</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} disabled={modalMode === 'view'} className={`input ${formErrors.address ? 'input-error' : ''}`} rows="2" placeholder="Enter complete address"></textarea>
                    {formErrors.address && <p className="error-message">{formErrors.address}</p>}
                  </div>

                  {/* Dynamic Subjects */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="label flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-500" /> Assigned Subjects *
                      </label>
                      {modalMode !== 'view' && (
                        <button type="button" onClick={addSubjectField} className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                          <Plus className="w-4 h-4" /> Add Subject
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.subjects.map((subject, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => handleSubjectChange(index, e.target.value)}
                            disabled={modalMode === 'view'}
                            className="input flex-1"
                            placeholder="e.g. Data Structures"
                          />
                          {modalMode !== 'view' && formData.subjects.length > 1 && (
                            <button type="button" onClick={() => removeSubjectField(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {formErrors.subjects && <p className="error-message">{formErrors.subjects}</p>}
                  </div>

                  {/* Status Toggle */}
                  {modalMode !== 'add' && (
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} disabled={modalMode === 'view'} className="w-4 h-4 text-primary-600 rounded" />
                        <span className="text-sm font-semibold text-slate-700">Active Employment Status</span>
                      </label>
                    </div>
                  )}
                </div>

                {formErrors.general && (
                  <div className="alert-danger mt-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{formErrors.general}</p>
                  </div>
                )}

                {modalMode !== 'view' && (
                  <div className="flex gap-4 mt-8 pt-6 border-t border-slate-200">
                    <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1" disabled={submitLoading}>Cancel</button>
                    <button type="submit" className="btn-primary flex-1" disabled={submitLoading}>
                      {submitLoading ? <><span className="spinner border-white mr-2"></span> Saving...</> : (modalMode === 'add' ? 'Add Staff' : 'Update Record')}
                    </button>
                  </div>
                )}
              </form>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content max-w-md">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Delete Staff?</h3>
                <p className="text-slate-600 mb-6">Are you sure you want to remove <span className="font-semibold text-slate-800">{deleteConfirm.name}</span>?</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 py-3">No</button>
                  <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger flex-1 py-3">Delete</button>
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
                  <h2 className="text-2xl font-bold text-slate-800">Bulk Import Staff</h2>
                  <p className="text-sm text-slate-500 mt-1">Upload CSV or Excel file to import multiple staff members</p>
                </div>
                <button
                  onClick={handleCloseBulkImportModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="modal-body">
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

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">Need a template?</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Download our template file to see the required format and column structure.
                        </p>
                        <a
                          href="/staff-import-template.csv"
                          download
                          className="inline-flex items-center gap-2 mt-2 text-xs font-bold text-amber-900 hover:text-amber-700 underline"
                        >
                          <Download className="w-3 h-3" />
                          Download CSV Template
                        </a>
                      </div>
                    </div>
                  </div>

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
                        Import Staff
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
