# UX/UI upgrade plan

Draft based on a source review on 2026-10-15. This proposes implementation work; it does not change the application.

## Direction and scope

Keep Agenda Legal's restrained teal identity. Make daily work easier to scan, actions easier to distinguish, and deadlines harder to misread. Prioritize cases, agenda, and case work over decorative changes.

Reviewed the global stylesheet, authenticated shell, dashboard, case list and detail, agenda, team access, authentication forms, shared schedule badge, deadline proximity rules, error boundary, and existing browser workflows. Findings below are source-based; authenticated browser inspection and user observation remain necessary before calling this a complete visual or usability audit.

## Findings

| Area               | Evidence in the repo                                                                                                                                                     | Proposed improvement                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Color foundation   | `src/app/globals.css` already defines brand, text, surface, and danger variables; several borders and status colors remain literal values.                               | Preserve the palette and introduce semantic tokens for controls, feedback, navigation, and interaction states.                         |
| Control visibility | Input border `#bfc8d4` on white is approximately 1.69:1; secondary button border `#8fa2ae` is 2.64:1.                                                                    | Strengthen boundaries where needed to identify controls, especially empty fields. Do not darken decorative card borders unnecessarily. |
| Buttons            | Primary and secondary classes exist, but secondary/danger hover states and explicit disabled styling are absent. Primary hover styling also applies to disabled buttons. | Define a complete shared state matrix and consistent sizing.                                                                           |
| Keyboard focus     | Navigation removes outlines and substitutes a subtle background. Other controls rely partly on browser defaults.                                                         | Add a consistent, clearly visible focus ring on every interactive element.                                                             |
| Navigation         | Main links in `app/layout.tsx` have no current-route styling or `aria-current`; court filters do have active styling.                                                    | Add persistent current-page indication and a skip-to-content link.                                                                     |
| Hierarchy          | Case creation and event creation occupy permanent columns beside lists; case work forms sit below all existing work.                                                     | Give lists more space and place contextual creation actions near their related sections.                                               |
| Feedback           | Many forms already use pending labels and live messages. Hide, archive, task status, and team actions use direct submissions without equivalent local feedback.          | Extend the existing feedback pattern consistently.                                                                                     |
| Deadline meaning   | `ScheduleBadge` shows kind/date, while proximity is represented through color. Overdue and near-term dates share the urgent category.                                    | Add explicit urgency wording; keep kind, due date, and urgency distinguishable.                                                        |
| Permissions        | Read-only users see disabled creation forms plus red permission messages.                                                                                                | Present a calm read-only explanation and omit unavailable editing surfaces. Keep all server authorization.                             |
| Mobile             | At 820px the entire sidebar becomes a top section; tables retain a 560px minimum width.                                                                                  | Reduce navigation height and adapt dense records and actions for narrow screens.                                                       |
| Dashboard          | MFA occupies a full metric; a panel explains server services and RLS. Recent case cards have no detail links.                                                            | Emphasize daily work, link cases directly, and replace implementation language with useful access guidance.                            |

## 1. Establish color and interaction foundations — P0

Use semantic CSS variables in `globals.css`, then consume them through small shared components in `src/components/`. Keep feature-specific behavior in its feature. No component library is required for this scope.

| Role                  | Starting palette                       | Rule                                                                              |
| --------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| Page / surface        | `#f6f7f9` / `#ffffff`                  | Preserve quiet backgrounds and clear grouping.                                    |
| Primary action        | `#145c72`, hover `#0d4050`, white text | Reserve filled teal for the main action in an active task area.                   |
| Main / secondary text | `#14202b` / `#5c6875`                  | Preserve readable text; avoid muted text for critical dates.                      |
| Control border        | Candidate `#7b8794`                    | Verify contrast against each actual surface; distinguish from decorative borders. |
| Neutral information   | Existing pale teal surface             | Use for record type and ordinary status.                                          |
| Success               | Existing green status family           | Use for confirmed completion or successful operations.                            |
| Warning / danger      | Existing amber / red families          | Pair with explicit wording; reserve red actions for consequential operations.     |
| Focus                 | Dedicated high-contrast ring token     | Validate on white surfaces, dark navigation, and filled buttons.                  |

