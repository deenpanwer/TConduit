import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { REPUTABLE_POLICY_TEMPLATES } from "@/components/docs/BrowseTemplatesModal";

export async function seedSamplePolicies(orgId: string) {
  if (!orgId) throw new Error("Organization ID is not available.");
  
  // Seed top 3 corporate landmark policies (Valve, Netflix, GitLab)
  const topEnterpriseDocs = REPUTABLE_POLICY_TEMPLATES.slice(0, 3);

  for (const tpl of topEnterpriseDocs) {
    await addDoc(collection(db, "organizations", orgId, "general_docs"), {
      title: `${tpl.title} (${tpl.institution})`,
      category: tpl.category,
      visibilityScope: "all",
      requiresAck: true,
      content: `### ${tpl.title}\n\n**Published by**: ${tpl.institution}\n\n**Framework**: ${tpl.researchBadge || "Standard"}\n\n${tpl.description}\n\n**Key Highlights**:\n${tpl.summary}`,
      fileName: tpl.fileName,
      fileUrl: tpl.pdfUrl,
      acknowledgements: {},
      createdAt: serverTimestamp(),
    });
  }
}

export async function seedSamplePacket(orgId: string) {
  if (!orgId) throw new Error("Organization ID is not available.");
  
  const enterprisePacketDocs = REPUTABLE_POLICY_TEMPLATES.slice(0, 3).map((tpl: any, i: number) => ({
    id: `doc-${i + 1}`,
    title: tpl.title,
    fileName: tpl.fileName,
    fileUrl: tpl.pdfUrl,
    requiresAck: true,
  }));

  await addDoc(collection(db, "organizations", orgId, "doc_packets"), {
    title: "Executive Onboarding & High-Performance Culture Packet",
    description: "Standard onboarding packet featuring corporate policy handbooks from Valve, Netflix, and GitLab.",
    assignScope: "all",
    requireAllDocsApproval: true,
    documents: enterprisePacketDocs,
    createdAt: serverTimestamp(),
  });
}
