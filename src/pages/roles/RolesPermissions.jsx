// src/pages/roles/RolesPermissions.jsx
import { useState, useMemo } from 'react'
import {
  Shield, Users, UserPlus, Edit2, Trash2,
  CheckCircle, XCircle, X,
  ShieldCheck, Crown, UserCog
} from 'lucide-react'
import { ROLES } from '@/constants/roles'
import { ROUTE_PERMISSIONS } from '@/utils/permissions'
import { ROUTES } from '@/constants/routes'
import {
  Button, IconButton, Badge, DataTable,
  StatCard, SearchInput, PageHeader, Input
} from '@/components/shared'
import ConfirmModal from '@/components/shared/modal/ConfirmModal'
import { useToast } from '@/components/shared/toast/ToastProvider'

// ── Route labels for permissions matrix ──────────────────────────────────────
const ROUTE_LABELS = {
  [ROUTES.DASHBOARD]:      'Dashboard',
  [ROUTES.PRODUCTS]:       'Products',
  [ROUTES.PRODUCT_ADD]:    'Add Product',
  [ROUTES.PRODUCT_EDIT]:   'Edit Product',
  [ROUTES.PRODUCT_DETAIL]: 'Product Detail',
  [ROUTES.CATEGORIES]:     'Categories',
  [ROUTES.CATEGORY_ADD]:   'Add Category',
  [ROUTES.CATEGORY_EDIT]:  'Edit Category',
  [ROUTES.ROLES]:          'Roles & Permissions',
  [ROUTES.PROFILE]:        'Profile',
}

// ── Role config — covers all possible UserRole enum values ───────────────────
const ROLE_CONFIG = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    icon:  <Crown size={12} />,
  },
  ADMIN: {
    label: 'Admin',
    icon:  <ShieldCheck size={12} />,
  },
  STAFF: {
    label: 'Staff',
    icon:  <Users size={12} />,
  },
}

// Only ADMIN and SUPER_ADMIN are assignable in the user form / role-change modal
const ASSIGNABLE_ROLES = ['ADMIN', 'SUPER_ADMIN']

// ── Demo users (matches com.erp.system.entity.User) ──────────────────────────
const DEMO_USERS = [
  { id:1, name:'Arjun Mehta',  email:'arjun.mehta@erp.local',  role:'SUPER_ADMIN', mobile:'+91 98765 43210', isActive:true,  lastLogin:'2025-05-28T09:15:00', createdAt:'2024-01-10T08:00:00', isDeleted:false },
  { id:2, name:'Priya Shah',   email:'priya.shah@erp.local',   role:'ADMIN',       mobile:'+91 91234 56789', isActive:true,  lastLogin:'2025-05-27T14:32:00', createdAt:'2024-02-15T09:30:00', isDeleted:false },
  { id:3, name:'Rohit Verma',  email:'rohit.verma@erp.local',  role:'ADMIN',       mobile:'+91 99887 76655', isActive:true,  lastLogin:'2025-05-26T11:00:00', createdAt:'2024-03-01T10:00:00', isDeleted:false },
  { id:4, name:'Sneha Patel',  email:'sneha.patel@erp.local',  role:'ADMIN',       mobile:'+91 88776 65544', isActive:false, lastLogin:'2025-04-10T16:45:00', createdAt:'2024-03-20T11:00:00', isDeleted:false },
  { id:5, name:'Karan Joshi',  email:'karan.joshi@erp.local',  role:'ADMIN',       mobile:'+91 77665 54433', isActive:true,  lastLogin:'2025-05-28T08:00:00', createdAt:'2024-04-05T12:00:00', isDeleted:false },
  { id:6, name:'Divya Nair',   email:'divya.nair@erp.local',   role:'SUPER_ADMIN', mobile:'+91 66554 43322', isActive:true,  lastLogin:'2025-05-27T18:20:00', createdAt:'2024-05-12T13:00:00', isDeleted:false },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}
const formatDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const AVATAR_COLORS = [
  { bg:'var(--color-primary-100)',  text:'var(--color-primary-dark)' },
  { bg:'var(--color-success-light)',text:'var(--color-success)'      },
  { bg:'var(--color-warning-light)',text:'var(--color-warning)'      },
  { bg:'var(--color-info-light)',   text:'var(--color-info)'         },
]

function Avatar({ name, id }) {
  const col = AVATAR_COLORS[id % AVATAR_COLORS.length]
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0"
      style={{ background: col.bg, color: col.text }}
    >
      {getInitials(name)}
    </span>
  )
}

const EMPTY_FORM = { name:'', email:'', mobile:'', role:'ADMIN', isActive:true }

// ── User Add/Edit Modal ───────────────────────────────────────────────────────
function UserModal({ isOpen, onClose, onSubmit, editUser, loading }) {
  const [form, setForm]     = useState(editUser ?? EMPTY_FORM)
  const [errors, setErrors] = useState({})

  if (!isOpen) return null

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSubmit(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
        style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', maxHeight:'90vh' }}
        role="dialog" aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom:'1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:'var(--color-primary-100)' }}>
              <UserCog size={18} style={{ color:'var(--color-primary)' }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color:'var(--color-text)' }}>
                {editUser ? 'Edit User' : 'Add New User'}
              </h3>
              <p className="text-xs" style={{ color:'var(--color-text-muted)' }}>
                {editUser ? `Editing ${editUser.name}` : 'Create a system user account'}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 disabled:opacity-40"
            style={{ background:'var(--color-surface-2)', color:'var(--color-text-muted)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <Input label="Full Name" placeholder="e.g. Arjun Mehta" required
            value={form.name} error={errors.name}
            onChange={(e) => set('name', e.target.value)} />

                      <Input label="Mobile" placeholder="+91 98765 43210"
            value={form.mobile} required
            onChange={(e) => set('mobile', e.target.value)} />

          <Input label="Email Address" type="email" placeholder="user@company.com" 
            value={form.email} error={errors.email}
            onChange={(e) => set('email', e.target.value)} />

          {/* Role picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium" style={{ color:'var(--color-text)' }}>
              Role <span style={{ color:'var(--color-danger)' }}>*</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              {ASSIGNABLE_ROLES.map((r) => {
                const cfg      = ROLE_CONFIG[r]
                const selected = form.role === r
                return (
                  <button key={r} type="button" onClick={() => set('role', r)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      border:     selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: selected ? 'var(--color-primary-50)'        : 'var(--color-surface)',
                      color:      selected ? 'var(--color-primary-dark)'      : 'var(--color-text-muted)',
                    }}
                  >
                    {cfg.icon}
                    {cfg.label}
                    {selected && (
                      <CheckCircle size={14} className="ml-auto" style={{ color:'var(--color-primary)' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color:'var(--color-text)' }}>Account Active</p>
              <p className="text-xs mt-0.5" style={{ color:'var(--color-text-muted)' }}>
                Inactive users cannot log in
              </p>
            </div>
            <button type="button" onClick={() => set('isActive', !form.isActive)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none"
              style={{ background: form.isActive ? 'var(--color-primary)' : 'var(--color-border-strong)' }}
              role="switch" aria-checked={form.isActive}>
              <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: form.isActive ? 'translateX(22px)' : 'translateX(2px)' }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 py-4 flex-shrink-0"
          style={{ borderTop:'1px solid var(--color-border)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>
            {editUser ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Role Change Modal ─────────────────────────────────────────────────────────
function RoleChangeModal({ isOpen, user, onClose, onConfirm, loading }) {
  const [selectedRole, setSelectedRole] = useState(user?.role ?? 'ADMIN')

  if (!isOpen || !user) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl shadow-2xl"
        style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)' }}
        role="dialog" aria-modal="true">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom:'1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:'var(--color-warning-light)' }}>
              <Shield size={18} style={{ color:'var(--color-warning)' }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color:'var(--color-text)' }}>Change Role</h3>
              <p className="text-xs" style={{ color:'var(--color-text-muted)' }}>{user.name}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
            style={{ background:'var(--color-surface-2)', color:'var(--color-text-muted)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-sm" style={{ color:'var(--color-text-muted)' }}>
            Select the new role for{' '}
            <strong style={{ color:'var(--color-text)' }}>{user.name}</strong>.
            This will update their access permissions immediately.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-1">
            {ASSIGNABLE_ROLES.map((r) => {
              const cfg     = ROLE_CONFIG[r] ?? { label: r, icon: <Shield size={16} /> }
              const current  = user.role === r
              const selected = selectedRole === r
              return (
                <button key={r} type="button" onClick={() => setSelectedRole(r)}
                  className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl text-sm font-semibold transition-all relative"
                  style={{
                    border:     selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: selected ? 'var(--color-primary-50)'        : 'var(--color-surface-2)',
                    color:      selected ? 'var(--color-primary-dark)'      : 'var(--color-text-muted)',
                  }}
                >
                  {current && (
                    <span className="absolute -top-2 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background:'var(--color-success-light)', color:'var(--color-success)' }}>
                      Current
                    </span>
                  )}
                  <span style={{
                    width:36, height:36, borderRadius:10,
                    background: selected ? 'var(--color-primary-100)' : 'var(--color-border)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}>
                    {r === 'SUPER_ADMIN' ? <Crown size={16} /> : <ShieldCheck size={16} />}
                  </span>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 py-4"
          style={{ borderTop:'1px solid var(--color-border)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>Cancel</Button>
          <Button onClick={() => onConfirm(selectedRole)} loading={loading}
            disabled={selectedRole === user.role} fullWidth>
            Apply Role
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Permissions Matrix ────────────────────────────────────────────────────────
function PermissionsMatrix() {
  // Use all roles from ROLES constant — safe because ROLE_CONFIG now covers all values
  const roleList  = Object.values(ROLES)
  const routeList = Object.keys(ROUTE_PERMISSIONS)

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {[
          { label:'Has Access', bg:'var(--color-success-light)', color:'var(--color-success)', mark:'✓' },
          { label:'No Access',  bg:'var(--color-surface-2)',     color:'var(--color-text-subtle)', mark:'—' },
        ].map(({ label, bg, color, mark }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color:'var(--color-text-muted)' }}>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full font-bold"
              style={{ background:bg, color }}>{mark}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-auto shadow-sm"
        style={{ border:'1px solid var(--color-border)', background:'var(--color-surface)' }}>
        <table className="w-full text-sm min-w-[480px]">
          <thead style={{ background:'var(--color-surface-2)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color:'var(--color-text-muted)', borderBottom:'1px solid var(--color-border)' }}>
                Route / Module
              </th>
              {roleList.map((role) => {
                // Safe fallback — never crashes even if new roles are added to the enum
                const cfg = ROLE_CONFIG[role] ?? { label: role, icon: <Shield size={12} /> }
                return (
                  <th key={role}
                    className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                    style={{ color:'var(--color-text-muted)', borderBottom:'1px solid var(--color-border)' }}>
                    <div className="flex flex-col items-center gap-1">
                      {cfg.icon}
                      {cfg.label}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {routeList.map((route, idx) => (
              <tr key={route}
                style={{
                  borderTop:'1px solid var(--color-border)',
                  background: idx % 2 === 1 ? 'var(--color-surface-2)' : 'var(--color-surface)',
                }}>
                <td className="px-4 py-3 font-medium text-sm" style={{ color:'var(--color-text)' }}>
                  {ROUTE_LABELS[route] ?? route}
                </td>
                {roleList.map((role) => {
                  const allowed = ROUTE_PERMISSIONS[route]?.includes(role)
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      {allowed ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                          style={{ background:'var(--color-success-light)', color:'var(--color-success)' }}>✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                          style={{ background:'var(--color-surface-2)', color:'var(--color-text-subtle)' }}>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── User Management ───────────────────────────────────────────────────────────
function UserManagement() {
  const toast = useToast()

  const [users,        setUsers]        = useState(DEMO_USERS)
  const [search,       setSearch]       = useState('')
  const [filterRole,   setFilterRole]   = useState('ALL')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editUser,     setEditUser]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [roleTarget,   setRoleTarget]   = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  const total       = users.length
  const superAdmins = users.filter((u) => u.role === 'SUPER_ADMIN').length
  const admins      = users.filter((u) => u.role === 'ADMIN').length
  const active      = users.filter((u) => u.isActive).length

  const filtered = useMemo(() => {
    let result = users
    if (filterRole !== 'ALL') result = result.filter((u) => u.role === filterRole)
    if (search.trim())
      result = result.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())  ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.mobile ?? '').includes(search)
      )
    return result
  }, [users, search, filterRole])

  const openAdd  = ()  => { setEditUser(null); setModalOpen(true) }
  const openEdit = (u) => { setEditUser(u);    setModalOpen(true) }

  const handleSubmit = async (form) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    if (editUser) {
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...form } : u))
      toast({ type:'success', title:'User updated', message:`${form.name} has been updated successfully.` })
    } else {
      const newUser = {
        ...form,
        id: Math.max(...users.map((u) => u.id)) + 1,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        isDeleted: false,
      }
      setUsers((prev) => [...prev, newUser])
      toast({ type:'success', title:'User created', message:`${form.name} has been added to the system.` })
    }
    setSaving(false)
    setModalOpen(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 600))
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
    toast({ type:'success', title:'User deleted', message:`${deleteTarget.name} has been removed.` })
    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleToggleActive = async (user) => {
    await new Promise((r) => setTimeout(r, 300))
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    toast({
      type:    user.isActive ? 'warning' : 'success',
      title:   user.isActive ? 'User deactivated' : 'User activated',
      message: `${user.name} is now ${user.isActive ? 'inactive' : 'active'}.`,
    })
  }

  const handleRoleChange = async (newRole) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setUsers((prev) => prev.map((u) => u.id === roleTarget.id ? { ...u, role: newRole } : u))
    toast({
      type:'success', title:'Role updated',
      message:`${roleTarget.name} is now ${ROLE_CONFIG[newRole]?.label ?? newRole}.`,
    })
    setSaving(false)
    setRoleTarget(null)
  }

  const columns = [
    {
      key: 'name', header: 'User', sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={val} id={row.id} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color:'var(--color-text)' }}>{val}</p>
            <p className="text-xs truncate" style={{ color:'var(--color-text-muted)' }}>{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile', header: 'Mobile',
      render: (val) => <span className="text-sm" style={{ color:'var(--color-text-muted)' }}>{val || '—'}</span>,
    },
    {
      key: 'role', header: 'Role', sortable: true,
      render: (val, row) => {
        const isSA = val === 'SUPER_ADMIN'
        return (
          <button
            onClick={() => setRoleTarget(row)}
            title="Click to change role"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80 cursor-pointer"
            style={{
              background: isSA ? 'var(--color-danger-light)'  : 'var(--color-primary-100)',
              color:      isSA ? 'var(--color-danger)'         : 'var(--color-primary-dark)',
              border: 'none',
            }}
          >
            {isSA ? <Crown size={11} /> : <ShieldCheck size={11} />}
            {ROLE_CONFIG[val]?.label ?? val}
            <Edit2 size={10} className="ml-0.5 opacity-60" />
          </button>
        )
      },
    },
    {
      key: 'isActive', header: 'Status', sortable: true, align: 'center',
      render: (val) => (
        <Badge variant={val ? 'success' : 'neutral'} dot>{val ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'lastLogin', header: 'Last Login', sortable: true,
      render: (val) => <span className="text-xs" style={{ color:'var(--color-text-muted)' }}>{formatDateTime(val)}</span>,
    },
    {
      key: 'createdAt', header: 'Joined', sortable: true,
      render: (val) => <span className="text-xs" style={{ color:'var(--color-text-muted)' }}>{formatDate(val)}</span>,
    },
    {
      key: 'id', header: 'Actions', align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <IconButton title={row.isActive ? 'Deactivate user' : 'Activate user'}
            onClick={() => handleToggleActive(row)}>
            {row.isActive
              ? <XCircle     size={16} style={{ color:'var(--color-warning)' }} />
              : <CheckCircle size={16} style={{ color:'var(--color-success)' }} />}
          </IconButton>
          <IconButton title="Edit user" onClick={() => openEdit(row)}>
            <Edit2 size={15} style={{ color:'var(--color-primary)' }} />
          </IconButton>
          <IconButton title="Delete user" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={15} style={{ color:'var(--color-danger)' }} />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={total}       label="Total Users"  accent="primary" icon={<Users size={20} />} />
        <StatCard value={superAdmins} label="Super Admins" accent="danger"  icon={<Crown size={20} />} />
        <StatCard value={admins}      label="Admins"       accent="info"    icon={<ShieldCheck size={20} />} />
        <StatCard value={active}      label="Active Users" accent="success" icon={<CheckCircle size={20} />} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput
            placeholder="Search by name, email, mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <div className="flex items-center rounded-lg overflow-hidden"
            style={{ border:'1px solid var(--color-border)' }}>
            {[
              { key:'ALL',         label:'All'         },
              { key:'SUPER_ADMIN', label:'Super Admin' },
              { key:'ADMIN',       label:'Admin'       },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setFilterRole(tab.key)}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background:   filterRole === tab.key ? 'var(--color-primary)' : 'var(--color-surface)',
                  color:        filterRole === tab.key ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                  borderRight: '1px solid var(--color-border)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <Button icon={<UserPlus size={16} />} onClick={openAdd}>Add User</Button>
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        keyField="id"
        pageSize={5}
        pageSizeOptions={[5, 10, 20]}
        striped
        emptyState={
          <div className="flex flex-col items-center gap-2 py-10">
            <Users size={36} style={{ color:'var(--color-text-subtle)' }} />
            <p className="text-sm font-medium" style={{ color:'var(--color-text)' }}>No users found</p>
            <p className="text-xs" style={{ color:'var(--color-text-muted)' }}>
              {search ? 'Try a different search term.' : 'Add your first user to get started.'}
            </p>
          </div>
        }
      />

      {/* Modals */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editUser={editUser}
        loading={saving}
      />
      <RoleChangeModal
        isOpen={!!roleTarget}
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
        onConfirm={handleRoleChange}
        loading={saving}
      />
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User?"
        message={`This will permanently remove ${deleteTarget?.name ?? 'this user'} from the system. This action cannot be undone.`}
        confirmLabel="Delete User"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key:'users',       label:'User Management',   icon:<Users size={15} />  },
  { key:'permissions', label:'Permissions Matrix', icon:<Shield size={15} /> },
]

export default function RolesPermissions() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage system users and configure access control."
        breadcrumbs={[{ label:'Dashboard', href:'/dashboard' }, { label:'Roles & Permissions' }]}
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl self-start"
        style={{ background:'var(--color-surface-2)', border:'1px solid var(--color-border)' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background:  active ? 'var(--color-surface)' : 'transparent',
                color:       active ? 'var(--color-text)'    : 'var(--color-text-muted)',
                boxShadow:   active ? 'var(--shadow-sm)'     : 'none',
                border:      active ? '1px solid var(--color-border)' : '1px solid transparent',
              }}>
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'users' ? <UserManagement /> : <PermissionsMatrix />}
    </div>
  )
}