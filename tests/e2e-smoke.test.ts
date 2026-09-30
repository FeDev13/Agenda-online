import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("route smoke checks", () => {
  it("has a sign-in route without public self-registration copy", () => {
    const signInPage = readFileSync(
      join(process.cwd(), "src/app/(auth)/sign-in/page.tsx"),
      "utf8"
    );
    const signInActions = readFileSync(
      join(process.cwd(), "src/app/(auth)/sign-in/actions.ts"),
      "utf8"
    );

    expect(signInPage.replace(/\s+/g, " ")).toContain(
      "El registro público está deshabilitado."
    );
    expect(signInActions).toContain("accept_pending_firm_invitations");
  });

  it("exposes generic password recovery routes", () => {
    const signInForm = readFileSync(
      join(process.cwd(), "src/app/(auth)/sign-in/sign-in-form.tsx"),
      "utf8"
    );
    const resetPage = readFileSync(
      join(process.cwd(), "src/app/(auth)/reset-password/page.tsx"),
      "utf8"
    );
    const resetActions = readFileSync(
      join(process.cwd(), "src/app/(auth)/reset-password/actions.ts"),
      "utf8"
    );
    const callbackRoute = readFileSync(
      join(process.cwd(), "src/app/(auth)/auth/callback/reset-password/route.ts"),
      "utf8"
    );
    const updatePage = readFileSync(
      join(process.cwd(), "src/app/(auth)/reset-password/update/page.tsx"),
      "utf8"
    );
    const updateActions = readFileSync(
      join(process.cwd(), "src/app/(auth)/reset-password/update/actions.ts"),
      "utf8"
    );

    expect(signInForm).toContain("/reset-password");
    expect(resetPage).toContain("ResetPasswordForm");
    expect(resetActions).toContain("resetPasswordForEmail");
    expect(resetActions).toContain("Si el email corresponde");
    expect(callbackRoute).toContain("exchangeCodeForSession");
    expect(updatePage).toContain("UpdatePasswordForm");
    expect(updateActions).toContain("updateUser");
    expect(updateActions).toContain("signOut");
  });

  it("has protected shell navigation for the vertical slice", () => {
    const layout = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/app/layout.tsx"),
      "utf8"
    );

    expect(layout).toContain("/app/cases");
    expect(layout).toContain("/app/calendar");
    expect(layout).toContain("/app/team");
    expect(layout).toContain("requireMfaVerified");
    expect(layout).toContain("signOutAction");
  });

  it("exposes MFA enrollment and verification gates", () => {
    const auth = readFileSync(join(process.cwd(), "src/lib/server/auth.ts"), "utf8");
    const routes = readFileSync(join(process.cwd(), "src/lib/routes.ts"), "utf8");
    const signInPage = readFileSync(
      join(process.cwd(), "src/app/(auth)/sign-in/page.tsx"),
      "utf8"
    );
    const enrollPage = readFileSync(
      join(process.cwd(), "src/app/(auth)/mfa/enroll/page.tsx"),
      "utf8"
    );
    const enrollActions = readFileSync(
      join(process.cwd(), "src/app/(auth)/mfa/enroll/actions.ts"),
      "utf8"
    );
    const verifyPage = readFileSync(
      join(process.cwd(), "src/app/(auth)/mfa/verify/page.tsx"),
      "utf8"
    );
    const verifyActions = readFileSync(
      join(process.cwd(), "src/app/(auth)/mfa/verify/actions.ts"),
      "utf8"
    );

    expect(auth).toContain("getAuthenticatorAssuranceLevel");
    expect(auth).toContain("listFactors");
    expect(auth).toContain("requireMfaVerified");
    expect(routes).toContain('path === "/app" || path.startsWith("/app/")');
    expect(signInPage).toContain("sanitizeProtectedNextPath");
    expect(enrollPage).toContain("MfaEnrollForm");
    expect(enrollActions).toContain('factorType: "totp"');
    expect(enrollActions).toContain("challengeAndVerify");
    expect(verifyPage).toContain("MfaVerifyForm");
    expect(verifyActions).toContain("challengeAndVerify");
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
    const teamServer = readFileSync(join(process.cwd(), "src/lib/server/team.ts"), "utf8");

    expect(teamPage).toContain("Integrantes del estudio");
    expect(teamPage).toContain("Invitar integrante");
    expect(teamPage).toContain("Remover acceso");
    expect(teamPage).toContain("Auditoría reciente");
    expect(teamActions).toContain("inviteFirmMemberAction");
    expect(teamServer).toContain("inviteUserByEmail");
    expect(teamServer).toContain("membership.invited");
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

  it("exposes the protected deadline email cron route", () => {
    const route = readFileSync(
      join(process.cwd(), "src/app/api/cron/deadline-alerts/route.ts"),
      "utf8"
    );
    const env = readFileSync(join(process.cwd(), "src/lib/env.ts"), "utf8");
    const exampleEnv = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(route).toContain("export async function POST");
    expect(route).toContain("DEADLINE_ALERT_CRON_SECRET");
    expect(route).toContain("runDeadlineAlertJob");
    expect(env).toContain("RESEND_API_KEY");
    expect(exampleEnv).toContain("RESEND_FROM_EMAIL");
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
