import ExcelJS from "exceljs";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";

export interface ExportDataPayload {
  leads: any[];
  deals: any[];
  calls: any[];
  notes: any[];
  invoices: any[];
  employees: any[];
  config: any;
}

export interface ExportFilterOptions {
  employeeIds: string[]; // empty or ["all"] means all
  interval: "daily" | "monthly";
  date: Date;
  includeAccountability: boolean;
  includeActivity: boolean;
  includeRevenue: boolean;
}

// Helper to filter items by employee list
const isAssignedToFiltered = (assignedTo: string | undefined, filterIds: string[]) => {
  if (!filterIds || filterIds.length === 0 || filterIds.includes("all")) return true;
  return assignedTo ? filterIds.includes(assignedTo) : false;
};

// Helper to filter logs by date
const isWithinTimeframe = (timestamp: string | any, interval: "daily" | "monthly", selectedDate: Date) => {
  if (!timestamp) return false;
  const date = new Date(typeof timestamp.toDate === "function" ? timestamp.toDate() : timestamp);
  if (isNaN(date.getTime())) return false;

  if (interval === "daily") {
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  } else {
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth()
    );
  }
};

// Helper to resolve lead status field key
const getLeadsStatusKey = (config: any) => {
  const leadsConfig = config?.modules?.leads;
  const leadsView = leadsConfig?.views?.find((v: any) => v.type === 'kanban') || leadsConfig?.views?.[0];
  const leadsKanbanField = leadsConfig?.fields?.find((f: any) => f.id === leadsView?.kanbanFieldId) || leadsConfig?.fields?.find((f: any) => f.key === 'status');
  return leadsKanbanField ? leadsKanbanField.key : "status";
};

// Helper to resolve deal status field key
const getDealsStatusKey = (config: any) => {
  const dealsConfig = config?.modules?.deals;
  const dealsView = dealsConfig?.views?.find((v: any) => v.type === 'kanban') || dealsConfig?.views?.[0];
  const dealsKanbanField = dealsConfig?.fields?.find((f: any) => f.id === dealsView?.kanbanFieldId) || dealsConfig?.fields?.find((f: any) => f.key === 'status');
  return dealsKanbanField ? dealsKanbanField.key : "status";
};

