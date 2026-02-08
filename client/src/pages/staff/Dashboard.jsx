import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { staffAPI } from '../../services/api';
import { Users, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await staffAPI.getDashboardStats();
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
      title: 'My Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
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
      title: 'Present Today',
      value: stats?.todayAttendance?.present || 0,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
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
          <h2 className="text-2xl font-bold mb-2">Welcome to Staff Dashboard</h2>
          <p className="text-blue-100 mb-4">
            Manage your assigned classes and mark attendance
          </p>
          {stats?.staffInfo && (
            <div className="flex flex-wrap gap-4 text-sm mt-4">
              {stats.staffInfo.assignments && stats.staffInfo.assignments.length > 0 ? (
                stats.staffInfo.assignments.map((assign, idx) => (
                  <div key={idx} className="bg-white bg-opacity-20 px-4 py-2 rounded-lg border border-white border-opacity-30">
                    <span className="font-bold">{assign.department}</span>: {assign.yearTaught?.join(', ')}
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                    <span className="font-semibold">Department:</span> {stats.staffInfo.department}
                  </div>
                  <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                    <span className="font-semibold">Years:</span> {stats.staffInfo.yearTaught?.join(', ')}
                  </div>
                </>
              )}
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <span className="font-semibold">Subjects:</span> {stats.staffInfo.subjects?.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="stat-card bg-white hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-800 mb-1">
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-slate-500">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Attendance */}
        {stats?.recentAttendance && stats.recentAttendance.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Attendance Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAttendance.map((record, index) => (
                    <tr key={index}>
                      <td className="font-medium">{record.studentId?.name || 'N/A'}</td>
                      <td>{record.studentId?.rollNo || 'N/A'}</td>
                      <td>{record.studentId?.department || 'N/A'}</td>
                      <td>{record.studentId?.year || 'N/A'}</td>
                      <td>Period {record.period}</td>
                      <td>
                        <span
                          className={`badge ${
                            record.status === 'Present'
                              ? 'badge-success'
                              : 'badge-danger'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {new Date(record.date).toLocaleDateString('en-IN')}
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
