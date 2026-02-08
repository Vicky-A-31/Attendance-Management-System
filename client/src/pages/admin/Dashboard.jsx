import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Users, UserCheck, TrendingUp, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Staff',
      value: stats?.totalStaff || 0,
      icon: UserCheck,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: "Today's Attendance",
      value: `${stats?.todayAttendance?.percentage || 0}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtitle: `${stats?.todayAttendance?.present || 0} / ${stats?.todayAttendance?.total || 0} Present`
    },
    {
      title: 'Absent Today',
      value: stats?.todayAttendance?.absent || 0,
      icon: Calendar,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="card bg-gradient-to-r from-primary-600 to-indigo-600 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h2>
          <p className="text-blue-100">
            Manage students, staff, and monitor attendance across the institution
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="stat-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-[10px] font-bold text-primary-600 mt-1 uppercase tracking-wider">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} p-2.5 rounded-xl shadow-inner border border-white/50`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Department Stats */}
        {stats?.departmentStats && stats.departmentStats.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Department Distribution</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.departmentStats.map((dept, index) => (
                <div key={index} className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/60 hover:border-primary-200 transition-all hover:bg-white hover:shadow-sm">
                  <div className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                    {dept._id}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="text-left">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Students</p>
                      <p className="text-xl font-black text-primary-600 tracking-tight">{dept.studentCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Staff</p>
                      <p className="text-xl font-black text-indigo-600 tracking-tight">{dept.staffCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Attendance */}
        {stats?.recentAttendance && stats.recentAttendance.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Dept / Year</th>
                    <th>Attendance</th>
                    <th>Managed By</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAttendance.slice(0, 10).map((record, index) => (
                    <tr key={index}>
                      <td>
                        <div className="font-bold text-slate-800">{record.studentId?.name || 'N/A'}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">{record.studentId?.rollNo || 'N/A'}</div>
                      </td>
                      <td>
                        <div className="text-xs font-bold text-slate-600">{record.studentId?.department || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{record.studentId?.year || 'N/A'}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${record.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                            {record.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">P-{record.period}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(record.date).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td>
                        <div className="text-xs font-bold text-slate-700">{record.staffId?.name || 'N/A'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
