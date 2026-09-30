import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  ShieldCheck,
  Crown,
  Sparkles,
  Ban,
  Eye,
  Calendar,
  Award,
  X,
  Clock,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  Zap,
  Trash2,
} from 'lucide-react'
import {
  getAdminUsers,
  updateUserRole,
  toggleUserSuspension,
  grantUserPremium,
  revokeUserPremium,
  deleteUser,
} from '@/actions/admin'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export interface UserItem {
  id: string
  user_id: string
  email?: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: string
  status?: string
  target_band?: number | string | null
  previous_score?: number | string | null
  onboarding_completed?: boolean | null
  created_at: string
  attempts_count?: number
  is_premium?: boolean
  plan_name?: string | null
  plan_slug?: string | null
  subscription_id?: string | null
  subscription_status?: string | null
  subscription_expires_at?: string | null
  subscription_started_at?: string | null
}

export function AdminUsersView({
  initialUsers,
  currentUserId,
  onRefresh,
}: {
  initialUsers: UserItem[]
  currentUserId: string
  onRefresh?: () => void
}) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [premiumFilter, setPremiumFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (initialUsers) {
      setUsers(initialUsers)
    }
  }, [initialUsers])

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const filtered = users.filter((u) => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase()
    const email = (u.email || '').toLowerCase()
    const s = search.toLowerCase().trim()
    if (s && !fullName.includes(s) && !email.includes(s) && !u.user_id.toLowerCase().includes(s)) {
      return false
    }
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (premiumFilter === 'premium' && !u.is_premium) return false
    if (premiumFilter === 'free' && u.is_premium) return false
    return true
  })

  // KPI calculations
  const totalUsersCount = users.length
  const premiumUsersCount = users.filter((u) => u.is_premium).length
  const freeStudentsCount = users.filter((u) => !u.is_premium && u.role !== 'admin').length
  const adminsCount = users.filter((u) => u.role === 'admin').length

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'student') => {
    if (userId === currentUserId && newRole !== 'admin') {
      alert('You cannot remove admin privileges from yourself.')
      return
    }

    try {
      setLoadingId(userId)
      await updateUserRole(userId, newRole)
      setUsers(users.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)))
      if (selectedUser?.user_id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null))
      }
      showNotification(`User role updated to ${newRole}`)
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    if (userId === currentUserId) {
      alert('You cannot suspend your own admin account.')
      return
    }

    try {
      setLoadingId(userId)
      const res = await toggleUserSuspension(userId, !currentlySuspended)
      setUsers(users.map((u) => (u.user_id === userId ? { ...u, status: res.status } : u)))
      if (selectedUser?.user_id === userId) {
        setSelectedUser((prev) => (prev ? { ...prev, status: res.status } : null))
      }
      showNotification(`User ${res.status === 'suspended' ? 'suspended' : 'restored'}`)
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleGrantPremium = async (userId: string, durationDays: number, planSlug: string = 'monthly') => {
    try {
      setLoadingId(userId)
      const res = await grantUserPremium(userId, durationDays, planSlug)
      const updatedExpiry = res.subscription?.expires_at || null

      setUsers(
        users.map((u) =>
          u.user_id === userId
            ? {
                ...u,
                is_premium: true,
                plan_name: planSlug === 'lifetime' ? 'Lifetime Access' : planSlug === 'yearly' ? 'Yearly Premium' : 'Monthly Pro',
                plan_slug: planSlug,
                subscription_status: 'active',
                subscription_expires_at: updatedExpiry,
              }
            : u
        )
      )

      if (selectedUser?.user_id === userId) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                is_premium: true,
                plan_name: planSlug === 'lifetime' ? 'Lifetime Access' : planSlug === 'yearly' ? 'Yearly Premium' : 'Monthly Pro',
                plan_slug: planSlug,
                subscription_status: 'active',
                subscription_expires_at: updatedExpiry,
              }
            : null
        )
      }

      showNotification(res.message || 'Premium granted successfully')
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleRevokePremium = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke this student\'s Premium subscription?')) {
      return
    }

    try {
      setLoadingId(userId)
      await revokeUserPremium(userId)

      setUsers(
        users.map((u) =>
          u.user_id === userId
            ? {
                ...u,
                is_premium: false,
                subscription_status: 'cancelled',
                subscription_expires_at: null,
              }
            : u
        )
      )

      if (selectedUser?.user_id === userId) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                is_premium: false,
                subscription_status: 'cancelled',
                subscription_expires_at: null,
              }
            : null
        )
      }

      showNotification('Premium subscription revoked')
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      setIsDeleting(true)
      await deleteUser(userToDelete.user_id)
      setUsers(users.filter((u) => u.user_id !== userToDelete.user_id))
      if (selectedUser?.user_id === userToDelete.user_id) {
        setSelectedUser(null)
      }
      showNotification(`User ${userToDelete.first_name || userToDelete.email || userToDelete.user_id} and all associated data deleted permanently`)
      setUserToDelete(null)
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete user and associated data', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatExpiry = (expiresAt?: string | null) => {
    if (!expiresAt) return 'Lifetime'
    const exp = new Date(expiresAt)
    const diff = exp.getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'Expired'
    if (days === 1) return 'Expires tomorrow'
    return `${days} days left`
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={cn(
            'fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 backdrop-blur-md bg-card/95',
            notification.type === 'success'
              ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'text-rose-600 dark:text-rose-400 border-rose-500/30'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Student & User Management</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Foxford Core
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
            Grant Premium access, manage band targets, and oversee platform accounts.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="self-start inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-card border border-border rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-black text-foreground mt-1">{totalUsersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-linear-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">⭐ Premium Students</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{premiumUsersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Free Students</p>
            <p className="text-2xl font-black text-foreground mt-1">{freeStudentsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Administrators</p>
            <p className="text-2xl font-black text-foreground mt-1">{adminsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, or user ID..."
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-card transition-all"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="student">Students Only</option>
            <option value="admin">Admins Only</option>
          </select>

          <select
            value={premiumFilter}
            onChange={(e) => setPremiumFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="premium">⭐ Premium Only</option>
            <option value="free">Free Students</option>
          </select>
        </div>
      </div>

      {/* Mobile User Cards List (Visible on mobile screens < 768px) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl">
            No users matching the current filter.
          </div>
        ) : (
          filtered.map((u) => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Student'
            const isCurrentUser = u.user_id === currentUserId
            const isAdmin = u.role === 'admin'
            const isSuspended = u.status === 'suspended'
            const isBusy = loadingId === u.user_id
            const isPrem = !!u.is_premium

            return (
              <div
                key={u.id || u.user_id}
                className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3 transition-all"
              >
                {/* Header: Avatar, Name, Email, Status & Role Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={fullName}
                        className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-400/20 to-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs border border-amber-500/30">
                        {fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate text-sm">{fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email || u.user_id}</p>
                    </div>
                  </div>

                  {/* Status & Role Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        isAdmin
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          : 'bg-secondary text-muted-foreground border border-border'
                      )}
                    >
                      {isAdmin && <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                      <span>{u.role}</span>
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[9px] font-bold uppercase',
                        isSuspended
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      )}
                    >
                      {isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-secondary/40 border border-border/60 text-center">
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-semibold uppercase">Plan</span>
                    {isPrem ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-current" /> Pro
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground">Free</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-semibold uppercase">Target</span>
                    <span className="text-[11px] font-bold text-foreground">
                      {u.target_band ? `Band ${u.target_band}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-semibold uppercase">Tests</span>
                    <span className="text-[11px] font-bold text-foreground">
                      {u.attempts_count || 0}
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-1 flex items-center justify-between gap-1.5 flex-wrap">
                  {/* Role Promotion / Demotion */}
                  {!isCurrentUser ? (
                    <button
                      type="button"
                      onClick={() => handleRoleChange(u.user_id, isAdmin ? 'student' : 'admin')}
                      disabled={isBusy}
                      className={cn(
                        'h-8 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer active:scale-95',
                        isAdmin
                          ? 'border-border text-foreground hover:bg-secondary'
                          : 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25'
                      )}
                    >
                      {isAdmin ? (
                        <>
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Demote</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Make Admin</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="h-8 px-2.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 border border-blue-500/30 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>You (Admin)</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Premium action */}
                    {!isAdmin && (
                      isPrem ? (
                        <button
                          type="button"
                          onClick={() => handleRevokePremium(u.user_id)}
                          disabled={isBusy}
                          className="h-8 px-2 rounded-xl text-xs font-bold border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleGrantPremium(u.user_id, 30, 'monthly')}
                          disabled={isBusy}
                          className="h-8 px-2.5 rounded-xl text-xs font-bold bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-2xs hover:opacity-95 flex items-center gap-1"
                        >
                          ⭐ +30d
                        </button>
                      )
                    )}

                    {/* Details modal */}
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="h-8 px-2.5 rounded-xl border border-border text-foreground hover:bg-secondary flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      <span>Profile</span>
                    </button>

                    {/* Suspend button */}
                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleToggleSuspend(u.user_id, isSuspended)}
                        disabled={isBusy}
                        className={cn(
                          'h-8 w-8 rounded-xl border flex items-center justify-center transition-colors',
                          isSuspended
                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                            : 'border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10'
                        )}
                        title={isSuspended ? 'Restore' : 'Suspend'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete button */}
                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(u)}
                        disabled={isBusy}
                        className="h-8 w-8 rounded-xl border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Users Table (Desktop & Tablet screens >= 768px) */}
      <div className="hidden md:block bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="p-3.5">Student / User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Membership / Plan</th>
                <th className="p-3.5">Target Band</th>
                <th className="p-3.5">Tests Taken</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No users matching the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Student'
                  const isCurrentUser = u.user_id === currentUserId
                  const isAdmin = u.role === 'admin'
                  const isSuspended = u.status === 'suspended'
                  const isBusy = loadingId === u.user_id
                  const isPrem = !!u.is_premium

                  return (
                    <tr key={u.id || u.user_id} className="hover:bg-secondary/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={fullName}
                              className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-400/20 to-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs border border-amber-500/30">
                              {fullName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{fullName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{u.email || u.user_id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            isAdmin
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-secondary text-muted-foreground border border-border'
                          )}
                        >
                          {isAdmin && <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Membership / Plan */}
                      <td className="p-3.5">
                        {isPrem ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] shadow-2xs">
                              <Crown className="w-3 h-3 fill-current" />
                              <span>{u.plan_name || 'Premium'}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatExpiry(u.subscription_expires_at)}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-medium border border-border">
                            Free Student
                          </span>
                        )}
                      </td>

                      {/* Target Band */}
                      <td className="p-3.5 font-bold text-foreground">
                        {u.target_band ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30">
                            Band {u.target_band}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Attempts Count */}
                      <td className="p-3.5 text-foreground/80 font-semibold">
                        {u.attempts_count ? `${u.attempts_count} tests` : '0 tests'}
                      </td>

                      {/* Account Status */}
                      <td className="p-3.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                            isSuspended
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          )}
                        >
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* 1. Premium Grant / Revoke / Status */}
                          {!isAdmin ? (
                            isPrem ? (
                              <button
                                type="button"
                                onClick={() => handleRevokePremium(u.user_id)}
                                disabled={isBusy}
                                className="h-7 px-2.5 rounded-lg text-[10px] font-bold border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Revoke Premium Membership"
                              >
                                Revoke Prem
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleGrantPremium(u.user_id, 30, 'monthly')}
                                disabled={isBusy}
                                className="h-7 px-2.5 rounded-lg text-[10px] font-bold bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-2xs hover:opacity-95 transition-opacity flex items-center gap-1 cursor-pointer"
                                title="Grant 30-Day Premium Access"
                              >
                                ⭐ +30 Days
                              </button>
                            )
                          ) : (
                            <span className="h-7 px-2.5 rounded-lg text-[10px] font-medium text-muted-foreground bg-secondary border border-border inline-flex items-center">
                              Full Access
                            </span>
                          )}

                          {/* 2. Promote / Demote Role */}
                          {!isCurrentUser ? (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(u.user_id, isAdmin ? 'student' : 'admin')}
                              disabled={isBusy}
                              className={cn(
                                'h-7 px-2.5 rounded-lg text-[10px] font-bold transition-colors border flex items-center gap-1 cursor-pointer',
                                isAdmin
                                  ? 'border-border text-foreground hover:bg-secondary'
                                  : 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25'
                              )}
                              title={isAdmin ? 'Demote to Student' : 'Promote to Admin'}
                            >
                              {isAdmin ? (
                                <>
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <span>Demote</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span>Make Admin</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 border border-blue-500/30 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>You</span>
                            </span>
                          )}

                          {/* 3. Suspend / Restore */}
                          {!isCurrentUser ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(u.user_id, isSuspended)}
                              disabled={isBusy}
                              className={cn(
                                'h-7 w-7 rounded-lg border transition-colors flex items-center justify-center cursor-pointer',
                                isSuspended
                                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                  : 'border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10'
                              )}
                              title={isSuspended ? 'Restore Account' : 'Suspend Account'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7 shrink-0" />
                          )}

                          {/* 4. View Profile Details */}
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="h-7 w-7 rounded-lg border border-border text-muted-foreground hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/10 flex items-center justify-center transition-colors cursor-pointer"
                            title="View Profile Details & Full Audit"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Delete User Permanently */}
                          {!isCurrentUser && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              disabled={isBusy}
                              className="h-7 w-7 rounded-lg border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete User Permanently (All Data)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details & Premium Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card rounded-2xl sm:rounded-3xl w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-border space-y-5 animate-in zoom-in-95 text-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Student Profile & Membership</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Identity Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-400/20 to-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-base flex items-center justify-center shadow-xs border border-amber-500/30">
                  {(selectedUser.first_name || 'S').charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">
                    {selectedUser.first_name} {selectedUser.last_name || ''}
                  </h4>
                  <p className="text-muted-foreground font-medium">{selectedUser.email || 'No email registered'}</p>
                  <p className="text-muted-foreground/70 font-mono text-[10px]">{selectedUser.user_id}</p>
                </div>
              </div>

              {/* User Role & Administrative Privileges */}
              <div className="p-4 bg-secondary/50 border border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={cn(
                      'w-4 h-4',
                      selectedUser.role === 'admin' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                    )} />
                    <span className="font-bold text-foreground text-xs">Role & Privileges</span>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      selectedUser.role === 'admin'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-secondary text-muted-foreground border border-border'
                    )}
                  >
                    {selectedUser.role === 'admin' ? 'Administrator' : 'Student'}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {selectedUser.role === 'admin'
                    ? 'This user has full administrative privileges: manage tests, review questions, modify student accounts, and change platform settings.'
                    : 'This user is registered as a student with standard permissions: taking IELTS practice tests, learning vocabulary, and tracking progress.'}
                </p>

                {/* Role Switcher Button */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  {selectedUser.user_id !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => handleRoleChange(selectedUser.user_id, selectedUser.role === 'admin' ? 'student' : 'admin')}
                      disabled={loadingId === selectedUser.user_id}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95',
                        selectedUser.role === 'admin'
                          ? 'border-border text-foreground hover:bg-secondary'
                          : 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25'
                      )}
                    >
                      {selectedUser.role === 'admin' ? (
                        <>
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Demote to Student Role</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Promote to Administrator</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Current active account (Cannot self-demote)
                    </span>
                  )}
                </div>
              </div>

              {/* Premium Membership Box */}
              <div className="p-4 bg-linear-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-foreground text-xs">Premium Subscription</span>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      selectedUser.is_premium
                        ? 'bg-amber-500 text-white'
                        : 'bg-secondary text-muted-foreground border border-border'
                    )}
                  >
                    {selectedUser.is_premium ? 'Active' : 'Free Account'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Plan</span>
                    <span className="font-bold text-foreground">{selectedUser.plan_name || 'Free Trial'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Expires</span>
                    <span className="font-bold text-foreground">
                      {selectedUser.is_premium ? formatExpiry(selectedUser.subscription_expires_at) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Premium Duration Buttons */}
                <div className="pt-2 border-t border-amber-500/20 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleGrantPremium(selectedUser.user_id, 30, 'monthly')}
                    className="px-3 py-1.5 rounded-xl bg-card border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/10 transition-colors shadow-2xs text-[11px] cursor-pointer"
                  >
                    ⭐ Grant 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGrantPremium(selectedUser.user_id, 365, 'yearly')}
                    className="px-3 py-1.5 rounded-xl bg-card border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/10 transition-colors shadow-2xs text-[11px] cursor-pointer"
                  >
                    ⭐ Grant 1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGrantPremium(selectedUser.user_id, -1, 'lifetime')}
                    className="px-3 py-1.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-95 transition-opacity shadow-2xs text-[11px] cursor-pointer"
                  >
                    ⭐ Lifetime Access
                  </button>
                  {selectedUser.is_premium && (
                    <button
                      type="button"
                      onClick={() => handleRevokePremium(selectedUser.user_id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/20 transition-colors text-[11px] cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Performance & Academic Info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-secondary/50 border border-border/50 rounded-xl">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Target Band</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedUser.target_band ? `Band ${selectedUser.target_band}` : 'Not specified'}
                  </p>
                </div>
                <div className="p-3 bg-secondary/50 border border-border/50 rounded-xl">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Previous IELTS Score</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedUser.previous_score ? `Band ${selectedUser.previous_score}` : 'First-time taker'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-secondary/50 border border-border/50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Registered Date</span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {new Date(selectedUser.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold">Tests Completed</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {selectedUser.attempts_count || 0} attempts
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              {selectedUser.user_id !== currentUserId ? (
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(selectedUser)
                  }}
                  className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete User Permanently</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Permanently Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card rounded-2xl sm:rounded-3xl w-[calc(100vw-1.5rem)] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-destructive/30 space-y-4 animate-in zoom-in-95 text-foreground">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">Delete User Permanently?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are about to permanently delete{' '}
                <span className="font-bold text-foreground">
                  {userToDelete.first_name || userToDelete.last_name
                    ? `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim()
                    : userToDelete.email || userToDelete.user_id}
                </span>{' '}
                (<span className="font-mono text-muted-foreground">{userToDelete.email || userToDelete.user_id}</span>).
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-foreground text-[11px] space-y-1">
                <p className="font-bold text-rose-600 dark:text-rose-400">⚠️ Irreversible Action:</p>
                <p className="text-muted-foreground">
                  This will completely and permanently erase this account and all associated data including:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-muted-foreground pl-1">
                  <li>All test attempts & saved answers (Listening, Reading, Writing, Speaking)</li>
                  <li>All AI grading feedback & transcripts</li>
                  <li>Vocabulary lists, saved bookmarks & progress history</li>
                  <li>Subscriptions, payment records & account credentials</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const usersList = await getAdminUsers()
      setUsers(usersList as UserItem[])
    } catch (e: any) {
      console.error('Failed to load admin users:', e)
      setError(e.message || 'Failed to load user accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-52 bg-card rounded-lg" />
            <div className="h-3 w-80 bg-card rounded" />
          </div>
          <div className="h-9 w-24 bg-card rounded-xl" />
        </div>

        {/* KPI Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-2xl p-4" />
          ))}
        </div>

        {/* Filter bar Skeleton */}
        <div className="h-14 bg-card border border-border rounded-2xl" />

        {/* Table Skeleton */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary/40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center space-y-4 fox-shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Failed to Load Users</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return <AdminUsersView initialUsers={users} currentUserId={currentUserId} onRefresh={loadData} />
}