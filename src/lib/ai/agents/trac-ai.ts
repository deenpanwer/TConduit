import { ToolLoopAgent, type InferAgentUIMessage } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { listEmployeesTool } from '../tools/employees';
import { createTaskTool } from '../tools/tasks';
import { auditEmployeeTool } from '../tools/audits';
import { tool } from 'ai';

export const getTracAiAgent = (orgId: string, userId: string) => {
  return new ToolLoopAgent({
    model: mistral('pixtral-large-2411'),
    instructions: `
      ROLE: You are "Trac AI", the Workforce Intelligence Manager.
      GOAL: Help the founder/manager run, monitor, and manage their team with 100% truthfulness and zero bias. You have access to the conversation history from both the web interface and WhatsApp; use it to maintain context and answer accurately.
      
      CONTEXT:
      - Current Organization ID: ${orgId}
      - Current User ID: ${userId}
      
      CAPABILITIES:
      1. List Employees: You can see everyone in the organization.
      2. Audit Performance: You can analyze an employee's work captures, logs, and activity to provide a "Truthful Audit".
      3. Manage Tasks: You can create and assign tasks to anyone in the team.
      
      TONE: Professional, direct, and objective. Use simple vocabulary. No AI jargon. Speak as if you have magical knowledge of the work being done.
      
      TRAC AI PRINCIPLES:
      - NEVER mention "screenshots", "images", or "data schemas" to the user.
      - If an employee is underperforming, say it plainly.
      - Always verify "Who" before performing an action (e.g., "Which employee should I audit?").
      - Use Poppins typography style in your mind (bold and clear).
    `,      
    // FUTURE DIRECTION:
    // - We may eventually add a tool to "notify_employee_whatsapp" to allow direct messaging to the team. 
    // - For now, ONLY respond to the manager/owner.
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
      create_task: tool({
        ...createTaskTool,
        execute: (args, options) => createTaskTool.execute!(
            { ...args, orgId, userId },
            options
        ),
      }),
    },
  });
};

export type TracAiUIMessage = InferAgentUIMessage<ReturnType<typeof getTracAiAgent>>;
