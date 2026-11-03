/**
 * Projects list + create/edit (Admin/Manager)
 */
const ProjectsView = {
  async render(container, user) {
    const projects = await API.getProjects();
    const tasks = await API.getTasks();
    const canManage = Utils.canManageProjects(user.role);

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="page-title">Projects</h1>
          <p class="page-sub">All workspace projects and delivery status.</p>
        </div>
        ${
          canManage
            ? '<button type="button" class="btn btn-primary" id="btn-new-project">New Project</button>'
            : '<span class="text-muted text-sm">View only — ask a manager to create projects.</span>'
        }
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="project-grid">
        ${projects.map((p) => this.card(p, tasks, canManage)).join('') || '<div class="empty-state surface col-span-full">No projects yet.</div>'}
      </div>
      <div id="project-form-root"></div>`;

    container.querySelector('#btn-new-project')?.addEventListener('click', () =>
      this.openForm(container, user, null, () => this.render(container, user))
    );

    container.querySelectorAll('[data-edit-project]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const project = projects.find((p) => p.id === btn.dataset.editProject);
        this.openForm(container, user, project, () => this.render(container, user));
      });
    });

    container.querySelectorAll('[data-delete-project]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this project and its tasks?')) return;
        await API.deleteProject(btn.dataset.deleteProject);
        Utils.toast('Project deleted');
        this.render(container, user);
      });
    });
  },

  card(p, tasks, canManage) {
    const count = tasks.filter((t) => t.project_id === p.id).length;
    const done = tasks.filter((t) => t.project_id === p.id && t.status === 'done').length;
    return `
      <article class="surface p-5 flex flex-col">
        <div class="flex items-start justify-between gap-2 mb-3">
          <h3 class="font-semibold text-base m-0">${Utils.escapeHtml(p.name)}</h3>
          <span class="badge badge-neutral">${Utils.escapeHtml(p.status || 'active')}</span>
        </div>
        <p class="text-muted text-sm flex-1 mb-4">${Utils.escapeHtml(p.description || '')}</p>
        <div class="mb-3">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-muted">${done}/${count} tasks done</span>
            <span class="text-muted">${p.progress || 0}%</span>
          </div>
          <div class="progress-bar"><span style="width:${p.progress || 0}%"></span></div>
        </div>
        <div class="flex items-center justify-between text-xs text-muted">
          <span>Due ${Utils.formatDate(p.due_date)}</span>
          ${
            canManage
              ? `<div class="flex gap-1">
                  <button type="button" class="btn-icon" data-edit-project="${p.id}" title="Edit">Edit</button>
                  <button type="button" class="btn-icon" data-delete-project="${p.id}" title="Delete">Del</button>
                </div>`
              : ''
          }
        </div>
      </article>`;
  },

  openForm(container, user, project, onDone) {
    const root = container.querySelector('#project-form-root');
    const isEdit = !!project;
    root.innerHTML = `
      <div class="modal-overlay" data-close>
        <div class="modal-panel" style="max-width:520px;">
          <div class="p-5" style="border-bottom:1px solid #e2e8f0;">
            <h2 class="text-xl font-semibold m-0">${isEdit ? 'Edit Project' : 'Create Project'}</h2>
          </div>
          <form id="project-form" class="p-5 space-y-3">
            <div>
              <label class="text-sm text-muted block mb-1">Name</label>
              <input class="input-field" name="name" required value="${Utils.escapeHtml(project?.name || '')}" />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Description</label>
              <textarea class="input-field" name="description" rows="3">${Utils.escapeHtml(project?.description || '')}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm text-muted block mb-1">Status</label>
                <select class="input-field" name="status">
                  ${['planning', 'active', 'on_hold', 'completed', 'archived']
                    .map(
                      (s) =>
                        `<option value="${s}" ${project?.status === s ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Progress %</label>
                <input class="input-field" type="number" min="0" max="100" name="progress" value="${project?.progress ?? 0}" />
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Start</label>
                <input class="input-field" type="date" name="start_date" value="${project?.start_date || ''}" />
              </div>
              <div>
                <label class="text-sm text-muted block mb-1">Due</label>
                <input class="input-field" type="date" name="due_date" value="${project?.due_date || ''}" />
              </div>
            </div>
          </form>
          <div class="flex justify-end gap-2 p-5" style="border-top:1px solid #e2e8f0;">
            <button type="button" class="btn btn-ghost" data-close>Cancel</button>
            <button type="button" class="btn btn-primary" id="save-project">Save</button>
          </div>
        </div>
      </div>`;

    root.querySelector('.modal-panel')?.addEventListener('click', (e) => e.stopPropagation());
    root.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => {
        root.innerHTML = '';
      })
    );

    root.querySelector('#save-project').addEventListener('click', async () => {
      const form = root.querySelector('#project-form');
      const fd = new FormData(form);
      const payload = {
        name: fd.get('name').toString().trim(),
        description: fd.get('description').toString().trim(),
        status: fd.get('status'),
        progress: Number(fd.get('progress') || 0),
        start_date: fd.get('start_date') || null,
        due_date: fd.get('due_date') || null,
        color: '#1C2541',
      };
      try {
        if (isEdit) await API.updateProject(project.id, payload);
        else await API.createProject({ ...payload, created_by: user.id });
        Utils.toast(isEdit ? 'Project updated' : 'Project created');
        root.innerHTML = '';
        onDone();
      } catch (err) {
        Utils.toast(err.message || 'Save failed', 'error');
      }
    });
  },
};

window.ProjectsView = ProjectsView;
