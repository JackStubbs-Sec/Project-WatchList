# Project WatchList Agent Instructions

## Purpose

Use these instructions for future chats working in this repository.

## Environment

- OS: Windows
- Shell: PowerShell
- Workspace root: `C:\Users\Admin\OneDrive\Documents\AutoHotkey\VSCode\Repo\Project Watchlist`
- Node is installed at `C:\Program Files\nodejs`
- Git is installed at `C:\Program Files\Git\cmd`
- `node`, `npm`, and `git` may not be available on PATH by default in a fresh chat terminal session

Before running build, dev, or git commands in a terminal session, prepend PATH:

```powershell
$env:Path = 'C:\Program Files\nodejs;C:\Program Files\Git\cmd;' + $env:Path
```

## Build And Validate

- Always run a production build before pushing code changes:

```powershell
npm run build
```

- If `npm run dev` is needed, use:

```powershell
npm run dev
```

- If Vite crashes on a locked local asset in OneDrive, check watcher ignores in `vite.config.ts`

## Git Workflow

- This repository is already initialized with git
- Default branch: `main`
- Remote `origin` is already configured:

```text
https://github.com/JackStubbs-Sec/Project-WatchList.git
```

- Standard push flow after code changes:

```powershell
git add .
git commit -m "<clear summary>"
git push
```

- Prefer focused commit messages that describe the actual change

## Deployment

- Pushing to `main` triggers GitHub Pages deployment through:

```text
.github/workflows/deploy.yml
```

- Public app URL:

```text
https://jackstubbs-sec.github.io/Project-WatchList/
```

## iOS/PWA Notes

- The app is intended to be installed from Safari via Add to Home Screen
- If Home Screen icon or layout changes do not appear, remove the installed app and add it again after deployment completes

## Viewport Design And Testing Workflow

- When the user asks to design/test UI in "viewport", use the shared browser page and set an iPhone-sized viewport before evaluating layout
- Preferred baseline viewport for iPhone-style checks:

```text
width: 390
height: 844
```

- If needed for compact devices, also test:

```text
width: 375
height: 812
```

- Apply viewport with Playwright page resize before making final UI judgments
- In viewport-driven tasks, do both:
	- Visual validation: verify no horizontal overflow, clipped text, or overlapping controls
	- Functional validation: click/tap target buttons/links and confirm critical flows still work
- After UI edits for viewport tasks, run:

```powershell
npm run build
```

- For viewport bug reports, capture evidence by checking page state and widths (for example compare `clientWidth` vs `scrollWidth`)
- Treat iPhone viewport behavior as release-blocking for Home, Discover, Library, Detail, Lists, and Profile screens

## Expectations For Future Chats

- Make requested code changes directly unless the user asks only for explanation
- Validate with `npm run build` before pushing
- If asked to publish changes, commit and push to `main`
- If a GitHub Actions or Pages issue appears, fix the workflow or deployment config and push the fix