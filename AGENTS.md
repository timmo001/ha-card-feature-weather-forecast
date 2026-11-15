# Weather Forecast Card Feature

A Home Assistant custom card feature
(`custom:hui-weather-forecast-card-feature`) that renders weather forecast
slots inside a tile card. It is written in TypeScript with Lit and built with
rolldown into a single file in `dist/`.

## Stack

- pnpm, pinned in `mise.toml` with Node and the lint tools. Don't switch to
  another package manager.
- Dependencies are pinned to exact versions (`pnpm add -E`).
- Tests with vitest, lint with oxlint using `@timmo001/oxlint-rules`
  (type-aware), formatting with Prettier.
- `.agents/skills/` is synced from `timmo001/skills` (see `skills-lock.json`).
  Don't edit it here.

## Checks

- `pnpm lint`, `pnpm test`, `pnpm build` and `pnpm format` (`prettier --write`).
- The hk pre-push hook (`hk.pkl`) runs Markdown, YAML, Actions and shell lints,
  plus oxlint, on the files a push changes. Run `hk check <files>` to check by
  hand, and `hk validate` after editing `hk.pkl`.
- CI runs HACS validation, lint and build from the shared workflows in
  `timmo001/workflows`.
- Renovate extends `timmo001/renovate-config`, and `renovate-automerge.yml`
  merges the updates that pass.

## Releases

- `release.yml` runs when a GitHub release is published, and attests the built
  card.
- `pnpm publish-to-local` copies a build to a running Home Assistant over SSH,
  configured by `.env` (see `.env.example`).

## Agents

- Agent permissions are in `opencode.json` and `.claude/settings.json`. Don't
  edit `.opencode/opencode.jsonc`, which is generated.
- Only commit or push when asked.
