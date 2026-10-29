// Stand-in for @vercel/oidc: the real package loads Node file APIs that the
// published server cannot run. The app never uses Vercel OIDC auth.
export function getContext(): { headers?: Record<string, string> } {
  return {};
}
export async function getVercelOidcToken(): Promise<string> {
  throw new Error("Vercel OIDC is not available in this app");
}
