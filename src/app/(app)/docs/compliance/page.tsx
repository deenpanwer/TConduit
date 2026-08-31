"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { 
  collection, query, onSnapshot 
} from "firebase/firestore";
import { Search, CheckCircle2, FileText, Layers, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PolicyAcknowledgementItem {
  id: string;
  docTitle: string;
  category: string;
  userId: string;
  userName: string;
  timestamp: string;
}

interface AssignedPacket {
  id: string;
  packetId: string;
  packetTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: any;
  dueDate?: any;
  completedAt?: any;
  status: "pending" | "completed" | "overdue";
  docStatuses: Array<{ title: string; isCompleted: boolean; acknowledgedAt?: any }>;
}

export default function StaffProgressPage() {
  const { userData } = useAuth();
  const orgId = userData?.ownedOrgId || userData?.orgId;

  const [activeTab, setActiveTab] = useState<"policies" | "packets">("policies");
  const [policyAcks, setPolicyAcks] = useState<PolicyAcknowledgementItem[]>([]);
  const [packetAssignments, setPacketAssignments] = useState<AssignedPacket[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!orgId) return;

    // 1. Company Policy Acknowledgements Listener
    const docsQ = query(collection(db, "organizations", orgId, "general_docs"));
    const unsubDocs = onSnapshot(docsQ, (snap) => {
      const acksList: PolicyAcknowledgementItem[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const acks = d.acknowledgements || {};
        Object.entries(acks).forEach(([uid, ackObj]: [string, any]) => {
          acksList.push({
            id: `${docSnap.id}_${uid}`,
            docTitle: d.title || "Company Policy",
            category: d.category || "Company Policy",
            userId: uid,
            userName: ackObj.userName || "Employee",
            timestamp: ackObj.timestamp || new Date().toISOString(),
          });
        });
      });
      // Sort newest first
      acksList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setPolicyAcks(acksList);
    });

    // 2. Assigned Packets Listener
    const packetsQ = query(collection(db, "organizations", orgId, "assigned_packets"));
    const unsubPackets = onSnapshot(packetsQ, (snap) => {
      const data: AssignedPacket[] = [];
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as AssignedPacket));
      setPacketAssignments(data);
    });

    return () => {
      unsubDocs();
      unsubPackets();
    };
  }, [orgId]);

  const filteredPolicyAcks = policyAcks.filter((item) =>
    item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.docTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPackets = packetAssignments.filter((item) =>
    item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.packetTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-background/50 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black font-poppins tracking-tight uppercase">
            Staff Progress & Sign-offs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time audit log of staff policy acknowledgements and assigned packets.
          </p>
        </div>
      </div>

      {/* Tabs & Search Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2 w-full sm:w-auto">
          <Button
            variant={activeTab === "policies" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("policies")}
            className={cn("rounded-xl text-xs font-bold gap-2", activeTab === "policies" && "bg-primary text-primary-foreground")}
          >
            <FileText className="size-4" /> Company Policy Ticks ({policyAcks.length})
          </Button>
          <Button
            variant={activeTab === "packets" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("packets")}
            className={cn("rounded-xl text-xs font-bold gap-2", activeTab === "packets" && "bg-primary text-primary-foreground")}
          >
            <Layers className="size-4" /> Assigned Packets ({packetAssignments.length})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search staff, policies or packets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl h-9 text-xs"
          />
        </div>
      </div>

      {/* TAB 1: COMPANY POLICY TICKS */}
      {activeTab === "policies" && (
        <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 pl-6">Employee</th>
                  <th className="p-4">Policy Document Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Acknowledged Timestamp</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredPolicyAcks.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4 pl-6 font-bold flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        {item.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{item.userName}</div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {item.docTitle}
                    </td>
                    <td className="p-4">
                      <span className="bg-primary/10 text-primary text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 pr-6">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1.5 border border-emerald-500/20">
                        <CheckCircle2 className="size-3.5" /> Ticked & Acknowledged
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredPolicyAcks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <UserCheck className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                      <div className="font-bold text-sm">No Policy Acknowledgements Recorded</div>
                      <div className="text-xs mt-1">Staff policy sign-offs will appear here automatically when employees read and tick policies.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: ASSIGNED PACKETS */}
      {activeTab === "packets" && (
        <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 pl-6">Employee</th>
                  <th className="p-4">Packet Title</th>
                  <th className="p-4">Assigned Date</th>
                  <th className="p-4">First Acknowledged</th>
                  <th className="p-4">Completed Date</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredPackets.map((item) => {
                  const completedDocs = item.docStatuses?.filter((d) => d.isCompleted).length || 0;
                  const totalDocs = item.docStatuses?.length || 1;
                  const isCompleted = item.status === "completed" || completedDocs === totalDocs;

                  // Compute First Acknowledged Date
                  const firstAckDoc = item.docStatuses?.find((d) => d.isCompleted && d.acknowledgedAt);
                  const firstAckVal = (item as any).firstAcknowledgedAt || firstAckDoc?.acknowledgedAt;
                  const firstAckDateStr = firstAckVal
                    ? new Date(firstAckVal.seconds ? firstAckVal.seconds * 1000 : firstAckVal).toLocaleString()
                    : "-";

                  // Compute Completed Date
                  const completedVal = item.completedAt;
                  const completedDateStr = completedVal
                    ? new Date(completedVal.seconds ? completedVal.seconds * 1000 : completedVal).toLocaleString()
                    : isCompleted
                    ? "Completed"
                    : "-";

                  return (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 pl-6 font-bold">
                        <div>{item.userName}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">{item.userEmail}</div>
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        {item.packetTitle}
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-[11px]">
                        {item.assignedAt ? new Date(item.assignedAt.seconds ? item.assignedAt.seconds * 1000 : item.assignedAt).toLocaleDateString() : "Recently"}
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-[11px]">
                        {firstAckDateStr}
                      </td>
                      <td className="p-4 text-muted-foreground font-mono text-[11px]">
                        {completedDateStr}
                      </td>
                      <td className="p-4 font-bold">
                        {completedDocs} / {totalDocs} Completed
                      </td>
                      <td className="p-4 pr-6">
                        {isCompleted ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> Completed
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full text-[11px]">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredPackets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      No packet assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
