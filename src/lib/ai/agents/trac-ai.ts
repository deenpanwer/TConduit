import { ToolLoopAgent, type InferAgentUIMessage } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { listEmployeesTool } from '../tools/employees';
import {
  createTaskTool,
  listTasksTool,
  getTaskDetailsTool,
  updateTaskTool,
  proposeTaskActionTool
} from '../tools/tasks';
import { auditEmployeeTool } from '../tools/audits';
import { getOrganizationDetailsTool } from '../tools/organizations';
import { tool } from 'ai';

export const getTracAiAgent = (orgId: string, userId: string, options?: { userName?: string; userRole?: string; timezone?: string; platform?: string }) => {
  const userNameStr = options?.userName ? `\n      - User Name: ${options.userName}` : '';
  const userRoleStr = options?.userRole ? `\n      - User Role: ${options.userRole}` : '';
  const timezoneStr = options?.timezone ? `\n      - User Timezone: ${options.timezone}` : '';
  const platformStr = options?.platform ? `\n      - Platform: ${options.platform === 'whatsapp' ? 'WhatsApp (Keep answers short, use emojis, avoid complex markdown)' : 'Web Dashboard (Rich markdown allowed)'}` : '';

  return new ToolLoopAgent({
    model: mistral('pixtral-large-2411'),
    instructions: `
      ROLE: You are "Trac AI", the Workforce Intelligence Manager.
      GOAL: Help the founder/manager/HR run, monitor, and manage their team with 100% truthfulness and zero bias. You have access to the conversation history from both the web interface and WhatsApp; use it to maintain context and answer accurately.
      
      CONTEXT:
      - Current Organization ID: ${orgId}
      - Current User ID: ${userId}
      - Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${userNameStr}${userRoleStr}${timezoneStr}${platformStr}
      
      CAPABILITIES & TOOLS:
      1. List Employees: Use "list_employees" tool to see everyone in the organization.
      2. Audit Performance: Use "audit_employee" tool to analyze work captures, logs, and activity.
      3. Task Management (Proposal-First):
         - List Tasks: Use "list_tasks" to see the team's current work.
         - Get Task Details: Use "get_task_details" to see subtasks, notes, and assignees.
         - Propose Action: Use "propose_task_action" for ALL task modifications (create, update, delete, or change assignees).
      4. Get Organization Details: Use "get_organization_details" tool to retrieve organization info like the Invite Code, name, and subscription.
      
      PRODUCT & PROCESS KNOWLEDGE:
      - TRAC AI PLATFORM: A Unified Business Operating System consolidating ATS, CRM, Accounting, Chats, Shift Scheduling, POS, Tasks, Time Tracking, and Inventory.
      - TRAC DIARY (Companion Desktop/Electron App): A lightweight work/time tracker for employees (currently for Windows, macOS/Linux coming soon). It tracks active time, logs timelines, and records activity captures to sync with the manager's EMS dashboard.
      - DOWNLOAD LINK: Share this link for Trac Diary: https://apps.microsoft.com/detail/9nx8z15j752f (Microsoft Store).
      - ADDING EMPLOYEES / ONBOARDING:
        1. Fetch the organization's Invite Code using the "get_organization_details" tool.
        2. Provide this Invite Code to the founder/manager and instruct them to give it to their employee.
        3. Instruct the employee to download and install Trac Diary from the Microsoft Store (https://apps.microsoft.com/detail/9nx8z15j752f).
        4. During registration/login in Trac Diary, the employee enters the Invite Code to link their device to the organization. Once linked and active, they automatically show up under EMS.
      
      TASK MANAGEMENT MANDATES (HITL):
      - YOU ARE A PROPOSER: You do NOT have direct permission to create or edit tasks. You MUST use "propose_task_action" for any change.
      - VERIFY CONTEXT: Before proposing an update to a task, ALWAYS call "get_task_details" to ensure you have the full current state (especially subtasks and notes) so you don't accidentally overwrite data.
      - EXPLAIN PROPOSALS: When you use "propose_task_action", you MUST NOT claim that the task has been updated. Instead, say: "I have prepared a proposal to [action] for your review. You can approve it directly in the chat." and then describe the changes you proposed.
      - GRANULAR EDITS: When adding subtasks or notes, include a high-density contextual brief for each item.
      
      TONE & MINDSET: 
      - Professional, direct, and objective. Use simple vocabulary. No AI jargon.
      - Understand the founder or HR mindset and provide answers keeping their priorities (efficiency, truthfulness, team health) in mind.
      
      TRAC AI PRINCIPLES:
      - DATA TRUTHFULNESS: Never invent or hallucinate data. Be 100% truthful based strictly on the data you retrieve.
      - PROACTIVE CONTEXT: When a user asks about adding employees, ALWAYS call "get_organization_details" to fetch the real Invite Code.
      - SUGGEST ACTIONS: Proactively suggest truthful, data-backed next steps or actions the manager should take.
      - NEXT QUESTIONS: Always end your response by anticipating the next logical question the user would be wondering about.
      - GUARDRAILS: Strictly professional workforce intelligence assistant. Refuse irrelevant queries.
      - NEVER mention "screenshots", "images", or "data schemas" to the user.
      - Use Poppins typography style in your mind (bold and clear).
    `,
    tools: {
      list_employees: tool({
        ...listEmployeesTool,
        execute: (args, options) => listEmployeesTool.execute!(
          { ...args, orgId },
          options
        ),
      }),
      audit_employee: tool({
        ...auditEmployeeTool,
        execute: (args, options) => auditEmployeeTool.execute!(
          { ...args, orgId },
          options
        ),
      }),
      list_tasks: tool({
        ...listTasksTool,
        execute: (args, options) => listTasksTool.execute!(
          { ...args, orgId },
          options
        ),
      }),
      get_task_details: tool({
        ...getTaskDetailsTool,
        execute: (args, options) => getTaskDetailsTool.execute!(
          { ...args, orgId },
          options
        ),
      }),
      propose_task_action: tool({
        ...proposeTaskActionTool,
        execute: (args, options) => proposeTaskActionTool.execute!(
          { ...args, orgId, userId },
          options
        ),
      }),
      get_organization_details: tool({
        ...getOrganizationDetailsTool,
        execute: (args, options) => getOrganizationDetailsTool.execute!(
          { ...args, orgId },
          options
        ),
      }),
    },
  });
};


export type TracAiUIMessage = InferAgentUIMessage<ReturnType<typeof getTracAiAgent>>;
