import type { Company } from "@/types/company";

export const COMPANY_LINKS_REQUEST_EVENT = "company-links-request";

export type CompanyLinksRequestDetail = {
  company: Company;
};

export function requestCompanyLinks(company: Company) {
  window.dispatchEvent(
    new CustomEvent<CompanyLinksRequestDetail>(COMPANY_LINKS_REQUEST_EVENT, {
      detail: { company },
    }),
  );
}
