// new file: src/lib/constants/orgTypes.ts
export const ORG_TYPE_MAP: Record<string, string> = {
  "Private Limited Company": "private_limited_company",
  "LLP": "llp",
  "Partnership Firm": "partnership_firm",
  "Sole Proprietorship": "sole_proprietorship",
}


export function mapOrgType(label?: string) {
  return label ? ORG_TYPE_MAP[label] ?? label : ""
}

