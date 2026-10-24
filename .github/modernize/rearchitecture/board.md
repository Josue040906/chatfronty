## User Input

> Restructure the existing Chatbot / AI Agent module in this repository to address tool-schema bloat and response latency. Inspect the current frontend/backend implementation and make the changes end-to-end: retain a single global agent-profile retrieval tool with concise structured JSON; update system instructions and avoid re-fetching a profile already present in conversation context; enable streaming from the configured LLM through backend route/controller and frontend chat; cap history with a sliding window; select the fastest suitable model already supported/configured. Preserve existing behavior and project conventions, modify only relevant files, and run targeted validation. Before editing, report the exact files you intend to change to the user-facing task result, then implement. Do not touch unrelated project areas. Do not create extra planning docs. If requirements cannot be determined safely from existing code, stop and ask a focused clarification.

**Project started**: 2026-10-23T23:27:00Z

## Tasks

### Phase: Architecture reconnaissance
- ⏳ t1 [architect] Inspect chatbot architecture and identify exact pre-edit file list (no edits)

### Phase: Implementation
- ⏳ t2 [backend] Implement profile-tool, prompt/context, history-window, model-selection, and server streaming changes [deps: t1]
- ⏳ t3 [frontend] Implement streamed chat response handling while preserving existing behavior [deps: t1]

### Phase: Smoke test
- ⏳ t4 [architect] Run independent build and startup smoke test [deps: t2, t3]

### Phase: Runtime validation
- ⏳ t5 [tester] Run targeted chatbot streaming and regression validation [deps: t4]
