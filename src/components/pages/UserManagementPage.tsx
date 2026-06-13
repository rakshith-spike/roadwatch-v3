import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Shield, UserCheck, UserX, Edit2, Plus,
  Mail, MapPin, Calendar, Activity, Filter, Briefcase, Eye
} from 'lucide-react';
import { Card, StatCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { useStore, SystemUser, UserRole } from '../../store/useStore';

const roleColors: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  citizen: 'default',
  contractor: 'info',
  government: 'warning',
  superadmin: 'danger'
};

const roleLabels: Record<string, string> = {
  citizen: 'Citizen',
  contractor: 'Contractor',
  government: 'Gov Admin',
  superadmin: 'Super Admin'
};

export function UserManagementPage() {
  const { systemUsers, user, toggleUserStatus, updateSystemUser, addSystemUser, addContractor } = useStore();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [viewUser, setViewUser] = useState<SystemUser | null>(null);

  // Add user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('citizen');
  const [newDistrict, setNewDistrict] = useState('');
  const [newState, setNewState] = useState('Karnataka');

  // Edit form
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('citizen');
  const [editDistrict, setEditDistrict] = useState('');

  const filtered = systemUsers.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus === 'active' && !u.isActive) return false;
    if (filterStatus === 'inactive' && u.isActive) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
        !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalUsers = systemUsers.length;
  const activeUsers = systemUsers.filter(u => u.isActive).length;
  const contractors = systemUsers.filter(u => u.role === 'contractor').length;
  const govAdmins = systemUsers.filter(u => u.role === 'government').length;

  async function handleAddUser() {
    if (!newName || !newEmail) return;
    try {
      await addSystemUser({
        id: '',
        name: newName,
        email: newEmail,
        role: newRole,
        district: newDistrict,
        state: newState,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      setAddModal(false);
      setNewName(''); setNewEmail(''); setNewRole('citizen'); setNewDistrict('');
    } catch (error) {
      console.error('Failed to register user:', error);
      alert('Could not register user. Email might be already in use.');
    }
  }

  async function handleEditUser() {
    if (!editUser) return;
    try {
      await updateSystemUser(editUser.id, { name: editName, role: editRole, district: editDistrict });
      setEditUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Could not update user.');
    }
  }

  function openEdit(u: SystemUser) {
    setEditUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditDistrict(u.district || '');
  }

  const roles: { value: UserRole; label: string }[] = [
    { value: 'citizen', label: 'Citizen' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'government', label: 'Government Admin' },
    { value: 'superadmin', label: 'Super Admin' }
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-surface-400">Manage all platform users, roles, and access levels</p>
        </div>
        <Button onClick={() => setAddModal(true)} icon={<Plus className="w-4 h-4" />}>Add User</Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: totalUsers, icon: <Users className="w-5 h-5 text-white" />, bg: 'from-primary-500 to-primary-600', change: `${activeUsers} active` },
          { title: 'Contractors', value: contractors, icon: <Briefcase className="w-5 h-5 text-white" />, bg: 'from-accent-500 to-accent-600', change: 'Licensed entities' },
          { title: 'Gov Admins', value: govAdmins, icon: <Shield className="w-5 h-5 text-white" />, bg: 'from-warning-500 to-warning-600', change: 'District admins' },
          { title: 'Inactive Users', value: totalUsers - activeUsers, icon: <UserX className="w-5 h-5 text-white" />, bg: 'from-danger-500 to-danger-600', change: 'Disabled accounts' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <StatCard {...s} changeType="neutral" />
          </motion.div>
        ))}
      </div>

      {/* Role distribution */}
      <Card variant="gradient">
        <h3 className="font-semibold text-white mb-4">Role Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          {(['citizen', 'contractor', 'government', 'superadmin'] as UserRole[]).map(role => {
            const count = systemUsers.filter(u => u.role === role).length;
            const pct = Math.round((count / totalUsers) * 100);
            return (
              <div key={role as string} className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{count}</div>
                <Badge variant={roleColors[role as string]}>{roleLabels[role as string]}</Badge>
                <div className="text-xs text-surface-500 mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filters */}
      <Card variant="gradient">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
              className="w-full bg-surface-800/50 border border-surface-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'citizen', 'contractor', 'government', 'superadmin'].map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filterRole === r ? 'bg-primary-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                {r === 'all' ? 'All Roles' : roleLabels[r] || r}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === s ? 'bg-accent-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* User Table */}
      <Card variant="gradient" padding="none">
        <div className="p-4 border-b border-surface-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-white">Users ({filtered.length})</h2>
        </div>
        <div className="divide-y divide-surface-700/50">
          {filtered.length === 0 && (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-surface-600 mx-auto mb-2" />
              <p className="text-surface-400">No users found</p>
            </div>
          )}
          {filtered.map((u, idx) => (
            <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
              className="p-4 hover:bg-surface-800/30 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${u.isActive ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20' : 'bg-surface-800'}`}>
                  <span className={`font-bold text-sm ${u.isActive ? 'text-primary-400' : 'text-surface-500'}`}>{u.name[0]}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white truncate">{u.name}</p>
                    <Badge variant={roleColors[u.role as string]}>{roleLabels[u.role as string]}</Badge>
                    {!u.isActive && <Badge variant="danger">Inactive</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-surface-400 mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                    {u.district && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{u.district}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {u.createdAt}</span>
                    {u.lastLogin && <span className="flex items-center gap-1"><Activity className="w-3 h-3" />Last seen {u.lastLogin}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewUser(u)} className="p-2 text-surface-400 hover:text-primary-400 hover:bg-surface-800 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(u)} className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleUserStatus(u.id)}
                    className={`p-2 rounded-lg transition-colors ${u.isActive ? 'text-surface-400 hover:text-danger-400 hover:bg-danger-500/10' : 'text-surface-400 hover:text-accent-400 hover:bg-accent-500/10'}`}>
                    {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* View User Modal */}
      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Profile">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-400">{viewUser.name[0]}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{viewUser.name}</h3>
                <p className="text-surface-400">{viewUser.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={roleColors[viewUser.role as string]}>{roleLabels[viewUser.role as string]}</Badge>
                  <Badge variant={viewUser.isActive ? 'success' : 'danger'} dot>{viewUser.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'User ID', value: viewUser.id },
                { label: 'State', value: viewUser.state || '—' },
                { label: 'District', value: viewUser.district || '—' },
                { label: 'Joined', value: viewUser.createdAt },
                { label: 'Last Login', value: viewUser.lastLogin || 'Never' },
                { label: 'Status', value: viewUser.isActive ? 'Active' : 'Inactive' }
              ].map(f => (
                <div key={f.label} className="bg-surface-800/50 rounded-lg p-3">
                  <p className="text-xs text-surface-400">{f.label}</p>
                  <p className="text-sm text-white">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => { openEdit(viewUser); setViewUser(null); }}
                icon={<Edit2 className="w-3.5 h-3.5" />}>Edit User</Button>
              <Button variant={viewUser.isActive ? 'danger' : 'secondary'} size="sm"
                onClick={() => { toggleUserStatus(viewUser.id); setViewUser(null); }}
                icon={viewUser.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}>
                {viewUser.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New User">
        <div className="space-y-4">
          <Input label="Full Name *" value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" />
          <Input label="Email *" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" />
          <Select label="Role" value={newRole as string} onChange={e => setNewRole(e.target.value as UserRole)}
            options={roles.map(r => ({ value: r.value as string, label: r.label }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="District" value={newDistrict} onChange={e => setNewDistrict(e.target.value)} placeholder="Bangalore Urban" />
            <Select label="State" value={newState} onChange={e => setNewState(e.target.value)}
              options={['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Gujarat', 'Rajasthan'].map(s => ({ value: s, label: s }))} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={!newName || !newEmail}>Add User</Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <div className="space-y-4">
          <Input label="Full Name" value={editName} onChange={e => setEditName(e.target.value)} />
          <Select label="Role" value={editRole as string} onChange={e => setEditRole(e.target.value as UserRole)}
            options={roles.map(r => ({ value: r.value as string, label: r.label }))} />
          <Input label="District" value={editDistrict} onChange={e => setEditDistrict(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
