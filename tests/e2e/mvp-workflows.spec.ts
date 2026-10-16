import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { formatDateOnly } from "../../src/lib/presentation";
import {
  getDateOnlyInTimeZone,
  addDaysToDateOnly
} from "../../src/lib/schedule-proximity";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const demoPassword = "Agenda-demo-1!";
let paralegalProfileId = "";
let readerProfileId = "";
const fixtureEmails = new Map<string, string>();
const mfaSecrets = new Map<string, string>();

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await provisionSyntheticFirm();
});

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
  const today = getDateOnlyInTimeZone(new Date(), "America/Argentina/Buenos_Aires");
  const dueOn = addDaysToDateOnly(today, 7);
  const eventOn = addDaysToDateOnly(today, 1);

  await signIn(page, "admin@example.test");
  await createCase(page, { caseNumber, caseTitle });
  await openCase(page, caseTitle);

  await page.getByText("Agregar nota", { exact: true }).first().click();
  await page.locator("#note-body").fill(noteBody);
  await page.getByRole("button", { name: "Guardar nota" }).click();
  await expect(page.getByText("Nota guardada.")).toBeVisible();
  await expect(page.getByText(noteBody)).toBeVisible();

  await page.getByText("Agregar tarea", { exact: true }).first().click();
  await page.locator("#task-title").fill(taskTitle);
  await page.locator("#task-due-on").fill(dueOn);
  await page.getByRole("button", { name: "Guardar tarea" }).click();
  await expect(page.getByText("Tarea guardada.")).toBeVisible();
  await expect(page.getByText(taskTitle)).toBeVisible();

  await page.locator("summary").filter({ hasText: "Subir documento" }).click();
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
  await expect(
    taskCalendarCard.getByText(`tarea: ${formatDateOnly(dueOn)}`, { exact: false })
  ).toBeVisible();

  await page.locator("summary").filter({ hasText: "Crear evento" }).click();
  await page
    .locator("#event-case")
    .selectOption({ label: `${caseNumber} - ${caseTitle}` });
  await page.locator("#event-title").fill(eventTitle);
  await page.locator("#startsAtLocal").fill(`${eventOn}T10:00`);
  await page.locator("#endsAtLocal").fill(`${eventOn}T11:00`);
  await page.locator("#location").fill("Sala de audiencias 1");
  await page.getByRole("button", { name: "Crear evento" }).click();
  await expect(page.getByText("Evento creado.")).toBeVisible();
  await expect(page.getByText(eventTitle)).toBeVisible();

  await page.goto("/app");
  const scheduleCard = page.locator("li.card").filter({ hasText: eventTitle });
  await expect(scheduleCard).toBeVisible();
  await scheduleCard.getByRole("button", { name: "Ocultar" }).click();
  await expect(page.getByRole("dialog")).toContainText("todo el estudio");
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();
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
    .filter({
      hasText: fixtureEmails.get("paralegal@example.test") ?? "missing synthetic user"
    });
  await assignmentRow.getByRole("button", { name: "Remover acceso" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
  await expect(assignmentRow).toBeVisible();
  await assignmentRow.getByRole("button", { name: "Remover acceso" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();
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
  await expect(
    page
      .locator('section[aria-labelledby="open-cases-title"] li.card')
      .filter({ hasText: adminCaseTitle })
  ).toHaveCount(0);

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
  await expect(page.getByRole("button", { name: "Guardar nota" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guardar tarea" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Subir documento" })).toHaveCount(0);
});

test("keeps failed form input, prevents repeated submission, and supports mobile keyboard navigation", async ({
  page
}, testInfo) => {
  const runId = Date.now().toString(36);
  const caseNumber = `UX-${runId}`;
  const caseTitle = `Causa sintética de revisión visual ${runId}`;
  await signIn(page, "admin@example.test");
  await page.goto("/app/cases");
  await expect(
    page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: "Causas abiertas" })
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".sidebar")).toHaveCSS("background-color", "rgb(16, 40, 50)");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page
    .locator("summary")
    .filter({ hasText: /^Crear causa$/ })
    .click();
  await page.getByLabel("Número de causa").fill(caseNumber);
  await page.getByLabel("Fecha de apertura").fill("2026-10-01");
  await page.getByLabel("Título de la causa").fill(" ");
  await expect(page.getByLabel("Título de la causa")).toHaveCSS("outline-width", "3px");
  await page.getByLabel("Cliente", { exact: true }).fill("Cliente sintético UX");
  await page.getByRole("button", { name: "Crear causa", exact: true }).click();
  await expect(page.getByText("Revisá los campos indicados.")).toBeFocused();
  await expect(page.getByLabel("Título de la causa")).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  await expect(page.getByLabel("Número de causa")).toHaveValue(caseNumber);
  await expect(page.getByLabel("Cliente", { exact: true })).toHaveValue(
    "Cliente sintético UX"
  );
  await page.getByLabel("Título de la causa").fill(caseTitle);

  let release: (() => void) | undefined;
  await page.route("**/app/cases", async (route) => {
    if (route.request().method() === "POST")
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    await route.continue();
  });
  await page.getByRole("button", { name: "Crear causa", exact: true }).click();
  try {
    await expect(
      page.getByRole("button", { name: "Creando...", exact: true })
    ).toBeDisabled();
  } finally {
    release?.();
  }
  await expect(page.getByText("Causa creada.")).toBeVisible();
  await page.unroute("**/app/cases");
  await page.goto(`/app/cases?q=${encodeURIComponent(caseNumber)}`);
  const row = page.locator("li.card").filter({ hasText: caseTitle });
  await expect(row).toBeVisible();
  await page.screenshot({
    caret: "initial",
    path: testInfo.outputPath("cases-desktop.png"),
    fullPage: true
  });
  await row.getByRole("button", { name: "Archivar causa" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(row.getByRole("button", { name: "Archivar causa" })).toBeFocused();
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: "Ver causa" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: "Causas abiertas" })
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: caseTitle })).toBeVisible();
  await page.screenshot({
    caret: "initial",
    path: testInfo.outputPath("case-desktop.png"),
    fullPage: true
  });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: /Menú/ });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Agenda" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Agenda y vencimientos" })
  ).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Tipo", { exact: true }).selectOption("task");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page).toHaveURL(/kind=task/);
  await expect(page.getByLabel("Tipo", { exact: true })).toHaveValue("task");
  await page.screenshot({
    caret: "initial",
    path: testInfo.outputPath("agenda-mobile.png"),
    fullPage: true
  });
});