The existing white-on-brand text is approximately 7.49:1; muted text on white is 5.69:1. Existing green, amber, and red badge text/background pairs are approximately 5.78:1, 6.07:1, and 6.37:1. These are promising source-level measurements, not a rendered accessibility certification.

Define default, hover, active, focus-visible, disabled, and pending states for buttons, links, inputs, selects, and textareas. Disabled controls must remain legible, stop showing hover affordances, and have explanatory text when the reason is not apparent. Pending actions retain their width and show a specific label such as “Guardando…”.

Adopt WCAG 2.2 AA as the validation target: 4.5:1 for normal text, 3:1 for large text and required non-text control indicators, visible unobscured keyboard focus, and no color-only meaning. Use 44px minimum control height as a project default; WCAG AA's target-size minimum is 24×24 CSS pixels with exceptions, not a universal 44px requirement. Review compact controls for both dimensions and spacing. See [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 2. Standardize buttons and feedback — P0

| Variant                   | Intended use                                           | Examples                                        |
| ------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Primary, filled teal      | Main commit or creation action within the current task | Crear causa, Guardar nota, Crear evento         |
| Secondary, outlined       | Supporting action                                      | Cancelar, Limpiar filtros, Editar               |
| Tertiary, quiet           | Low-emphasis utility                                   | Ocultar, secondary navigation                   |
| Destructive, outlined red | Entry into a consequential operation                   | Desactivar integrante, Eliminar definitivamente |
| Destructive, filled red   | Final confirmation of an irreversible operation        | Confirm permanent deletion                      |
| Text link                 | Navigation to another resource                         | Ver causa, Descargar                            |

Create shared `Button`, button-link styling, `FormField`, and `InlineNotice` primitives. Preserve native button/link semantics and explicit button types. Keep the public API small; use variants and sizes instead of accumulating class combinations. Standardize action ordering: commit followed by cancel in forms, with destructive actions separated from routine work.

Add pending protection and local success/error feedback to direct mutation forms. Preserve entered values on failure. Connect field errors through `aria-invalid` and `aria-describedby`; focus the first invalid field or an error summary. Keep live announcements concise.

Archive should use neutral styling and an explanation of its effect rather than the same emphasis as permanent deletion. For member deactivation, access removal, and MFA reset, show the affected person/case and consequence before submission. Use an accessible confirmation surface with managed focus and a clear cancel path. Preserve the existing exact-case-number confirmation for permanent deletion and the retention restrictions in `docs/case-retention.md`.

Clarify whether “Ocultar” affects the current user or a wider audience by inspecting its server behavior before rewriting the label. Only offer undo if an authorized server operation actually supports restoration.

## 3. Improve the shell and daily workflows — P1

- **Shell:** add active navigation with `aria-current="page"`, a skip link, consistent breadcrumbs, and a compact mobile menu. Case detail should retain the cases navigation state. Keep the imminent-deadline alert understandable to assistive technology.
- **Dashboard:** prioritize upcoming obligations and direct case links. Remove the technical RLS explanation from the daily workspace. Replace the MFA metric with a useful workload indicator only after verifying its query and meaning; keep security status in account context. Label counts with their scope and time range.
- **Cases:** use a full-width searchable list with a clear “Crear causa” entry point. Move court filters next to search and show active filter chips and a clear-all action. Use a dedicated creation route or an accessible inline disclosure; prefer a route for a longer form. Put archived cases in a separate view/disclosure and reveal permanent deletion only within that workflow.
- **Agenda:** retain a useful agenda list first. Group by date, show today/overdue states explicitly, add type and date-range filters, and link each entry to its cause. Place creation behind a clear action. A month/week calendar is optional later work, after validating demand; it should not delay the list improvements.
- **Case detail:** replace large “metric” typography for jurisdiction/date with a compact metadata summary. Put “Agregar nota”, “Crear tarea”, and “Subir documento” beside their sections. Introduce section navigation only if long cases justify it. Show document sizes in KB/MB and understandable file types instead of raw bytes/MIME values.
- **Access management:** use more width for member records and group uncommon actions in a labeled menu or details area. Explain self-action restrictions and inactive states. Show permission limitations as neutral information rather than validation failures.

