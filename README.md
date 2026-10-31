# Trailmark

Trailmark is a knowledge-handover platform built for **WCC Forge 48** (We Code Coders). When a team member leaves a project, it reads the project's authorised sources, finds what is missing or unclear, asks the departing member about those gaps, and gives the incoming member a reviewed, evidence-linked handover.

## The problem

When someone leaves a project, the files stay but much of what they knew leaves with them: why decisions were made, what was left half done, which parts depend on others, what usually breaks, and who to ask. This knowledge is scattered across chats, commits, pull requests, task boards and meeting notes, and often exists only in the leaver's memory. The incoming member has to rebuild the picture from fragments, and the remaining team loses time to questions and rework.

## How Trailmark works

1. **Connect.** The project lead connects authorised sources: a code repository, documents, a chat export and a task list, and sets who may see each one.
2. **Reconstruct.** Trailmark rebuilds the project's current state: decisions and their reasons, owners, unfinished work, dependencies, risks and key contacts. Each item keeps a link to its source.
3. **Verify.** Every statement is labelled:
   - **Verified**: supported by a source, shown with the link.
   - **Unverified**: stated by the departing member only.
   - **Missing or conflicting**: nothing was found, or sources disagree. Trailmark says so and does not fill the gap.
4. **Ask.** For each gap, the departing member gets a specific question together with the evidence that raised it. Unanswered questions stay visible as open gaps.
5. **Review.** The project lead edits, rejects, resolves conflicts (with a written reason) and approves. Every change is versioned, and nothing is shared until a person approves it.
6. **Hand over.** The incoming member sees only the approved handover, filtered to their permissions, with what they own, unfinished work, risks, dependencies, open questions and a recommended order of next actions. Each statement links to its source, and they confirm receipt.

## Key principles

- **Traceable:** important statements link back to their supporting sources.
- **Honest about uncertainty:** missing, unverified and conflicting information is shown, not hidden or guessed.
- **Permission-aware:** summaries and derived statements inherit the restrictions of their sources, and restricted content is hidden or redacted.
- **Human-controlled:** a person reviews, corrects and approves every handover.

## Planned technology

- Frontend: React (Next.js)
- Backend: Python, FastAPI
- Database: PostgreSQL with pgvector
- AI: a large language model API, with structured output and claim-support checks
- Containers: a minimal Docker setup
- Hosting: Vercel (frontend) and Render (backend and database)

## Status

Planning stage (Round 1 of WCC Forge 48). There is no installable build yet. Setup instructions, testing notes, known limitations and a roadmap will be added here as the project is built.

## Team

| Member | GitHub | Main areas |
| --- | --- | --- |
| Kishan S (team leader) | [KishanSadeesh](https://github.com/KishanSadeesh) | Frontend, synthetic demo project, testing, deployment, demonstration |
| Tharun Sridhar | [tharunsridhar](https://github.com/tharunsridhar) | AI pipeline, backend, access control, Docker, documentation |

Both members work together across the project.

The repository is owned by the GitHub account `try2mastercode`, which belongs to Tharun Sridhar. All commits come from the two members' own accounts listed above.

## Disclosure

- Demonstration data will be synthetic and will be disclosed as such.
- AI assistance used in development, including AI-generated code, will be disclosed in this repository.
- External services planned: a large language model API, GitHub, Vercel and Render.
