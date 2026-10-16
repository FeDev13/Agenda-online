# UX/UI acceptance session

Use local synthetic data. Do not put real client details into recordings, screenshots, or test notes. Automated accessibility checks and keyboard tests support this session; they do not replace a manual screen-reader assessment or observation with firm users.

## Manual screen-reader check

A tester should record operating system, browser, screen reader, and application revision. Suggested combinations are NVDA with Firefox or Chrome, or VoiceOver with Safari. No message has been sent to testers on the user's behalf.

1. Sign in, use the skip link, and verify that page headings, navigation, current section, and role are understandable.
2. Open the mobile menu and a form disclosure. Verify expanded/collapsed state and logical reading order.
3. Submit an invalid case or deadline form. Verify the focused error summary, field names/errors, and retained input. Correct it and verify the success announcement.
4. Open a deadline status confirmation. Verify its title and consequence, contained keyboard navigation, Escape/Cancel behavior, and focus return.
5. Complete and reopen a synthetic deadline. Verify the updated view/status and whether focus remains understandable when its card disappears. Record any focus improvements needed.
6. Navigate the overdue/review/resolved tabs and pagination. Confirm date, kind, status, and urgency can be understood without color.
7. Inspect a table at a narrow width. Verify the labeled scroll region can be reached and scrolled by keyboard.

Record pass/fail plus a short reproduction for each step. Do not claim full accessibility conformance from an automated scan.

## Firm-user observation

Recruit representative admins, lawyers, assistants, and read-only users through the firm's normal process. Run the same synthetic tasks on the baseline and updated versions if a baseline is available; otherwise record this version as the baseline for future comparisons.

| Task                                    | Expected result                              | Completion | Time | Errors / observations |
| --------------------------------------- | -------------------------------------------- | ---------- | ---- | --------------------- |
| Find a cause by client or number        | Correct cause opened                         |            |      |                       |
| Add a note and complete a task          | Both changes persist                         |            |      |                       |
| Enter a reviewed legal deadline         | Source/date confirmed                        |            |      |                       |
| Review a historical deadline            | Correct human-chosen status                  |            |      |                       |
| Complete and reopen an overdue deadline | Correct queue and audit history              |            |      |                       |
| Remove an assigned reader's access      | Confirmation understood; access removed      |            |      |                       |
| Use a read-only account                 | Reads work; unavailable mutations are absent |            |      |                       |

Observe without coaching first. Record misunderstandings about color, action labels, hiding versus resolution, and historical review. Prioritize wrong-case or wrong-status actions over cosmetic preferences.

## Reflow and visual checks

Automated browser checks cover 320/390/768/1280px widths, large text, keyboard focus, and WCAG A/AA rules through axe. A manual tester should additionally use native browser zoom at 200% and 400%, high contrast/forced colors, and the firm's actual device/browser combination. Confirm controls, dates, dialogs, and contained table scrolling remain usable.

Theme customization, dark mode, a month/week calendar, and animation remain optional product enhancements; they are not prerequisites for accepting this workflow.
