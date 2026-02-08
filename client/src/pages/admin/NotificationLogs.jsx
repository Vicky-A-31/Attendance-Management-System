import { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';
import Layout from '../../components/Layout';
import { 
  Bell, 
  Search, 
  MessageSquare, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  Send
} from 'lucide-react';

export default function NotificationLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ 
        page: pagination.page, 
        limit: 50 
      });
      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(prev => ({
          ...prev,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <span className="badge-success flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Sent</span>;
      case 'failed':
        return <span className="badge-danger flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Failed</span>;
      case 'test':
        return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold border border-amber-200 flex items-center gap-1 w-fit uppercase tracking-wider"><AlertTriangle className="w-3 h-3" /> Test Mode</span>;
      default:
        return <span className="badge-secondary">{status}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Notification Logs</h1>
            <p className="text-slate-600 mt-1">Review all SMS and WhatsApp alerts sent to parents</p>
          </div>
          <button 
            onClick={() => { setPagination(p => ({ ...p, page: 1 })); fetchLogs(); }}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
          </button>
        </div>

        {/* Info Box for Test Mode */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3 animate-fade-in text-sm mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900">How to test without Twilio?</h4>
            <p className="text-blue-800 opacity-90 leading-relaxed">
              When Twilio credentials are not configured, the system automatically uses <strong>Test Mode</strong>. 
              Instead of sending a real SMS, the message is logged below. You can verify the content, 
              recipient phone number, and timing of every notification right here in the dashboard.
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card overflow-hidden">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="spinner mb-4"></div>
              <p className="text-slate-500 font-medium">Fetching logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-16 h-16 text-slate-100 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No notifications yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Once attendance is marked as 'Absent', notification logs will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Message Content</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {log.type === 'whatsapp' ? (
                            <>
                              <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 uppercase">WhatsApp</span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                <Send className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 uppercase">SMS</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-700 text-sm">
                            {log.to}
                          </span>
                          {log.metadata?.studentName && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-medium text-slate-500">{log.metadata.studentName}</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] font-mono text-slate-400">{log.metadata.rollNo}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="max-w-md">
                        <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 italic">
                          "{log.message}"
                        </p>
                      </td>
                      <td>
                        {getStatusBadge(log.status)}
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
              <div className="flex gap-1 text-xs font-semibold text-slate-500">
                Page {pagination.page} of {pagination.pages}
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
