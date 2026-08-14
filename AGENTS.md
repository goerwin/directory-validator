# AGENTS.md

- Keep responses concise. Skip unnecessary detail.
- If instructions conflict, ask for clarification.
- Avoid long comments on functions, constants, classes, etc. Be concise or avoid them if code is self-explanatory
- Point out incorrect assumptions, mistakes, or misunderstandings when they affect the solution. Do not validate incorrect conclusions.
- When making technical decisions, prioritize correctness, simplicity, robustness, scalability, and long-term maintainability over implementation effort, unless the user explicitly asks for the quickest or lowest-cost solution.
- If a branch is needed to start new work, branch from `main` or any other if explicitely asked by the user, with a matching prefix (`feat/`, `fix/`, `refactor/`, `docs/`, `chore/`).
- Preserve the user's existing coding style unless there is a clear reason to change it.
- Keep changes focused. Avoid unrelated refactors or drive-by improvements unless they are necessary to implement the requested change.
- Avoid duplicating logic, component structure, or styles. Extract shared code when duplication is intentional and likely to be maintained together, but do not introduce unnecessary abstractions for one-off cases.

## Git

- Never push to `main`. Confirm before commit/push.
- Never add an agent or other name as a co-author.
- Verify lint, typecheck, build, and tests pass before pushing.
- Use Conventional Commits: `feat`, `fix`, `refactor`, `docs`, or `chore`. Keep messages to one line unless the why isn't obvious. Keep commits atomic. Never commit secrets.
- Skip the pre-commit hooks with `--no-verify`. We already verify before pushing.
