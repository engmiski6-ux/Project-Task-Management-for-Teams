/**
 * Demo / localStorage data layer (active when Supabase keys are not set).
 */
const DemoStore = (() => {
  const KEY = 'taskflow_demo_v2';

  function seedUsers() {
    const ids = {
      miski: Utils.uid(),
      sara: Utils.uid(),
      ahmed: Utils.uid(),
      layla: Utils.uid(),
      omar: Utils.uid(),
    };
    return [
      {
        id: ids.miski,
        username: 'miski',
        email: 'miski@team.local',
        password: 'miski123',
        full_name: 'Miski Admin',
        role: 'admin',
        job_title: 'System Administrator',
        department: 'Operations',
        avatar_url: null,
        is_active: true,
      },
      {
        id: ids.sara,
        username: 'sara',
        email: 'sara@team.local',
        password: 'miski123',
        full_name: 'Sara Hassan',
        role: 'manager',
        job_title: 'Project Manager',
        department: 'Product',
        avatar_url: null,
        is_active: true,
      },
      {
        id: ids.ahmed,
        username: 'ahmed',
        email: 'ahmed@team.local',
        password: 'miski123',
        full_name: 'Ahmed Ali',
        role: 'member',
        job_title: 'Frontend Developer',
        department: 'Engineering',
        avatar_url: null,
        is_active: true,
      },
      {
        id: ids.layla,
        username: 'layla',
        email: 'layla@team.local',
        password: 'miski123',
        full_name: 'Layla Noor',
        role: 'member',
        job_title: 'UI/UX Designer',
        department: 'Design',
        avatar_url: null,
        is_active: true,
      },
      {
        id: ids.omar,
        username: 'omar',
        email: 'omar@team.local',
        password: 'miski123',
        full_name: 'Omar Khalid',
        role: 'member',
        job_title: 'Backend Developer',
        department: 'Engineering',
        avatar_url: null,
        is_active: true,
      },
    ];
  }

  function buildSeed() {
    const users = seedUsers();
    const [admin, manager, ahmed, layla, omar] = users;
    const workspaceId = Utils.uid();
    const p1 = Utils.uid();
    const p2 = Utils.uid();
    const p3 = Utils.uid();

    const tasks = [
      {
        id: Utils.uid(),
        project_id: p1,
        title: 'Design homepage hero',
        description: 'Create landing hero with team collaboration imagery.',
        status: 'done',
        priority: 'high',
        assignee_id: layla.id,
        created_by: admin.id,
        start_date: Utils.addDaysISO(-15),
        due_date: Utils.addDaysISO(-5),
        position: 0,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p1,
        title: 'Implement navigation',
        description: 'Responsive sidebar and main content split.',
        status: 'in_progress',
        priority: 'high',
        assignee_id: ahmed.id,
        created_by: admin.id,
        start_date: Utils.addDaysISO(-5),
        due_date: Utils.addDaysISO(3),
        position: 1,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p1,
        title: 'API integration',
        description: 'Wire Supabase auth and project APIs.',
        status: 'review',
        priority: 'medium',
        assignee_id: omar.id,
        created_by: admin.id,
        start_date: Utils.addDaysISO(-3),
        due_date: Utils.addDaysISO(7),
        position: 2,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p1,
        title: 'Accessibility audit',
        description: 'WCAG AA pass on key dashboard pages.',
        status: 'todo',
        priority: 'medium',
        assignee_id: layla.id,
        created_by: admin.id,
        start_date: Utils.todayISO(),
        due_date: Utils.addDaysISO(14),
        position: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p2,
        title: 'Auth flow screens',
        description: 'Login and register flows.',
        status: 'in_progress',
        priority: 'high',
        assignee_id: ahmed.id,
        created_by: manager.id,
        start_date: Utils.addDaysISO(-2),
        due_date: Utils.addDaysISO(5),
        position: 0,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p2,
        title: 'Push notifications',
        description: 'Preference center and delivery.',
        status: 'todo',
        priority: 'low',
        assignee_id: omar.id,
        created_by: manager.id,
        start_date: Utils.addDaysISO(2),
        due_date: Utils.addDaysISO(20),
        position: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p2,
        title: 'Onboarding checklist',
        description: 'First-run empty states.',
        status: 'todo',
        priority: 'medium',
        assignee_id: layla.id,
        created_by: manager.id,
        start_date: Utils.todayISO(),
        due_date: Utils.addDaysISO(10),
        position: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p3,
        title: 'Reporting exports',
        description: 'CSV export for analytics.',
        status: 'todo',
        priority: 'medium',
        assignee_id: ahmed.id,
        created_by: admin.id,
        start_date: Utils.todayISO(),
        due_date: Utils.addDaysISO(30),
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: Utils.uid(),
        project_id: p1,
        title: 'Performance budget',
        description: 'Bundle size and Lighthouse targets.',
        status: 'todo',
        priority: 'high',
        assignee_id: omar.id,
        created_by: admin.id,
        start_date: Utils.addDaysISO(-1),
        due_date: Utils.addDaysISO(-1),
        position: 4,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const navTask = tasks.find((t) => t.title === 'Implement navigation');
    const apiTask = tasks.find((t) => t.title === 'API integration');

    return {
      sessionUserId: null,
      users,
      workspace: {
        id: workspaceId,
        name: 'Miski Workspace',
        description: 'Primary team workspace for project delivery',
        owner_id: admin.id,
      },
      projects: [
        {
          id: p1,
          workspace_id: workspaceId,
          name: 'Website Redesign',
          description: 'Modernize marketing site with dual-surface UI.',
          status: 'active',
          progress: 65,
          start_date: Utils.addDaysISO(-20),
          due_date: Utils.addDaysISO(25),
          color: '#1C2541',
          created_by: admin.id,
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        },
        {
          id: p2,
          workspace_id: workspaceId,
          name: 'Mobile App Launch',
          description: 'iOS/Android MVP for customer portal.',
          status: 'active',
          progress: 40,
          start_date: Utils.addDaysISO(-10),
          due_date: Utils.addDaysISO(45),
          color: '#D4AF37',
          created_by: admin.id,
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          id: p3,
          workspace_id: workspaceId,
          name: 'Internal Tools',
          description: 'Admin dashboards and automation.',
          status: 'planning',
          progress: 15,
          start_date: Utils.todayISO(),
          due_date: Utils.addDaysISO(60),
          color: '#5BC0BE',
          created_by: manager.id,
          created_at: new Date().toISOString(),
        },
      ],
      tasks,
      subtasks: [
        { id: Utils.uid(), task_id: navTask.id, title: 'Build sidebar component', is_completed: true, position: 0 },
        { id: Utils.uid(), task_id: navTask.id, title: 'Mobile drawer menu', is_completed: false, position: 1 },
        { id: Utils.uid(), task_id: navTask.id, title: 'Active route highlighting', is_completed: false, position: 2 },
        { id: Utils.uid(), task_id: apiTask.id, title: 'Auth helpers', is_completed: true, position: 0 },
        { id: Utils.uid(), task_id: apiTask.id, title: 'RLS policies review', is_completed: false, position: 1 },
      ],
      comments: [
        {
          id: Utils.uid(),
          task_id: apiTask.id,
          user_id: manager.id,
          content: 'Confirm RLS policies before merging.',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: Utils.uid(),
          task_id: apiTask.id,
          user_id: omar.id,
          content: 'Policies drafted — review scheduled.',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ],
      attachments: [],
      activity: [
        {
          id: Utils.uid(),
          workspace_id: workspaceId,
          user_id: admin.id,
          action: 'created_project',
          entity_type: 'project',
          entity_id: p1,
          details: { name: 'Website Redesign' },
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        },
        {
          id: Utils.uid(),
          workspace_id: workspaceId,
          user_id: admin.id,
          action: 'created_project',
          entity_type: 'project',
          entity_id: p2,
          details: { name: 'Mobile App Launch' },
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          id: Utils.uid(),
          workspace_id: workspaceId,
          user_id: ahmed.id,
          action: 'updated_task',
          entity_type: 'task',
          entity_id: navTask.id,
          details: { title: 'Implement navigation', status: 'in_progress' },
          created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: Utils.uid(),
          workspace_id: workspaceId,
          user_id: layla.id,
          action: 'completed_task',
          entity_type: 'task',
          entity_id: tasks[0].id,
          details: { title: 'Design homepage hero' },
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: Utils.uid(),
          workspace_id: workspaceId,
          user_id: manager.id,
          action: 'commented',
          entity_type: 'task',
          entity_id: apiTask.id,
          details: { title: 'API integration' },
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
      ],
      notifications: [
        {
          id: Utils.uid(),
          user_id: ahmed.id,
          title: 'Task assigned',
          message: 'Assigned: Implement navigation',
          type: 'task',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: Utils.uid(),
          user_id: ahmed.id,
          title: 'Mention',
          message: 'You were mentioned on API integration.',
          type: 'mention',
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: Utils.uid(),
          user_id: admin.id,
          title: 'Overdue task',
          message: 'Performance budget is past due.',
          type: 'alert',
          is_read: false,
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* ignore */ }
    const data = buildSeed();
    save(data);
    return data;
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get() {
    return load();
  }

  function mutate(fn) {
    const data = load();
    const result = fn(data);
    save(data);
    return result;
  }

  function reset() {
    localStorage.removeItem(KEY);
    return load();
  }

  function logActivity(data, userId, action, entityType, entityId, details = {}) {
    data.activity.unshift({
      id: Utils.uid(),
      workspace_id: data.workspace.id,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    });
  }

  return { get, mutate, reset, logActivity, KEY };
})();

window.DemoStore = DemoStore;
