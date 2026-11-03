/**
 * Unified Data API — DemoStore or Supabase
 */
const API = (() => {
  let supabase = null;

  function isDemo() {
    return APP_CONFIG.DEMO_MODE;
  }

  function init() {
    if (!isDemo() && window.supabase) {
      supabase = window.supabase.createClient(
        APP_CONFIG.SUPABASE_URL,
        APP_CONFIG.SUPABASE_ANON_KEY
      );
    }
    return supabase;
  }

  function client() {
    return supabase;
  }

  async function login(identifier, password) {
    if (isDemo()) {
      const data = DemoStore.get();
      const user = data.users.find(
        (u) =>
          (u.username.toLowerCase() === identifier.toLowerCase() ||
            u.email.toLowerCase() === identifier.toLowerCase()) &&
          u.password === password
      );
      if (!user) throw new Error('Invalid username/email or password.');
      DemoStore.mutate((d) => {
        d.sessionUserId = user.id;
      });
      const { password: _p, ...safe } = user;
      return safe;
    }
    const email = identifier.includes('@') ? identifier : `${identifier}@team.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return getCurrentProfile();
  }

  async function register({ username, email, full_name, password }) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        if (d.users.some((u) => u.username === username || u.email === email)) {
          throw new Error('Username or email already exists.');
        }
        const user = {
          id: Utils.uid(),
          username,
          email,
          password,
          full_name,
          role: 'member',
          job_title: 'Team Member',
          department: '',
          avatar_url: null,
          is_active: true,
        };
        d.users.push(user);
        d.sessionUserId = user.id;
        DemoStore.logActivity(d, user.id, 'joined', 'member', user.id, { name: full_name });
        const { password: _p, ...safe } = user;
        return safe;
      });
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name, role: 'member' } },
    });
    if (error) throw error;
    return getCurrentProfile();
  }

  async function logout() {
    if (isDemo()) {
      DemoStore.mutate((d) => {
        d.sessionUserId = null;
      });
      return;
    }
    await supabase.auth.signOut();
  }

  async function getSession() {
    if (isDemo()) {
      const d = DemoStore.get();
      if (!d.sessionUserId) return null;
      const user = d.users.find((u) => u.id === d.sessionUserId);
      if (!user) return null;
      const { password: _p, ...safe } = user;
      return safe;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    return getCurrentProfile();
  }

  async function getCurrentProfile() {
    if (isDemo()) return getSession();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.user.id)
      .single();
    if (error) throw error;
    return data;
  }

  async function getMembers() {
    if (isDemo()) {
      return DemoStore.get().users.map(({ password, ...u }) => u);
    }
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (error) throw error;
    return data;
  }

  async function inviteMember({ username, email, full_name, role }) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        if (d.users.some((u) => u.username === username || u.email === email)) {
          throw new Error('User already exists.');
        }
        const user = {
          id: Utils.uid(),
          username,
          email,
          password: APP_CONFIG.DEFAULT_PASSWORD,
          full_name,
          role: role || 'member',
          job_title: 'Team Member',
          department: '',
          avatar_url: null,
          is_active: true,
        };
        d.users.push(user);
        DemoStore.logActivity(d, d.sessionUserId, 'invited_member', 'member', user.id, {
          name: full_name,
          role,
        });
        const { password: _p, ...safe } = user;
        return safe;
      });
    }
    throw new Error('Use Supabase Admin invite or an Edge Function for live invites.');
  }

  async function updateProfile(userId, updates) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const u = d.users.find((x) => x.id === userId);
        if (!u) throw new Error('User not found');
        Object.assign(u, updates);
        const { password: _p, ...safe } = u;
        return safe;
      });
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getProjects() {
    if (isDemo()) return DemoStore.get().projects;
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function createProject(payload) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const project = {
          id: Utils.uid(),
          workspace_id: d.workspace.id,
          progress: 0,
          status: 'planning',
          color: '#1C2541',
          created_at: new Date().toISOString(),
          ...payload,
        };
        d.projects.unshift(project);
        DemoStore.logActivity(d, d.sessionUserId, 'created_project', 'project', project.id, {
          name: project.name,
        });
        return project;
      });
    }
    const { data, error } = await supabase.from('projects').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function updateProject(id, updates) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const p = d.projects.find((x) => x.id === id);
        if (!p) throw new Error('Project not found');
        Object.assign(p, updates);
        DemoStore.logActivity(d, d.sessionUserId, 'updated_project', 'project', id, { name: p.name });
        return p;
      });
    }
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteProject(id) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const p = d.projects.find((x) => x.id === id);
        d.projects = d.projects.filter((x) => x.id !== id);
        d.tasks = d.tasks.filter((t) => t.project_id !== id);
        DemoStore.logActivity(d, d.sessionUserId, 'deleted_project', 'project', id, {
          name: p?.name,
        });
      });
    }
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  }

  async function getTasks(filters = {}) {
    if (isDemo()) {
      let tasks = [...DemoStore.get().tasks];
      if (filters.project_id) tasks = tasks.filter((t) => t.project_id === filters.project_id);
      if (filters.assignee_id) tasks = tasks.filter((t) => t.assignee_id === filters.assignee_id);
      if (filters.status) tasks = tasks.filter((t) => t.status === filters.status);
      if (filters.priority) tasks = tasks.filter((t) => t.priority === filters.priority);
      return tasks;
    }
    let q = supabase.from('tasks').select('*').order('position');
    if (filters.project_id) q = q.eq('project_id', filters.project_id);
    if (filters.assignee_id) q = q.eq('assignee_id', filters.assignee_id);
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.priority) q = q.eq('priority', filters.priority);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function getTask(id) {
    if (isDemo()) {
      const d = DemoStore.get();
      const task = d.tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');
      return {
        ...task,
        subtasks: d.subtasks.filter((s) => s.task_id === id).sort((a, b) => a.position - b.position),
        comments: d.comments
          .filter((c) => c.task_id === id)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        attachments: d.attachments.filter((a) => a.task_id === id),
      };
    }
    const { data: task, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error) throw error;
    const [subtasks, comments, attachments] = await Promise.all([
      supabase.from('subtasks').select('*').eq('task_id', id).order('position'),
      supabase.from('comments').select('*, profiles(full_name, username)').eq('task_id', id).order('created_at'),
      supabase.from('attachments').select('*').eq('task_id', id),
    ]);
    return {
      ...task,
      subtasks: subtasks.data || [],
      comments: comments.data || [],
      attachments: attachments.data || [],
    };
  }

  async function createTask(payload) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const task = {
          id: Utils.uid(),
          status: 'todo',
          priority: 'medium',
          position: d.tasks.filter((t) => t.project_id === payload.project_id).length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...payload,
        };
        d.tasks.push(task);
        DemoStore.logActivity(d, d.sessionUserId, 'created_task', 'task', task.id, {
          title: task.title,
        });
        return task;
      });
    }
    const { data, error } = await supabase.from('tasks').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async function updateTask(id, updates) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const t = d.tasks.find((x) => x.id === id);
        if (!t) throw new Error('Task not found');
        Object.assign(t, updates, { updated_at: new Date().toISOString() });
        DemoStore.logActivity(d, d.sessionUserId, 'updated_task', 'task', id, {
          title: t.title,
          ...updates,
        });
        return t;
      });
    }
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteTask(id) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const t = d.tasks.find((x) => x.id === id);
        d.tasks = d.tasks.filter((x) => x.id !== id);
        d.subtasks = d.subtasks.filter((s) => s.task_id !== id);
        d.comments = d.comments.filter((c) => c.task_id !== id);
        DemoStore.logActivity(d, d.sessionUserId, 'deleted_task', 'task', id, { title: t?.title });
      });
    }
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }

  async function addSubtask(taskId, title) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const st = {
          id: Utils.uid(),
          task_id: taskId,
          title,
          is_completed: false,
          position: d.subtasks.filter((s) => s.task_id === taskId).length,
        };
        d.subtasks.push(st);
        return st;
      });
    }
    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function toggleSubtask(id, is_completed) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const s = d.subtasks.find((x) => x.id === id);
        if (s) s.is_completed = is_completed;
        return s;
      });
    }
    const { data, error } = await supabase
      .from('subtasks')
      .update({ is_completed })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function addComment(taskId, userId, content) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const c = {
          id: Utils.uid(),
          task_id: taskId,
          user_id: userId,
          content,
          created_at: new Date().toISOString(),
        };
        d.comments.push(c);
        const task = d.tasks.find((t) => t.id === taskId);
        DemoStore.logActivity(d, userId, 'commented', 'task', taskId, { title: task?.title });
        return c;
      });
    }
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function addAttachmentMeta(taskId, userId, fileMeta) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const a = {
          id: Utils.uid(),
          task_id: taskId,
          uploaded_by: userId,
          created_at: new Date().toISOString(),
          ...fileMeta,
        };
        d.attachments.push(a);
        return a;
      });
    }
    const { data, error } = await supabase
      .from('attachments')
      .insert({ task_id: taskId, uploaded_by: userId, ...fileMeta })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getActivity(limit = 50) {
    if (isDemo()) {
      return DemoStore.get().activity.slice(0, limit);
    }
    const { data, error } = await supabase
      .from('activity_log')
      .select('*, profiles(full_name, username)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  async function getNotifications(userId) {
    if (isDemo()) {
      return DemoStore.get().notifications.filter((n) => n.user_id === userId);
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function markNotificationRead(id) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        const n = d.notifications.find((x) => x.id === id);
        if (n) n.is_read = true;
      });
    }
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }

  async function getWorkspace() {
    if (isDemo()) return DemoStore.get().workspace;
    const { data, error } = await supabase.from('workspaces').select('*').limit(1).single();
    if (error) throw error;
    return data;
  }

  async function updateWorkspace(updates) {
    if (isDemo()) {
      return DemoStore.mutate((d) => {
        Object.assign(d.workspace, updates);
        return d.workspace;
      });
    }
    const ws = await getWorkspace();
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', ws.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  function subscribe(table, callback) {
    if (isDemo() || !supabase) return { unsubscribe() {} };
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }

  return {
    init,
    client,
    isDemo,
    login,
    register,
    logout,
    getSession,
    getCurrentProfile,
    getMembers,
    inviteMember,
    updateProfile,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    addComment,
    addAttachmentMeta,
    getActivity,
    getNotifications,
    markNotificationRead,
    getWorkspace,
    updateWorkspace,
    subscribe,
  };
})();

window.API = API;
