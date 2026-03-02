# Atlas Workflows Library

This folder is Atlas UX's workflow library.

## Structure

- `workflows/registry.ts`
  Atlas-native workflow handlers (TypeScript) that run inside the backend.

## How Atlas Uses Workflows

Atlas treats workflows as governed automation sequences:

1. Atlas receives a request (UI / API)
2. Atlas writes an **audit log** entry and (optionally) a **decision memo / approval**
3. Atlas triggers the workflow via the engine loop
4. Atlas stores the result and writes a final audit log entry
