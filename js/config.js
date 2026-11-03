/**
 * App configuration — set Supabase URL + anon key to leave demo mode.
 */
const APP_CONFIG = {
  APP_NAME: 'TaskFlow',
  APP_TAGLINE: 'Project Task Management for Teams',

  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  get DEMO_MODE() {
    return (
      this.SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
      this.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY' ||
      !this.SUPABASE_URL ||
      !this.SUPABASE_ANON_KEY
    );
  },

  DEFAULT_PASSWORD: 'miski123',

  TASK_STATUSES: [
    { id: 'todo', label: 'To Do', color: '#64748b' },
    { id: 'in_progress', label: 'In Progress', color: '#0369a1' },
    { id: 'review', label: 'Review', color: '#a16207' },
    { id: 'done', label: 'Done', color: '#059669' },
  ],

  PRIORITIES: [
    { id: 'high', label: 'High', color: '#b91c1c' },
    { id: 'medium', label: 'Medium', color: '#a16207' },
    { id: 'low', label: 'Low', color: '#0369a1' },
  ],

  ROLES: ['admin', 'manager', 'member'],
};

window.APP_CONFIG = APP_CONFIG;