test("resolves and reopens an overdue legal deadline with read-only protection", async ({
  page
}, testInfo) => {
  const runId = Date.now().toString(36);
  const caseNumber = `DEADLINE-${runId}`;
  const caseTitle = `Causa sintética de vencimiento ${runId}`;
  const title = `Presentación sintética ${runId}`;
  const dueOn = addDaysToDateOnly(
    getDateOnlyInTimeZone(new Date(), "America/Argentina/Buenos_Aires"),
    -1
  );
  await signIn(page, "admin@example.test");
  await createCase(page, { caseNumber, caseTitle });
  await assignCaseAccess(page, {
    assignmentRole: "assigned_reader",
    caseNumber,
    caseTitle,
    profileId: readerProfileId
  });
  await page.goto("/app/calendar");
  await page.locator("summary").filter({ hasText: "Crear vencimiento legal" }).click();
  await page
    .locator("#deadline-case")
    .selectOption({ label: `${caseNumber} - ${caseTitle}` });
  await page.getByLabel("Título del vencimiento").fill(title);
  await page.getByLabel("Fecha del vencimiento").fill(dueOn);
  await page
    .getByLabel("Fuente de la fecha")
    .fill("Orden judicial sintética revisada manualmente");
  await page.getByRole("button", { name: "Crear vencimiento", exact: true }).click();
  await expect(
    page.getByLabel("Confirmo que revisé la fecha y su fuente.")
  ).not.toBeChecked();
  expect(
    await page
      .locator("#deadline-confirmed")
      .evaluate((element) => (element as HTMLInputElement).validity.valueMissing)
  ).toBe(true);
  await page.getByLabel("Confirmo que revisé la fecha y su fuente.").check();
  await page.getByRole("button", { name: "Crear vencimiento", exact: true }).click();
  await expect(page.getByText("Vencimiento creado con fecha confirmada.")).toBeVisible();
  const url = `/app/calendar?scope=overdue&kind=deadline&from=${dueOn}&to=${dueOn}`;
  await page.goto(url);
  const card = page.locator("li.card").filter({ hasText: title });
  await expect(card).toContainText("Vencido");
  await card.getByRole("button", { name: "Marcar cumplido" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Marcar cumplido" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(card).toHaveCount(0);
  await page.goto(url.replace("scope=overdue", "scope=resolved"));
  await expect(card).toContainText("Estado: Cumplido");
  await expect(card).not.toContainText("Vencido");
  await card.getByRole("button", { name: "Reabrir vencimiento" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(card).toHaveCount(0);
  await page.goto(url);
  await expect(card).toContainText("Estado: Pendiente");
  await page.screenshot({
    path: testInfo.outputPath("overdue-deadline.png"),
    fullPage: true,
    caret: "initial"
  });
  await signOut(page);
  await signIn(page, "reader@example.test");
  await page.goto(url);
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: "Marcar cumplido" })).toHaveCount(0);
  await expect(
    page.locator("summary").filter({ hasText: "Crear vencimiento legal" })
  ).toHaveCount(0);
});

test("passes automated accessibility checks and preserves reflow at large text sizes", async ({
  page
}, testInfo) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
  await checkAccessibility(page);
  await signIn(page, "admin@example.test");
  for (const path of [
    "/app",
    "/app/cases",
    "/app/calendar",
    "/app/calendar?scope=overdue",
    "/app/calendar?scope=review",
    "/app/calendar?scope=resolved",
    "/app/team"
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    if (path === "/app/calendar") {
      await page
        .locator("summary")
        .filter({ hasText: "Crear vencimiento legal" })
        .click();
    }
    await checkAccessibility(page);
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/app/calendar?scope=overdue");
  await expect(
    page.getByRole("heading", { name: "Vencidos", exact: true })
  ).toBeVisible();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    )
    .toBe(true);
  await checkAccessibility(page);
  await page.screenshot({
    path: testInfo.outputPath("agenda-large-text.png"),
    fullPage: true,
    caret: "initial"
  });
});

async function checkAccessibility(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target)
    }))
  ).toEqual([]);
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Correo electronico").fill(fixtureEmails.get(email) ?? email);
  await page.getByLabel("Contraseña").fill(demoPassword);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await completeMfaIfNeeded(page, email);
  await expect(page).toHaveURL(/\/app$/);
}

