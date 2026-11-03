/**
 * Team / Members
 */
const TeamView = {
  async render(container, user) {
    const members = await API.getMembers();
    const tasks = await API.getTasks();
    const canInvite = Utils.canManageProjects(user.role);

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="page-title">Team / Members</h1>
          <p class="page-sub">${members.length} people in this workspace.</p>
        </div>
        ${canInvite ? '<button type="button" class="btn btn-primary" id="btn-invite">Invite Member</button>' : ''}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${members
          .map((m) => {
            const active = tasks.filter((t) => t.assignee_id === m.id && t.status !== 'done').length;
            const done = tasks.filter((t) => t.assignee_id === m.id && t.status === 'done').length;
            return `
            <article class="surface p-5">
              <div class="flex items-center gap-3 mb-3">
                <div class="avatar avatar-lg">${Utils.initials(m.full_name)}</div>
                <div>
                  <h3 class="font-semibold m-0">${Utils.escapeHtml(m.full_name)}</h3>
                  <p class="text-muted text-sm m-0">@${Utils.escapeHtml(m.username)}</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 mb-3">
                <span class="badge badge-neutral">${m.role}</span>
                <span class="text-muted text-xs self-center">${Utils.escapeHtml(m.job_title || '')}</span>
              </div>
              <p class="text-muted text-sm mb-3">${Utils.escapeHtml(m.department || '—')} · ${Utils.escapeHtml(m.email)}</p>
              <div class="flex gap-4 text-sm">
                <div><span class="font-semibold">${active}</span> <span class="text-muted">active</span></div>
                <div><span class="font-semibold">${done}</span> <span class="text-muted">done</span></div>
              </div>
            </article>`;
          })
          .join('')}
      </div>
      <div id="invite-root"></div>`;

    container.querySelector('#btn-invite')?.addEventListener('click', () => this.openInvite(container, user));
  },

  openInvite(container, user) {
    const root = container.querySelector('#invite-root');
    root.innerHTML = `
      <div class="modal-overlay" data-close>
        <div class="modal-panel" style="max-width:460px;">
          <div class="p-5" style="border-bottom:1px solid #e2e8f0;">
            <h2 class="text-xl font-semibold m-0">Invite Member</h2>
            <p class="text-muted text-sm mt-1 mb-0">Default password applied for testing.</p>
          </div>
          <form id="invite-form" class="p-5 space-y-3">
            <div>
              <label class="text-sm text-muted block mb-1">Full name</label>
              <input class="input-field" name="full_name" required />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Username</label>
              <input class="input-field" name="username" required />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Email</label>
              <input class="input-field" type="email" name="email" required />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Role</label>
              <select class="input-field" name="role">
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                ${user.role === 'admin' ? '<option value="admin">Admin</option>' : ''}
              </select>
            </div>
          </form>
          <div class="flex justify-end gap-2 p-5" style="border-top:1px solid #e2e8f0;">
            <button type="button" class="btn btn-ghost" data-close>Cancel</button>
            <button type="button" class="btn btn-primary" id="save-invite">Send Invite</button>
          </div>
        </div>
      </div>`;

    root.querySelector('.modal-panel')?.addEventListener('click', (e) => e.stopPropagation());
    root.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', () => {
        root.innerHTML = '';
      })
    );

    root.querySelector('#save-invite').addEventListener('click', async () => {
      const fd = new FormData(root.querySelector('#invite-form'));
      try {
        await API.inviteMember({
          full_name: fd.get('full_name').toString().trim(),
          username: fd.get('username').toString().trim(),
          email: fd.get('email').toString().trim(),
          role: fd.get('role'),
        });
        Utils.toast('Member invited');
        root.innerHTML = '';
        this.render(container, user);
      } catch (err) {
        Utils.toast(err.message || 'Invite failed', 'error');
      }
    });
  },
};

window.TeamView = TeamView;
