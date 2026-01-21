import { HiringData } from "@/components/HiringModal";

export function processDocumentTemplate(
  rawText: string, 
  candidateName: string, 
  hiringData: HiringData
) {
  const logoMarkdown = hiringData.logoUrl 
    ? `<img src="${hiringData.logoUrl}" style="max-height: 60px; margin-bottom: 20px;" />` 
    : `<h2 style="margin-top: 0;">${hiringData.orgName}</h2>`;

  return rawText
    .replace(/!Company Logo!\]\({{ORG_LOGO}}\)/g, logoMarkdown)
    .replace(/{{ORG_LOGO}}/g, hiringData.logoUrl || "")
    .replace(/{{CLIENT_NAME}}/g, hiringData.orgName)
    .replace(/{{ORG_NAME}}/g, hiringData.orgName)
    .replace(/{{COMPANY_NAME}}/g, hiringData.orgName)
    .replace(/{{CLIENT_ADDRESS}}/g, "123 Business Rd, Tech City") 
    .replace(/{{CONTRACTOR_NAME}}/g, candidateName)
    .replace(/{{EMPLOYEE_NAME}}/g, candidateName)
    .replace(/{{CANDIDATE_NAME}}/g, candidateName)
    .replace(/{{CANDIDATE_ADDRESS}}/g, "Remote")
    .replace(/{{CONTRACTOR_ADDRESS}}/g, "Remote") 
    .replace(/{{SERVICES_DESCRIPTION}}/g, "Software development and engineering services.")
    .replace(/{{PAYMENT_RATE}}/g, `${hiringData.currency}${hiringData.rate}/hr`)
    .replace(/{{SALARY_AMOUNT}}/g, `${hiringData.currency}${hiringData.salary}`)
    .replace(/{{EQUITY_AMOUNT}}/g, "1,000") 
    .replace(/{{JOB_TITLE}}/g, "Software Engineer") 
    .replace(/{{MANAGER_NAME}}/g, hiringData.userName)
    .replace(/{{USER_NAME}}/g, hiringData.userName)
    .replace(/{{START_DATE}}/g, "Immediately")
    .replace(/{{EXPIRATION_DATE}}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
    .replace(/{{END_DATE}}/g, "Open-ended")
    .replace(/{{DISPUTE_COUNTY}}/g, "San Francisco County, CA")
    .replace(/{{CONFIDENTIALITY_OTHER}}/g, "None")
    .replace(/{{GOVERNING_LAW_STATE}}/g, "California")
    .replace(/{{CURRENT_DATE}}/g, new Date().toLocaleDateString())
    .replace(/{{EFFECTIVE_DATE}}/g, new Date().toLocaleDateString())
    // Signature lines
    .replace(/_{10,}\n\*\*{{USER_NAME}}\*\*\n\*\*{{ORG_NAME}}\*\*/g, 
        `*Digitally Signed by ${hiringData.userName}*\n**${hiringData.userName}**\n**${hiringData.orgName}**`)
    .replace(/Signature: __________________________/g, (match, offset, string) => {
        const precedingText = string.substring(Math.max(0, offset - 100), offset);
        if (precedingText.includes("Client") || precedingText.includes("Employer") || precedingText.includes("Company") || precedingText.includes("Signatory") || precedingText.includes("Sincerely")) {
            return `Digital Signature: *Digitally Verified via Trac AI*`;
        }
        return match;
    });
}