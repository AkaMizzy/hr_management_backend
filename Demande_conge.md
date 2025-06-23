# Demande de Congé – Functional and Structural Documentation

## Overview

This document describes the structure and workflow of the **Demande de Congé** feature within the HR Management System. It handles the process where an employee applies for leave (congé), and the request is reviewed by both the employee's manager and the Responsable RH (HR Manager).

---

## Functional Flow

### 1. Request Submission

- The **employee** fills out a form to request a leave (congé).
- The system records the request in the `demande_conge` table with an initial status of `pending`.

### 2. Manager Review

- The **manager** reviews the submitted leave request:
  - If **approved**, a validation entry is recorded for the manager with the possibilty to determen if the employee can cancel it or not (annulation 1 or 0)
  - If **rejected**, a justification is provided, the status is set to `rejected`, and the RH will not see the request.

### 3. Responsable RH Review

- If the manager has approved the request:
  - The **Responsable RH** reviews it.
  - If **approved**, the request status is updated to `approved`.
  - If **rejected**, a justification is added, and the status is updated to `rejected`.

### 4. Final State

- The **employee** can track the status and read any justification through their dashboard.
- The flow is complete when the request is either rejected at any step or approved by both reviewers.

---

## Table Structures

### Table: `demande_conge`

Stores leave (congé) requests submitted by employees.

| Field         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| id            | PK       | Unique identifier                                |
| date_debut    | DATE     | Start date of the leave                          |
| date_fin      | DATE     | End date of the leave                            |
| nombre_jours  | INT      | Total number of leave days                       |
| status        | STRING   | `pending`, `approved`, or `rejected`             |
| id_employe    | FK       | Employee ID from the employees table             |

---

### Table: `conge_validations`

Records validation decisions made for each leave request.

| Field             | Type     | Description                                                  |
|------------------|----------|--------------------------------------------------------------|
| id               | PK       | Unique identifier                                            |
| id_demande_conge | FK       | References the leave request                                 |
| validator_role   | ENUM     | Role of validator: `manager`, `responsable_rh`               |
| is_approved      | BOOLEAN  | `true` if approved, `false` if rejected                      |
| annulable        | BOOLEAN  | Indicates if the employee can cancel the request             |
| justifier        | TEXT     | Optional explanation in case of rejection                    |

---

## Key Considerations

- **Status Tracking:** The `status` field in the `demande_conge` table is updated according to the validation flow.
- **Validation Order:** The RH only sees and acts on the request if the manager approves it.
- **Transparency:** If rejected, the justification becomes visible to the employee.
- **Cancellation Control:** The `annulable` field allows managers to prevent cancelation if the process has started or is sensitive.

---

## Conclusion

The _Demande de Congé_ module follows the same validation logic as the _Demande d’Absence_, ensuring a consistent and reliable process across different types of employee requests. The modular approach and table separation ensure maintainability and extensibility as the system grows.
