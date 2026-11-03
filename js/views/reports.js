/**
 * Reports & Analytics
 */
const ReportsView = {
  async render(container) {
    const [projects, tasks, members] = await Promise.all([
      API.getProjects(),
      API.getTasks(),
      API.getMembers(),
    ]);

    const total = tasks.length || 1;
    const statusCounts = APP_CONFIG.TASK_STATUSES.map((s) => ({
      ...s,
      count: tasks.filter((t) => t.status === s.id).length,
    }));
    const priorityCounts = APP_CONFIG.PRIORITIES.map((p) => ({
      ...p,
      count: tasks.filter((t) => t.priority === p.id).length,
    }));
    const completed = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter((t) => Utils.isOverdue(t.due_date, t.status)).length;
    const completionRate = Math.round((completed / total) * 100);

    const byProject = projects.map((p) => {
      const pts = tasks.filter((t) => t.project_id === p.id);
      const done = pts.filter((t) => t.status === 'done').length;
      return {
        name: p.name,
        total: pts.length,
        done,
        rate: pts.length ? Math.round((done / pts.length) * 100) : 0,
      };
    });

    container.innerHTML = `
      <div class="mb-6">
        <h1 class="page-title">Reports & Analytics</h1>
        <p class="page-sub">Progress metrics across projects and the team.</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="surface kpi-card"><div class="kpi-label">Completion Rate</div><div class="kpi-value">${completionRate}%</div></div>
        <div class="surface kpi-card"><div class="kpi-label">Total Tasks</div><div class="kpi-value">${tasks.length}</div></div>
        <div class="surface kpi-card"><div class="kpi-label">Completed</div><div class="kpi-value">${completed}</div></div>
        <div class="surface kpi-card"><div class="kpi-label">Overdue</div><div class="kpi-value ${overdue ? 'warn' : ''}">${overdue}</div></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <section class="surface p-5">
          <h2 class="text-base font-semibold mb-4">Status Breakdown</h2>
          ${statusCounts
            .map(
              (s) => `
            <div class="bar-chart-row">
              <span class="text-sm">${s.label}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:${(s.count / total) * 100}%;background:${s.color}"></div>
              </div>
              <span class="text-sm text-muted text-right">${s.count}</span>
            </div>`
            )
            .join('')}
          <div class="mt-6 flex justify-center">${this.donutSVG(statusCounts, total)}</div>
        </section>

        <section class="surface p-5">
          <h2 class="text-base font-semibold mb-4">Priority Distribution</h2>
          ${priorityCounts
            .map(
              (p) => `
            <div class="bar-chart-row">
              <span class="text-sm">${p.label}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:${(p.count / total) * 100}%;background:${p.color}"></div>
              </div>
              <span class="text-sm text-muted text-right">${p.count}</span>
            </div>`
            )
            .join('')}
          <h3 class="font-semibold mt-8 mb-3 text-sm">Project Completion</h3>
          ${
            byProject
              .map(
                (p) => `
            <div class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span>${Utils.escapeHtml(p.name)}</span>
                <span class="text-muted">${p.done}/${p.total} · ${p.rate}%</span>
              </div>
              <div class="progress-bar"><span style="width:${p.rate}%"></span></div>
            </div>`
              )
              .join('') || '<p class="text-muted">No projects.</p>'
          }
        </section>
      </div>

      <section class="surface p-5">
        <h2 class="text-base font-semibold mb-4">Team Throughput</h2>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Active</th>
                <th>Done</th>
                <th>Overdue</th>
                <th>Load</th>
              </tr>
            </thead>
            <tbody>
              ${members
                .map((m) => {
                  const mine = tasks.filter((t) => t.assignee_id === m.id);
                  const active = mine.filter((t) => t.status !== 'done').length;
                  const done = mine.filter((t) => t.status === 'done').length;
                  const od = mine.filter((t) => Utils.isOverdue(t.due_date, t.status)).length;
                  const max = Math.max(
                    ...members.map(
                      (x) => tasks.filter((t) => t.assignee_id === x.id && t.status !== 'done').length
                    ),
                    1
                  );
                  return `
                  <tr>
                    <td class="font-medium">${Utils.escapeHtml(m.full_name)}</td>
                    <td>${active}</td>
                    <td>${done}</td>
                    <td class="${od ? 'text-danger' : ''}">${od}</td>
                    <td class="w-40">
                      <div class="bar-track"><div class="bar-fill" style="width:${(active / max) * 100}%"></div></div>
                    </td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  },

  donutSVG(segments, total) {
    const r = 56;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const circles = segments
      .map((s) => {
        const len = total ? (s.count / total) * c : 0;
        const el = `<circle cx="80" cy="80" r="${r}" fill="none" stroke="${s.color}" stroke-width="16"
          stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}"
          transform="rotate(-90 80 80)" />`;
        offset += len;
        return el;
      })
      .join('');
    return `
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="16" />
        ${circles}
        <text x="80" y="84" text-anchor="middle" fill="#0b132b" font-size="18" font-weight="700">${total}</text>
        <text x="80" y="102" text-anchor="middle" fill="#475569" font-size="10">tasks</text>
      </svg>`;
  },
};

window.ReportsView = ReportsView;
