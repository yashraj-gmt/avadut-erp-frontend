// src/pages/customers/CustomerList.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X, RefreshCw, User, Phone,
  Eye, Pencil, Trash2, Building2, MapPin, Users, Star,
} from 'lucide-react';
import { customerService } from '@/services/customerService';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/shared/Button';
import DataTable from '@/components/shared/DataTable';
import EmptyState from '@/components/shared/EmptyState';
import { useToast } from '@/components/shared/toast/ToastProvider';
import { ROUTES } from '@/constants/routes';
import CustomerFormModal from './CustomerFormModal';

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
const PAGE_SIZE = 50;

export default function CustomerList() {
  const navigate    = useNavigate();
  const toast       = useToast();
  const debounceRef = useRef(null);

  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Tabs & Counts state
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'regular'
  const [counts, setCounts]       = useState({ all: 0, regular: 0 });

  // Filter state
  const [search, setSearch] = useState('');

  // Modal states
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Open add modal if navigated with /customers/add
  useEffect(() => {
    if (window.location.pathname.endsWith('/add')) setFormOpen(true);
  }, []);

  // ── Build filter params ──────────────────────────────────────────────
  const buildParams = useCallback((tab, searchTerm, currentPage) => {
    return {
      isRegular: tab === 'regular' ? true : undefined,
      search:    searchTerm?.trim() || undefined,
      page:      currentPage,
      size:      PAGE_SIZE,
      sortBy:    'dateJoined',
      sortDir:   'desc',
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

  // ── Fetch Tab Counts (All & Regular Customers) ───────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, regRes] = await Promise.all([
        customerService.search({ size: 1 }),
        customerService.search({ size: 1, isRegular: true }),
      ]);
      const get = r => r?.data?.totalElements ?? r?.totalElements ?? 0;
      setCounts({
        all:     get(allRes),
        regular: get(regRes),
      });
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Debounced fetch on tab, search or page changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData(activeTab, search, page);
    }, search ? 350 : 0);
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

  const handleResetAll = () => {
    setSearch('');
    setActiveTab('all');
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

  // ── 25 Characters Truncation Helper ────────────────────────────────────
  const truncate25 = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (str.length <= 25) return str;
    return str.slice(0, 25) + '...';
  };

  // ── Columns ───────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'srNo',
      header: 'Sr. No.',
      width: 'w-16',
      align: 'center',
      render: (_, __, index) => (
        <span className="font-semibold text-xs text-[var(--color-text-muted)]">
          {(page * PAGE_SIZE) + index + 1}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Customer Name',
      sortable: true,
      render: (_, row) => {
        const full = row.name || '';
        return (
          <div className="flex items-center gap-1.5 min-w-0" title={full}>
            <span className="text-sm font-semibold text-[var(--color-text)] cursor-help">
              {truncate25(full)}
            </span>
            {row.isRegular && (
              <span
                title="Regular Customer"
                className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
              >
                ⭐ Regular
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'firmName',
      header: 'Firm Name',
      sortable: true,
      render: v => {
        if (!v) return <span className="text-xs text-[var(--color-text-subtle)]">—</span>;
        const full = String(v);
        return (
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-text)] cursor-help" title={full}>
            <Building2 size={13} className="text-slate-400 shrink-0" />
            <span>{truncate25(full)}</span>
          </div>
        );
      },
    },
    {
      key: 'mobile',
      header: 'Mobile Number',
      render: (_, row) => (
        <div className="text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 font-medium text-[var(--color-text)]">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <span>{row.mobile}</span>
          </div>
          {row.telephoneNumber && (
            <div className="text-[11px] text-[var(--color-text-subtle)] pl-4.5 mt-0.5 truncate">
              Tel: {row.telephoneNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Site Address',
      render: (_, row) => {
        const loc = [row.address, row.area, row.city].filter(Boolean).join(', ');
        if (!loc) return <span className="text-xs text-[var(--color-text-subtle)]">—</span>;
        return (
          <div className="flex items-start gap-1.5 text-xs text-[var(--color-text-muted)] cursor-help max-w-xs" title={loc}>
            <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{truncate25(loc)}</span>
          </div>
        );
      },
    },
    {
      key: 'totalOrders',
      header: 'Total Orders',
      align: 'center',
      sortable: true,
      render: v => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]">
          {v ?? 0}
        </span>
      ),
    },
    {
      key: '_actions',
      header: 'Action',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); navigate(ROUTES.CUSTOMER_PROFILE, { state: { id: row.id } }); }}
            title="View Profile"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-all hover:scale-105 cursor-pointer shadow-xs"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setEditTarget(row); setFormOpen(true); }}
            title="Edit Customer"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all hover:scale-105 cursor-pointer shadow-xs"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDeleteTarget(row); }}
            title="Delete Customer"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all hover:scale-105 cursor-pointer shadow-xs"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
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

      {/* ── 2 Main Clickable Tabs: All Customers & Regular Customers ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Tab 1: All Customers */}
        <button
          type="button"
          id="tab-all-customers"
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-[var(--radius-xl)] border-2 transition-all duration-200 cursor-pointer text-left shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
            activeTab === 'all'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-50, #eff6ff)] shadow-sm'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0 transition-colors ${
              activeTab === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Users size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                All Customers
              </span>
              {activeTab === 'all' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Active
                </span>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] leading-tight mt-0.5">
              {counts.all}
            </p>
            <p className="text-[11px] text-[var(--color-text-subtle)] truncate mt-0.5">
              Total registered clients in directory
            </p>
          </div>
        </button>

        {/* Tab 2: Regular Customers */}
        <button
          type="button"
          id="tab-regular-customers"
          onClick={() => handleTabChange('regular')}
          className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-[var(--radius-xl)] border-2 transition-all duration-200 cursor-pointer text-left shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${
            activeTab === 'regular'
              ? 'border-amber-500 bg-amber-50/70 shadow-sm'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0 transition-colors ${
              activeTab === 'regular'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            <Star size={20} className="fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Regular Customers ⭐
              </span>
              {activeTab === 'regular' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  Active
                </span>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] leading-tight mt-0.5">
              {counts.regular}
            </p>
            <p className="text-[11px] text-[var(--color-text-subtle)] truncate mt-0.5">
              Frequent & VIP repeat customers
            </p>
          </div>
        </button>
      </div>

      {/* ── Toolbar: Search & Record Count ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] pointer-events-none" />
          <input
            id="customer-search-input"
            type="text"
            placeholder="Search by name, firm, mobile, location…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${totalElements} customer${totalElements !== 1 ? 's' : ''} found`}
          </span>
          {(search || activeTab !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              icon={<RefreshCw size={14} />}
              onClick={handleResetAll}
              disabled={loading}
              title="Reset filters"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Direct Table (Clean, no nested background cards) ── */}
      <div className="w-full">
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
              description={search ? "No customers match your search query." : "Start by adding your first customer."}
              action={
                <Button icon={<Plus size={15} />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>
                  Add First Customer
                </Button>
              }
            />
          }
        />

        {/* Server-side Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 mt-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <span className="text-xs sm:text-sm text-[var(--color-text-muted)] text-center sm:text-left">
              Page {page + 1} of {totalPages} ({totalElements} items)
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              >
                ‹ Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition cursor-pointer"
              >
                Next ›
              </button>
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
