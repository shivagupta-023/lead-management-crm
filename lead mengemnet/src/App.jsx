import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, Shield, LayoutDashboard, Database, 
  FileText, LogOut, Search, Plus, Filter, ArrowUpDown, 
  ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, 
  Building2, Mail, Phone, Tag, User, Settings, Lock, 
  Activity, ExternalLink, Trash2, Edit, Eye, Send, Sparkles, Code,
  Menu, X
} from 'lucide-react';

// const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://lead-management-crm-9k7o.vercel.app/api';

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

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      'New': 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
      'Contacted': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
      'Qualified': 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]',
      'Proposal': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]',
      'Won': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
      'Lost': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    };
    return map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close menu on mobile after clicking
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
              <button 
                disabled={loading}
                type="submit"
                className="w-full mt-4 py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-center space-x-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)] px-4 py-3 rounded-xl animate-bounce">
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-medium text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl shrink-0 z-40 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
            <Shield className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight hidden sm:block">LeadSync Enterprise</h1>
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight sm:hidden">LeadSync</h1>
            <p className="text-[10px] md:text-[11px] text-indigo-400 font-medium">Live API Connected</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="flex items-center space-x-3 pl-3 md:pl-4 border-l border-white/10">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-200">{currentUser.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-0.5 ${currentUser.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'}`}>
                {currentUser.role}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg ml-1 md:ml-2 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`absolute md:relative z-50 w-64 h-full border-r border-white/5 bg-slate-950/95 md:bg-slate-900/20 backdrop-blur-2xl p-4 flex flex-col space-y-1 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-3">Navigation</p>
          
          <button onClick={() => handleNavigation('dashboard')} className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <LayoutDashboard className="w-4 h-4" /> <span>Dashboard</span>
          </button>
          <button onClick={() => handleNavigation('leads')} className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'leads' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <Users className="w-4 h-4" /> <span>Leads Pipeline</span>
          </button>
          {currentUser.role === 'Admin' && (
            <button onClick={() => handleNavigation('members')} className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'members' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
              <UserCheck className="w-4 h-4" /> <span>Team Members</span>
            </button>
          )}
          <button onClick={() => handleNavigation('activities')} className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'activities' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <Activity className="w-4 h-4" /> <span>Live Activities</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-950 to-slate-900 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Live Operations</h2>
                  <p className="text-sm text-slate-400 mt-1">Data pulling from MongoDB via REST API.</p>
                </div>
                {currentUser.role === 'Admin' && (
                  <button onClick={() => { setEditingLead(null); setIsLeadModalOpen(true); }} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                    <Plus className="w-4 h-4" /> <span>Create Lead</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 shadow-xl">
                  <div className="flex items-center justify-between"><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</p><Users className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" /></div>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mt-3 md:mt-4">{leads.length}</h3>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 shadow-xl">
                  <div className="flex items-center justify-between"><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Won Leads</p><CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /></div>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mt-3 md:mt-4">{leads.filter(l => l.status === 'Won').length}</h3>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 shadow-xl hidden sm:block">
                  <div className="flex items-center justify-between"><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Proposals</p><FileText className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" /></div>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mt-3 md:mt-4">{leads.filter(l => l.status === 'Proposal').length}</h3>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 shadow-xl hidden sm:block">
                  <div className="flex items-center justify-between"><p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">New Leads</p><Tag className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /></div>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mt-3 md:mt-4">{leads.filter(l => l.status === 'New').length}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 md:p-6 lg:col-span-2 shadow-xl">
                  <h3 className="text-sm md:text-base font-bold text-white mb-5 flex items-center"><Activity className="w-4 h-4 mr-2 text-indigo-400" /> Pipeline Status</h3>
                  <div className="space-y-5">
                    {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(st => {
                      const count = leads.filter(l => l.status === st).length;
                      const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                      return (
                        <div key={st} className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-300">{st}</span>
                            <span className="text-slate-400">{count} leads ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-950/50 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col">
                  <h3 className="text-sm md:text-base font-bold text-white mb-5 flex items-center"><Clock className="w-4 h-4 mr-2 text-indigo-400" /> Recent Activities</h3>
                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                    {activities.length === 0 ? <p className="text-xs text-slate-500 text-center py-4">No recent activity.</p> : activities.slice(0, 10).map(act => (
                      <div key={act.id} className="flex space-x-3 text-sm pb-4 border-b border-white/5 last:border-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] mt-1.5 shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-[13px] leading-tight font-medium text-slate-200">{act.details}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] font-bold text-slate-500">{act.user}</span>
                            <span className="text-[10px] text-slate-500">{new Date(act.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
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
            <div className="space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Leads Database</h2>
                  <p className="text-sm text-slate-400 mt-1">Search, filter, and modify live records.</p>
                </div>
                {currentUser.role === 'Admin' && (
                  <button onClick={() => { setEditingLead(null); setIsLeadModalOpen(true); }} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                    <Plus className="w-4 h-4" /> <span>Create Lead</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-xl">
                <div className="relative w-full lg:w-96">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input type="text" placeholder="Search by name, company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="flex-1 sm:flex-none bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="ALL">All Statuses</option>
                    {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [field, ord] = e.target.value.split('-'); setSortBy(field); setSortOrder(ord); }} className="flex-1 sm:flex-none bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="updatedAt-desc">Latest Updated</option>
                    <option value="createdAt-desc">Newest Created</option>
                    <option value="name-asc">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-950/40 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <th className="p-4 md:p-5">Lead Info</th>
                        <th className="p-4 md:p-5">Contact</th>
                        <th className="p-4 md:p-5">Source</th>
                        <th className="p-4 md:p-5">Status</th>
                        <th className="p-4 md:p-5 hidden sm:table-cell">Assigned User</th>
                        <th className="p-4 md:p-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {paginatedLeads.length === 0 ? (
                        <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No leads match your search criteria.</td></tr>
                      ) : paginatedLeads.map(lead => (
                          <tr key={lead._id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="p-4 md:p-5">
                              <p className="font-bold text-white text-sm">{lead.name}</p>
                              <p className="text-xs text-slate-400 flex items-center mt-1"><Building2 className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {lead.company || 'N/A'}</p>
                            </td>
                            <td className="p-4 md:p-5">
                              <p className="text-slate-300 text-xs flex items-center"><Mail className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {lead.email}</p>
                              <p className="text-slate-400 text-xs flex items-center mt-1.5"><Phone className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {lead.phone}</p>
                            </td>
                            <td className="p-4 md:p-5">
                              <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/50 border border-white/10 text-slate-300">{lead.source || 'Other'}</span>
                            </td>
                            <td className="p-4 md:p-5">
                              <select value={lead.status} onChange={(e) => handleStatusChange(lead._id, e.target.value)} className={`text-[11px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all ${getStatusBadge(lead.status)}`}>
                                {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => <option key={s} value={s} className="bg-slate-900 text-slate-200">{s}</option>)}
                              </select>
                            </td>
                            <td className="p-4 md:p-5 text-xs font-semibold text-slate-300 hidden sm:table-cell">{lead.assignedUser}</td>
                            <td className="p-4 md:p-5 text-right space-x-2">
                              <button onClick={() => setSelectedLead(lead)} className="p-2.5 bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 rounded-lg transition-colors shadow-sm"><Eye className="w-4 h-4" /></button>
                              {currentUser.role === 'Admin' && (
                                <>
                                  <button onClick={() => { setEditingLead(lead); setIsLeadModalOpen(true); }} className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors shadow-sm"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteLead(lead._id, lead.name)} className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 md:p-5 border-t border-white/5 flex items-center justify-between text-xs md:text-sm font-medium text-slate-400 bg-slate-950/20">
                  <p>Page {currentPage} of {totalPages} ({filteredLeads.length} total)</p>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage===1} className="p-2.5 bg-slate-900 border border-white/5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage===totalPages} className="p-2.5 bg-slate-900 border border-white/5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MEMBERS (Admin Only) */}
          {activeTab === 'members' && currentUser.role === 'Admin' && (
            <div className="space-y-6 relative z-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Team Members</h2>
                <p className="text-sm text-slate-400 mt-1">Manage system access and roles.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {users.map(u => (
                  <div key={u._id} className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-lg text-white border border-white/10 shadow-inner">
                       {u.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{u.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'}`}>{u.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-6 relative z-10">
               <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">System Audit Log</h2>
                <p className="text-sm text-slate-400 mt-1">Real-time tracker of all CRM actions.</p>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
                {activities.length === 0 ? <p className="text-slate-400 text-center py-8">No activities logged yet during this session.</p> : activities.map(act => (
                  <div key={act.id} className="flex items-start space-x-4 p-4 rounded-xl bg-slate-950/50 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner"><Activity className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">{act.type}</span>
                        <span className="text-xs text-slate-500 font-medium">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200 mt-1.5">{act.details}</p>
                      <p className="text-[11px] text-slate-500 mt-1.5 uppercase font-semibold">Triggered by: <span className="text-slate-300">{act.user}</span></p>
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
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-5 md:p-6 border-b border-white/10 flex items-start justify-between bg-slate-900/50">
              <div>
                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusBadge(selectedLead.status)}`}>{selectedLead.status}</span>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-3">{selectedLead.name}</h3>
                <p className="text-xs md:text-sm text-slate-400 flex items-center mt-1.5 font-medium"><Building2 className="w-4 h-4 mr-1.5 opacity-70" /> {selectedLead.company || 'No Company'}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-white/5 hover:bg-slate-800 transition-colors">✕</button>
            </div>
            <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-950/50 p-5 rounded-xl border border-white/5 shadow-inner">
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email</p><p className="text-slate-200 font-medium">{selectedLead.email}</p></div>
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone</p><p className="text-slate-200 font-medium">{selectedLead.phone}</p></div>
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Source</p><p className="text-slate-200 font-medium">{selectedLead.source}</p></div>
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Assigned</p><p className="text-slate-200 font-medium">{selectedLead.assignedUser}</p></div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center"><FileText className="w-4 h-4 mr-2 text-indigo-400" /> Lead Notes & Logs</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                  {!selectedLead.notes || selectedLead.notes.length === 0 ? <p className="text-xs text-slate-500 italic p-4 bg-slate-950/30 rounded-lg text-center">No notes added yet.</p> : selectedLead.notes.map(note => (
                    <div key={note._id || note.timestamp} className="p-4 rounded-xl bg-slate-950/50 border border-white/5 text-sm">
                      <div className="flex justify-between font-bold text-slate-400 mb-2 text-xs">
                        <span className="text-indigo-300">{note.author}</span><span className="text-slate-500">{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{note.message}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                  <input type="text" placeholder="Type a new note..." value={newNoteText} onChange={e => setNewNoteText(e.target.value)} className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" required />
                  <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"><Send className="w-4 h-4 mr-2" /> Save Note</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT LEAD MODAL */}
      {isLeadModalOpen && currentUser.role === 'Admin' && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden my-auto">
            <div className="p-5 md:p-6 border-b border-white/10 flex justify-between bg-slate-900/50">
               <h3 className="text-lg md:text-xl font-bold text-white flex items-center"><Plus className="w-5 h-5 mr-2 text-indigo-400" /> {editingLead ? 'Edit Lead' : 'Create New Lead'}</h3>
               <button onClick={() => { setIsLeadModalOpen(false); setEditingLead(null); }} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-white/5 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveLead} className="p-5 md:p-6 space-y-5">
              <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lead Name</label><input type="text" name="name" defaultValue={editingLead?.name || ''} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email</label><input type="email" name="email" defaultValue={editingLead?.email || ''} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" required /></div>
                <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone</label><input type="text" name="phone" defaultValue={editingLead?.phone || ''} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" required /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Company</label><input type="text" name="company" defaultValue={editingLead?.company || ''} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" required /></div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Source</label>
                  <select name="source" defaultValue={editingLead?.source || 'Website'} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer">
                    {['Website', 'LinkedIn', 'Referral', 'Google Ads', 'Conference'].map(src => <option key={src}>{src}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                  <select name="status" defaultValue={editingLead?.status || 'New'} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer">
                    {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Assign User</label>
                  <select name="assignedUser" defaultValue={editingLead?.assignedUser || 'Member User'} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer">
                    {users.length > 0 ? users.map(u => <option key={u._id} value={u.name}>{u.name}</option>) : <option>Member User</option>}
                  </select>
                </div>
              </div>
              <div className="pt-6 mt-2 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => { setIsLeadModalOpen(false); setEditingLead(null); }} className="px-5 py-2.5 bg-slate-950 border border-white/10 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-bold transition-all w-full sm:w-auto">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all w-full sm:w-auto">{editingLead ? 'Save Changes' : 'Create Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-4 border-t border-white/5 bg-slate-950 text-center text-[11px] md:text-xs font-medium text-slate-500 z-40 shrink-0">
        Built for <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-bold tracking-wide">Digital Heroes Training Task</a>
      </footer>
    </div>
  );
}