async function completeMfaIfNeeded(page: Page, email: string) {
  await page.waitForURL(/\/(app|mfa\/enroll|mfa\/verify)/);
  await page.goto("/app");
  await page.waitForURL(/\/(app|mfa\/enroll|mfa\/verify)/);

  if (page.url().includes("/mfa/enroll")) {
    await page.getByRole("button", { name: "Generar segundo factor" }).click();
    const secret = (await page.locator(".mfaQrBlock code").textContent())?.trim();

    if (!secret) {
      throw new Error(`Missing MFA enrollment secret for ${email}`);
    }

    mfaSecrets.set(email, secret);
    await page.getByLabel("Código de autenticación").fill(generateTotp(secret));
    await page.getByRole("button", { name: "Verificar" }).click();
    await page.waitForURL(/\/app$/);
    return;
  }

  if (page.url().includes("/mfa/verify")) {
    const secret = mfaSecrets.get(email);

    if (!secret) {
      throw new Error(`Missing stored MFA secret for ${email}`);
    }

    await page.getByLabel("Código de autenticación").fill(generateTotp(secret));
    await page.getByRole("button", { name: "Verificar" }).click();
    await page.waitForURL(/\/app$/);
  }
}

function generateTotp(secret: string) {
  const key = decodeBase32(secret);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));

  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = readByte(digest, digest.length - 1) & 0x0f;
  const binary =
    ((readByte(digest, offset) & 0x7f) << 24) |
    ((readByte(digest, offset + 1) & 0xff) << 16) |
    ((readByte(digest, offset + 2) & 0xff) << 8) |
    (readByte(digest, offset + 3) & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

function readByte(buffer: Buffer, index: number) {
  const value = buffer[index];

  if (value === undefined) {
    throw new Error("Invalid TOTP digest.");
  }

  return value;
}

function decodeBase32(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of secret.replaceAll(/\s/g, "").replaceAll("=", "").toUpperCase()) {
    const index = alphabet.indexOf(char);

    if (index === -1) {
      throw new Error("Invalid TOTP secret.");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

async function provisionSyntheticFirm() {
  const env = readTestEnv();
  // Older local setups use this server-only name as well.
  const adminKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !adminKey)
    throw new Error(
      "Configure local Supabase and a server-only admin key before running browser tests."
    );
  if (
    !["localhost", "127.0.0.1"].includes(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname)
  )
    throw new Error("Browser workflow tests require local synthetic Supabase data.");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const runId = Date.now().toString(36);
  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .insert({
      name: `Synthetic UX test firm ${runId}`,
      default_timezone: "America/Argentina/Buenos_Aires"
    })
    .select("id")
    .single();
  if (firmError || !firm) throw new Error("Could not provision synthetic test firm.");
  for (const role of ["admin", "lawyer", "paralegal", "read_only"] as const) {
    const alias = role === "read_only" ? "reader" : role;
    const email = `ux-${alias}-${runId}@example.test`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { display_name: `Synthetic ${alias}` }
    });
    if (error || !data.user) throw new Error(`Could not provision synthetic ${alias}.`);
    const { error: membershipError } = await supabase.from("firm_memberships").insert({
      firm_id: firm.id,
      profile_id: data.user.id,
      role,
      status: "active",
      accepted_at: new Date().toISOString()
    });
    if (membershipError) throw new Error(`Could not assign synthetic ${alias}.`);
    fixtureEmails.set(`${alias}@example.test`, email);
    if (role === "paralegal") paralegalProfileId = data.user.id;
    if (role === "read_only") readerProfileId = data.user.id;
  }
}

function readTestEnv() {
  const env = { ...process.env };

  if (existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      env[line.slice(0, separatorIndex)] ??= line.slice(separatorIndex + 1);
    }
  }

  return env;
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
  await page.locator("summary").filter({ hasText: "Asignar acceso a causa" }).click();
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
  await page
    .locator("summary")
    .filter({ hasText: /^Crear causa$/ })
    .click();
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
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar" }).click();
}
