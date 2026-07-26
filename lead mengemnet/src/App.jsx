import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, Shield, LayoutDashboard, Database, 
  FileText, LogOut, Search, Plus, Filter, ArrowUpDown, 
  ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, 
  Building2, Mail, Phone, Tag, User, Settings, Lock, 
  Activity, ExternalLink, Trash2, Edit, Eye, Send, Sparkles, Code
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loginEmail, setLoginEmail] = useState('admin@example.com');
  const [loginPassword, setLoginPassword] = useState('Password123');
  const [loading, setLoading] = useState(false);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]); // Simulated from updates
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Setup on mount
  useEffect(() => {
    if (token) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if(storedUser) {
        setCurrentUser(storedUser);
        fetchLeads(token, storedUser);
        if(storedUser.role === 'Admin') fetchUsers(token);
      }
    }
  }, [token]);

  const authHeaders = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };

  // Trigger Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const logActivity = (type, details, userName) => {
    const newAct = {
      id: 'a_' + Date.now(),
      type,
      details,
      timestamp: new Date().toISOString(),
      user: userName || currentUser?.name || 'System'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // --- API CALLS ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setToken(data.token);
        setCurrentUser(data);
        logActivity('Login', `User ${data.name} logged in securely`, data.name);
        showToast(`Welcome back, ${data.name}!`);
        setActiveTab('dashboard');
      } else {
        showToast(data.message || 'Invalid credentials', 'error');
      }
    } catch (err) {
      showToast('Backend connection refused. Is server running?', 'error');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logActivity('Logout', `User logged out`, currentUser?.name);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setLeads([]);
  };

  const fetchLeads = async (authToken, user) => {
    try {
      const res = await fetch(`${API_URL}/leads`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if(res.ok) {
        const data = await res.json();
        setLeads(data);
        logActivity('Sync', `Synchronized ${data.length} leads from database`, user.name);
      }
    } catch (err) {
      showToast('Error fetching leads', 'error');
    }
  };

  const fetchUsers = async (authToken) => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if(res.ok) setUsers(await res.json());
    } catch (err) {}
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    const form = e.target;
    const leadData = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      company: form.company.value,
      source: form.source.value,
      status: form.status.value,
      assignedUser: form.assignedUser.value,
    };

    try {
      if (editingLead) {
        const res = await fetch(`${API_URL}/leads/${editingLead._id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(leadData)
        });
        if(res.ok) {
          const updated = await res.json();
          setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
          logActivity('Lead Updated', `Lead "${updated.name}" was updated`, currentUser.name);
          showToast('Lead updated successfully!');
        }
      } else {
        const res = await fetch(`${API_URL}/leads`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(leadData)
        });
        if(res.ok) {
          const newL = await res.json();
          setLeads(prev => [newL, ...prev]);
          logActivity('Lead Created', `Lead "${newL.name}" created`, currentUser.name);
          showToast('New lead created successfully!');
        }
      }
      setIsLeadModalOpen(false);
      setEditingLead(null);
    } catch(err) {
      showToast('Action failed', 'error');
    }
  };

  const handleDeleteLead = async (id, name) => {
    if (currentUser.role !== 'Admin') return;
    if (window.confirm(`Are you sure you want to delete lead "${name}"?`)) {
      try {
        const res = await fetch(`${API_URL}/leads/${id}`, { method: 'DELETE', headers: authHeaders });
        if(res.ok) {
          setLeads(prev => prev.filter(l => l._id !== id));
          logActivity('Lead Deleted', `Lead "${name}" deleted permanently`, currentUser.name);
          showToast('Lead deleted.', 'info');
          if (selectedLead?._id === id) setSelectedLead(null);
        }
      } catch(err) { showToast('Delete failed', 'error'); }
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    const originalLead = leads.find(l => l._id === leadId);
    try {
      // Optimistic UI update
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, status: newStatus } : l));
      
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
        if (selectedLead && selectedLead._id === leadId) setSelectedLead(updated);
        logActivity('Status Changed', `Status of "${updated.name}" updated to ${newStatus}`, currentUser.name);
        showToast(`Status updated to ${newStatus}`);
      } else {
        throw new Error('Update failed');
      }
    } catch (err) { 
      // Revert if failed
      setLeads(prev => prev.map(l => l._id === leadId ? originalLead : l));
      showToast('Error updating status', 'error'); 
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedLead) return;
    
    try {
      const res = await fetch(`${API_URL}/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ note: newNoteText })
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
        setSelectedLead(updated);
        logActivity('Note Added', `New note on "${updated.name}"`, currentUser.name);
        setNewNoteText('');
        showToast('Note added securely!');
      }
    } catch(err) { showToast('Failed to add note', 'error'); }
  };

  // --- FILTERING & PAGINATION ---

  const filteredLeads = useMemo(() => {
    let list = [...leads];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        (l.company && l.company.toLowerCase().includes(q)) || 
        (l.email && l.email.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'ALL') list = list.filter(l => l.status === statusFilter);
    if (sourceFilter !== 'ALL') list = list.filter(l => l.source === sourceFilter);

    list.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [leads, searchTerm, statusFilter, sourceFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status) => {
    const map = {
      'New': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Contacted': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'Qualified': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Proposal': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'Won': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'Lost': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    return map[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
                <Shield className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">LeadSync Enterprise</h1>
              <p className="text-sm text-slate-400 mt-1">Production Lead Management Platform</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <button 
                disabled={loading}
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Authenticate & Access'}</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium mb-3 text-center">Quick Demo Credentials (Click to Fill):</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { setLoginEmail('admin@example.com'); setLoginPassword('Password123'); }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-left transition-all"
                >
                  <p className="text-xs font-bold text-indigo-400">Admin Account</p>
                  <p className="text-[11px] text-slate-400">admin@example.com</p>
                </button>
                <button 
                  onClick={() => { setLoginEmail('member@example.com'); setLoginPassword('Password123'); }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-left transition-all"
                >
                  <p className="text-xs font-bold text-violet-400">Member Account</p>
                  <p className="text-[11px] text-slate-400">member@example.com</p>
                </button>
              </div>
            </div>
          </div>
        </div>
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950">
          Built for <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-medium">Digital Heroes Training Task</a>
        </footer>
      </div>
    );
  }

  // --- MAIN DASHBOARD APP ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 bg-slate-900 border border-slate-700 shadow-2xl px-4 py-3 rounded-xl animate-bounce">
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-medium text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">LeadSync Enterprise</h1>
            <p className="text-[11px] text-slate-400">Live API Connected Mode</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
            <div className="w-9 h-9 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center font-bold text-indigo-300">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{currentUser.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider mt-0.5 ${currentUser.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'}`}>
                {currentUser.role}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg ml-2" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar + Main */}
      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Navigation</p>
          
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <LayoutDashboard className="w-4 h-4" /> <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('leads')} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leads' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <Users className="w-4 h-4" /> <span>Leads Pipeline</span>
          </button>
          {currentUser.role === 'Admin' && (
            <button onClick={() => setActiveTab('members')} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'members' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
              <UserCheck className="w-4 h-4" /> <span>Team Members</span>
            </button>
          )}
          <button onClick={() => setActiveTab('activities')} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'activities' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <Activity className="w-4 h-4" /> <span>Live Activities</span>
          </button>
        </aside>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-950">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Live Operations Dashboard</h2>
                  <p className="text-sm text-slate-400">Data pulling from MongoDB via REST API.</p>
                </div>
                {currentUser.role === 'Admin' && (
                  <button onClick={() => { setEditingLead(null); setIsLeadModalOpen(true); }} className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm px-4 py-2 rounded-lg">
                    <Plus className="w-4 h-4" /> <span>Create Lead</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-400 uppercase">Total Leads</p><Users className="w-5 h-5 text-indigo-400" /></div>
                  <h3 className="text-3xl font-bold text-white mt-3">{leads.length}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-400 uppercase">Won Leads</p><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>
                  <h3 className="text-3xl font-bold text-white mt-3">{leads.filter(l => l.status === 'Won').length}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-400 uppercase">Proposals</p><FileText className="w-5 h-5 text-indigo-400" /></div>
                  <h3 className="text-3xl font-bold text-white mt-3">{leads.filter(l => l.status === 'Proposal').length}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-400 uppercase">New Leads</p><Tag className="w-5 h-5 text-amber-400" /></div>
                  <h3 className="text-3xl font-bold text-white mt-3">{leads.filter(l => l.status === 'New').length}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 shadow-lg">
                  <h3 className="text-base font-bold text-white mb-4">Pipeline Status Chart</h3>
                  <div className="space-y-4">
                    {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(st => {
                      const count = leads.filter(l => l.status === st).length;
                      const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                      return (
                        <div key={st} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{st}</span>
                            <span className="text-slate-400">{count} leads ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
                  <h3 className="text-base font-bold text-white mb-4">Session Activities</h3>
                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-1">
                    {activities.length === 0 ? <p className="text-xs text-slate-500">No recent activity.</p> : activities.slice(0, 10).map(act => (
                      <div key={act.id} className="flex space-x-3 text-sm pb-3 border-b border-slate-800/60 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-200">{act.details}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400">{act.user}</span>
                            <span className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LEADS PIPELINE */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Leads Database</h2>
                  <p className="text-sm text-slate-400">Search, filter, and modify live records.</p>
                </div>
                {currentUser.role === 'Admin' && (
                  <button onClick={() => { setEditingLead(null); setIsLeadModalOpen(true); }} className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm px-4 py-2 rounded-lg">
                    <Plus className="w-4 h-4" /> <span>Create Lead</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input type="text" placeholder="Search by name, company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300">
                    <option value="ALL">All Statuses</option>
                    {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [field, ord] = e.target.value.split('-'); setSortBy(field); setSortOrder(ord); }} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300">
                    <option value="updatedAt-desc">Latest Updated</option>
                    <option value="createdAt-desc">Newest Created</option>
                    <option value="name-asc">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="p-4">Lead Info</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Source</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Assigned User</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-sm">
                      {paginatedLeads.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-400">No leads found.</td></tr>
                      ) : paginatedLeads.map(lead => (
                          <tr key={lead._id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              <p className="font-semibold text-white">{lead.name}</p>
                              <p className="text-xs text-slate-400 flex items-center mt-0.5"><Building2 className="w-3 h-3 mr-1" /> {lead.company || 'N/A'}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-slate-300 text-xs flex items-center"><Mail className="w-3 h-3 mr-1" /> {lead.email}</p>
                              <p className="text-slate-400 text-xs flex items-center mt-1"><Phone className="w-3 h-3 mr-1" /> {lead.phone}</p>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 text-slate-300">{lead.source || 'Other'}</span>
                            </td>
                            <td className="p-4">
                              <select value={lead.status} onChange={(e) => handleStatusChange(lead._id, e.target.value)} className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${getStatusBadge(lead.status)}`}>
                                {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => <option key={s} value={s} className="bg-slate-900 text-slate-200">{s}</option>)}
                              </select>
                            </td>
                            <td className="p-4 text-xs font-medium text-slate-300">{lead.assignedUser}</td>
                            <td className="p-4 text-right space-x-2">
                              <button onClick={() => setSelectedLead(lead)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"><Eye className="w-4 h-4" /></button>
                              {currentUser.role === 'Admin' && (
                                <>
                                  <button onClick={() => { setEditingLead(lead); setIsLeadModalOpen(true); }} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteLead(lead._id, lead.name)} className="p-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-800 flex items-center justify-between text-sm text-slate-400">
                  <p>Page {currentPage} of {totalPages} ({filteredLeads.length} total)</p>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage===1} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage===totalPages} className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MEMBERS (Admin Only) */}
          {activeTab === 'members' && currentUser.role === 'Admin' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Team Members (DB View)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {users.map(u => (
                  <div key={u._id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{u.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'}`}>{u.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Live Session Logs</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
                {activities.length === 0 ? <p className="text-slate-400">No activities logged yet during this session.</p> : activities.map(act => (
                  <div key={act.id} className="flex items-start space-x-4 p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5"><Activity className="w-4 h-4" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase text-indigo-400">{act.type}</span><span className="text-xs text-slate-400">{new Date(act.timestamp).toLocaleString()}</span></div>
                      <p className="text-sm font-medium text-slate-200 mt-1">{act.details}</p>
                      <p className="text-xs text-slate-400 mt-1">By: <span className="text-slate-300">{act.user}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* LEAD DETAILS & NOTES MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${getStatusBadge(selectedLead.status)}`}>{selectedLead.status}</span>
                <h3 className="text-xl font-bold text-white mt-2">{selectedLead.name}</h3>
                <p className="text-xs text-slate-400 flex items-center mt-1"><Building2 className="w-3 h-3 mr-1" /> {selectedLead.company || 'No Company'}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div><p className="text-xs text-slate-400">Email</p><p className="text-slate-200">{selectedLead.email}</p></div>
                <div><p className="text-xs text-slate-400">Phone</p><p className="text-slate-200">{selectedLead.phone}</p></div>
                <div><p className="text-xs text-slate-400">Source</p><p className="text-slate-200">{selectedLead.source}</p></div>
                <div><p className="text-xs text-slate-400">Assigned</p><p className="text-slate-200">{selectedLead.assignedUser}</p></div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm">Lead Notes & Communication Log</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {!selectedLead.notes || selectedLead.notes.length === 0 ? <p className="text-xs text-slate-500 italic">No notes added yet.</p> : selectedLead.notes.map(note => (
                    <div key={note._id || note.timestamp} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                      <div className="flex justify-between font-semibold text-slate-300 mb-1">
                        <span>{note.author}</span><span className="text-slate-500">{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200">{note.message}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input type="text" placeholder="Add a new note..." value={newNoteText} onChange={e => setNewNoteText(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" required />
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center shadow-md"><Send className="w-3.5 h-3.5 mr-1" /> Add Note</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT LEAD MODAL */}
      {isLeadModalOpen && currentUser.role === 'Admin' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between"><h3 className="text-lg font-bold text-white">{editingLead ? 'Edit Lead' : 'Create New Lead'}</h3><button onClick={() => { setIsLeadModalOpen(false); setEditingLead(null); }} className="text-slate-400">✕</button></div>
            <form onSubmit={handleSaveLead} className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Lead Name</label><input type="text" name="name" defaultValue={editingLead?.name || ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label><input type="email" name="email" defaultValue={editingLead?.email || ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" required /></div>
                <div><label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Phone</label><input type="text" name="phone" defaultValue={editingLead?.phone || ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Company</label><input type="text" name="company" defaultValue={editingLead?.company || ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200" required /></div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Source</label>
                  <select name="source" defaultValue={editingLead?.source || 'Website'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
                    {['Website', 'LinkedIn', 'Referral', 'Google Ads', 'Conference'].map(src => <option key={src}>{src}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Status</label>
                  <select name="status" defaultValue={editingLead?.status || 'New'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
                    {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Assign User</label>
                  <select name="assignedUser" defaultValue={editingLead?.assignedUser || 'Member User'} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
                    {users.length > 0 ? users.map(u => <option key={u._id} value={u.name}>{u.name}</option>) : <option>Member User</option>}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => { setIsLeadModalOpen(false); setEditingLead(null); }} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">{editingLead ? 'Save Changes' : 'Create Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500 mt-auto">
        Built for <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-medium">Digital Heroes Training Task</a>
      </footer>
    </div>
  );
}