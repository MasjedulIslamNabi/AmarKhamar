# Automated WhatsApp & SMS Staff Dispatch & Farm Task Communication Center

Empower farm managers and dairy supervisors to generate, customize, and dispatch operational daily instructions, feeding schedules, vaccine alerts, weigh-in tasks, and payroll notifications to farm personnel via WhatsApp and SMS in one click.

---

### User Review & Critical Decisions

> [!NOTE]
> Based on your selection, we are designing the **Automated WhatsApp & SMS Staff Dispatch & Farm Communication Hub**. This bridges the gap between digital farm records and real-world farm laborers who work in the barn and rely on mobile messages for daily tasks.

- **Communication Channels**: Direct WhatsApp Web / App deep-linking (`https://wa.me/?text=...`) and native SMS URI triggers (`sms:?body=...`) alongside instant one-tap clipboard copying.
- **Bilingual Message Engine**: Native formatting in both **Bangla (বাংলা)** and **English** with WhatsApp-compliant typography (bolding `*`, clean lists `-`, and emoji-free legible structures).
- **Automated Data Binding**: Automatically pulls real farm data (active cattle tags due for vaccines, exact daily feed ration quantities, employee salaries, and weigh-in dates) directly into the message templates.

---

## 1. Feature Architecture & Core Templates

### A. Dispatch Template Catalog
1. **Morning Feeding & Nutrition Ration (`প্রভাতী খাদ্য বণ্টন বার্তা`)**:
   - Calculates daily herd feed distribution based on active heads:
     - Concentrates quantity (kg) for bulls and milking cows.
     - Green Napier grass distribution per shed.
     - Dry rice straw roughage ration and mineral supplement block status.
2. **Preventive Vaccine & Health Alert (`টিকা ও চিকিৎসা সতর্কবার্তা`)**:
   - Automatically populates cattle tag numbers due for vaccination within the next 15–30 days.
   - Lists target diseases (FMD, Anthrax, BQ, HS) and booster schedules.
3. **Monthly Weigh-in & Scale Logging Callout (`ওজন পরিমাপ শিডিউল`)**:
   - Assigns staff to lead cattle to the weighing scale and record updated weights.
4. **Salary & Wage Disbursement Confirmation (`বেতন পরিশোধ রশিদ বার্তা`)**:
   - Pre-fills employee name, role, payment month, and disbursed amount in BDT for transparent record-keeping.
5. **Emergency Barn Alert / Quarantine Handover (`জরুরি পর্যবেক্ষণ বার্তা`)**:
   - Rapid dispatch for isolated animals showing signs of fever, bloat, or off-feed conditions.

### B. Staff Recipient Selector & Directory
- Integration with the existing `employees` state (`data.employees`).
- Select recipient (Farm Supervisor, Senior Herdsman, Cleaning Worker) to automatically populate their mobile number.

### C. Live Smartphone Dispatch Preview
- Real-time preview panel rendering the message in a high-fidelity mobile message bubble.
- Character count & word count tracker for SMS segment limits.

---

## 2. Visual Design & User Interface

Adhering strictly to `frontend-design` standards and the established **Pure White & Emerald Agro-Tech theme**:
- **Canvas & Cards**: Pure `#FFFFFF` surfaces with subtle `border-emerald-100` and `border-slate-200`.
- **Zero-Pill Discipline**: Metadata rendered with clean unboxed text and dot separators (`·`).
- **Interactive Action Buttons**:
  - `Send via WhatsApp` (`bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold`).
  - `Send via SMS` (`bg-slate-900 hover:bg-slate-800 text-white font-bold`).
  - `Copy Message Text` (`bg-emerald-50 text-emerald-800 border border-emerald-300`).

---

## 3. Implementation Steps

1. **New Component: `src/components/StaffDispatchModal.tsx`**:
   - Modal dialog accessible from the top navigation / Dashboard / Employees tab.
   - Template selection tabs (Feed, Healthcare, Weigh-in, Payroll, Emergency).
   - Language toggle (English / বাংলা).
   - Recipient selector linked to farm employee list.
   - Editable message textarea with dynamic placeholder tags.
   - One-click trigger buttons (`WhatsApp`, `SMS`, `Copy`).
2. **Context & Quick Trigger Integration**:
   - Add "Staff Dispatch" quick trigger button in the main header and `Employees.tsx` management screen.
   - Add direct "Send Salary Receipt via WhatsApp" button on each employee payment card.
3. **Verification**:
   - Verify URI encoding for special characters, line breaks (`%0A`), and Bengali Unicode strings.
   - Validate clean compilation via `lint_applet` and `compile_applet`.
