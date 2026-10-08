# DESIGN.md — Crew Scheduling Wizard

Design system and screen specification for Stitch AI. UI labels are in Indonesian. Descriptions are in English.

---

## 1. Product Overview

A web app for a broadcast production team. It manages the daily rundown, crew requests, crew assignments, and the generation of official assignment letters (Surat Perintah) as PDF.

This design covers the **guided wizards** that help users fill in data to create crew schedules. The goal is simple: a first-time user should finish each wizard without training and without making a mistake that the server will reject.

**Users**

- **Admin Program**: builds the rundown and requests crew for each program. Works in the morning, often in a hurry.
- **Admin Teknik**: receives requests, picks crew, resolves conflicts, and issues Surat Perintah. Needs to see availability and conflicts clearly.
- **Crew**: views the schedule they were given. Mostly on a phone.

**Platform**: responsive web app. Desktop first for admins, mobile first for crew.

**Language**: Bahasa Indonesia. Short, direct, polite.

---

## 2. Design Principles

1. **One decision per step.** Each wizard step asks for one kind of information.
2. **Show the consequence early.** Warn about overlaps and unavailable crew before the user submits.
3. **Never lose the user's work.** On an error, keep every field filled and point to the exact problem.
4. **Warnings inform, conflicts block.** Overlap with another division is a yellow warning. A crew conflict on save is a red error with details.
5. **Calm and clear.** Dense data, but quiet visuals. Color is reserved for status.

---

## 3. Color

| Role           | Name           | Hex       | Use                                   |
| -------------- | -------------- | --------- | ------------------------------------- |
| Primary        | Deep Blue      | `#1F4E8C` | Primary buttons, active step, links   |
| Primary hover  | Deep Blue Dark | `#173B6B` | Hover and pressed state               |
| Primary soft   | Blue Tint      | `#E8F0FA` | Selected rows, active step background |
| Background     | Canvas         | `#F6F8FB` | Page background                       |
| Surface        | White          | `#FFFFFF` | Cards, wizard panel, tables           |
| Border         | Slate 200      | `#D9DFE8` | Dividers, input borders               |
| Text primary   | Ink            | `#1B2433` | Headings, body                        |
| Text secondary | Slate 600      | `#5B667A` | Helper text, labels                   |
| Success        | Green          | `#1E8A5A` | Available, completed, 201 Created     |
| Success soft   | Green Tint     | `#E3F5EC` | Success badge background              |
| Warning        | Amber          | `#B7791F` | Overlap warning, pending              |
| Warning soft   | Amber Tint     | `#FFF4DB` | Warning banner background             |
| Danger         | Red            | `#C0392B` | Conflict, unavailable, 409 Conflict   |
| Danger soft    | Red Tint       | `#FDEAE7` | Error banner background               |
| Info           | Teal           | `#16808D` | Processing, in-progress PDF           |

Rules

- Never use color alone for status. Pair it with an icon and a text label.
- Text on soft backgrounds uses the matching strong color. Contrast must meet WCAG AA (4.5:1).

---

## 4. Typography

**Font family**: Inter, fallback system-ui, sans-serif.

| Style         | Size / Line height | Weight | Use                             |
| ------------- | ------------------ | ------ | ------------------------------- |
| Page title    | 28 / 36            | 700    | Wizard title                    |
| Step title    | 20 / 28            | 600    | Heading of the current step     |
| Section label | 14 / 20            | 600    | Group headings, table headers   |
| Body          | 14 / 22            | 400    | Default text                    |
| Helper        | 12 / 18            | 400    | Hints, timestamps, error detail |
| Button        | 14 / 20            | 600    | All buttons                     |

Numbers (times, counts) use tabular figures so columns align.

---

## 5. Layout and Spacing

- Base unit: 4px. Common steps: 8, 12, 16, 24, 32, 48.
- Desktop: 12-column grid, content max width 1120px, centered.
- Wizard container: 880px wide card, centered, 32px padding.
- Tablet: card goes full width with 24px page margin.
- Mobile: full width, 16px margin. Footer buttons stick to the bottom.
- Corner radius: 8px for inputs and buttons, 12px for cards, 999px for badges.
- Elevation: cards use a 1px border plus a very soft shadow (`0 1px 2px rgba(27,36,51,0.06)`). Modals use `0 8px 24px rgba(27,36,51,0.16)`.

