import { expect, test, type Page } from "@playwright/test";

const demoPassword = "Agenda-demo-1!";
const paralegalProfileId = "10000000-0000-4000-8000-000000000012";
const readerProfileId = "10000000-0000-4000-8000-000000000013";

test.describe.configure({ mode: "serial" });

test("creates case work, schedule entries, and document download links", async ({
  page
}) => {
  const runId = Date.now().toString(36);
  const caseNumber = `E2E-${runId}-001`;
  const caseTitle = `Causa sintetica E2E ${runId}`;
  const noteBody = `Nota sintetica E2E ${runId}`;
  const taskTitle = `Tarea sintetica E2E ${runId}`;
  const eventTitle = `Audiencia sintetica E2E ${runId}`;
  const documentName = `documento-sintetico-${runId}.pdf`;

  await signIn(page, "admin@example.test");
  await createCase(page, { caseNumber, caseTitle });
  await openCase(page, caseTitle);

  await page.locator("#note-body").fill(noteBody);
  await page.getByRole("button", { name: "Guardar nota" }).click();
  await expect(page.getByText("Nota guardada.")).toBeVisible();
  await expect(page.getByText(noteBody)).toBeVisible();

  await page.locator("#task-title").fill(taskTitle);
  await page.locator("#task-due-on").fill("2026-10-10");
  await page.getByRole("button", { name: "Guardar tarea" }).click();
  await expect(page.getByText("Tarea guardada.")).toBeVisible();
  await expect(page.getByText(taskTitle)).toBeVisible();

  await page.locator("#document-file").setInputFiles({
    buffer: Buffer.from("%PDF-1.4\n% synthetic browser fixture\n"),
    mimeType: "application/pdf",
    name: documentName
  });
  await page.locator("#document-name").fill(documentName);
  await page.getByRole("button", { name: "Subir documento" }).click();
  await expect(page.getByText("Documento subido.")).toBeVisible();
  await expect(page.getByText(documentName)).toBeVisible();

  const download = page.waitForRequest((request) =>
    request.url().includes("/documents/")
  );
  await page.getByRole("link", { name: "Descargar" }).click();
  await download;

  await page.goto("/app/calendar");
  const taskCalendarCard = page.locator("li.card").filter({ hasText: taskTitle });
  await expect(taskCalendarCard).toBeVisible();
  await expect(taskCalendarCard.getByText("vencimiento: 2026-10-10")).toBeVisible();

  await page
    .locator("#event-case")
    .selectOption({ label: `${caseNumber} - ${caseTitle}` });
  await page.locator("#event-title").fill(eventTitle);
  await page.locator("#startsAtLocal").fill("2026-10-12T10:00");
  await page.locator("#endsAtLocal").fill("2026-10-12T11:00");
  await page.locator("#location").fill("Sala de audiencias 1");
  await page.getByRole("button", { name: "Crear evento" }).click();
  await expect(page.getByText("Evento creado.")).toBeVisible();
  await expect(page.getByText(eventTitle)).toBeVisible();

  await page.goto("/app");
  const scheduleCard = page.locator("li.card").filter({ hasText: eventTitle });
  await expect(scheduleCard).toBeVisible();
  await scheduleCard.getByRole("button", { name: "Ocultar" }).click();
  await expect(page.locator("li.card").filter({ hasText: eventTitle })).toHaveCount(0);
});

test("assigns and removes restricted case access", async ({ page }) => {
  const runId = Date.now().toString(36);
  const caseNumber = `E2E-${runId}-002`;
  const caseTitle = `Acceso sintetico E2E ${runId}`;

  await signIn(page, "admin@example.test");
  await createCase(page, { caseNumber, caseTitle });
  await assignCaseAccess(page, {
    assignmentRole: "assigned_paralegal",
    caseNumber,
    caseTitle,
    profileId: paralegalProfileId
  });

  await signOut(page);
  await signIn(page, "paralegal@example.test");
  await page.goto("/app/cases");
  await expect(page.locator("li.card").filter({ hasText: caseTitle })).toBeVisible();

  await signOut(page);
  await signIn(page, "admin@example.test");
  await page.goto("/app/team");
  const assignmentRow = page
    .getByRole("row")
    .filter({ hasText: caseTitle })
    .filter({ hasText: "paralegal@example.test" });
  await assignmentRow.getByRole("button", { name: "Remover acceso" }).click();
  await expect(assignmentRow).toHaveCount(0);
  await expect(page.getByText("Acceso a causa removido").first()).toBeVisible();

  await signOut(page);
  await signIn(page, "paralegal@example.test");
  await page.goto("/app/cases");
  await expect(page.locator("li.card").filter({ hasText: caseTitle })).toHaveCount(0);
});

