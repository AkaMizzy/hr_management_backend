
# 📘 Task Assignment System Design (Simplified Version)

## Overview

This document explains the structure and flow of a feature in an HR Management System that allows managers to assign tasks to employees. The system is composed of three main tables: `tache`, `tache_employe`, and `action`.

---

## 🔹 1. `tache` – Task Table

The `tache` table represents a task as defined by a manager. It contains general information about the task, such as its title, description, time window, status, and the manager who created it.

- Each task can be assigned to **one or multiple employees**
- The `status` field reflects the **global progress**, controlled **only by the manager**
- Tasks start as `pending` by default

### Key Fields:
- `id` 
- `intitule`, `description`
- `ddr`, `dfr` (stored as DATETIME) (date debut de realisation, et date fin de realisation)
- `status` (pending, done, forwarded, cancel) pending as default
- `valide_manager` (boolean validation flag)
- `manager_id` (references the manager's `employe.id`)

---

## 🔹 2. `tache_employe` – Assignment Table

This table links individual employees to the tasks they are assigned to. Each entry represents **one employee assigned to one task**.

- Allows a task to be assigned to **many employees**

### Key Fields:
- `id`
- `tache_id`, `employe_id` (foreign keys)
- `assigned_at` timestamp DEFAULT CURRENT_TIMESTAMP

---

## 🔹 3. `action` – What the Employee Did

The `action` table allows employees to document what they did in relation to a specific task. This helps the manager assess task completion based on actual inputs.

- Linked to a `tache_employe` assignment
- Stores narrative and visual evidence of progress

### Key Fields:
- `intitule`, `description`, `details`
- `photo` (optional)
- `tache_employe_id` (foreign key)

---

## 🔁 Flow Summary

1. A **manager** logs in and creates a task (`tache`) — default status is `pending`.
2. the **manager** assigne The tasks to one or more employees via `tache_employe`.
3. Each employee sees their assigned tasks on their dashboard.
4. Employees perform actions and log them using the `action` table.
5. The **manager** reviews actions and manually updates the `tache.status`.

---

