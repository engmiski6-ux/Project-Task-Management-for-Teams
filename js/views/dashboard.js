/**
 * Role-based Dashboard — light main surfaces, masked activity names
 */
const DashboardView = {
  async render(container, user) {
    const [projects, tasks, members, activity, notifications] = await Promise.all([
      API.getProjects(),
      API.getTasks(),
      API.getMembers(),
      API.getActivity(8),
      API.getNotifications(user.id),
    ]);

    if (user.role === 'admin' || user.role === 'manager') {
      container.innerHTML = this.adminHTML(user, projects, tasks, members, activity);
    } else {
      container.innerHTML = this.memberHTML(user, projects, tasks, notifications);
    }
  },

  adminHTML(user, projects, tasks, members, activity) {
    const activeTasks = tasks.filter((t) => t.status !== 'done');
    const completed = tasks.filter((t) => t.status === 'done');
    const overdue = tasks.filter((t) => Utils.isOverdue(t.due_date, t.status));

    const workload = members.map((m) => ({
      name: m.full_name,
      count: tasks.filter((t) => t.assignee_id === m.id && t.status !== 'done').length,
    }));
    const maxLoad = Math.max(...workload.map((w) => w.count), 1);

    return `
      <div class="mb-6">
        <h1 class="page-title">Welcome back, ${Utils.escapeHtml(user.full_name.split(' ')[0])}</h1>
        <p class="page-sub">Team overview and delivery health.</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${this.kpi('Total Projects', projects.length)}
        ${this.kpi('Active Tasks', activeTasks.length)}
        ${this.kpi('Completed', completed.length)}
        ${this.kpi('Overdue', overdue.length, overdue.length > 0)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section class="surface p-5">
          <h2 class="text-base font-semibold mb-4">Project Progress</h2>
          ${
            projects
              .map(
                (p) => `
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-1">
                <span>${Utils.escapeHtml(p.name)}</span>
                <span class="text-muted">${p.progress || 0}%</span>
              </div>
              <div class="progress-bar"><span style="width:${p.progress || 0}%"></span></div>
            </div>`
              )
              .join('') || '<p class="text-muted">No projects yet.</p>'
          }
        </section>

        <section class="surface p-5">
          <h2 class="text-base font-semibold mb-4">Team Workload</h2>
          ${workload
            .map(
              (w) => `
            <div class="bar-chart-row">
              <span class="text-sm truncate">${Utils.escapeHtml(w.name.split(' ')[0])}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${(w.count / maxLoad) * 100}%"></div></div>
              <span class="text-sm text-muted text-right">${w.count}</span>
            </div>`
            )
            .join('')}
        </section>
      </div>

      <section class="surface p-5">
        <h2 class="text-base font-semibold mb-3">Recent Team Activity</h2>
        ${this.termFeed(activity, members)}
      </section>`;
  },

  memberHTML(user, projects, tasks, notifications) {
    const mine = tasks.filter((t) => t.assignee_id === user.id);
    const byStatus = {
      todo: mine.filter((t) => t.status === 'todo').length,
      in_progress: mine.filter((t) => t.status === 'in_progress').length,
      review: mine.filter((t) => t.status === 'review').length,
      done: mine.filter((t) => t.status === 'done').length,
    };
    const focus = mine
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        const pa = { high: 0, medium: 1, low: 2 }[a.priority] ?? 1;
        const pb = { high: 0, medium: 1, low: 2 }[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        return new Date(a.due_date || '9999') - new Date(b.due_date || '9999');
      })
      .slice(0, 5);

    const upcoming = mine
      .filter((t) => t.due_date && t.status !== 'done')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);

    const unread = notifications.filter((n) => !n.is_read);

    return `
      <div class="mb-6">
        <h1 class="page-title">My Daily Focus</h1>
        <p class="page-sub">Prioritized work for ${Utils.formatDate(Utils.todayISO())}.</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${this.kpi('To Do', byStatus.todo)}
        ${this.kpi('In Progress', byStatus.in_progress)}
        ${this.kpi('Review', byStatus.review)}
        ${this.kpi('Done', byStatus.done)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section class="surface p-5 lg:col-span-2">
          <h2 class="text-base font-semibold mb-4">Focus Queue</h2>
          ${
            focus
              .map((t) => {
                const proj = projects.find((p) => p.id === t.project_id);
                return `
              <button type="button" class="w-full text-left task-card" data-open-task="${t.id}">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-medium text-sm">${Utils.escapeHtml(t.title)}</div>
                    <div class="text-muted text-xs mt-1">${Utils.escapeHtml(proj?.name || '')} · ${Utils.statusLabel(t.status)}</div>
                  </div>
                  ${Utils.priorityBadge(t.priority)}
                </div>
              </button>`;
              })
              .join('') || '<p class="text-muted empty-state">You are all caught up.</p>'
          }
        </section>

        <div class="space-y-4">
          <section class="surface p-5">
            <h2 class="text-base font-semibold mb-3">Upcoming Deadlines</h2>
            ${
              upcoming
                .map((t) => {
                  const days = Utils.daysUntil(t.due_date);
                  const overdue = Utils.isOverdue(t.due_date, t.status);
                  return `
                <div class="flex justify-between items-center py-2" style="border-bottom:1px solid #f1f5f9;">
                  <span class="text-sm truncate pr-2">${Utils.escapeHtml(t.title)}</span>
                  <span class="text-xs whitespace-nowrap ${overdue ? 'text-danger' : 'text-muted'}">${
                    overdue ? 'Overdue' : days === 0 ? 'Today' : `${days}d`
                  }</span>
                </div>`;
                })
                .join('') || '<p class="text-muted text-sm">No upcoming deadlines.</p>'
            }
          </section>

          <section class="surface p-5">
            <h2 class="text-base font-semibold mb-3">Notifications</h2>
            ${
              unread.length
                ? unread
                    .slice(0, 5)
                    .map(
                      (n) => `
              <div class="py-2" style="border-bottom:1px solid #f1f5f9;">
                <div class="text-sm font-medium">${Utils.escapeHtml(n.title)}</div>
                <div class="text-muted text-xs">${Utils.escapeHtml(n.message || '')}</div>
              </div>`
                    )
                    .join('')
                : '<p class="text-muted text-sm">No new notifications.</p>'
            }
          </section>
        </div>
      </div>`;
  },

  kpi(label, value, warn = false) {
    return `
      <div class="surface kpi-card">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value ${warn ? 'warn' : ''}">${value}</div>
      </div>`;
  },

  termFeed(activity, members) {
    if (!activity.length) return '<p class="text-muted">No recent activity.</p>';
    return `<div class="term-log">${activity
      .map((a) => {
        const u = members.find((m) => m.id === a.user_id) || {
          username: a.profiles?.username || 'user',
          full_name: a.profiles?.full_name || 'User',
        };
        const masked = Utils.maskUsername(u.username || u.full_name);
        const action = Utils.activityActionText(a);
        return `<div class="term-line">
          <span class="term-ts">${Utils.formatLogStamp(a.created_at)}</span>
          <span class="term-user">${Utils.escapeHtml(masked)}</span>
          <span class="term-action">${action}</span>
        </div>`;
      })
      .join('')}</div>`;
  },
};

window.DashboardView = DashboardView;
