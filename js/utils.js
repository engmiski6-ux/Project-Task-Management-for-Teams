/**
 * Shared helpers — date formatting uses only valid Intl options
 * (never pass boolean flags like year:false to toLocaleDateString).
 */
const Utils = {
  uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  },

  initials(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  },

  /**
   * Mask a display name for public activity feeds.
   * "Miski Admin" → "M***i A***n" | "sara" → "s**a"
   */
  maskName(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'user***';
    return parts
      .map((part) => {
        if (part.length <= 2) return `${part.charAt(0)}*`;
        return `${part.charAt(0)}${'*'.repeat(Math.min(part.length - 2, 3))}${part.charAt(part.length - 1)}`;
      })
      .join(' ');
  },

  /** Mask username handle: "miski" → "m***i" */
  maskUsername(username = '') {
    const u = String(username).trim();
    if (!u) return 'u***';
    if (u.length <= 2) return `${u.charAt(0)}*`;
    return `${u.charAt(0)}${'*'.repeat(Math.min(u.length - 2, 3))}${u.charAt(u.length - 1)}`;
  },

  /**
   * Safe date formatter.
   * @param {string|Date|null} dateStr
   * @param {'full'|'short'|'monthDay'} style
   */
  formatDate(dateStr, style = 'full') {
    if (!dateStr) return '—';
    const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';

    let options;
    if (style === 'monthDay' || style === 'short') {
      options = { month: 'short', day: 'numeric' };
    } else {
      options = { month: 'short', day: 'numeric', year: 'numeric' };
    }

    try {
      return d.toLocaleDateString(undefined, options);
    } catch (_) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return style === 'full' ? `${y}-${m}-${day}` : `${m}-${day}`;
    }
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    try {
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return d.toISOString().slice(0, 16).replace('T', ' ');
    }
  },

  /** Compact ISO-like stamp for terminal logs */
  formatLogStamp(dateStr) {
    if (!dateStr) return '---------- --:--';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '---------- --:--';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  },

  relativeTime(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return Utils.formatDate(dateStr, 'short');
  },

  isOverdue(dueDate, status) {
    if (!dueDate || status === 'done') return false;
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return false;
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  },

  daysUntil(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
  },

  priorityBadge(priority) {
    const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
    const label = priority || 'medium';
    return `<span class="badge ${map[label] || 'badge-medium'}">${label}</span>`;
  },

  statusLabel(status) {
    const s = (APP_CONFIG.TASK_STATUSES || []).find((x) => x.id === status);
    return s ? s.label : status;
  },

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  },

  canManageProjects(role) {
    return role === 'admin' || role === 'manager';
  },

  todayISO() {
    return new Date().toISOString().slice(0, 10);
  },

  addDaysISO(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  },

  activityActionText(a) {
    const name = a.details?.name || a.details?.title || '';
    const safe = Utils.escapeHtml(name);
    const map = {
      created_project: `created_project ${safe ? `"${safe}"` : ''}`.trim(),
      updated_project: `updated_project ${safe ? `"${safe}"` : ''}`.trim(),
      deleted_project: 'deleted_project',
      created_task: `created_task ${safe ? `"${safe}"` : ''}`.trim(),
      updated_task: `updated_task ${safe ? `"${safe}"` : ''}`.trim(),
      completed_task: `completed_task ${safe ? `"${safe}"` : ''}`.trim(),
      deleted_task: 'deleted_task',
      commented: `commented ${safe ? `on "${safe}"` : ''}`.trim(),
      invited_member: `invited_member ${safe ? `"${safe}"` : ''}`.trim(),
      joined: 'joined_workspace',
    };
    return map[a.action] || String(a.action || 'action').replace(/_/g, '_');
  },
};

window.Utils = Utils;
