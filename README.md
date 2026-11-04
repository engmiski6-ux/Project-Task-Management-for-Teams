# 🚀 TaskFlow – Project Task Management for Teams

**TaskFlow** is a modern, intuitive, and collaborative project task management platform designed to help teams track project delivery health, assign tasks, monitor team workloads, and streamline workplace operations.

---

## 📌 Project Overview

TaskFlow serves as a centralized workspace built to eliminate workflow chaos. It empowers administrators, managers, and team members to collaborate seamlessly by providing visual progress tracking, task distribution analysis, real-time activity feeds, and role-specific dashboards.

---

## 👥 User Roles & Permissions (RBAC Architecture)

TaskFlow implements a structured Role-Based Access Control (RBAC) system to ensure clear authority, effective team hierarchy, and proper security delegation across three main tiers:

### 👑 1. Super Admin / Workspace Admin (e.g., Miski Admin)
* **Complete System Authority:** Full control over the entire TaskFlow platform, workspace parameters, and system-wide configurations.
* **User & Role Management:** Authority to add, remove, suspend, or elevate users between Team Member, Manager, and Admin roles.
* **Global Access & Audit Logs:** Access to view full activity logs, all projects, security settings, and organizational audit trails.
* **Billing & Subscriptions:** Full management of integrations, domain links, workspace settings, and administrative operations.

### 💼 2. Project Managers 
* **Team & Project Oversight:** High-level overview of team progress, project health, deadlines, and delivery bottlenecks.
* **Task Creation & Assignment:** Full permission to create new tasks, define timelines, and assign responsibilities to specific team members.
* **Workload Monitoring:** Real-time visibility into task allocation across members (e.g., Ahmed, Layla, Omar) to ensure balanced work distribution.
* **Reports & Analytics:** Access to detailed performance reports, progress charts, and team velocity metrics.

### 🧑‍💻 3. Team Members
* **Personalized Dashboard:** Tailored dashboard view displaying individual task assignments, priorities, and upcoming deadlines.
* **Status & Work Updates:** Ability to update task progression (e.g., *In Progress*, *Completed*) in real-time.
* **Collaborative Activity:** Log contributions, view team updates, and stay aligned with overall project delivery goals.

---

## ✨ Key Features

- **📊 Dynamic Dashboard:** Instantly view key metrics including **Total Projects**, **Active Tasks**, **Completed Tasks**, and **Overdue Items**.
- **📈 Visual Project Progress:** Interactive progress bars tracking completion percentages for active projects (*Website Redesign*, *Mobile App Launch*, *Internal Tools*).
- **⚖️ Team Workload Distribution:** Visual charts displaying active tasks assigned per team member.
- **⚡ Real-Time Activity Feed:** Audit log showing recent actions, updates, and project creations with timestamps.
- **🗂️ Workspace Navigation:**
  - **Projects:** Create, view, and organize team projects.
  - **Tasks:** Comprehensive task lists and board views.
  - **Team / Members:** Directory of admins, managers, and team members.
  - **Reports & Analytics:** Performance tracking and metrics.
  - **Settings:** Workspace configuration, role assignments, and profile customization.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **UI/UX Design:** Modern Responsive Layouts (Sidebar navigation, Clean cards, Status indicators)
- **Deployment:** Vercel

---

## 🌐 Live Demo

Explore the live application on Vercel:

👉 [**TaskFlow Application**](https://task-management-git-main-miski-projects.vercel.app/app.html)