---

## 6. Components

### 6.1 Stepper

- Horizontal on desktop, above the card. Compact "Langkah 2 dari 4" with a progress bar on mobile.
- Each step: numbered circle plus label.
- States: **completed** (green circle with check, clickable to go back), **active** (primary circle, bold label), **upcoming** (gray outline, not clickable).
- Steps with an unresolved error show a red dot.

### 6.2 Form fields

- Label above the input, helper text below.
- Height 40px. Focus ring 2px in Blue Tint with a Deep Blue border.
- Required fields marked with a red asterisk and the word "wajib" in helper text on first use.
- Inline error appears under the field in red with an icon. It never replaces the label.
- Date picker with a calendar popover. Time fields use 24-hour format (HH:mm).

### 6.3 Buttons

- **Primary** (Deep Blue, white text): Lanjut, Kirim, Simpan.
- **Secondary** (white, blue border): Kembali, Simpan Draf.
- **Danger** (red): Batalkan permintaan.
- **Disabled**: gray fill, no shadow. Always show a tooltip or helper line that says why it is disabled.
- Loading: spinner replaces the label, width stays fixed.

### 6.4 Status badge

Pill with icon and text.

- `Diajukan` amber, `Ditugaskan` green, `Bentrok` red, `Diproses` teal with spinner, `Selesai` green, `Draf` gray.

### 6.5 Candidate row (crew picker)

- Checkbox or radio, avatar initials, name, role, division.
- Right side: availability badge.
- **Tersedia**: green badge. Sorted first.
- **Tidak tersedia**: red badge plus a one-line reason ("Sudah ada tugas 08:00–10:00", "Cuti"). Row is dimmed but still selectable. Selecting it shows a warning and the server makes the final call.
- Search field and role filter above the list.

### 6.6 Alert banners

- **Warning** (amber): overlap with another division's activity at the same time. Shows the activity name, division, and time range. Dismissible.
- **Error** (red): save failed with conflict. Shows each conflicting assignment as a list item with crew name, date, time, and program. Includes a button "Pilih ulang crew".
- **Success** (green): assignment saved.
- Banners sit at the top of the wizard card, not as floating toasts, because users need to read them.

### 6.7 Summary card

Read-only block used in review steps. Key-value rows, an "Ubah" link on each section that jumps back to that step.

### 6.8 Empty, loading, and error states

- Loading lists use skeleton rows.
- Empty candidate list: "Belum ada crew untuk peran ini" with a suggestion to change date or role.
- Network error: inline message with a "Coba lagi" button. Form data is kept.

---

## 7. Wizard Pattern (shared)

Every wizard uses this frame:

1. Page title and short description.
2. Stepper.
3. Step card containing the step title, a one-line instruction, and the fields.
4. Sticky footer with **Kembali** on the left, **Simpan Draf** in the middle, and **Lanjut** on the right.
5. Validation runs per step. **Lanjut** stays disabled until required fields are valid.
6. Progress is saved as a draft so a refresh does not erase input.
7. Leaving with unsaved changes shows a confirm dialog.

---

## 8. Screen Specifications

### 8.1 Wizard A — Permintaan Crew (Admin Program)

**Step 1 — Tanggal & Blok**

- Fields: Tanggal siaran (date), Blok (select).
- Side panel shows existing rundown rows for the chosen date and block.

**Step 2 — Baris Program**

- Repeatable rows: Nama program, Jam mulai, Jam selesai, Catatan.
- Button "Tambah baris program".
- If a row overlaps another division's activity, show an inline amber warning under that row. The user can continue.

**Step 3 — Kebutuhan Peran**

- For each program row: add roles with a quantity stepper (for example Kameramen × 2).
- Action "Salin dari hari sebelumnya".

**Step 4 — Tinjau & Kirim**