// Main data processing function
const processExportData = (payload: ExportDataPayload, options: ExportFilterOptions) => {
  const { leads = [], deals = [], calls = [], notes = [], invoices = [], employees = [], config } = payload;
  const { employeeIds, interval, date } = options;

  const leadsStatusKey = getLeadsStatusKey(config);
  const dealsStatusKey = getDealsStatusKey(config);

  // Dynamic Follow Up Field detection
  const followUpField = config?.modules?.leads?.fields?.find((f: any) => 
    (f.label.toLowerCase().includes("follow") || f.key.toLowerCase().includes("follow")) &&
    f.type === "date"
  );
  const followUpKey = followUpField ? followUpField.key : "nextFollowUp";

  // 1. Process Employees details Map
  const employeeMap = new Map<string, string>();
  employees.forEach(emp => {
    employeeMap.set(emp.id, emp.name || emp.displayName || emp.email || "Unknown Member");
  });

  // 2. Filter Leads (Keep only non-deleted)
  const filteredLeads = leads.filter(l => !l.isDeleted);

  // 3. Process Accountability & Excuses directory (Assigned leads only!)
  const excusesList: any[] = [];
  filteredLeads.forEach(lead => {
    const assignedId = lead.data?.assignedTo || lead.assignedTo;
    
    // EXCLUDE unassigned leads as requested: "should only look at the assigned leads"
    if (!assignedId) return;
    if (!isAssignedToFiltered(assignedId, employeeIds)) return;

    // Scan history logs for missed follow-up reasons
    const historyLogs = lead.history || [];
    const reasonLogs = historyLogs.filter((h: any) => h.type === "System" && h.action === "MISSED_FOLLOWUP_REASON");

    // Also look at follow-up dates in the past
    const followUpVal = lead.data?.[followUpKey] || lead[followUpKey];
    if (followUpVal) {
      let followUpDate: Date | null = null;
      if (typeof followUpVal.toDate === "function") {
        followUpDate = followUpVal.toDate();
      } else if (followUpVal.seconds !== undefined) {
        followUpDate = new Date(followUpVal.seconds * 1000);
      } else {
        const cleanVal = typeof followUpVal === "string" ? followUpVal.replace(/(\d+)(st|nd|rd|th)/gi, "$1") : followUpVal;
        const parsed = new Date(cleanVal);
        if (!isNaN(parsed.getTime())) {
          followUpDate = parsed;
        }
      }

      if (followUpDate) {
        // If follow-up date matches timeframe
        if (isWithinTimeframe(followUpDate, interval, date)) {
          const isOverdue = followUpDate.getTime() < new Date().getTime();
          if (isOverdue) {
            // Find if there is a reason log logged around/after the follow-up date
            const matchingReason = reasonLogs.find((r: any) => {
              const reasonTime = new Date(r.timestamp);
              return reasonTime.getTime() >= followUpDate!.getTime();
            });

            const employeeName = employeeMap.get(assignedId) || "Unknown Employee";

            // Extract reason text from content
            let reasonText = "Pending Explanation";
            let ackDateStr = "--:--";
            let status = "Pending";

            if (matchingReason) {
              status = "Acknowledged";
              ackDateStr = format(new Date(matchingReason.timestamp), "yyyy-MM-dd hh:mm a");
              const match = matchingReason.content.match(/"(.*?)"/);
              if (match && match[1]) {
                reasonText = match[1];
              } else {
                reasonText = matchingReason.content;
              }
            }

            // Check if there is any Call or Note logged AFTER the follow-up date (Follow-through Audit)
            const postCallOrNote = historyLogs.some((h: any) => {
              if (h.type !== "Call" && h.type !== "Note") return false;
              const logTime = new Date(h.timestamp);
              return logTime.getTime() > followUpDate!.getTime();
            });

            excusesList.push({
              employeeId: assignedId,
              employeeName,
              leadId: lead.id,
              leadName: lead.name,
              scheduledDate: format(followUpDate, "yyyy-MM-dd hh:mm a"),
              scheduledTimestamp: followUpDate.getTime(),
              acknowledgeDate: ackDateStr,
              overdueDays: Math.floor((new Date().getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24)),
              status,
              reason: reasonText,
              followedThrough: postCallOrNote ? "Yes" : "No"
            });
          }
        }
      }
    }
  });

  // Sort excuses by scheduled date (oldest first)
  excusesList.sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp);

  // 4. Process Employee Activity Roster
  const activityRoster: any[] = [];
  const targetEmployeeIds = (!employeeIds || employeeIds.length === 0 || employeeIds.includes("all"))
    ? Array.from(employeeMap.keys())
    : employeeIds;

  // Filter non-deleted invoices
  const filteredInvoices = invoices.filter(inv => !inv.isDeleted);

  targetEmployeeIds.forEach(empId => {
    const employeeName = employeeMap.get(empId) || "Unknown Employee";

    // Calls filter
    const empCalls = calls.filter(c => {
      const isAuthor = c.lastEditedBy === empId || c.data?.createdBy === empId;
      return isAuthor && isWithinTimeframe(c.createdAt || c.timestamp, interval, date);
    });

    const totalCallDuration = empCalls.reduce((sum, c) => sum + (Number(c.data?.duration) || 0), 0);
    const avgCallDuration = empCalls.length > 0 ? Math.round(totalCallDuration / empCalls.length) : 0;

    // Notes filter
    const empNotes = notes.filter(n => {
      const isAuthor = n.lastEditedBy === empId || n.data?.createdBy === empId;
      return isAuthor && isWithinTimeframe(n.createdAt || n.timestamp, interval, date);
    });

    // Invoices filter
    const empInvoices = filteredInvoices.filter(inv => {
      const creatorId = inv.lastEditedBy || inv.data?.createdBy;
      return creatorId === empId && isWithinTimeframe(inv.createdAt || inv.timestamp, interval, date);
    });
    
    // Exclude rejected/cancelled invoices from overall metrics
    const validInvoices = empInvoices.filter(inv => inv.data?.status !== 'rejected' && inv.data?.status !== 'cancelled');
    const totalInvoicedAmt = validInvoices.reduce((sum, inv) => sum + (Number(inv.data?.amount) || 0), 0);
    
    const paidInvoices = empInvoices.filter(inv => inv.data?.status === 'paid');
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + (Number(inv.data?.amount) || 0), 0);
    
    const unpaidInvoices = empInvoices.filter(inv => ['draft', 'sent', 'overdue', 'unpaid'].includes(inv.data?.status || 'draft'));
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.data?.amount) || 0), 0);

    // Lead assignments
    const assignedLeadsCount = filteredLeads.filter(l => (l.data?.assignedTo || l.assignedTo) === empId).length;

    // Lead movements
    let stageMovements = 0;
    filteredLeads.forEach(l => {
      const leadHistory = l.history || [];
      leadHistory.forEach((h: any) => {
        const isSelf = h.userId === empId;
        const isMove = h.type === "System" && h.content?.toLowerCase().includes("status");
        if (isSelf && isMove && isWithinTimeframe(h.timestamp, interval, date)) {
          stageMovements++;
        }
      });
    });

    activityRoster.push({
      employeeId: empId,
      employeeName,
      callsCount: empCalls.length,
      totalDuration: totalCallDuration,
      avgDuration: avgCallDuration,
      notesCount: empNotes.length,
      invoicesCount: validInvoices.length,
      invoicedAmount: totalInvoicedAmt,
      paidCount: paidInvoices.length,
      paidAmount,
      unpaidCount: unpaidInvoices.length,
      unpaidAmount,
      assignedLeads: assignedLeadsCount,
      stageMovements
    });
  });

  // 5. Process Deals & Pipeline Revenue
  const dealsList: any[] = [];
  deals.forEach(deal => {
    const ownerId = deal.data?.contactId || deal.contactId || deal.data?.ownerId || deal.ownerId;
    if (!ownerId) return; // Ignore unowned deals
    if (!isAssignedToFiltered(ownerId, employeeIds)) return;

    if (isWithinTimeframe(deal.createdAt || deal.timestamp, interval, date)) {
      const ownerName = employeeMap.get(ownerId) || "Unknown Employee";
      dealsList.push({
        dealId: deal.id,
        name: deal.name,
        organization: deal.data?.organization || "Individual",
        stage: deal.data?.[dealsStatusKey] || "Qualification",
        value: Number(deal.data?.annualRevenue) || 0,
        ownerName,
        createdAt: format(new Date(deal.createdAt || deal.timestamp), "yyyy-MM-dd")
      });
    }
  });

  // KPI aggregates
  const totalCalls = activityRoster.reduce((sum, r) => sum + r.callsCount, 0);
  const totalNotes = activityRoster.reduce((sum, r) => sum + r.notesCount, 0);
  const totalMissed = excusesList.length;
  const totalAcknowleged = excusesList.filter(e => e.status === "Acknowledged").length;
  const adherenceRate = totalMissed > 0 ? Math.round((totalAcknowleged / totalMissed) * 100) : 100;
  
  const closedWonDeals = dealsList.filter(d => d.stage?.toLowerCase() === "won");
  const closedLostDeals = dealsList.filter(d => d.stage?.toLowerCase() === "lost");
  const totalClosedWonRevenue = closedWonDeals.reduce((sum, d) => sum + d.value, 0);

  // Invoices aggregates
  const targetInvoices = filteredInvoices.filter(inv => {
    const creatorId = inv.lastEditedBy || inv.data?.createdBy;
    return isAssignedToFiltered(creatorId, employeeIds) && isWithinTimeframe(inv.createdAt || inv.timestamp, interval, date);
  });
  const validTargetInvoices = targetInvoices.filter(inv => inv.data?.status !== 'rejected' && inv.data?.status !== 'cancelled');
  const totalInvoicedAmount = validTargetInvoices.reduce((sum, inv) => sum + (Number(inv.data?.amount) || 0), 0);
  const totalInvoicesCount = validTargetInvoices.length;

  const paidTargetInvoices = targetInvoices.filter(inv => inv.data?.status === 'paid');
  const totalPaidCount = paidTargetInvoices.length;
  const totalPaidAmount = paidTargetInvoices.reduce((sum, inv) => sum + (Number(inv.data?.amount) || 0), 0);

  return {
    excusesList,
    activityRoster,
    dealsList,
    kpis: {
      totalCalls,
      totalNotes,
      totalMissed,
      totalAcknowleged,
      adherenceRate,
      totalClosedWonRevenue,
      closedWonCount: closedWonDeals.length,
      closedLostCount: closedLostDeals.length,
      totalInvoicedAmount,
      totalInvoicesCount,
      totalPaidCount,
      totalPaidAmount
    }
  };
};