For agenda labels, distinguish “Vencido”, “Vence hoy”, “Vence mañana”, and later dates while keeping the exact date visible. Reconcile these labels with `schedule-proximity.ts` and the existing “48 hours” warning, which currently uses date-only day offsets. Do not imply hour-level precision for date-only deadlines. Do not infer that a future deadline is safe simply because it is green; prefer neutral styling for ordinary future obligations.

## 4. Polish responsive layouts and recovery — P1/P2

Use a small spacing scale, consistent heading/body sizes, and reusable section/action layouts. Reduce nested card borders when spacing already communicates grouping. Keep the existing system font initially; a font change has lower value than clearer actions and information hierarchy.

Validate 320px, 390px, 768px, and 1280px widths plus 200% zoom and reflow. Keep page-level horizontal scrolling absent; give genuinely two-dimensional tables a contained scroll area or a labeled mobile record layout. Test long synthetic Spanish titles, email addresses, jurisdictions, and empty states.

Add route-level loading and error recovery where it improves continuity, preserving the shell. Replace raw `error.message` in `src/app/error.tsx` with safe user-facing copy and retry/navigation actions; retain safe diagnostics on the server. Empty states should distinguish no results, no data, and no access, and offer an authorized next action.

Keep Spanish wording consistent with the existing Argentine voice. Show dates in a consistent es-AR format, retain date-only semantics, and make event timezone context clear. Default to the firm's timezone rather than the browser's timezone.

## Delivery sequence and acceptance

1. **Baseline:** capture synthetic-data screens for all main routes, roles, and interaction states; record keyboard and mobile issues. Confirm the most frequent workflows with firm users.
2. **Foundation PR:** tokens, button/field/notice primitives, complete interaction states, and focus treatment. Pilot on sign-in and one case form before migrating all consumers.
3. **Feedback PR:** direct mutation pending states, field errors, confirmations, and safe recovery. Verify success and failure paths and that canceled confirmations do not mutate data.
4. **Workflow PRs:** shell and cases, then agenda/case detail, then access management. Keep each change independently reviewable with synthetic screenshots.
5. **Validation:** test finding a cause, adding a note, completing a task, creating an event, and changing access with representative roles. Compare completion, errors, and missed actions against baseline before adding further visual complexity.

Acceptance gates:

- Every interactive control has a visible focus state; all workflows work by keyboard, including any new menu, disclosure, or confirmation.
- Primary, secondary, destructive, disabled, and pending buttons are visibly distinguishable and consistent across routes.
- Required contrast checks pass for actual default and interactive states. Urgency and errors remain understandable without color.
- Browser tests cover successful submission, validation failure, delayed submission, and narrow-screen operation where behavior changed. Existing role denial and cross-firm protections continue to pass.
- No creation controls are misleadingly presented to read-only users. Server authorization, private downloads, audit behavior, and date semantics remain enforced.
- Run `pnpm lint`, `pnpm typecheck`, relevant `pnpm test` and `pnpm test:e2e`, and `pnpm build` for implementation PRs. Run database/RLS checks if authorization or queries change.

Read the installed Next.js guides in `node_modules/next/dist/docs/` before implementing route or component changes, as required by `AGENTS.md`.

Theme customization, dark mode, extensive animations, a new icon system, and a full calendar grid are deferred until the core workflows are validated.