- Summary card with "Ubah" links.
- Primary button "Kirim ke Teknik".
- Success state: "Permintaan terkirim ke Admin Teknik" with badge `Diajukan` and a button back to the rundown.

### 8.2 Wizard B — Penugasan Crew (Admin Teknik)

**Step 1 — Pilih Permintaan**

- List of requests with status `Diajukan`. Filter by date, block, role.
- Selecting one fills the date, block, and role for the next step.

**Step 2 — Pilih Kandidat**

- Candidate list as described in 6.5. Counter shows "2 dari 3 crew dipilih".
- Available crew first, unavailable crew below with reasons.

**Step 3 — Cek Bentrok**

- Summary of the assignments about to be saved.
- Neutral info note: "Ini hanya pratinjau. Pemeriksaan akhir dilakukan saat menyimpan."
- Any known warning from step 2 is listed again here.

**Step 4 — Simpan**

- Button "Simpan Penugasan" with loading state.
- On **409 Conflict**: red error banner listing the clashing assignments. Button "Pilih ulang crew" returns to step 2 with the problem crew marked. All selections remain.
- On **201 Created**: move to step 5.

**Step 5 — Selesai**

- Success message and the final assignment list.
- Primary button "Buat Surat Perintah". Secondary "Kembali ke daftar permintaan".
- Note: crew and Admin Program are notified automatically.

### 8.3 Surat Perintah status panel

Shown after the user taps "Buat Surat Perintah".

- States: `Diproses` (teal, spinner, "Surat sedang dibuat, biasanya beberapa detik") then `Selesai` (green).
- When done, show a primary button "Unduh PDF".
- If generation fails, show a red message with "Coba lagi".

### 8.4 First login (all roles)

A short two-step wizard: **Ganti password** then **Lengkapi profil**.

- Password field with show/hide toggle and a live strength hint.
- Shown only when the account is flagged as requiring a password change. The rest of the app stays locked until it is done.

---

## 9. Responsive Behavior

- **Desktop (≥1024px)**: horizontal stepper, two-column layout in steps with a side panel.
- **Tablet (640–1023px)**: side panel moves below the form.
- **Mobile (<640px)**: compact stepper, single column, sticky footer buttons, candidate rows become cards with the badge on top.
- Touch targets are at least 44×44px.

---

## 10. Accessibility

- Full keyboard navigation. Focus moves to the step title when the step changes.
- Stepper uses `aria-current="step"`.
- Error banners use `role="alert"`. Field errors are linked with `aria-describedby`.
- Status is always shown as icon plus text.
- Respect reduced-motion settings. Step transitions are a simple 150ms fade.

---

## 11. Content and Tone

- Short sentences. Active voice. No jargon in front of users.
- Buttons use verbs: "Kirim ke Teknik", "Simpan Penugasan", "Unduh PDF".
- Error messages say what happened and what to do next.
  - Good: "Budi sudah bertugas 08:00–10:00 di Berita Pagi. Pilih crew lain."
  - Avoid: "Terjadi kesalahan."

---

## 12. Do and Don't

**Do**

- Keep the stepper visible on every step.
- Keep all entered data after any error.
- Put the most likely choice first (available crew on top).
- Explain why a button is disabled.

**Don't**

- Don't block the user on overlap warnings from other divisions.
- Don't present step 3 of Wizard B as final. The server decides.
- Don't use red for anything except conflict, unavailability, and errors.
- Don't use more than one primary button per screen.

---

## 13. Prompt Hints for Stitch

When generating screens, start with one screen at a time and reuse this file as the design system.

1. "Wizard B, Step 2 — Pilih Kandidat, desktop. Include stepper, search and role filter, candidate list with available and unavailable states, sticky footer."
2. "Wizard B, Step 4 — Simpan, desktop, showing the 409 Conflict error banner with two clashing assignments."
3. "Wizard A, Step 2 — Baris Program, desktop, with one row showing an amber overlap warning."
4. "Surat Perintah status panel in both Diproses and Selesai states."
5. "Wizard B, Step 2 on mobile."
