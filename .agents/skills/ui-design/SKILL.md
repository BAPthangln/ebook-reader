---
name: ui-design
description: >-
  Expert UI/UX Design System and Aesthetic Engineering guidelines.
  Use when designing, building, or refactoring user interfaces to achieve world-class,
  modern, sleek, and intuitive UI (inspired by Apple Books, Vercel, Linear, and Notion).
---

# UI/UX Design System & Aesthetic Engineering Skill

This skill guides the design and implementation of modern, high-aesthetic web interfaces. It focuses on turning rough or utilitarian UIs into polished, delightful, and human-centered products.

---

## 1. Visual Hierarchy & Spatial Rhythm
- **Spacing**: Use an 8pt grid system (8px, 16px, 24px, 32px, 48px). Avoid random margins/padding.
- **Elevation & Layers**:
  - Layer 0: Deep background (`bg-slate-950` with subtle radial mesh gradient).
  - Layer 1: Content cards (`bg-slate-900/70` with `backdrop-blur-md` and `border border-slate-800/80`).
  - Layer 2: Floating modals, popovers, drawers (`bg-slate-900/95 shadow-2xl border border-slate-700/60`).
  - Layer 3: Tooltips, alerts, snackbars.

---

## 2. Color Palette & Lighting
- **Never Pure Black on White**: Use tinted slates (`#0f172a`, `#1e293b`) rather than harsh `#000000` for dark themes (except true OLED modes).
- **Ambient Lighting**: Use subtle top-edge highlights (`border-t border-white/10`) to simulate physical light falling on cards.
- **Accents**: 1 primary accent (e.g., Electric Blue `#3b82f6` or Indigo `#6366f1`) and 1 warm accent (Amber/Gold for stars, bookmarks, sepia).

---

## 3. E-Reader Specific UI Patterns (Apple Books & Kindle Inspired)
- **Book Cover Skeuomorphism**:
  - Book covers should have a subtle 3D spine shadow on the left edge (`box-shadow: inset 4px 0 6px -2px rgba(0,0,0,0.5)`).
  - Hover state: Gentle lift (`-translate-y-1.5`), realistic drop shadow (`shadow-2xl shadow-blue-900/20`), smooth 300ms cubic-bezier transition.
- **"Continue Reading" Hero Banner**:
  - A prominent spotlight card for the book currently in progress with blurred background cover art, progress ring, and a 1-click "Đọc tiếp" action.
- **Distraction-Free Zen Mode**:
  - Top and bottom toolbars should feel lightweight, floating, and auto-dimming so the text remains the hero.
- **Tactile Reader Themes**:
  - Sepia mode must feel like authentic book paper (`#fbf0d9` with warm espresso typography `#433422`).

---

## 4. Micro-Interactions & Polish
- **Buttons**: Rounded-xl or 2xl, subtle inner border (`border border-white/10`), active press effect (`active:scale-95`).
- **Badges**: Pill-shaped with subtle translucent background (`bg-blue-500/10 text-blue-400 border border-blue-500/20`).
- **Typography Pairing**:
  - UI Controls: Sharp Sans-serif (`Inter`, `system-ui`).
  - Reading Content: Premium Serif (`Merriweather`, `Lora`, `Literata`).
