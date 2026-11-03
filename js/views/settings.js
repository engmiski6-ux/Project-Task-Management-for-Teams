/**
 * Settings — Profile & Workspace
 */
const SettingsView = {
  async render(container, user) {
    const workspace = await API.getWorkspace();
    const canManage = Utils.canManageProjects(user.role);

    container.innerHTML = `
      <div class="mb-6">
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Profile and workspace preferences.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section class="surface p-5">
          <h2 class="text-base font-semibold mb-4">My Profile</h2>
          <form id="profile-form" class="space-y-3">
            <div class="flex items-center gap-3 mb-4">
              <div class="avatar avatar-lg">${Utils.initials(user.full_name)}</div>
              <div>
                <div class="font-semibold">${Utils.escapeHtml(user.full_name)}</div>
                <div class="text-muted text-sm capitalize">${user.role}</div>
              </div>
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Full name</label>
              <input class="input-field" name="full_name" value="${Utils.escapeHtml(user.full_name)}" />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Username</label>
              <input class="input-field" name="username" value="${Utils.escapeHtml(user.username)}" />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Email</label>
              <input class="input-field" name="email" type="email" value="${Utils.escapeHtml(user.email)}" />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Job title</label>
              <input class="input-field" name="job_title" value="${Utils.escapeHtml(user.job_title || '')}" />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Department</label>
              <input class="input-field" name="department" value="${Utils.escapeHtml(user.department || '')}" />
            </div>
            <button type="submit" class="btn btn-primary mt-2">Save Profile</button>
          </form>
        </section>

        <section class="surface p-5">
          <h2 class="text-base font-semibold mb-4">Workspace</h2>
          <form id="workspace-form" class="space-y-3">
            <div>
              <label class="text-sm text-muted block mb-1">Workspace name</label>
              <input class="input-field" name="name" value="${Utils.escapeHtml(workspace.name || '')}" ${canManage ? '' : 'disabled'} />
            </div>
            <div>
              <label class="text-sm text-muted block mb-1">Description</label>
              <textarea class="input-field" name="description" rows="3" ${canManage ? '' : 'disabled'}>${Utils.escapeHtml(workspace.description || '')}</textarea>
            </div>
            ${
              canManage
                ? '<button type="submit" class="btn btn-primary mt-2">Save Workspace</button>'
                : '<p class="text-muted text-sm">Only admins and managers can edit workspace settings.</p>'
            }
          </form>
        </section>
      </div>`;

    container.querySelector('#profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const updated = await API.updateProfile(user.id, {
          full_name: fd.get('full_name').toString().trim(),
          username: fd.get('username').toString().trim(),
          email: fd.get('email').toString().trim(),
          job_title: fd.get('job_title').toString().trim(),
          department: fd.get('department').toString().trim(),
        });
        Object.assign(user, updated);
        Utils.toast('Profile saved');
        window.dispatchEvent(new CustomEvent('user-updated', { detail: user }));
        this.render(container, user);
      } catch (err) {
        Utils.toast(err.message || 'Save failed', 'error');
      }
    });

    container.querySelector('#workspace-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!canManage) return;
      const fd = new FormData(e.target);
      try {
        await API.updateWorkspace({
          name: fd.get('name').toString().trim(),
          description: fd.get('description').toString().trim(),
        });
        Utils.toast('Workspace saved');
      } catch (err) {
        Utils.toast(err.message || 'Save failed', 'error');
      }
    });
  },
};

window.SettingsView = SettingsView;
