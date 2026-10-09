// Every Server Action returns { ok: true, ...data } on success or
// { ok: false, code, message } on failure: code is for the caller's logic,
// message is Thai text the UI can show as is.
export function fail(code, message) {
  return { ok: false, code, message };
}
