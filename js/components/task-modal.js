/**
 * Task Details Modal — create / edit
 */
const TaskModal = (() => {
  let state = { open: false, taskId: null, mode: 'edit' };
  let membersCache = [];
  let projectsCache = [];
  let currentUser = null;
  let onSaved = null;

  function ensureRoot() {
    let root = document.getElementById('task-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'task-modal-root';
      document.body.appendChild(root);
    }
    return root;
  }

  async function open({ taskId = null, defaults = {}, user, onSave }) {
    currentUser = user;
    onSaved = onSave;
    state = { open: true, taskId, mode: taskId ? 'edit' : 'create' };
    membersCache = await API.getMembers();
    projectsCache = await API.getProjects();

    let task = {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee_id: user?.id || '',
      project_id: projectsCache[0]?.id || '',
      start_date: Utils.todayISO(),
      due_date: Utils.addDaysISO(7),
      subtasks: [],
      comments: [],
      attachments: [],
      ...defaults,
    };

    if (taskId) {
      task = await API.getTask(taskId);
    }

    render(task);
  }

  function close() {
    state.open = false;
    ensureRoot().innerHTML = '';
  }

  function render(task) {
    const root = ensureRoot();
    const memberOpts = membersCache
      .map(
        (m) =>
          `<option value="${m.id}" ${m.id === task.assignee_id ? 'selected' : ''}>${Utils.escapeHtml(m.full_name)}</option>`
      )
      .join('');
    const projectOpts = projectsCache
      .map(
        (p) =>
          `<option value="${p.id}" ${p.id === task.project_id ? 'selected' : ''}>${Utils.escapeHtml(p.name)}</option>`
      )
      .join('');
    const statusOpts = APP_CONFIG.TASK_STATUSES.map(
      (s) => `<option value="${s.id}" ${s.id === task.status ? 'selected' : ''}>${s.label}</option>`
    ).join('');
    const priorityOpts = APP_CONFIG.PRIORITIES.map(
      (p) => `<option value="${p.id}" ${p.id === task.priority ? 'selected' : ''}>${p.label}</option>`
    ).join('');

    const subtasksHtml =
      (task.subtasks || [])
        .map(
          (s) => `
      <div class="checklist-item" data-subtask="${s.id}">
        <input type="checkbox" ${s.is_completed ? 'checked' : ''} data-action="toggle-subtask" data-id="${s.id}" />
        <span class="${s.is_completed ? 'line-through text-muted' : ''}">${Utils.escapeHtml(s.title)}</span>
      </div>`
        )
        .join('') || '<p class="text-muted text-sm">No sub-tasks yet.</p>';

    const commentsHtml =
      (task.comments || [])
        .map((c) => {
          const author =
            membersCache.find((m) => m.id === c.user_id) ||
            (c.profiles ? { full_name: c.profiles.full_name, username: c.profiles.username } : { full_name: 'User', username: 'user' });
          const masked = Utils.maskUsername(author.username || author.full_name);
          return `
        <div class="comment-block">
          <div class="meta">${Utils.escapeHtml(masked)} · ${Utils.formatLogStamp(c.created_at)}</div>
          <div>${Utils.escapeHtml(c.content)}</div>
        </div>`;
        })
        .join('') || '<p class="text-muted text-sm">No comments yet.</p>';

    const attachmentsHtml =
      (task.attachments || [])
        .map(
          (a) => `
      <div class="flex items-center justify-between surface p-2 mb-2" style="border-radius:6px;">
        <span class="text-sm truncate font-mono">${Utils.escapeHtml(a.file_name)}</span>
        <span class="text-muted text-xs">${a.file_size ? Math.round(a.file_size / 1024) + ' KB' : ''}</span>
      </div>`
        )
        .join('') || '<p class="text-muted text-sm">No attachments.</p>';

    root.innerHTML = `
      <div class="modal-overlay" data-close-overlay>
        <div class="modal-panel" role="dialog" aria-modal="true">
          <div class="flex items-center justify-between p-5" style="border-bottom:1px solid #e2e8f0;">
            <h2 class="text-xl font-semibold m-0">${state.mode === 'create' ? 'Create Task' : 'Task Details'}</h2>
            <button type="button" class="btn-icon" data-action="close" aria-label="Close">Close</button>
          </div>
          <form id="task-form" class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label class="text-sm text-muted block mb-1">Title</label>
              <input class="input-field" name="title" required value="${Utils.escapeHtml(task.title || '')}" placeholder="Task title" />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Description</label>
              <textarea class="input-field" name="description" rows="3" placeholder="Full description...">${Utils.escapeHtml(task.description || '')}</textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-sm text-muted block mb-1">Project</label>
                <select class="input-field" name="project_id" required>${projectOpts}</select>
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Assignee</label>
                <select class="input-field" name="assignee_id"><option value="">Unassigned</option>${memberOpts}</select>
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Status</label>
                <select class="input-field" name="status">${statusOpts}</select>
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Priority</label>
                <select class="input-field" name="priority">${priorityOpts}</select>
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Start Date</label>
                <input class="input-field" type="date" name="start_date" value="${task.start_date || ''}" />
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Due Date</label>
                <input class="input-field" type="date" name="due_date" value="${task.due_date || ''}" />
              </div>
            </div>

            <div>
              <label class="text-sm text-muted block mb-2">Checklist / Sub-tasks</label>
              <div id="subtask-list">${subtasksHtml}</div>
              ${
                state.mode === 'edit'
                  ? `<div class="flex gap-2 mt-2">
                      <input class="input-field" id="new-subtask" placeholder="Add sub-task..." />
                      <button type="button" class="btn btn-ghost" data-action="add-subtask">Add</button>
                    </div>`
                  : '<p class="text-muted text-xs mt-1">Save the task first to add checklist items.</p>'
              }
            </div>

            <div>
              <label class="text-sm text-muted block mb-2">Attachments</label>
              <div id="attachment-list">${attachmentsHtml}</div>
              ${
                state.mode === 'edit'
                  ? `<label class="btn btn-ghost mt-2 cursor-pointer">
                      <input type="file" id="attach-file" class="hidden" />
                      Upload file
                    </label>`
                  : ''
              }
            </div>

            ${
              state.mode === 'edit'
                ? `<div>
                    <label class="text-sm text-muted block mb-2">Comments</label>
                    <div id="comment-list" class="mb-3">${commentsHtml}</div>
                    <div class="flex gap-2">
                      <input class="input-field" id="new-comment" placeholder="Write a comment..." />
                      <button type="button" class="btn btn-primary" data-action="add-comment">Send</button>
                    </div>
                  </div>`
                : ''
            }
          </form>
          <div class="flex items-center justify-between gap-3 p-5" style="border-top:1px solid #e2e8f0;">
            <div>
              ${
                state.mode === 'edit'
                  ? '<button type="button" class="btn btn-danger" data-action="delete">Delete</button>'
                  : ''
              }
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn btn-ghost" data-action="close">Cancel</button>
              <button type="button" class="btn btn-primary" data-action="save">Save Task</button>
            </div>
          </div>
        </div>
      </div>`;

    bindEvents(task);
  }

  function bindEvents() {
    const root = ensureRoot();

    root.querySelector('[data-close-overlay]')?.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close-overlay')) close();
    });

    root.querySelectorAll('[data-action="close"]').forEach((btn) =>
      btn.addEventListener('click', close)
    );

    root.querySelector('[data-action="save"]')?.addEventListener('click', async () => {
      const form = root.querySelector('#task-form');
      const fd = new FormData(form);
      const payload = {
        title: fd.get('title').toString().trim(),
        description: fd.get('description').toString().trim(),
        project_id: fd.get('project_id'),
        assignee_id: fd.get('assignee_id') || null,
        status: fd.get('status'),
        priority: fd.get('priority'),
        start_date: fd.get('start_date') || null,
        due_date: fd.get('due_date') || null,
      };
      if (!payload.title) {
        Utils.toast('Title is required', 'error');
        return;
      }
      try {
        if (state.mode === 'create') {
          payload.created_by = currentUser.id;
          await API.createTask(payload);
          Utils.toast('Task created');
        } else {
          await API.updateTask(state.taskId, payload);
          Utils.toast('Task updated');
        }
        close();
        if (onSaved) onSaved();
      } catch (err) {
        Utils.toast(err.message || 'Failed to save', 'error');
      }
    });

    root.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      if (!confirm('Delete this task?')) return;
      try {
        await API.deleteTask(state.taskId);
        Utils.toast('Task deleted');
        close();
        if (onSaved) onSaved();
      } catch (err) {
        Utils.toast(err.message || 'Delete failed', 'error');
      }
    });

    root.querySelectorAll('[data-action="toggle-subtask"]').forEach((cb) => {
      cb.addEventListener('change', async () => {
        await API.toggleSubtask(cb.dataset.id, cb.checked);
        const span = cb.parentElement.querySelector('span');
        span.classList.toggle('line-through', cb.checked);
        span.classList.toggle('text-muted', cb.checked);
      });
    });

    root.querySelector('[data-action="add-subtask"]')?.addEventListener('click', async () => {
      const input = root.querySelector('#new-subtask');
      const title = input.value.trim();
      if (!title) return;
      await API.addSubtask(state.taskId, title);
      input.value = '';
      const fresh = await API.getTask(state.taskId);
      render(fresh);
    });

    root.querySelector('[data-action="add-comment"]')?.addEventListener('click', async () => {
      const input = root.querySelector('#new-comment');
      const content = input.value.trim();
      if (!content) return;
      await API.addComment(state.taskId, currentUser.id, content);
      input.value = '';
      const fresh = await API.getTask(state.taskId);
      render(fresh);
    });

    root.querySelector('#attach-file')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await API.addAttachmentMeta(state.taskId, currentUser.id, {
        file_name: file.name,
        file_url: `#local/${file.name}`,
        file_size: file.size,
        mime_type: file.type,
      });
      Utils.toast('Attachment added');
      const fresh = await API.getTask(state.taskId);
      render(fresh);
    });
  }

  return { open, close };
})();

window.TaskModal = TaskModal;
