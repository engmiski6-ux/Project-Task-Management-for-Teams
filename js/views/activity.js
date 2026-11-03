/**
 * Activity Log — terminal-style audit trail with masked usernames
 */
const ActivityView = {
  async render(container) {
    const [activity, members] = await Promise.all([API.getActivity(100), API.getMembers()]);

    container.innerHTML = `
      <div class="mb-6">
        <h1 class="page-title">Activity Log</h1>
        <p class="page-sub">Raw audit trail of workspace actions.</p>
      </div>

      <div class="surface p-4 mb-4">
        <select class="input-field w-auto" id="act-filter">
          <option value="">All actions</option>
          <option value="project">Projects</option>
          <option value="task">Tasks</option>
          <option value="member">Members</option>
          <option value="comment">Comments</option>
        </select>
      </div>

      <div id="activity-feed">${this.termList(activity, members)}</div>`;

    container.querySelector('#act-filter')?.addEventListener('change', (e) => {
      const type = e.target.value;
      const filtered = type
        ? activity.filter(
            (a) =>
              a.entity_type === type ||
              (type === 'comment' && a.action === 'commented') ||
              (type === 'member' &&
                (a.entity_type === 'member' || a.action.includes('member') || a.action === 'joined'))
          )
        : activity;
      container.querySelector('#activity-feed').innerHTML = this.termList(filtered, members);
    });
  },

  termList(activity, members) {
    if (!activity.length) {
      return '<div class="term-log"><div class="term-line"><span class="term-action">// no activity recorded</span></div></div>';
    }
    return `<div class="term-log">${activity
      .map((a) => {
        const u = members.find((m) => m.id === a.user_id) || {
          username: a.profiles?.username || 'user',
          full_name: a.profiles?.full_name || 'User',
        };
        const masked = Utils.maskUsername(u.username || u.full_name);
        const action = Utils.activityActionText(a);
        const entity = a.entity_type ? `[${a.entity_type}]` : '';
        return `<div class="term-line">
          <span class="term-ts">${Utils.formatLogStamp(a.created_at)}</span>
          <span class="term-user">${Utils.escapeHtml(masked)}</span>
          <span class="term-action">${entity ? `<span class="hl">${entity}</span> ` : ''}${action}</span>
        </div>`;
      })
      .join('')}</div>`;
  },
};

window.ActivityView = ActivityView;
