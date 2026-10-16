# UX/UI upgrade results

Implemented the UI upgrade and deadline-lifecycle follow-up from [the review plan](ux-ui-upgrade-plan.md) on 2026-10-16. See [deadline lifecycle](deadline-lifecycle.md) for the accepted state model and release procedure.

## Delivered

- Preserved the teal identity and added semantic control, feedback, disabled, and focus colors. Strengthened field and secondary-button boundaries; standardized 44px controls and hover, active, focus, disabled, and pending states. Final destructive confirmation uses filled red; routine archival uses a neutral action.
- Added shared buttons, form fields, feedback, and action forms. Failed submissions retain their inputs, validation errors identify fields, and error summaries receive focus. Direct mutations now report safe errors and pending states. Native dialogs explain consequential operations and support keyboard cancellation and focus return.
- Added current-section navigation, including case detail, a skip link, and a collapsible mobile menu with Escape support.
- Gave case lists the full content width, moved court filters beside search, and placed creation and archived-case workflows behind disclosures. Permanent deletion retains exact case-number confirmation and the existing retention restrictions.
- Grouped the agenda by date and added validated type/date filters. Badges distinguish tasks from legal deadlines and show textual urgency. Event labels expose their timezone and offset; date-only values retain their calendar day. The follow-up replaces the former 20-per-type limit with database filtering and 25-entry timeline pages, plus overdue, review, and resolved views.
- Added direct case links to the dashboard and agenda. Replaced the dashboard's MFA metric and technical access explanation with daily-work information.
- Put note, task, and document creation beside their related case sections. Added compact case metadata, section navigation, readable file types/sizes, and configured-timezone timestamps. Completed tasks do not carry overdue urgency text.
- Removed unavailable editing surfaces from read-only views. Grouped member administration actions and explained self-action restrictions. Access removal, deactivation, MFA reset, and role changes have confirmation steps.
- Added loading and error recovery inside the authenticated shell. Unexpected error details are no longer rendered in the root error page. Tables have labeled, keyboard-focusable scroll containers.

## Validation

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 83 tests passed, including timezone/date boundaries, file formatting, and valid/invalid agenda filters.
- `pnpm test:db`: 64 database checks passed.
- `pnpm test:e2e`: seven Chromium workflows passed against a fresh isolated synthetic firm and accounts. Coverage includes creation/upload/download, assignment/removal, archival, read-only restrictions, retained invalid input, delayed submission, dialog cancellation, active navigation, skip-link focus, mobile menu behavior, case-detail overflow at 320, 390, 768, and 1280px widths, manual deadline creation, completion/reopening, and automated axe A/AA scans. The automated scan found no violations on the tested screens, including large-text reflow.
- `pnpm build`: production build passed. The initial sandbox run could not bind a port during CSS processing; a fresh generated build cache and an approved run outside the sandbox resolved it.
- Reviewed desktop and mobile screenshots. Measured color pairs include control border/white at 3.66:1, disabled text/surface at 5.49:1, sidebar text/background at 14.72:1, and white/destructive action at 7.86:1. These checks do not constitute a complete WCAG conformance audit.

The browser setup fails clearly when local admin configuration is missing, accepts the older local service-role variable for provisioning, and refuses remote Supabase hosts. Each run creates an isolated synthetic firm and four synthetic accounts; it does not reset MFA on existing accounts or reuse their case records. Application credential configuration is unchanged.

## Review images

Screenshots use synthetic data only. They were captured in development mode; the Next.js development indicator is visible. The current captures use the isolated synthetic test firm.

- [Case list, desktop](ux-ui/cases-desktop.png)
- [Case detail, desktop](ux-ui/case-desktop.png)
- [Filtered agenda, mobile](ux-ui/agenda-mobile.png)
- [Overdue legal deadline](ux-ui/overdue-deadline.png)
- [Agenda with large text](ux-ui/agenda-large-text.png)

## Scope and follow-up

The follow-up adds an audited deadline lifecycle migration and column grants protecting status changes. Existing RLS and case-role boundaries remain enforced. The migration is applied locally; no hosted database has been changed. Resolved deadlines are excluded from alerts, and historical past deadlines require review rather than being assumed overdue. See [the lifecycle release notes](deadline-lifecycle.md).

Automated A/AA scans and large-text reflow checks now pass. Firm-user observation, native browser zoom/forced-color checks, and a manual screen-reader assessment remain human acceptance work; [the session checklist](ux-ui-acceptance-checklist.md) is ready. Dark mode, theme customization, animation, and a month/week calendar remain deferred as described in the plan.
