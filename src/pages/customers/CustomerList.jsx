// src/pages/customers/CustomerList.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X, RefreshCw, User, Phone,
  Eye, Pencil, Trash2, Users, Star, ShieldX, CheckCircle2,
} from 'lucide-react';
import { customerService } from '@/services/customerService';
import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/shared/Badge';
import Button from '@/components/shared/Button';
import DataTable from '@/components/shared/DataTable';
import EmptyState from '@/components/shared/EmptyState';
import { useToast } from '@/components/shared/toast/ToastProvider';
import { ROUTES } from '@/constants/routes';
import CustomerFormModal from './CustomerFormModal';

// ── Helpers ────────────────────────────────────────────────────────────────
const statusVariant = (s) => ({ ACTIVE: 'success', INACTIVE: 'warning', BLOCKED: 'danger' }[s] ?? 'neutral');
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  {
    key:   'all',
    label: 'Total Customers',
    icon:  Users,
    color: 'var(--color-primary)',
    bg:    'var(--color-primary-50)',
    filter: {},
  },
  {
    key:   'active',
    label: 'Active',
    icon:  CheckCircle2,
    color: '#16a34a',
    bg:    '#dcfce7',
    filter: { customerStatus: 'ACTIVE' },
  },
  {
    key:   'regular',
    label: 'Regular ⭐',
    icon:  Star,
    color: '#d97706',
    bg:    '#fef3c7',
    filter: { isRegular: true },
  },
  {
    key:   'inactive',
    label: 'Inactive',
    icon:  ShieldX,
    color: '#dc2626',
    bg:    '#fee2e2',
    filter: { customerStatus: 'INACTIVE' },
  },
];

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({ customer, onConfirm, onCancel, loading }) {
  if (!customer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-5 sm:p-6 w-full max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--color-danger-light)] flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-[var(--color-danger)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">Delete Customer</h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text)] mb-5 leading-relaxed">
          Are you sure you want to delete <strong>{customer.name}</strong>? All associated records will be preserved but this customer will be soft-deleted.
        </p>
        <div className="flex gap-2 sm:gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ── CustomerList Page ──────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function CustomerList() {
  const navigate    = useNavigate();
  const toast       = useToast();
  const debounceRef = useRef(null);

  const [customers, setCustomers]   = useState([]);
  const [counts, setCounts]         = useState({ all: 0, active: 0, regular: 0, inactive: 0 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter state
  const [activeTab, setActiveTab]   = useState('all');
  const [search, setSearch]         = useState('');

  // Modal states
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Open add modal if navigated with /customers/add
  useEffect(() => {
    if (window.location.pathname.endsWith('/add')) setFormOpen(true);
  }, []);

  // ── Build filter params from active tab ───────────────────────────────
  const buildParams = useCallback((tab, searchTerm, currentPage) => {
    const tabFilter = TABS.find(t => t.key === tab)?.filter ?? {};
    return {
      ...tabFilter,
      search:  searchTerm || undefined,
      page:    currentPage,
      size:    PAGE_SIZE,
      sortBy:  'dateJoined',
      sortDir: 'desc',
    };
  }, []);

  // ── Fetch list data ───────────────────────────────────────────────────
  const fetchData = useCallback(async (tab, searchTerm, currentPage) => {
    setLoading(true);
    try {
      const params = buildParams(tab, searchTerm, currentPage);
      const res    = await customerService.search(params);
      const paged  = res?.data ?? res;
      setCustomers(paged?.content ?? []);
      setTotalPages(paged?.totalPages ?? 0);
      setTotalElements(paged?.totalElements ?? 0);
    } catch (err) {
      toast({ type: 'error', message: err?.message ?? 'Failed to load customers.' });
    } finally {
      setLoading(false);
    }
  }, [toast, buildParams]);

  // ── Fetch tab counts ──────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, activeRes, regularRes, inactiveRes] = await Promise.all([
        customerService.search({ size: 1 }),
        customerService.search({ size: 1, customerStatus: 'ACTIVE' }),
        customerService.search({ size: 1, isRegular: true }),
        customerService.search({ size: 1, customerStatus: 'INACTIVE' }),
      ]);
      const get = r => r?.data?.totalElements ?? r?.totalElements ?? 0;
      setCounts({
        all:      get(allRes),
        active:   get(activeRes),
        regular:  get(regularRes),
        inactive: get(inactiveRes),
      });
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Debounced fetch on tab/search/page changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(activeTab, search, page);
    }, search ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [activeTab, search, page, fetchData]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPage(0);
  };

  const handleSearch = (val) => {
    setSearch(val);
    setPage(0);
  };

  // ── Actions ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await customerService.remove(deleteTarget.id);
      toast({ type: 'success', message: `${deleteTarget.name} deleted successfully.` });
      setDeleteTarget(null);
      fetchData(activeTab, search, page);
      fetchCounts();
    } catch (err) {
      toast({ type: 'error', message: err?.message ?? 'Failed to delete customer.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditTarget(null);
    fetchData(activeTab, search, page);
    fetchCounts();
    if (window.location.pathname.endsWith('/add')) navigate(ROUTES.CUSTOMERS);
  };

  // ── Columns ───────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name', header: 'Customer', sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)' }}
          >
            {row.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[var(--color-text)] truncate">{row.name}</span>
              {row.isRegular && <span title="Regular Customer" className="text-amber-400 text-xs shrink-0">⭐</span>}
            </div>
            {row.firmName && (
              <div className="text-[11px] text-[var(--color-text-subtle)] truncate">{row.firmName}</div>
            )}
            <div className="flex items-center gap-1 mt-0.5 text-xs text-[var(--color-text-muted)]">
              <Phone size={10} className="shrink-0" />
              <span className="truncate">{row.mobile}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'customerStatus', header: 'Status', align: 'center',
      render: v => <Badge variant={statusVariant(v)} dot size="sm">{v?.charAt(0) + v?.slice(1)?.toLowerCase() ?? '—'}</Badge>,
    },
    {
      key: 'totalOrders', header: 'Orders', align: 'center', sortable: true,
      render: v => <span className="font-semibold text-[var(--color-text)]">{v ?? 0}</span>,
    },
    {
      key: 'dateJoined', header: 'Joined', sortable: true,
      render: v => <span className="text-xs sm:text-sm text-[var(--color-text-muted)] whitespace-nowrap">{fmt(v)}</span>,
    },
    {
      key: '_actions', header: '', align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={e => { e.stopPropagation(); navigate(ROUTES.CUSTOMER_PROFILE, { state: { id: row.id } }); }}
            title="View Profile"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] transition"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setEditTarget(row); setFormOpen(true); }}
            title="Edit"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-subtle)] hover:text-[var(--color-warning)] hover:bg-[var(--color-warning-light)] transition"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDeleteTarget(row); }}
            title="Delete"
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <PageHeader
        title="Customer Management"
        subtitle="Manage your customer directory, track orders, and monitor payments."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Customers' }]}
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={() => { setEditTarget(null); setFormOpen(true); }}
            className="w-full sm:w-auto"
          >
            Add Customer
          </Button>
        }
      />

      {/* ── Clickable Tab Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {TABS.map(tab => {
          const Icon    = tab.icon;
          const count   = counts[tab.key] ?? 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={[
                'text-left rounded-[var(--radius-lg)] border p-3.5 sm:p-4 transition-all duration-200 cursor-pointer',
                'hover:shadow-md hover:scale-[1.01] active:scale-[0.99]',
                isActive
                  ? 'border-2 shadow-md'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-current',
              ].join(' ')}
              style={{
                borderColor: isActive ? tab.color : undefined,
                background:  isActive ? tab.bg    : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                  style={{ background: isActive ? tab.color + '22' : 'var(--color-surface-2)' }}
                >
                  <Icon size={16} style={{ color: tab.color }} />
                </div>
                {isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: tab.color + '22', color: tab.color }}>
                    Active
                  </span>
                )}
              </div>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: isActive ? tab.color : 'var(--color-text)' }}>
                {count}
              </p>
              <p className="text-xs sm:text-sm font-medium text-[var(--color-text-muted)] mt-0.5">{tab.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-3 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
            <input
              type="text"
              placeholder="Search by name, mobile…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
            />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]">
                <X size={14} />
              </button>
            )}
          </div>
          <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={() => { handleSearch(''); handleTabChange('all'); }} disabled={loading}>
            Reset
          </Button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-3.5 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${totalElements} customer${totalElements !== 1 ? 's' : ''} found`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <DataTable
            data={customers}
            columns={columns}
            keyField="id"
            loading={loading}
            pageSize={0}
            onRowClick={row => navigate(ROUTES.CUSTOMER_PROFILE, { state: { id: row.id } })}
            emptyState={
              <EmptyState
                icon={<User size={40} />}
                title="No customers found"
                description="Try adjusting your search or adding your first customer."
                action={
                  <Button icon={<Plus size={15} />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>
                    Add First Customer
                  </Button>
                }
              />
            }
          />
        </div>

        {/* Server-side pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
            <span className="text-xs sm:text-sm text-[var(--color-text-muted)] text-center sm:text-left">
              Page {page + 1} of {totalPages} ({totalElements} items)
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition"
              >‹ Previous</button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition"
              >Next ›</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {formOpen && (
        <CustomerFormModal
          customer={editTarget}
          onSuccess={handleFormSuccess}
          onClose={() => { setFormOpen(false); setEditTarget(null); if (window.location.pathname.endsWith('/add')) navigate(ROUTES.CUSTOMERS); }}
        />
      )}

      <DeleteConfirmModal
        customer={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
