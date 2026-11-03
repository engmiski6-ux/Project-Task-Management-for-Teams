-- Seed after creating Auth users (password for all: miski123)
-- Create in Dashboard → Authentication → Users:
--   miski@team.local, sara@team.local, ahmed@team.local, layla@team.local, omar@team.local

DO $$
DECLARE
  v_admin_id UUID;
  v_manager_id UUID;
  v_ahmed_id UUID;
  v_layla_id UUID;
  v_omar_id UUID;
  v_workspace_id UUID;
  v_project1 UUID;
  v_project2 UUID;
  v_project3 UUID;
  v_task1 UUID;
  v_task2 UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'miski@team.local' OR username = 'miski' LIMIT 1;
  SELECT id INTO v_manager_id FROM public.profiles WHERE email = 'sara@team.local' OR username = 'sara' LIMIT 1;
  SELECT id INTO v_ahmed_id FROM public.profiles WHERE email = 'ahmed@team.local' OR username = 'ahmed' LIMIT 1;
  SELECT id INTO v_layla_id FROM public.profiles WHERE email = 'layla@team.local' OR username = 'layla' LIMIT 1;
  SELECT id INTO v_omar_id FROM public.profiles WHERE email = 'omar@team.local' OR username = 'omar' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Create auth user miski@team.local first.';
    RETURN;
  END IF;

  UPDATE public.profiles SET role = 'admin', username = 'miski', full_name = COALESCE(full_name, 'Miski Admin') WHERE id = v_admin_id;
  IF v_manager_id IS NOT NULL THEN UPDATE public.profiles SET role = 'manager' WHERE id = v_manager_id; END IF;

  INSERT INTO public.workspaces (name, description, owner_id)
  VALUES ('Miski Workspace', 'Primary team workspace', v_admin_id)
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (v_workspace_id, v_admin_id, 'admin', v_admin_id);

  IF v_manager_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by) VALUES (v_workspace_id, v_manager_id, 'manager', v_admin_id);
  END IF;
  IF v_ahmed_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by) VALUES (v_workspace_id, v_ahmed_id, 'member', v_admin_id);
  END IF;
  IF v_layla_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by) VALUES (v_workspace_id, v_layla_id, 'member', v_admin_id);
  END IF;
  IF v_omar_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by) VALUES (v_workspace_id, v_omar_id, 'member', v_admin_id);
  END IF;

  INSERT INTO public.projects (workspace_id, name, description, status, progress, start_date, due_date, color, created_by)
  VALUES
    (v_workspace_id, 'Website Redesign', 'Marketing site refresh', 'active', 65, CURRENT_DATE - 20, CURRENT_DATE + 25, '#1C2541', v_admin_id),
    (v_workspace_id, 'Mobile App Launch', 'Customer portal MVP', 'active', 40, CURRENT_DATE - 10, CURRENT_DATE + 45, '#D4AF37', v_admin_id),
    (v_workspace_id, 'Internal Tools', 'Admin dashboards', 'planning', 15, CURRENT_DATE, CURRENT_DATE + 60, '#5BC0BE', COALESCE(v_manager_id, v_admin_id));

  SELECT id INTO v_project1 FROM public.projects WHERE name = 'Website Redesign' AND workspace_id = v_workspace_id;
  SELECT id INTO v_project2 FROM public.projects WHERE name = 'Mobile App Launch' AND workspace_id = v_workspace_id;
  SELECT id INTO v_project3 FROM public.projects WHERE name = 'Internal Tools' AND workspace_id = v_workspace_id;

  INSERT INTO public.tasks (project_id, title, description, status, priority, assignee_id, created_by, start_date, due_date, position)
  VALUES
    (v_project1, 'Design homepage hero', 'Landing hero with collaboration imagery', 'done', 'high', v_layla_id, v_admin_id, CURRENT_DATE - 15, CURRENT_DATE - 5, 0),
    (v_project1, 'Implement navigation', 'Sidebar + main content split', 'in_progress', 'high', v_ahmed_id, v_admin_id, CURRENT_DATE - 5, CURRENT_DATE + 3, 1),
    (v_project1, 'API integration', 'Supabase auth and APIs', 'review', 'medium', v_omar_id, v_admin_id, CURRENT_DATE - 3, CURRENT_DATE + 7, 2),
    (v_project1, 'Accessibility audit', 'WCAG AA pass', 'todo', 'medium', v_layla_id, v_admin_id, CURRENT_DATE, CURRENT_DATE + 14, 3),
    (v_project2, 'Auth flow screens', 'Login and register', 'in_progress', 'high', v_ahmed_id, COALESCE(v_manager_id, v_admin_id), CURRENT_DATE - 2, CURRENT_DATE + 5, 0),
    (v_project2, 'Push notifications', 'Preference center', 'todo', 'low', v_omar_id, COALESCE(v_manager_id, v_admin_id), CURRENT_DATE + 2, CURRENT_DATE + 20, 1),
    (v_project3, 'Reporting exports', 'CSV export', 'todo', 'medium', v_ahmed_id, v_admin_id, CURRENT_DATE, CURRENT_DATE + 30, 0);

  SELECT id INTO v_task1 FROM public.tasks WHERE title = 'Implement navigation' LIMIT 1;
  SELECT id INTO v_task2 FROM public.tasks WHERE title = 'API integration' LIMIT 1;

  IF v_task1 IS NOT NULL THEN
    INSERT INTO public.subtasks (task_id, title, is_completed, position) VALUES
      (v_task1, 'Build sidebar component', true, 0),
      (v_task1, 'Mobile drawer menu', false, 1);
  END IF;

  IF v_task2 IS NOT NULL AND v_omar_id IS NOT NULL THEN
    INSERT INTO public.comments (task_id, user_id, content) VALUES
      (v_task2, COALESCE(v_manager_id, v_admin_id), 'Confirm RLS policies before merging.'),
      (v_task2, v_omar_id, 'Policies drafted.');
  END IF;

  INSERT INTO public.activity_log (workspace_id, user_id, action, entity_type, entity_id, details)
  VALUES
    (v_workspace_id, v_admin_id, 'created_project', 'project', v_project1, '{"name":"Website Redesign"}'),
    (v_workspace_id, COALESCE(v_ahmed_id, v_admin_id), 'updated_task', 'task', v_task1, '{"title":"Implement navigation"}');

  RAISE NOTICE 'Seed complete.';
END $$;
