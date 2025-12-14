# Product Requirements Document: `Plan2` Component

## 1. Overview

The `Plan2` component is a user interface element designed to interactively refine a user's hiring intent. Instead of presenting a static plan, it engages the user in a short, guided conversation to accurately determine the job role they are looking for. This component will replace the initial "plan" presentation in the user flow, creating a more dynamic and user-friendly experience.

## 2. Goals

*   To improve the accuracy of matching user needs to a specific job role.
*   To create a more engaging and interactive user experience.
*   To reduce user friction by guiding them towards a solution instead of presenting a static, potentially incorrect, plan.
*   To seamlessly integrate with the backend AI model for dynamic content generation.

## 3. User Flow & Component Stages

The `Plan2` component will have three primary stages.

### Stage 1: Initial Suggestion

1.  **Trigger:** The component is rendered after the user submits their initial query (e.g., "I need someone to make videos for my social media").
2.  **UI:**
    *   A subtle, non-bold heading: "we think you're looking for someone like this:"
    *   A bold, AI-generated job title (e.g., **"Social Media Video Editor"**).
    *   Two buttons:
        *   "Yes, that's right" (Green)
        *   "Not correct" (Red)
3.  **Loading State:** While the initial suggestion is being generated, a skeleton UI will be displayed to indicate activity. The skeleton should mimic the layout of the loaded content (a line for the heading, a thicker line for the title, and two button shapes).

### Stage 2: User Confirmation ("Yes, that's right")

1.  **Trigger:** The user clicks the "Yes, that's right" button.
2.  **Action:**
    *   The component's state is finalized.
    *   The confirmed job title and a generated "final query" (for semantic search) are passed to the parent component or a state management store.
    *   The UI might show a confirmation message or simply move to the next step in the application's user flow (e.g., showing search results, as indicated by "we have that and the final query working").

### Stage 3: User Correction ("Not correct")

1.  **Trigger:** The user clicks the "Not correct" button.
2.  **UI Change (Part A - The Question):**
    *   The initial suggestion UI is replaced.
    *   A single, AI-generated clarifying question is displayed (e.g., "Can you tell me what kind of videos you are looking for?").
    *   An input field for the user's answer is provided.
    *   A "Submit" button.
3.  **Loading State:** Skeletons will be used while waiting for the clarifying question and after the user submits their answer.

4.  **UI Change (Part B - The Final Proposal):**
    *   **Trigger:** The user submits their answer to the clarifying question.
    *   The question/input UI is replaced.
    *   A new, updated bold job title is displayed.
    *   Two new buttons appear:
        *   "Start Hiring"
        *   "Edit"
5.  **Action:**
    *   **"Start Hiring":** This indicates the end of the refinement process. The final job title and query are used to proceed.
    *   **"Edit":** This allows the user to manually edit the title or other parameters, providing an escape hatch from the AI-guided flow.

## 4. Technical Requirements

### `plan2.tsx` Component

*   A new file at `src/components/ai-elements/plan2.tsx`.
*   It will manage its own state through the different stages: `INITIAL_SUGGESTION`, `AWAITING_CORRECTION`, `FINAL_PROPOSAL`, and various `LOADING_*` states.
*   It will not use the `Collapsible` component like the original `Plan` component.
*   It will feature a clean, subtle UI with smooth transitions between states.
*   It must implement skeleton loading states for all asynchronous (AI call) operations.

### `src/lib/hiringAssistant.ts`

*   A new file to handle the multi-step AI conversation. This keeps the AI logic separate from the component.
*   This will contain three new asynchronous functions, each calling the Gemini API with a different prompt.

1.  **`getInitialRoleSuggestion(userQuery: string)`**
    *   **Prompt:** Takes the user's initial query and asks the AI to return a likely job title.
    *   **Returns:** `{ title: string, final_query: string }`

2.  **`getClarifyingQuestion(userQuery:string, rejectedTitle: string)`**
    *   **Prompt:** Takes the user's query and the rejected title, and asks the AI to generate a single, concise question to better understand the user's need.
    *   **Returns:** `{ question: string }`

