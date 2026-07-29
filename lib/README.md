# lib/ — Standalone Libraries

> **Platform scope**: None (framework-agnostic)  
> **Consumers**: Tooling, back-end scripts, code generation

## Purpose

Standalone TypeScript packages used by tooling or back-end scripts. These packages have **no workspace dependencies** — they never import from `packages/*` or `apps/*`.

## Packages

| Package | Path | Purpose |
|---------|------|---------|
| **api-spec** | `lib/api-spec/` | OpenAPI YAML source definition (`openapi.yaml`). Input for Orval code generation. |
| **api-zod** | `lib/api-zod/` | Zod schemas auto-generated from api-spec via Orval. **Do not hand-edit.** |
| **api-client-react** | `lib/api-client-react/` | React Query hooks auto-generated from api-spec. **Do not hand-edit.** |
| **db** | `lib/db/` | Drizzle ORM schema for the Supabase PostgreSQL database. |

## Rules

- `api-zod` and `api-client-react` are **auto-generated** — regenerate with Orval when the OpenAPI spec changes
- Never modify generated files by hand
- `api-spec` changes require user approval (see README.md user preferences)