export const generateCRMExcelReport = async (
  payload: ExportDataPayload,
  options: ExportFilterOptions,
  filename: string
) => {
  const { excusesList, activityRoster, dealsList, kpis } = processExportData(payload, options);
  
  const workbook = new ExcelJS.Workbook();
  
  // SHEET 1: SUMMARY DASHBOARD
  const summarySheet = workbook.addWorksheet("Dashboard Summary");
  summarySheet.views = [{ showGridLines: true }];

  // Column width setup
  summarySheet.getColumn("A").width = 24;
  summarySheet.getColumn("B").width = 24;
  summarySheet.getColumn("C").width = 24;
  summarySheet.getColumn("D").width = 24;
  summarySheet.getColumn("E").width = 24;

  // Title block
  summarySheet.mergeCells("A1:E2");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = `CRM PERFORMANCE AUDIT - ${options.interval.toUpperCase()} REPORT`;
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0284C7" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  summarySheet.getRow(3).height = 15; // Spacer

  // Subtitle info
  summarySheet.getCell("A4").value = "Report Period:";
  summarySheet.getCell("A4").font = { bold: true };
  summarySheet.getCell("B4").value = format(options.date, options.interval === "daily" ? "yyyy-MM-dd" : "MMMM yyyy");
  
  summarySheet.getCell("D4").value = "Generated On:";
  summarySheet.getCell("D4").font = { bold: true };
  summarySheet.getCell("E4").value = format(new Date(), "yyyy-MM-dd hh:mm a");

  summarySheet.getRow(5).height = 20; // Spacer

  // KPI Row 6: Labels (No merged cells, clean columns!)
  summarySheet.getRow(6).height = 25;
  summarySheet.getRow(7).height = 30;
  summarySheet.getRow(8).height = 20;

  const kpisData = [
    { label: "Calls Logged", value: kpis.totalCalls, desc: "Outbound logs", color: "FFE0F2FE" },
    { label: "Follow-up Adherence", value: `${kpis.adherenceRate}%`, desc: `${kpis.totalAcknowleged}/${kpis.totalMissed} Met`, color: kpis.adherenceRate >= 80 ? "FFD1FAE5" : "FFFEE2E2" },
    { label: "Closed Revenue Won", value: `$${kpis.totalClosedWonRevenue.toLocaleString()}`, desc: `${kpis.closedWonCount} Won Deals`, color: "FFD1FAE5" },
    { label: "Total Invoiced", value: `$${kpis.totalInvoicedAmount.toLocaleString()}`, desc: `${kpis.totalInvoicesCount} Issued (${kpis.totalPaidCount} Paid)`, color: "FFFEE2E2" }
  ];

  kpisData.forEach((k, idx) => {
    const colIndex = idx + 1; // Col A, B, C, D
    const cellLabel = summarySheet.getCell(6, colIndex);
    const cellValue = summarySheet.getCell(7, colIndex);
    const cellDesc = summarySheet.getCell(8, colIndex);

    cellLabel.value = k.label;
    cellLabel.font = { bold: true, size: 10, color: { argb: "FF475569" } };
    cellLabel.alignment = { horizontal: "center", vertical: "middle" };
    cellLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.color } };

    cellValue.value = k.value;
    cellValue.font = { bold: true, size: 16, color: { argb: "FF0F172A" } };
    cellValue.alignment = { horizontal: "center", vertical: "middle" };
    cellValue.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.color } };

    cellDesc.value = k.desc;
    cellDesc.font = { italic: true, size: 8, color: { argb: "FF64748B" } };
    cellDesc.alignment = { horizontal: "center", vertical: "middle" };
    cellDesc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: k.color } };

    // Apply card borders
    const border = { style: "thin" as any, color: { argb: "FFCBD5E1" } };
    cellLabel.border = { top: border, left: border, right: border };
    cellValue.border = { left: border, right: border };
    cellDesc.border = { bottom: border, left: border, right: border };
  });

  // SHEET 2: ACCCOUNTABILITY (Assigned follow-ups only)
  if (options.includeAccountability) {
    const accSheet = workbook.addWorksheet("Follow-up Accountability");
    accSheet.views = [{ state: "frozen", ySplit: 1, showGridLines: true }];
    accSheet.columns = [
      { header: "Responsible Employee", key: "employee", width: 24 },
      { header: "Lead / Contact Name", key: "leadName", width: 22 },
      { header: "Follow-up Scheduled Date", key: "scheduled", width: 24 },
      { header: "Employee Acknowledge Date", key: "acknowledged", width: 24 },
      { header: "Status", key: "status", width: 15 },
      { header: "Days Late", key: "late", width: 12 },
      { header: "Employee Excuse / Reason", key: "reason", width: 40 },
      { header: "Follow-through Done?", key: "followedThrough", width: 22 }
    ];

    accSheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0284C7" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    excusesList.forEach(item => {
      const row = accSheet.addRow({
        employee: item.employeeName,
        leadName: item.leadName,
        scheduled: item.scheduledDate,
        acknowledged: item.acknowledgeDate,
        status: item.status,
        late: item.overdueDays,
        reason: item.reason,
        followedThrough: item.followedThrough
      });

      if (item.status === "Pending") {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
          cell.font = { color: { argb: "FFDC2626" } };
        });
      }
    });
  }

  // SHEET 3: TEAM ACTIVITY (Includes Invoices Issued metrics)
  if (options.includeActivity) {
    const actSheet = workbook.addWorksheet("Employee Activity Logs");
    actSheet.views = [{ state: "frozen", ySplit: 1, showGridLines: true }];
    actSheet.columns = [
      { header: "Employee Name", key: "employee", width: 24 },
      { header: "Assigned Leads", key: "leads", width: 16 },
      { header: "Calls Logged", key: "calls", width: 14 },
      { header: "Total Duration (sec)", key: "duration", width: 18 },
      { header: "Avg Duration (sec)", key: "avg", width: 18 },
      { header: "Notes Logged", key: "notes", width: 14 },
      { header: "Invoices Issued", key: "invoicesCount", width: 18 },
      { header: "Paid Invoices", key: "paidCount", width: 16 },
      { header: "Invoiced Amount ($)", key: "invoicedAmount", width: 20 },
      { header: "Paid Amount ($)", key: "paidAmount", width: 20 },
      { header: "Stage Transitions", key: "moves", width: 18 }
    ];

    actSheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0284C7" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    activityRoster.forEach(item => {
      actSheet.addRow({
        employee: item.employeeName,
        leads: item.assignedLeads,
        calls: item.callsCount,
        duration: item.totalDuration,
        avg: item.avgDuration,
        notes: item.notesCount,
        invoicesCount: item.invoicesCount,
        paidCount: item.paidCount,
        invoicedAmount: item.invoicedAmount,
        paidAmount: item.paidAmount,
        moves: item.stageMovements
      });
    });
  }

  // SHEET 4: REVENUE & PIPELINE
  if (options.includeRevenue) {
    const revSheet = workbook.addWorksheet("Revenue & Deals");
    revSheet.views = [{ state: "frozen", ySplit: 1, showGridLines: true }];
    revSheet.columns = [
      { header: "Deal Name", key: "deal", width: 24 },
      { header: "Owner", key: "owner", width: 22 },
      { header: "Organization", key: "org", width: 22 },
      { header: "Stage Status", key: "stage", width: 18 },
      { header: "Annual Revenue ($)", key: "value", width: 20 },
      { header: "Created Date", key: "date", width: 16 }
    ];

    revSheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0284C7" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      revSheet.getRow(1).height = 24;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    dealsList.forEach(item => {
      const row = revSheet.addRow({
        deal: item.name,
        owner: item.ownerName,
        org: item.organization,
        stage: item.stage,
        value: item.value,
        date: item.createdAt
      });

      if (item.stage?.toLowerCase() === "won") {
        row.getCell("stage").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
        row.getCell("stage").font = { color: { argb: "FF065F46" }, bold: true };
      } else if (item.stage?.toLowerCase() === "lost") {
        row.getCell("stage").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        row.getCell("stage").font = { color: { argb: "FF991B1B" }, bold: true };
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

export const generateCRMCSVReport = (
  payload: ExportDataPayload,
  options: ExportFilterOptions,
  filename: string
) => {
  const { excusesList, activityRoster, dealsList } = processExportData(payload, options);
  
  let csvData: any[] = [];

  if (options.includeAccountability) {
    excusesList.forEach(item => {
      csvData.push({
        ReportType: "Accountability",
        Employee: item.employeeName,
        TargetName: item.leadName,
        DateScheduled: item.scheduledDate,
        DateAcknowledged: item.acknowledgeDate,
        Status: item.status,
        DaysLate: item.overdueDays,
        ReasonExcuse: item.reason,
        FollowThroughDone: item.followedThrough,
        MetricValue: ""
      });
    });
  }

  if (options.includeActivity) {
    activityRoster.forEach(item => {
      csvData.push({
        ReportType: "Activity Log",
        Employee: item.employeeName,
        TargetName: "",
        DateScheduled: "",
        DateAcknowledged: "",
        Status: `Assigned Leads: ${item.assignedLeads}`,
        DaysLate: "",
        ReasonExcuse: `Calls: ${item.callsCount} | Duration: ${item.totalDuration}s | Notes: ${item.notesCount} | Invoices: ${item.invoicesCount} ($${item.invoicedAmount})`,
        FollowThroughDone: "",
        MetricValue: item.callsCount
      });
    });
  }

  if (options.includeRevenue) {
    dealsList.forEach(item => {
      csvData.push({
        ReportType: "Revenue & Deals",
        Employee: item.ownerName,
        TargetName: item.name,
        DateScheduled: item.createdAt,
        DateAcknowledged: "",
        Status: item.stage,
        DaysLate: "",
        ReasonExcuse: `Organization: ${item.organization}`,
        FollowThroughDone: "",
        MetricValue: item.value
      });
    });
  }

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const generateCRMPDFReport = async (
  payload: ExportDataPayload,
  options: ExportFilterOptions,
  filename: string
) => {
  const { excusesList, activityRoster, dealsList, kpis } = processExportData(payload, options);
  const { config } = payload;
  
  const container = document.createElement("div");
  Object.assign(container.style, {
    width: "800px",
    position: "absolute",
    left: "-9999px",
    top: "0",
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    backgroundColor: "#f8fafc"
  });

  const employeeNameStr = (options.employeeIds.length === 0 || options.employeeIds.includes("all"))
    ? "All Team Members"
    : `${options.employeeIds.length} Team Members`;

  const dateStr = format(options.date, options.interval === "daily" ? "MMMM dd, yyyy" : "MMMM yyyy");

  // Helper to build footer with Hubstaff-style branding
  const getFooterHtml = (pageNum: number, totalPages: number) => `
    <div style="position: absolute; bottom: 40px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5pt; font-family: sans-serif; box-sizing: border-box;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-weight: 500; color: #94a3b8;">Generated with</span>
        <!-- Trac AI Logo Icon (SVG) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 2000 2000" preserveAspectRatio="xMidYMid meet" fill="none" style="display: inline-block; vertical-align: middle; margin-top: 3px;">
          <g fill="#000000" transform="translate(1000, 1000) scale(2.8) translate(-988.9499999999998, -1077.1)">
            <path d="M1001.5 1317.8 c-2.8 -4 -135.7 -233.2 -137.2 -236.6 -1.3 -3.1 -1.2 -3.6 4 -13.5 3 -5.6 8.9 -16.9 13.2 -25.2 4.3 -8.2 8.1 -15.4 8.5 -16 0.8 -1.1 7 -12.8 18.3 -34.5 9.5 -18.4 17.1 -32.9 22.2 -42.5 2.3 -4.4 5.9 -11.1 8 -15 2.1 -3.8 4.2 -7.4 4.9 -7.8 1.2 -0.8 69.3 0 70.8 0.9 1.9 1.2 1.5 2 -17.2 37.9 -4.5 8.8 -9.1 17.4 -10 19 -1 1.7 -4.1 7.5 -7 13 -2.9 5.5 -7.2 13.6 -9.5 18 -2.3 4.4 -7.5 14.3 -11.5 22 -4 7.7 -10.2 19.6 -13.8 26.3 l-6.5 12.4 1.8 3.6 c3.3 7.1 8.7 15.2 10 15.2 1.3 0 4.6 -5.8 17.9 -31.2 9 -17.4 19.7 -37.8 21.3 -40.8 0.8 -1.4 2.5 -4.5 3.9 -7 1.4 -2.5 7.4 -13.9 13.3 -25.5 6 -11.5 12.4 -23.9 14.3 -27.5 1.9 -3.6 5.8 -10.8 8.5 -16 2.8 -5.2 6.8 -12.6 8.8 -16.5 5.7 -10.8 13.3 -25.3 23 -44 4.8 -9.3 9.1 -17.4 9.5 -18 0.4 -0.5 3.3 -5.9 6.5 -12 3.2 -6 6.3 -11.6 6.8 -12.3 0.9 -1.1 6.9 -1.3 30.6 -1 38.8 0.4 42.1 0.6 42.1 2.5 0 0.8 -2.6 6.5 -5.9 12.7 -3.2 6.1 -9.3 17.9 -13.6 26.1 -4.3 8.3 -10.4 19.7 -13.5 25.5 -3.2 5.8 -8.8 16.4 -12.5 23.5 -14 27 -21.1 40.6 -31.3 59.5 -5.8 10.7 -15.4 29.2 -21.5 41 -6 11.8 -11.3 22 -11.7 22.5 -0.4 0.6 -3.8 6.9 -7.5 14 -3.7 7.2 -8 15.3 -9.5 18 -3.2 5.8 -10.8 20.2 -20.7 39.5 -3.9 7.4 -9.8 18.8 -13.2 25.3 l-6.2 11.9 3.2 5.6 c5.5 9.7 7.9 13.2 9.2 13.2 0.6 0 2.1 -1.9 3.2 -4.3 1.1 -2.3 6 -11.8 10.9 -21.2 4.9 -9.3 9.8 -18.8 10.9 -21 2 -4 22 -41.7 23.7 -44.5 0.5 -0.8 5 -9.6 10.1 -19.5 10.6 -20.7 14.5 -28.1 28 -53.2 5.4 -10 14.4 -27.1 20 -38 5.6 -10.9 13.3 -25.6 17.1 -32.8 3.9 -7.1 8.7 -16.1 10.8 -20 4.8 -8.9 13.6 -25.8 23.5 -45 4.2 -8.2 8.1 -15.4 8.5 -16 0.4 -0.5 3.1 -5.6 5.9 -11.2 2.8 -5.5 5.8 -10.7 6.7 -11.4 1 -0.8 4.5 -1.2 10.2 -1.2 4.8 0.1 19.7 0.2 33.2 0.3 13.5 0.1 25.5 0.4 26.8 0.7 2 0.5 2.2 1 1.7 3.2 -0.4 1.4 -1 3 -1.5 3.6 -0.4 0.5 -5.3 9.8 -10.7 20.5 -5.5 10.7 -11.7 22.7 -13.8 26.5 -16.8 31.3 -20.5 38.4 -27.2 51.4 -3.4 6.9 -6.7 12.9 -7.3 13.5 -0.5 0.5 -1 1.5 -1 2.2 0 0.6 -1.8 4.4 -4.1 8.5 -4.7 8.5 -12.9 23.7 -17.6 32.4 -1.7 3.3 -7.8 15 -13.4 26 -5.6 11 -10.5 20.5 -10.9 21 -0.4 0.6 -3.6 6.4 -7 13 -3.4 6.6 -7.5 14.3 -9 17 -4.4 8.1 -13.2 24.8 -22.5 43 -4.8 9.4 -9.5 18.4 -10.5 20 -2.1 3.6 -8.1 14.9 -16.2 30.5 -25.8 49.4 -29.3 56.1 -37.6 71 -1.3 2.5 -6.3 11.9 -11 21 -28.1 54.6 -27 52.9 -30.7 47.8z"/>
            <path d="M787.4 949.8 c-33.9 -58.5 -62.3 -107.4 -63 -108.7 -2.6 -4.9 -1.4 -5.2 14.5 -4.7 8 0.3 28.3 0.8 45.1 1.1 16.8 0.3 46.3 0.8 65.5 1.1 19.3 0.3 42.2 0.7 51 0.9 8.8 0.2 38.5 0.6 66 1.1 27.5 0.4 52.9 0.8 56.5 0.9 3.6 0.1 13.2 0.2 21.3 0.3 17.1 0.2 17.5 0.5 13.4 8 -3.6 6.8 -10.2 19.4 -20.2 38.7 -4.8 9.4 -9.4 17.5 -10.3 18.2 -1.1 0.9 -8.5 1 -30.6 0.5 -16 -0.3 -36.5 -0.6 -45.6 -0.7 l-16.4 0 -22.6 39.5 c-12.4 21.7 -25.4 44.9 -28.9 51.5 -6.8 12.8 -21.4 40.6 -27.1 51.7 -2.2 4.2 -4.1 6.8 -5.1 6.8 -1.2 0 -21.1 -33.3 -63.5 -106.2z"/>
          </g>
        </svg>
        <span style="font-weight: 800; color: #334155; letter-spacing: -0.1px;">Trac AI</span>
      </div>
      <div>
        <a href="https://www.heytracai.com" target="_blank" style="font-weight: 800; color: #2563eb; text-decoration: none; letter-spacing: 0.1px;">heytracai.com</a>
      </div>
    </div>
  `;

  // Dynamic Follow Up Field detection
  const followUpField = config?.modules?.leads?.fields?.find((f: any) => 
    (f.label.toLowerCase().includes("follow") || f.key.toLowerCase().includes("follow")) &&
    f.type === "date"
  );
  const followUpLabel = followUpField ? followUpField.label : "Follow-up Scheduled";

  // PAGINATION CHUNKER:
  // Chunk arrays to fit page divisions:
  const excuseChunks: any[][] = [];
  const chunkSize = 13; // 13 excuses fit perfectly per page
  for (let i = 0; i < excusesList.length; i += chunkSize) {
    excuseChunks.push(excusesList.slice(i, i + chunkSize));
  }

  const dealChunks: any[][] = [];
  const dealChunkSize = 14; // 14 deals fit perfectly per page
  for (let i = 0; i < dealsList.length; i += dealChunkSize) {
    dealChunks.push(dealsList.slice(i, i + dealChunkSize));
  }

  // Calculate total pages
  let totalPages = 1; // Page 1 is always active logs + KPIs
  if (options.includeAccountability) {
    totalPages += Math.max(1, excuseChunks.length);
  }
  if (options.includeRevenue) {
    totalPages += Math.max(1, dealChunks.length);
  }

  let currentPageNum = 1;
  let htmlPages = "";

  // PAGE 1: KPI Summary Cards & Employee Activity logs
  htmlPages += `
    <div class="pdf-page" style="width: 800px; height: 1130px; padding: 40px; box-sizing: border-box; position: relative; background-color: #ffffff; overflow: hidden; font-family: sans-serif;">
      <!-- Header Block -->
      <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="font-size: 20pt; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; color: #0f172a;">
            CRM Performance <span style="color: #0284c7;">Audit</span>
          </h1>
          <p style="font-size: 9.5pt; color: #64748b; margin: 4px 0 0 0; font-style: italic;">
            Interval: ${options.interval.toUpperCase()} REPORT (${dateStr})
          </p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 9pt; font-weight: bold; color: #334155; margin: 0;">Scope: ${employeeNameStr}</p>
          <p style="font-size: 8pt; color: #64748b; margin: 2px 0 0 0;">Generated: ${format(new Date(), "yyyy-MM-dd hh:mm a")}</p>
        </div>
      </div>

      <!-- KPI summary cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px;">
        <div style="background-color: #f0f9ff; border: 1px solid #e0f2fe; padding: 12px 8px; border-radius: 12px; text-align: center;">
          <p style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #0369a1; margin: 0 0 4px 0;">Calls Logged</p>
          <p style="font-size: 16pt; font-weight: 900; color: #0c4a6e; margin: 0;">${kpis.totalCalls}</p>
          <p style="font-size: 7.5pt; color: #0284c7; margin: 3px 0 0 0; font-style: italic;">Outbound dials</p>
        </div>
        
        <div style="background-color: ${kpis.adherenceRate >= 80 ? "#f0fdf4" : "#fef2f2"}; border: 1px solid ${kpis.adherenceRate >= 80 ? "#dcfce7" : "#fee2e2"}; padding: 12px 8px; border-radius: 12px; text-align: center;">
          <p style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: ${kpis.adherenceRate >= 80 ? "#166534" : "#991b1b"}; margin: 0 0 4px 0;">Adherence</p>
          <p style="font-size: 16pt; font-weight: 900; color: ${kpis.adherenceRate >= 80 ? "#14532d" : "#7f1d1d"}; margin: 0;">${kpis.adherenceRate}%</p>
          <p style="font-size: 7.5pt; color: #64748b; margin: 3px 0 0 0; font-style: italic;">${kpis.totalAcknowleged}/${kpis.totalMissed} Met</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 12px 8px; border-radius: 12px; text-align: center;">
          <p style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #166534; margin: 0 0 4px 0;">Revenue Won</p>
          <p style="font-size: 16pt; font-weight: 900; color: #14532d; margin: 0;">$${kpis.totalClosedWonRevenue.toLocaleString()}</p>
          <p style="font-size: 7.5pt; color: #15803d; margin: 3px 0 0 0; font-style: italic;">${kpis.closedWonCount} deals won</p>
        </div>

        <div style="background-color: #fdfdf2; border: 1px solid #fef3c7; padding: 12px 8px; border-radius: 12px; text-align: center;">
          <p style="font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #b45309; margin: 0 0 4px 0;">Total Invoiced</p>
          <p style="font-size: 16pt; font-weight: 900; color: #78350f; margin: 0;">$${kpis.totalInvoicedAmount.toLocaleString()}</p>
          <p style="font-size: 7.5pt; color: #b45309; margin: 3px 0 0 0; font-style: italic;">${kpis.totalInvoicesCount} Issued (${kpis.totalPaidCount} paid)</p>
        </div>
      </div>

      <!-- Section: Activity Log -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 11pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #0284c7; padding-left: 8px; margin: 0 0 10px 0; color: #0f172a;">
          Employee Activity & Engagement Logs
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; text-align: left;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #475569;">
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Employee</th>
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: center;">Leads</th>
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: center;">Calls</th>
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: center;">Total Calls (sec)</th>
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: center;">Avg Call (sec)</th>
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: center;">Notes</th>
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: center;">Invoices Issued</th>
              <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: right;">Billed Value</th>
            </tr>
          </thead>
          <tbody>
            ${activityRoster.map(item => `
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                <td style="padding: 8px 6px; font-weight: bold; color: #0f172a; vertical-align: middle;">${item.employeeName}</td>
                <td style="padding: 8px 6px; text-align: center; color: #1e293b; font-weight: 600; vertical-align: middle;">${item.assignedLeads}</td>
                <td style="padding: 8px 6px; text-align: center; color: #1e293b; font-weight: 600; vertical-align: middle;">${item.callsCount}</td>
                <td style="padding: 8px 6px; text-align: center; color: #475569; font-weight: 500; vertical-align: middle;">${item.totalDuration}s</td>
                <td style="padding: 8px 6px; text-align: center; color: #475569; font-weight: 500; vertical-align: middle;">${item.avgDuration}s</td>
                <td style="padding: 8px 6px; text-align: center; color: #1e293b; font-weight: 600; vertical-align: middle;">${item.notesCount}</td>
                <td style="padding: 8px 6px; text-align: center; color: #1e293b; font-weight: 600; vertical-align: middle; line-height: 1.2;">
                  <div>${item.invoicesCount}</div>
                  <div style="font-size: 7pt; color: #64748b; font-weight: normal; margin-top: 1px;">
                    ${item.paidCount} paid / ${item.unpaidCount} unpaid
                  </div>
                </td>
                <td style="padding: 8px 6px; text-align: right; font-weight: bold; color: #0f172a; vertical-align: middle; line-height: 1.2;">
                  <div>$${item.invoicedAmount.toLocaleString()}</div>
                  <div style="font-size: 7pt; color: #16a34a; font-weight: 500; margin-top: 1px;">
                    $${item.paidAmount.toLocaleString()} paid
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- Render Hubstaff style footer -->
      ${getFooterHtml(currentPageNum++, totalPages)}
    </div>
  `;

  // PAGES 2+: FOLLOW-UP ACCOUNTABILITY (Chunked!)
  if (options.includeAccountability) {
    if (excuseChunks.length === 0) {
      // Draw empty table if selected but empty
      htmlPages += `
        <div class="pdf-page" style="width: 800px; height: 1130px; padding: 40px; box-sizing: border-box; position: relative; background-color: #ffffff; overflow: hidden; font-family: sans-serif;">
          <h3 style="font-size: 11pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #ef4444; padding-left: 8px; margin: 0 0 12px 0; color: #0f172a;">
            CRM Accountability & Missed Follow-ups
          </h3>
          <p style="font-size: 9pt; color: #64748b; font-style: italic;">All follow-ups completed on time.</p>
          ${getFooterHtml(currentPageNum++, totalPages)}
        </div>
      `;
    } else {
      excuseChunks.forEach((chunk, chunkIdx) => {
        htmlPages += `
          <div class="pdf-page" style="width: 800px; height: 1130px; padding: 40px; box-sizing: border-box; position: relative; background-color: #ffffff; overflow: hidden; font-family: sans-serif;">
            <h3 style="font-size: 11pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #ef4444; padding-left: 8px; margin: 0 0 12px 0; color: #0f172a;">
              CRM Accountability & Missed Follow-ups <span style="font-size: 8.5pt; color: #64748b; font-weight: normal; text-transform: none;">(Part ${chunkIdx + 1} of ${excuseChunks.length})</span>
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt; text-align: left;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #475569;">
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Employee</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Lead Name</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">${followUpLabel}</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Status</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Excuse / Explanation</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: center;">Follow-through</th>
                </tr>
              </thead>
              <tbody>
                ${chunk.map(item => {
                  const isPending = item.status === "Pending";
                  const statusBadgeStyle = isPending
                    ? "background-color: #fee2e2; color: #ef4444; border: 1px solid #fca5a5;"
                    : "background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;";

                  return `
                    <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${isPending ? "#fffafb" : "#ffffff"};">
                      <td style="padding: 8px 6px; font-weight: bold; color: #0f172a; vertical-align: middle;">${item.employeeName}</td>
                      <td style="padding: 8px 6px; color: #1e293b; font-weight: 600; vertical-align: middle;">${item.leadName}</td>
                      <td style="padding: 8px 6px; color: #475569; font-weight: 500; vertical-align: middle;">${item.scheduledDate}</td>
                      <td style="padding: 8px 6px; text-align: center; vertical-align: middle;">
                        <span style="display: inline-block; font-size: 7.5pt; font-weight: 900; text-transform: uppercase; padding: 3px 6px; border-radius: 4px; line-height: 1; text-align: center; ${statusBadgeStyle}">
                          ${item.status}
                        </span>
                      </td>
                      <td style="padding: 8px 6px; color: ${isPending ? "#ef4444" : "#334155"}; font-style: ${isPending ? "italic" : "normal"}; max-width: 220px; word-wrap: break-word; vertical-align: middle; font-weight: 500;">
                        ${item.reason}
                      </td>
                      <td style="padding: 8px 6px; text-align: center; font-weight: 700; color: ${item.followedThrough === "Yes" ? "#16a34a" : "#ca8a04"}; vertical-align: middle;">
                        ${item.followedThrough}
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>

            ${getFooterHtml(currentPageNum++, totalPages)}
          </div>
        `;
      });
    }
  }

  // PAGES: REVENUE & PIPELINE DEALS (Chunked!)
  if (options.includeRevenue) {
    if (dealChunks.length === 0) {
      htmlPages += `
        <div class="pdf-page" style="width: 800px; height: 1130px; padding: 40px; box-sizing: border-box; position: relative; background-color: #ffffff; overflow: hidden; font-family: sans-serif;">
          <h3 style="font-size: 11pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #16a34a; padding-left: 8px; margin: 0 0 12px 0; color: #0f172a;">
            Revenue Conversion & Pipeline Deals
          </h3>
          <p style="font-size: 9pt; color: #64748b; font-style: italic;">No deals in timeframe.</p>
          ${getFooterHtml(currentPageNum++, totalPages)}
        </div>
      `;
    } else {
      dealChunks.forEach((chunk, chunkIdx) => {
        htmlPages += `
          <div class="pdf-page" style="width: 800px; height: 1130px; padding: 40px; box-sizing: border-box; position: relative; background-color: #ffffff; overflow: hidden; font-family: sans-serif;">
            <h3 style="font-size: 11pt; font-weight: 900; text-transform: uppercase; border-left: 4px solid #16a34a; padding-left: 8px; margin: 0 0 12px 0; color: #0f172a;">
              Revenue Conversion & Pipeline Deals <span style="font-size: 8.5pt; color: #64748b; font-weight: normal; text-transform: none;">(Part ${chunkIdx + 1} of ${dealChunks.length})</span>
            </h3>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; text-align: left;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #475569;">
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Deal Name</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Owner</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Organization</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase;">Stage</th>
                  <th style="padding: 8px 6px; font-weight: 800; text-transform: uppercase; text-align: right;">Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${chunk.map(item => {
                  const isWon = item.stage?.toLowerCase() === "won";
                  const isLost = item.stage?.toLowerCase() === "lost";
                  const badgeStyle = isWon
                    ? "background-color: #dcfce7; color: #166534;"
                    : isLost
                    ? "background-color: #fee2e2; color: #991b1b;"
                    : "background-color: #f1f5f9; color: #475569;";

                  return `
                    <tr style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                      <td style="padding: 8px 6px; font-weight: bold; color: #0f172a;">${item.name}</td>
                      <td style="padding: 8px 6px; color: #475569;">${item.ownerName}</td>
                      <td style="padding: 8px 6px; color: #475569;">${item.organization}</td>
                      <td style="padding: 8px 6px;">
                        <span style="font-size: 7.5pt; font-weight: 900; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; ${badgeStyle}">
                          ${item.stage}
                        </span>
                      </td>
                      <td style="padding: 8px 6px; text-align: right; font-weight: bold; color: ${isWon ? "#15803d" : "#0f172a"};">
                        $${item.value.toLocaleString()}
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>

            ${getFooterHtml(currentPageNum++, totalPages)}
          </div>
        `;
      });
    }
  }

  container.innerHTML = htmlPages;
  document.body.appendChild(container);

  // Short delay to paint DOM elements before canvas drawing
  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    const pages = container.querySelectorAll(".pdf-page");
    const pdf = new jsPDF("p", "pt", "a4");
    
    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i] as HTMLElement;
      
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      
      // Add clickable hyperlink annotation overlay for heytracai.com (bottom right)
      pdf.link(pdfWidth - 40 - 80, pdfHeight - 40 - 12, 80, 14, { url: "https://www.heytracai.com" });
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
  } finally {
    document.body.removeChild(container);
  }
};
