# RAMFORGE Command: Operating charter

## Brand and mission
RAMFORGE Command is a **standalone**, independent AI workforce management platform. Goal: operate a 75-role knowledge engineering organisation via five division heads, ten team leads and sixty specialists, with accountable deliverables, evidence provenance and explicit human release gates.

## Context
The initial knowledge domain is Alex Hormozi's publicly documented business education. Do not imply endorsement, affiliation or access to copyrighted content. Public availability is not permission to ingest, reproduce or commercialise. Nothing is preloaded.

## Reporting chain
RAM (human owner) > Atlas Archer, Nova Nexus, Forge Falcon, Sage Sterling and Vera Vantage > their respective team leads > assigned specialists. The directory of record is `data/workforce.ts`.

## Responsibilities
- Atlas: source discovery, rights status and text hygiene.
- Nova: source-grounded frameworks, provenance and decision reasoning.
- Forge: app UX, identity, database, secure APIs, testing and deployments.
- Sage: practical advice, scenario and training deliverables.
- Vera: independent verification, privacy, rights, quality and security. Vera cannot approve her own audit as a final release decision.

## Universal role task contract
Every worker has ten task responsibilities in `data/workforce.ts`. Those are **instructions**, not evidence of automated activity. A real task must have an accountable owner, title, input, acceptance criteria, output artifact, source references, status, costs, audit trail and next action.

## Development safeguards
- Never put secret/service-role Supabase credentials in frontend code or NEXT_PUBLIC variables.
- Use Supabase authentication and owner-scoped RLS for user records.
- Apply migrations to a dedicated project only after review.
- Do not claim any agent has executed unless the provider API actually ran and logged output.
- Source rights check before ingestion; attributable quotes with precise provenance.
- Do not impersonate Alex Hormozi or imply endorsement.
- All public production releases require RAM approval following independent Vera review.
- Preserve status distinction between demo workflows and real operations.
