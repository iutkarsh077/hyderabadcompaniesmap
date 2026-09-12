export const SITE_NAME = "Hyderabad Companies Map";

export const PORTFOLIO_URL = "https://utkarsh-human.vercel.app/";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function getContactEmail() {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";
}
