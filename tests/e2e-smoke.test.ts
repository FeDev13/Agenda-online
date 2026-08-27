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
      "Public self-registration is intentionally unavailable"
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

  it("links open cases to the case detail workflow", () => {
    const casesPage = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/cases/page.tsx"),
      "utf8"
    );

    expect(casesPage).toContain("/app/cases/${caseItem.id}");
    expect(casesPage).toContain("View case");
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

    expect(forms).toContain("Upload document");
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
    expect(casePage).toContain("Archive");
    expect(casePage).toContain("Complete");
  });
});