test("archives open cases with admin-only controls", async ({ page }) => {
  const runId = Date.now().toString(36);
  const adminCaseNumber = `E2E-${runId}-004`;
  const adminCaseTitle = `Archivo sintetico E2E ${runId}`;
  const lawyerCaseNumber = `E2E-${runId}-005`;
  const lawyerCaseTitle = `Sin archivo abogado E2E ${runId}`;

  await signIn(page, "admin@example.test");
  await createCase(page, {
    caseNumber: adminCaseNumber,
    caseTitle: adminCaseTitle
  });
  await archiveCase(page, adminCaseTitle);
  await expect(page.locator("li.card").filter({ hasText: adminCaseTitle })).toHaveCount(
    0
  );

  await signOut(page);
  await signIn(page, "lawyer@example.test");
  await createCase(page, {
    caseNumber: lawyerCaseNumber,
    caseTitle: lawyerCaseTitle
  });
  await expect(
    page.locator("li.card").filter({ hasText: lawyerCaseTitle })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Archivar causa" })).toHaveCount(0);
});

test("keeps read-only users out of case work mutations", async ({ page }) => {
  const runId = Date.now().toString(36);
  const caseNumber = `E2E-${runId}-003`;
  const caseTitle = `Lectura sintetica E2E ${runId}`;

  await signIn(page, "admin@example.test");
  await createCase(page, { caseNumber, caseTitle });
  await assignCaseAccess(page, {
    assignmentRole: "assigned_reader",
    caseNumber,
    caseTitle,
    profileId: readerProfileId
  });
  await signOut(page);

  await signIn(page, "reader@example.test");
  await page.goto("/app/cases");
  await page
    .locator("li.card")
    .filter({ hasText: caseTitle })
    .getByRole("link", { name: "Ver causa" })
    .click();
  await expect(
    page.getByText("Tu rol puede ver esta causa, pero no agregar trabajo.")
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar nota" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Guardar tarea" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Subir documento" })).toBeDisabled();
});

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contraseña").fill(demoPassword);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
}

async function assignCaseAccess(
  page: Page,
  {
    assignmentRole,
    caseNumber,
    caseTitle,
    profileId
  }: {
    assignmentRole: string;
    caseNumber: string;
    caseTitle: string;
    profileId: string;
  }
) {
  await page.goto("/app/team");
  await page
    .locator("#assignment-case")
    .selectOption({ label: `${caseNumber} - ${caseTitle}` });
  await page.getByLabel("Integrante del equipo").selectOption(profileId);
  await page.getByLabel("Rol de asignación").fill(assignmentRole);
  await page.getByRole("button", { name: "Asignar acceso a la causa" }).click();
  await expect(page.getByText("Acceso a la causa asignado.")).toBeVisible();
}

async function createCase(
  page: Page,
  { caseNumber, caseTitle }: { caseNumber: string; caseTitle: string }
) {
  await page.goto("/app/cases");
  await page.getByLabel("Número de causa").fill(caseNumber);
  await page.getByLabel("Fecha de apertura").fill("2026-10-01");
  await page.getByLabel("Título de la causa").fill(caseTitle);
  await page.getByLabel("Cliente").fill(`Cliente ${caseTitle}`);
  await page.getByLabel("Juzgado").fill("Juzgado Civil E2E");
  await page.getByLabel("Expediente").fill(`EXP-${caseNumber}`);
  await page.getByLabel("Jurisdicción").fill("Ciudad Autonoma de Buenos Aires");
  await page.getByLabel("Descripción interna").fill("Causa sintetica para E2E.");
  await page.getByRole("button", { name: "Crear causa" }).click();
  await expect(page.getByText("Causa creada.")).toBeVisible();
  await expect(page.locator("li.card").filter({ hasText: caseTitle })).toBeVisible();
}

async function openCase(page: Page, caseTitle: string) {
  await page.goto("/app/cases");
  const caseRow = page.locator("li.card").filter({ hasText: caseTitle });
  await caseRow.getByRole("link", { name: "Ver causa" }).click();
  await expect(page.getByRole("heading", { name: caseTitle })).toBeVisible();
}

async function archiveCase(page: Page, caseTitle: string) {
  await page.goto("/app/cases");
  const caseRow = page.locator("li.card").filter({ hasText: caseTitle });
  await caseRow.getByRole("button", { name: "Archivar causa" }).click();
}
