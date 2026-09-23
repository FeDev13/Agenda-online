import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("route smoke checks", () => {
  it("has a sign-in route without public self-registration copy", () => {
    const signInPage = readFileSync(
      join(process.cwd(), "src/app/(auth)/sign-in/page.tsx"),
      "utf8"
    );

    expect(signInPage.replace(/\s+/g, " ")).toContain(
      "El registro público está deshabilitado."
    );
  });

  it("has protected shell navigation for the vertical slice", () => {
    const layout = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/layout.tsx"),
      "utf8"
    );

    expect(layout).toContain("/app/cases");
    expect(layout).toContain("/app/calendar");
    expect(layout).toContain("/app/team");
    expect(layout).toContain("signOutAction");
  });

  it("exposes team lifecycle, assignment removal, and audit controls", () => {
    const teamPage = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/team/page.tsx"),
      "utf8"
    );
    const teamActions = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/team/actions.ts"),
      "utf8"
    );

    expect(teamPage).toContain("Integrantes del estudio");
    expect(teamPage).toContain("Remover acceso");
    expect(teamPage).toContain("Auditoría reciente");
    expect(teamActions).toContain("deactivateFirmMemberAction");
    expect(teamActions).toContain("removeCaseAssignmentAction");
    expect(teamActions).toContain("updateFirmMemberRoleAction");
  });

  it("audits document download preparation", () => {
    const caseDetail = readFileSync(
      join(process.cwd(), "src/lib/server/case-detail.ts"),
      "utf8"
    );

    expect(caseDetail).toContain("document.download_prepared");
  });

  it("links open cases to the case detail workflow", () => {
    const casesPage = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/cases/page.tsx"),
      "utf8"
    );

    expect(casesPage).toContain("/app/cases/${caseItem.id}");
    expect(casesPage).toContain("Ver causa");
    expect(casesPage).toContain("archiveCaseAction");
    expect(casesPage).toContain("Archivar causa");
  });

  it("exposes dashboard schedule hiding controls", () => {
    const dashboardPage = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/page.tsx"),
      "utf8"
    );
    const actions = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/actions.ts"),
      "utf8"
    );

    expect(dashboardPage).toContain("Próxima agenda");
    expect(dashboardPage).toContain("hideScheduleItemAction");
    expect(dashboardPage).toContain("Ocultar");
    expect(actions).toContain("hideScheduleItem");
  });

  it("exposes private document upload and signed download surfaces", () => {
    const forms = readFileSync(
      join(
        process.cwd(),
        "src/app/(authenticated)/app/cases/[caseId]/case-work-forms.tsx"
      ),
      "utf8"
    );
    const downloadRoute = readFileSync(
      join(
        process.cwd(),
        "src/app/(authenticated)/app/cases/[caseId]/documents/[documentId]/download/route.ts"
      ),
      "utf8"
    );

    expect(forms).toContain("Subir documento");
    expect(forms).toContain('type="file"');
    expect(forms).toContain("uploadDocumentAction");
    expect(downloadRoute).toContain("createSignedDocumentDownloadUrl");
    expect(downloadRoute).toContain("NextResponse.redirect");
  });

  it("exposes note archive and task status actions on the case detail route", () => {
    const casePage = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/cases/[caseId]/page.tsx"),
      "utf8"
    );

    expect(casePage).toContain("archiveNoteAction");
    expect(casePage).toContain("updateTaskStatusAction");
    expect(casePage).toContain("Archivar");
    expect(casePage).toContain("Completar");
  });
});
