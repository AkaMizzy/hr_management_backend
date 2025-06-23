# 📄 Attestation Request – HR Management System

## 🎯 Objective

Establish a structured process allowing an employee to request an attestation. 
This request will go through two levels of validation: the direct manager and then the Responsable RH. 
The goal is to ensure a clear, trackable, and hierarchical request process.

---

## 🧠 General Concept

1. **Employee**: submits an attestation request.
2. **Manager**: validates or rejects the request.
   - If rejected, a justification is required and the request is returned to the employee.
3. **Responsable RH**: only sees and processes requests already approved by the manager.
   - Can validate or reject. Justification is required in case of rejection.
4. **Final Result**:
   - If both approve, a downloadable attestation will be made available later.
   - If one rejects, the process stops and the employee is informed.

---

## 🗃️ Database Table Structures

### `attestations`
Contains the main information about each request.

| Field          | Type         | Description                                            |
|----------------|--------------|--------------------------------------------------------|
| id             | PRIMARY KEY  | Unique ID of the request                               |
| code           | STRING       | Reference code (optional)                              |
| intitule       | STRING       | Title or subject of the attestation                    |
| description    | TEXT         | Additional details                                     |
| date_demande   | DATETIME     | Date of request submission DEFAULT CURRENT_TIMESTAMP   |
| employe_id     | FOREIGN KEY  | Refers to the requesting employee                      |
| statut         | ENUM         | `'approved'` or `'rejected'` default `'pending'`       |

> 🔎 Note: The `code` field is usually not required from the employee side. It could be used later.

---

### `attestation_validations`
Tracks each approval step of the attestation by role.

| Field             | Type         | Description                                                      |
|------------------|--------------|------------------------------------------------------------------|
| id               | PRIMARY KEY  | Unique validation entry ID                                       |
| attestation_id   | FOREIGN KEY  | Refers to the associated attestation                             |
| validator_role   | ENUM         | Role of the validator: `'manager'` or `'responsable_rh'`         |
| is_approved      | BOOLIEAN     | Refers to whether the validatior_role is approve it or not       |
| justification    | STRING       | Reason for rejection (required if is_approved is `'false'`)      |
| date_validation  | DATETIME     | Timestamp of when the validation occurred                        |

> ✅ Best Practice:  
> - At most, two rows exist per attestation (one for the manager, one for the Responsable RH).  
> - This model allows filtering with ease. Example: to show only the validated requests by managers:  
> `WHERE validator_role = 'manager' AND statut = 'approved'`.

---

## 🔄 User Flow

### 1. Submit Request (Employee)
- Employee fills out a form with `intitule`, `description`.
- A new row is created in `attestations`.

### 2. Manager Validation
- Manager sees all requests from employees under their supervision.
- Can approve or reject the request.
  - If rejected, a justification must be provided.
  - the status in `attestations` switched to `refused`
- A row is inserted into `attestation_validations`.

### 3. Responsable RH Validation
- Sees only the requests approved by managers.
- Can approve or reject with justification if rejected.
- Another row is added to `attestation_validations`.
- if both `manager` and `responsable RH` approve it, the `status` in `attestations` switched to `approved`

### 4. Result for the Employee
- Employee is can see his attestation if only both `status` is `approved`.
- If fully approved, a download link will eventually be made available.
- If rejected (at any level), the employee sees the justification.

---

## 📌 Key Points

- The dual-table model (`attestations` + `attestation_validations`) allows clear traceability and scalability.
- Each actor has a dedicated interface:
  - **Employee**: Submit, view status, and read justifications.
  - **Manager**: View and process requests from their team.
  - **HR Manager**: View and process only approved requests from managers.
- `justification` is **mandatory** in case of rejection and visible to the employee.

---

