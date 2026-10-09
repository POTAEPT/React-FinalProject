// Only same-site paths are allowed as a redirect target after login, so a link
// like /login?next=//evil.example cannot send people off the site.
export function safeNextPath(value) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/";
  }

  if (value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }

  return value;
}
