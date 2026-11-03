/**
 * Tasks — My Tasks, Kanban (DnD), Calendar
 * Date formatting uses Utils.formatDate(style) — never invalid Intl options.
 */
const TasksView = {
  filters: { priority: '', assignee_id: '', sort: 'due_date', project_id: '', view: 'kanban' },

  async render(container, user, opts = {}) {
    if (opts.view) this.filters.view = opts.view;
    const [tasks, projects, members] = await Promise.all([
      API.getTasks(),
      API.getProjects(),
      API.getMembers(),
    ]);

    container.innerHTML = `
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="page-sub">Organize work across list, board, and calendar.</p>
        </div>
        <button type="button" class="btn btn-primary" id="btn-new-task">New Task</button>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-4">
        <div class="tab-bar">
          <button type="button" class="tab-btn ${this.filters.view === 'mine' ? 'active' : ''}" data-view="mine">My Tasks</button>
          <button type="button" class="tab-btn ${this.filters.view === 'kanban' ? 'active' : ''}" data-view="kanban">Kanban</button>
          <button type="button" class="tab-btn ${this.filters.view === 'calendar' ? 'active' : ''}" data-view="calendar">Calendar</button>
        </div>
        <select class="input-field w-auto" id="filter-priority">
          <option value="">All priorities</option>
          ${APP_CONFIG.PRIORITIES.map((p) => `<option value="${p.id}" ${this.filters.priority === p.id ? 'selected' : ''}>${p.label}</option>`).join('')}
        </select>
        <select class="input-field w-auto" id="filter-assignee">
          <option value="">All assignees</option>
          ${members.map((m) => `<option value="${m.id}" ${this.filters.assignee_id === m.id ? 'selected' : ''}>${Utils.escapeHtml(m.full_name)}</option>`).join('')}
        </select>
        <select class="input-field w-auto" id="filter-project">
          <option value="">All projects</option>
          ${projects.map((p) => `<option value="${p.id}" ${this.filters.project_id === p.id ? 'selected' : ''}>${Utils.escapeHtml(p.name)}</option>`).join('')}
        </select>
        <select class="input-field w-auto" id="filter-sort">
          <option value="due_date" ${this.filters.sort === 'due_date' ? 'selected' : ''}>Sort: Due date</option>
          <option value="priority" ${this.filters.sort === 'priority' ? 'selected' : ''}>Sort: Priority</option>
          <option value="title" ${this.filters.sort === 'title' ? 'selected' : ''}>Sort: Title</option>
        </select>
      </div>

      <div id="tasks-body"></div>`;

    const body = container.querySelector('#tasks-body');
    const refresh = () => this.render(container, user);

    container.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filters.view = btn.dataset.view;
        this.render(container, user);
      });
    });

    ['filter-priority', 'filter-assignee', 'filter-project', 'filter-sort'].forEach((id) => {
      container.querySelector(`#${id}`)?.addEventListener('change', (e) => {
        const map = {
          'filter-priority': 'priority',
          'filter-assignee': 'assignee_id',
          'filter-project': 'project_id',
          'filter-sort': 'sort',
        };
        this.filters[map[id]] = e.target.value;
        this.paintBody(body, user, tasks, projects, members, refresh);
      });
    });

    container.querySelector('#btn-new-task')?.addEventListener('click', () => {
      TaskModal.open({
        user,
        defaults: { assignee_id: user.id },
        onSave: refresh,
      });
    });

    this.paintBody(body, user, tasks, projects, members, refresh);
  },

  applyFilters(tasks, user) {
    let list = [...tasks];
    if (this.filters.view === 'mine') list = list.filter((t) => t.assignee_id === user.id);
    if (this.filters.priority) list = list.filter((t) => t.priority === this.filters.priority);
    if (this.filters.assignee_id) list = list.filter((t) => t.assignee_id === this.filters.assignee_id);
    if (this.filters.project_id) list = list.filter((t) => t.project_id === this.filters.project_id);

    const prio = { high: 0, medium: 1, low: 2 };
    if (this.filters.sort === 'priority') list.sort((a, b) => (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1));
    else if (this.filters.sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => new Date(a.due_date || '9999') - new Date(b.due_date || '9999'));

    return list;
  },

  paintBody(body, user, tasks, projects, members, refresh) {
    const filtered = this.applyFilters(tasks, user);
    if (this.filters.view === 'calendar') {
      body.innerHTML = this.calendarHTML(filtered);
      this.bindTaskOpens(body, user, refresh);
      return;
    }
    if (this.filters.view === 'mine') {
      body.innerHTML = this.listHTML(filtered, projects, members);
      this.bindTaskOpens(body, user, refresh);
      return;
    }
    body.innerHTML = this.kanbanHTML(filtered, projects, members);
    this.bindTaskOpens(body, user, refresh);
    this.bindDragDrop(body, refresh);
  },

  listHTML(tasks, projects, members) {
    if (!tasks.length) return '<div class="surface empty-state">No tasks match your filters.</div>';
    return `
      <div class="surface overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map((t) => {
                const p = projects.find((x) => x.id === t.project_id);
                const m = members.find((x) => x.id === t.assignee_id);
                const overdue = Utils.isOverdue(t.due_date, t.status);
                return `
                <tr class="cursor-pointer" data-open-task="${t.id}">
                  <td class="font-medium">${Utils.escapeHtml(t.title)}</td>
                  <td class="text-muted">${Utils.escapeHtml(p?.name || '—')}</td>
                  <td>${Utils.statusLabel(t.status)}</td>
                  <td>${Utils.priorityBadge(t.priority)}</td>
                  <td>${Utils.escapeHtml(m?.full_name || 'Unassigned')}</td>
                  <td class="${overdue ? 'text-danger' : ''}">${Utils.formatDate(t.due_date)}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>`;
  },

  kanbanHTML(tasks, projects, members) {
    return `
      <div class="kanban-board">
        ${APP_CONFIG.TASK_STATUSES.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return `
          <div class="kanban-col" data-status="${col.id}">
            <div class="kanban-col-header">
              <span>${col.label}</span>
              <span class="text-muted text-xs">${colTasks.length}</span>
            </div>
            <div class="kanban-col-body" data-drop-status="${col.id}">
              ${colTasks
                .map((t) => {
                  const p = projects.find((x) => x.id === t.project_id);
                  const m = members.find((x) => x.id === t.assignee_id);
                  const overdue = Utils.isOverdue(t.due_date, t.status);
                  return `
                  <div class="task-card" draggable="true" data-task-id="${t.id}" data-open-task="${t.id}">
                    <div class="flex justify-between gap-2 mb-2">
                      ${Utils.priorityBadge(t.priority)}
                      <span class="text-xs ${overdue ? 'text-danger' : 'text-muted'}">${Utils.formatDate(t.due_date, 'monthDay')}</span>
                    </div>
                    <div class="font-medium text-sm mb-1">${Utils.escapeHtml(t.title)}</div>
                    <div class="text-muted text-xs mb-2 truncate">${Utils.escapeHtml(p?.name || '')}</div>
                    <div class="text-xs text-muted">${Utils.escapeHtml(m?.full_name || 'Unassigned')}</div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  },

  calendarHTML(tasks) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push({ day: '', muted: true, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, muted: false, date: iso });
    }
    while (cells.length % 7 !== 0) cells.push({ day: '', muted: true, date: null });

    const today = Utils.todayISO();

    return `
      <div class="surface p-4">
        <h2 class="text-base font-semibold mb-4">${monthName}</h2>
        <div class="cal-grid mb-2">
          ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            .map((d) => `<div class="text-center text-xs text-muted py-1">${d}</div>`)
            .join('')}
        </div>
        <div class="cal-grid">
          ${cells
            .map((c) => {
              const dayTasks = c.date ? tasks.filter((t) => t.due_date === c.date) : [];
              return `
              <div class="cal-cell ${c.muted ? 'muted' : ''} ${c.date === today ? 'today' : ''}">
                <div class="text-xs ${c.date === today ? 'font-bold' : 'text-muted'}">${c.day}</div>
                ${dayTasks
                  .slice(0, 3)
                  .map(
                    (t) =>
                      `<div class="cal-event" data-open-task="${t.id}" title="${Utils.escapeHtml(t.title)}">${Utils.escapeHtml(t.title)}</div>`
                  )
                  .join('')}
                ${dayTasks.length > 3 ? `<div class="text-xs text-muted">+${dayTasks.length - 3}</div>` : ''}
              </div>`;
            })
            .join('')}
        </div>
      </div>`;
  },

  bindTaskOpens(root, user, refresh) {
    root.querySelectorAll('[data-open-task]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (el.classList.contains('dragging')) return;
        e.stopPropagation();
        TaskModal.open({ taskId: el.dataset.openTask, user, onSave: refresh });
      });
    });
  },

  bindDragDrop(root, refresh) {
    let dragId = null;

    root.querySelectorAll('.task-card[draggable]').forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        dragId = card.dataset.taskId;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragId);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        root.querySelectorAll('.kanban-col-body').forEach((c) => c.classList.remove('drag-over'));
      });
      card.addEventListener(
        'click',
        (e) => {
          if (card.dataset.justDragged === '1') {
            e.stopImmediatePropagation();
            card.dataset.justDragged = '0';
          }
        },
        true
      );
    });

    root.querySelectorAll('[data-drop-status]').forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain') || dragId;
        const status = zone.dataset.dropStatus;
        if (!id) return;
        const card = root.querySelector(`[data-task-id="${id}"]`);
        if (card) card.dataset.justDragged = '1';
        try {
          await API.updateTask(id, { status });
          Utils.toast(`Moved to ${Utils.statusLabel(status)}`);
          refresh();
        } catch (err) {
          Utils.toast(err.message || 'Move failed', 'error');
        }
      });
    });
  },
};

window.TasksView = TasksView;
