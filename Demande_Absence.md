# Demande d'Absence – Functional and Structural Documentation

## Overview

This document describes the structure and workflow of the **Demande d'Absence** feature within the HR Management System. It follows a validation flow where an employee submits a request for absence, which must be reviewed and approved by both a manager and a Responsable RH (HR manager).

---

## Functional Flow

### 1. Request Submission

- An **employee** submits a request for absence using a dedicated form.
- The system saves the request in the `demande_absence` table with a default status of `pending`.

### 2. Manager Review

- The **manager** reviews the request:
  - If **approved**, a validation entry is recorded with their decision.
  - If **rejected**, a justification is provided, and the request status is immediately set to `rejected`. It will **not** go further.

### 3. Responsable RH Review

- If approved by the manager:
  - The **Responsable RH** reviews the request.
  - If **approved**, the request status becomes `approved`.
  - If **rejected**, a justification is added, and the request status becomes `rejected`.

### 4. Final State

- The **employee** can view the status and any justifications via their dashboard.
- A request is considered final once it is **rejected** by any reviewer or **approved** by both.

---

## Table Structures

### Table: `demande_absence`

Stores each absence request submitted by employees.

| Field         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| id            | PK       | Unique identifier                                |
| date          | DATE     | Date of absence                                  |
| heure_debut   | TIME     | Start time                                       |
| heure_fin     | TIME     | End time                                         |
| motif         | TEXT     | Reason for absence                               |
| status        | ENUM     | `pending`, `approved`, or `rejected`             |
| id_employe    | FK       | Employee ID from the employees table             |

---

### Table: `absence_validations`

Records each validation action taken on an absence request.

| Field               | Type     | Description                                                  |
|--------------------|----------|--------------------------------------------------------------|
| id                 | PK       | Unique identifier                                            |
| id_demande_absence | FK       | References the absence request                               |
| validator_role     | ENUM     | Role of validator: `manager`, `responsable_rh`               |
| is_approved        | BOOLEAN  | `true` if approved, `false` if rejected                      |
| annulable          | BOOLEAN  | Indicates if the request can be canceled by the employee     |
| justifier          | TEXT     | Reason for rejection (optional; only present if rejected)    |

---

## Key Considerations

- **Status Control:** The `status` field in the main table is updated based on validator decisions.
- **Sequential Validation:** The RH can only validate after the manager approves.
- **Justification Visibility:** When a request is rejected, the justification is shown to the employee.
- **Annulable Flag:** Prevents employees from canceling requests that are under review or finalized.

---
