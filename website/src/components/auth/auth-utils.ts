type AuthUser = {
  email?: { address?: string | null } | null;
  google?: { name?: string | null; email?: string | null } | null;
  wallet?: { address?: string | null } | null;
} | null;

export function userDisplayName(user: AuthUser): string {
  if (!user) return "Account";
  const email = user.email?.address;
  if (email) {
    return email.split("@")[0] ?? email;
  }
  const google = user.google?.name || user.google?.email;
  if (google) return String(google);
  const wallet = user.wallet?.address;
  if (wallet) {
    return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  }
  return "Account";
}

export function userSecondaryLabel(user: AuthUser): string | null {
  if (!user) return null;
  if (user.email?.address) return user.email.address;
  if (user.wallet?.address) return user.wallet.address;
  if (user.google?.email) return String(user.google.email);
  return null;
}
