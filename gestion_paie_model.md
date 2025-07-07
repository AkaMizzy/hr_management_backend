# 📊 Payroll Management Module (Gestion de Paie)

## 🧭 Concept and Objective

This module manages the **salary payments of employees**.  
It ensures that each payroll cycle is calculated accurately based on:

- A structured set of **payroll components (rubriques)** such as base salary, bonuses, indemnities, deductions.
- **Specific calculation forms (f1–f5)** defined for each rubrique, which determine how the amount is calculated.
- Customizations that apply per employee.
- A detailed line-by-line payslip that records every calculation.

This guarantees precise, transparent, and auditable payroll for all employees.

---

## 🗃️ The 4 Core Tables and Their Roles

### 1️⃣ `rubrique_paie`

This table defines the **global list of payroll components** (rubriques) applicable across the company.

It includes:

- A `code` and `intitule` to identify the rubrique.
- Up to **five formula fields (f1–f5)** which determine how each part of the payroll is calculated.
- Settings to control visibility on the payslip, the display order, and whether this rubrique is **mandatory** (obligatoire).

This table acts as the **blueprint or template** for all salary components.

```sql
CREATE TABLE rubrique_paie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) ,
    intitule VARCHAR(100),
    f1 VARCHAR(255),
    f2 VARCHAR(255),
    f3 VARCHAR(255),
    f4 VARCHAR(255),
    f5 VARCHAR(255),
    visible TINYINT(1) ,
    `order` INT,
    obligatoire TINYINT(1)
);
```

---

### 2️⃣ `employe_rubrique`

This table links specific rubriques to each employee and period.

It works by:

- Storing the `id_employe` and the associated `id_rubrique`.
- Keeping a **snapshot of the f1–f5 calculation forms**, copied from `rubrique_paie` when the line is inserted.
- Recording `date_debut` and `date_fin` to indicate the validity of this configuration for the employee.

This ensures that even if the global rubrique formulas change later, the employee’s payroll history remains intact and fully auditable.

```sql
CREATE TABLE employe_rubrique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_employe INT,
    id_rubrique INT ,
    date_debut DATE ,
    date_fin DATE ,
    f1 VARCHAR(255),
    f2 VARCHAR(255),
    f3 VARCHAR(255),
    f4 VARCHAR(255),
    f5 VARCHAR(255),
    FOREIGN KEY (id_rubrique) REFERENCES rubrique_paie(id),
    FOREIGN KEY (id_employe) REFERENCES employes(id)
);
```
---

### 3️⃣ `paie`

This table stores the **header of each payroll run**, i.e., one record per employee per pay period.

It contains:

- The employee’s ID and the payroll period (`date_debut`, `date_fin`).
- Summary amounts like `salaire_base`, `impot`, and `salaire_net`.

This acts as the main payslip record tying together the overall salary calculation for the period.

```sql
CREATE TABLE paie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_employe INT ,
    date_debut DATE ,
    date_fin DATE ,
    salaire_base DECIMAL(12,2) ,
    impot DECIMAL(12,2) ,
    salaire_net DECIMAL(12,2) ,
    FOREIGN KEY (id_employe) REFERENCES employes(id)
);
```
---

### 4️⃣ `paie_detail`

This table provides the **line-by-line breakdown** for each payslip.

For every `paie` record, it links to multiple `employe_rubrique` entries and records the final calculated `montant` for each rubrique.

This offers a transparent view of how each payslip is constructed from individual components.

```sql
CREATE TABLE paie_detail (	
    id INT AUTO_INCREMENT PRIMARY KEY,
    paie_id INT ,
    employe_rubrique_id INT ,
    montant DECIMAL(12,2) ,
    FOREIGN KEY (paie_id) REFERENCES paie(id),
    FOREIGN KEY (employe_rubrique_id) REFERENCES employe_rubrique(id)
);
```
---

## 🔄 The Trigger Mechanism

To ensure the process is seamless and minimizes human error, a database **trigger** is set up on the `employe_rubrique` table.

This trigger automatically:

- Fetches the `f1–f5` formulas from `rubrique_paie` **if the rubrique is marked as obligatoire**.
- Inserts them into the new `employe_rubrique` record being created.

This means that whenever an HR user assigns a mandatory rubrique to an employee, the calculation parameters are automatically copied and locked in for that employee and period.

```sql
BEFORE INSERT ON employe_rubrique
FOR EACH ROW
BEGIN
    DECLARE v_f1 VARCHAR(255);
    DECLARE v_f2 VARCHAR(255);
    DECLARE v_f3 VARCHAR(255);
    DECLARE v_f4 VARCHAR(255);
    DECLARE v_f5 VARCHAR(255);


    SELECT f1, f2, f3, f4, f5
    INTO v_f1, v_f2, v_f3, v_f4, v_f5
    FROM rubrique_paie
    WHERE id = NEW.id_rubrique AND obligatoire = 1;

    SET NEW.f1 = v_f1;
    SET NEW.f2 = v_f2;
    SET NEW.f3 = v_f3;
    SET NEW.f4 = v_f4;
    SET NEW.f5 = v_f5;
END
```

---

## 🚀 The Overall Flow of the Payroll Process

1. **Define global rubriques:**  
   The responsable rh creates and manages rubriques in `rubrique_paie`, setting the formulas (f1–f5), visibility, order, and marking which are obligatory.

2. **Assign rubriques to employees:**  
   When an employee is onboarded or updated, obligatory rubriques are automatically linked via the trigger, copying the relevant f1–f5 formulas into `employe_rubrique`. Optional rubriques can be added manually.

3. **Process payroll for a period:**  
   - A `paie` record is created for each employee for that period, inserting the base salary and other top-level figures.

4. **Payslip generation:**  
   - The `paie_detail` table holds each line that contributes to the employee’s final salary.
   - This ensures the payslip clearly shows how the `salaire_net` was derived, enhancing trust and auditability.

---
