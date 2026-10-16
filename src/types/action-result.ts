export type ActionResult = {
  ok: boolean;
  message: string | null;
  fieldErrors?: Record<string, string>;
};
