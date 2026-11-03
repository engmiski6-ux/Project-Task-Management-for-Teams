/**
 * TaskFlow — App shell & hash router
 * Dark navy sidebar | White main content
 * No demo banner. Text-only nav labels (no decorative feed icons).
 */
const App = (() => {
  let currentUser = null;

  const NAV = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'Projects' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'team', label: 'Team / Members' },
    { id: 'reports', label: 'Reports & Analytics' },
    { id: 'activity', label: 'Activity Log' },
    { id: 'settings', label: 'Settings' },
  ];

  async function init() {
    API.init();
    currentUser = await API.getSession();
    if (!currentUser) {
      window.location.href = 'index.html';
      return;
    }

    mountShell();
    window.addEventListener('hashchange', route);
    window.addEventListener('user-updated', (e) => {
      currentUser = e.detail;
      updateSidebarUser();
    });

    route();

    API.subscribe('tasks', () => {
      const page = (location.hash.replace('#', '') || 'dashboard').split('/')[0];
      if (page === 'tasks') route();
    });
  }

  function mountShell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <div class="app-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand">
            <div class="logo">TaskFlow</div>
            <p class="tag">Team Task Management</p>
          </div>
          <nav class="flex-1 overflow-y-auto py-3" id="sidebar-nav">
            ${NAV.map(
              (n) => `
              <button type="button" class="nav-link" data-nav="${n.id}">
                <span class="nav-label">${n.label}</span>
              </button>`
            ).join('')}
          </nav>
          <div class="sidebar-footer">
            <div class="mb-3">
              <div class="meta-name truncate" id="sb-name">${Utils.escapeHtml(currentUser.full_name)}</div>
              <div class="meta-role" id="sb-role">${Utils.escapeHtml(currentUser.role)}</div>
            </div>
            <button type="button" class="btn btn-ghost w-full" id="btn-logout">Log out</button>
          </div>
        </aside>
        <div class="main-wrap">
          <header class="topbar">
            <div class="flex items-center gap-3">
              <button type="button" class="btn-icon lg:hidden" id="btn-menu" aria-label="Menu">Menu</button>
              <h2 id="page-title">Dashboard</h2>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-primary text-sm hidden sm:inline-flex" id="btn-quick-task">New Task</button>
              <div class="avatar" title="${Utils.escapeHtml(currentUser.full_name)}">${Utils.initials(currentUser.full_name)}</div>
            </div>
          </header>
          <main class="content" id="view-root"></main>
        </div>
      </div>
      <div id="toast-container"></div>`;

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      await API.logout();
      window.location.href = 'index.html';
    });

    document.getElementById('btn-menu')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.add('open');
      document.getElementById('sidebar-overlay')?.classList.add('open');
    });

    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        location.hash = btn.dataset.nav;
        closeSidebar();
      });
    });

    document.getElementById('btn-quick-task')?.addEventListener('click', () => {
      TaskModal.open({
        user: currentUser,
        defaults: { assignee_id: currentUser.id },
        onSave: () => route(),
      });
    });
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
  }

  function updateSidebarUser() {
    const name = document.getElementById('sb-name');
    const role = document.getElementById('sb-role');
    if (name) name.textContent = currentUser.full_name;
    if (role) role.textContent = currentUser.role;
  }

  async function route() {
    const raw = (location.hash || '#dashboard').replace('#', '') || 'dashboard';
    const [page] = raw.split('/');
    const titleMap = Object.fromEntries(NAV.map((n) => [n.id, n.label]));
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titleMap[page] || 'Dashboard';

    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.nav === page);
    });

    const root = document.getElementById('view-root');
    if (!root) return;
    root.innerHTML = '<div class="text-muted p-6">Loading…</div>';

    try {
      switch (page) {
        case 'projects':
          await ProjectsView.render(root, currentUser);
          break;
        case 'tasks':
          await TasksView.render(root, currentUser);
          break;
        case 'team':
          await TeamView.render(root, currentUser);
          break;
        case 'reports':
          await ReportsView.render(root, currentUser);
          break;
        case 'activity':
          await ActivityView.render(root, currentUser);
          break;
        case 'settings':
          await SettingsView.render(root, currentUser);
          break;
        case 'dashboard':
        default:
          await DashboardView.render(root, currentUser);
          root.querySelectorAll('[data-open-task]').forEach((el) => {
            el.addEventListener('click', () => {
              TaskModal.open({
                taskId: el.dataset.openTask,
                user: currentUser,
                onSave: () => route(),
              });
            });
          });
          break;
      }
    } catch (err) {
      console.error(err);
      root.innerHTML = `<div class="surface empty-state text-danger">Failed to load view: ${Utils.escapeHtml(err.message || 'Unknown error')}</div>`;
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