3.  **`getRefinedRole(userQuery: string, rejectedTitle: string, userAnswer: string)`**
    *   **Prompt:** Takes the original query, the rejected title, and the user's answer to the clarifying question. It asks the AI to generate a new, more accurate title and a final query.
    *   **Returns:** `{ title: string, final_query: string }`

*   All functions will handle API calls, including error handling and parsing the JSON response. Zod schemas will be used to validate the expected responses for each function.

## 5. Non-Goals

*   This component will not handle the actual "hiring" or "search" process. It is only responsible for refining the user's intent into a job title and a search query.
*   The "Edit" functionality's implementation details are outside the scope of this initial version, but the button should be present in the final stage.
*   This component will not include "reasoning" text from the AI, as requested.

---

## Progress Update

### What's Done:

1.  **`plan2.md` created:** A detailed Product Requirements Document for the `Plan2` component was created.
2.  **`src/lib/hiringAssistant.ts` created:** This file contains the server-side AI interaction logic for initial role suggestion, clarifying questions, and refining roles.
3.  **API Routes created:** Three new API routes (`/api/hiring/suggestion`, `/api/hiring/question`, `/api/hiring/refine`) were implemented to securely expose the `hiringAssistant.ts` functions.
4.  **`src/components/ai-elements/plan2.tsx` created:** The `Plan2` component was implemented with robust state management, skeleton loading, and UI for all defined stages.
5.  **Integration into `src/app/search/[id]/page.tsx`:** The `Plan2` component has been successfully integrated into the search page, replacing the previous `Plan` component. It now handles the multi-stage hiring plan refinement process.
6.  **Bug Fix:** The issue of `GEMINI_API_KEY` not being accessible on the client-side has been resolved by implementing dedicated API routes for AI interactions, ensuring the API key remains secure on the server.

### What's Left:

*   The core functionality of the `Plan2` component and its integration is complete. No further steps are pending based on the initial request.

### What Was Removed:

*   **Original `Plan` component and related imports:** The compound `Plan` component and its sub-components (`PlanContent`, `PlanDescription`, etc.) from `@/components/ai-elements/plan` were removed from `src/app/search/[id]/page.tsx`.
*   **`Reasoning` component and related imports:** The `Reasoning` component and its sub-components (`ReasoningContent`, `ReasoningTrigger`) were removed from `src/app/search/[id]/page.tsx`.
*   **`PlanSkeleton` import and usage:** The `PlanSkeleton` component, previously used for loading states, was removed as `Plan2` now handles its own skeleton loading.
*   **Client-side AI function calls:** Direct calls to `getInitialRoleSuggestion`, `getClarifyingQuestion`, and `getRefinedRole` from `@/lib/hiringAssistant` within `plan2.tsx` were replaced by secure `fetch` calls to the new API routes.
*   **Client-side markdown editing logic:** The `isEditing` state, `planToMarkdown`, `markdownToPlan`, `handleEdit`, and `handleSave` functions, along with the associated UI for editing the plan in markdown format, were removed as they are not part of the new `Plan2`'s interactive refinement flow.
*   **Streaming reasoning logic:** The state and effects related to streaming `rawReasoning` content (`content`, `isStreamingReasoning`, `currentTokenIndex`, `tokens`, `chunkIntoTokens`) were removed, as the `Plan2` component does not display reasoning.

### UI Improvements (Future Considerations):

*   **"Edit" Button Functionality:** While the "Edit" button is present in the `SHOWING_REFINEMENT` stage, its functionality is a non-goal for the current implementation. Future work could involve implementing a modal or a separate view for users to fine-tune the `title` and `final_query` manually.
*   **Error Display:** Improve the user-facing error messages to be more actionable or provide options for retry.
*   **Animations:** Enhance transitions between stages with more subtle and fluid animations beyond basic opacity changes.
*   **Accessibility:** Review and ensure all new UI elements meet accessibility standards (e.g., keyboard navigation, screen reader support).
*   **Input Validation:** Add client-side validation for the user's answer in the `SHOWING_QUESTION` stage to provide immediate feedback.