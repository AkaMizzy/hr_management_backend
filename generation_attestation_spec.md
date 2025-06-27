# 📄 Feature Specification: PDF Generation for Demande d'Attestation

## 🧭 Objective

The goal of this feature is to allow the **Responsable RH** to generate an official **PDF attestation** after a demande d'attestation has been **approved by both the manager and RH**.

This ensures that employees can receive a formal document for use in external or internal procedures.

---

## 🚦 Flow of the Feature

1. An **employee submits** a demande d’attestation.
2. The **manager reviews** the request:
   - If approved → it proceeds to the RH.
   - If refused → status changes to "refused" with justification.
3. The **responsable RH reviews** the request:
   - If approved → the demand status becomes "approved".
   - If refused → status changes to "refused" with justification.
4. Once the **RH approves**, a **“Generate PDF”** button becomes available on their dashboard.
5. When clicked:
   - The backend **fetches the necessary data** (employee info, type, dates).
   - It **generates a formatted PDF**.
   - The PDF is **stored in /uploads/attestation**.
   - A new entry is created in the `attestation_documents` table, linking the document to the attestation.
6. The employee can then **see and download** the generated PDF from their dashboard.

---

## 🗃️ Tables Involved

- `demande_attestation`: Contains the attestation request data ( id , code, description, date_demande, employe_id , status, type_id .).
- `attestation_validation`: Stores manager and RH validation steps (id , attestation_id , validator_role , is_approved, justification, date_validation)
- `attestation_documents`: Stores metadata about the generated PDF (file path, attestation_id, created_at).

| Field         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| id            | PK       | Unique identifier                                |
| id_attestation| int      | Refers to the associated attestation             |
| file_path     | String   | file location                                    |
| created_at    | datetime | Date of generated DEFAULT CURRENT_TIMESTAMP      |


---

## 🧰 Tools and Technologies

- **PDF Generation Library**: `pdfkit` is recommended for generating the PDF from backend logic.
- **Storage**: PDFs will be saved on the server (e.g., `/uploads/attestations/` directory).
- **Backend Role**:
  - Responsible for fetching data.
  - Generating and saving the PDF.
  - Storing document records in the database.
- **Frontend Role**:
  - Displays the "Generate PDF" button when appropriate.
  - Sends a request to trigger PDF generation.
  - Displays a "Download" link once the PDF is available.

---

