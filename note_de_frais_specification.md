# Note de Frais – Specification & Database Design

## 📌 Overview

The "Note de Frais" feature is part of the HR Management System. It allows **employees to submit expense reimbursement requests** for travel, meals, accommodation, and other costs.

This feature follows the **same two-step validation process** as implemented in previous modules like *demande d’attestation*, *demande de congé*, and *demande d’absence*.

---

## 🧭 Functional Flow

1. **Employee** submits a "note de frais" via a form with type, amount, and description.
2. **Manager** reviews the request:
   - If **approved**, the request is forwarded to the Responsable RH.
   - If **rejected**, the status becomes `"rejected"` and justification is required.
3. **Responsable RH** reviews requests that were approved by the manager:
   - If approved → status becomes `"approved"`
   - If rejected → status becomes `"rejected"` with justification.
4. The final status is reflected in the main `note_frais` table.

---

## 🗃️ Database Tables

### 🔹 `type_note_frais`
Stores the list of available expense types.

| Field      | Type         | Description                        |
|------------|--------------|------------------------------------|
| `id`       | INT (PK)     | Unique identifier                  |
| `intitule` | VARCHAR(100) | Expense type (e.g. transport, repas) |

---

### 🔹 `demande_note_frais`
Stores expense claims submitted by employees.

| Field         | Type                          | Description                                      |
|---------------|-------------------------------|--------------------------------------------------|
| `id`          | INT (PK)                      | Unique identifier                                |
| `date_frais`  | DATE                          | Date of the expense                              |
| `type_id`     | INT (FK to type_note_frais)   | Type of expense                                  |
| `description` | varchar(255)                  | Description or notes about the expense           |
| `montant`     | DECIMAL(10, 2)                | Requested reimbursement amount                   |
| `status`      | ENUM('pending','approved','rejected') | Overall status  default 'pending'        |
| `id_employe`  | INT (FK to employes)          | Who submitted the request                        |

---

### 🔹 `note_frais_validations`
Stores validation decisions for each note de frais request.

| Field             | Type                                 | Description                                       |
|------------------|--------------------------------------|---------------------------------------------------|
| `id`             | INT (PK)                             | Unique identifier                                 |
| `id_note_frais`  | INT (FK to note_frais)               | Link to the related note                          |
| `validator_role` | ENUM('manager','responsable_rh')     | Who validated the request                         |
| `is_approved`    | BOOLEAN                              | true = approved, false = rejected                 |
| `justification`  | varchar(255)                         | Required if rejected                              |
| `date_validation`| DATETIME                             | Date and time of the validation                   |

---

## ✅ Benefits

- Reuses the existing two-step validation model
- Cleanly separates logic between request data and approval data
- Easily extensible for future features like receipt attachments

---
