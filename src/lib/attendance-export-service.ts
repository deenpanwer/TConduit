import { AttendanceLog } from "@/hooks/use-attendance";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { format, parseISO, parse } from "date-fns";

const formatShiftTime = (shiftStr: string) => {
  if (!shiftStr || shiftStr === "Flexible" || shiftStr === "Not Set") return shiftStr;
  try {
    const parts = shiftStr.split(" - ");
    if (parts.length !== 2) return shiftStr;
    const formatTime = (t: string) => {
      const timeToParse = t.trim().substring(0, 5);
      const parsed = parse(timeToParse, "HH:mm", new Date());
      return format(parsed, "hh:mm a");
    };
    return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
  } catch (e) {
    return shiftStr;
  }
};

export const generateAttendanceFile = async (
  logs: AttendanceLog[],
  formatType: 'csv' | 'xlsx',
  filename: string
) => {
  if (formatType === 'csv') {
    const exportData = logs.map(log => ({
      'Member': log.userName,
      'Date': log.date,
      'Shift': formatShiftTime(log.shift),
      'Clock In': log.clockIn ? format(parseISO(log.clockIn), "hh:mm:ss a") : "--:--",
      'Clock Out': log.clockOut ? format(parseISO(log.clockOut), "hh:mm:ss a") : "--:--",
      'Late': log.late,
      'Extra Worked': log.extraWorked,
      'Break Time (h)': log.breakTime,
      'Active Time (h)': log.activeTime,
      'Idle Time (h)': log.idleTime,
      'Keystrokes': log.keystrokes,
      'Mouse Clicks': log.mouseClicks,
      'Assigned Tasks': log.assignedTasksCount,
      'Total Hours (h)': log.totalHours,
    }));
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    worksheet.columns = [
      { header: 'Member', key: 'member', width: 20 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Shift', key: 'shift', width: 20 },
      { header: 'Clock In', key: 'clockIn', width: 15 },
      { header: 'Clock Out', key: 'clockOut', width: 15 },
      { header: 'Late', key: 'late', width: 10 },
      { header: 'Extra Worked', key: 'extra', width: 15 },
      { header: 'Break (h)', key: 'break', width: 10 },
      { header: 'Active (h)', key: 'active', width: 10 },
      { header: 'Idle (h)', key: 'idle', width: 10 },
      { header: 'Keystrokes', key: 'keys', width: 12 },
      { header: 'Clicks', key: 'clicks', width: 10 },
      { header: 'Assigned Tasks', key: 'tasks', width: 15 },
      { header: 'Total (h)', key: 'total', width: 10 },
    ];

    // Freeze the first row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: 'FF0284C7' } // Professional blue
      };
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle',
        wrapText: true 
      };
      cell.border = { 
        bottom: { style: 'thin', color: { argb: 'FF0369A1' } } 
      };
    });

    logs.forEach(log => {
      const isAbsent = !log.clockIn && log.activeTime === 0 && log.totalHours === 0;
      
      const row = worksheet.addRow({
        member: log.userName,
        date: log.date,
        shift: formatShiftTime(log.shift),
        clockIn: log.clockIn ? format(parseISO(log.clockIn), "hh:mm:ss a") : (isAbsent ? "Absent" : "--:--"),
        clockOut: log.clockOut ? format(parseISO(log.clockOut), "hh:mm:ss a") : (isAbsent ? "Absent" : "--:--"),
        late: log.late,
        extra: log.extraWorked,
        break: log.breakTime,
        active: log.activeTime,
        idle: log.idleTime,
        keys: log.keystrokes,
        clicks: log.mouseClicks,
        tasks: log.assignedTasksCount,
        total: log.totalHours,
      });

      if (isAbsent) {
        row.eachCell((cell) => {
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'FFFEE2E2' } // Tailwind red-100
          };
          cell.font = { 
            color: { argb: 'FFDC2626' }, // Tailwind red-600
            bold: true
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }
};
