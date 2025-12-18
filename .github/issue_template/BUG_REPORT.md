---
name: Bug Report
about: Found something broken? Let us know!
labels: bug
---

## Describe the Bug

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

What did you expect to happen?

## Screenshots

If applicable, add screenshots to help explain the problem.

## Environment

- **Browser:** (e.g., Chrome 120, Safari 17)
- **Device:** (e.g., Desktop, iPhone 15)
- **OS:** (e.g., macOS 14, Windows 11)

## Possible Solution

Any thoughts on what might be causing this or how to fix it?

---

## Want to Fix It Yourself?

We'd love your help! Here's how to get started:

<details>
<summary><strong>Quick Setup Guide</strong></summary>

```bash
# 1. Fork and clone
git clone git@github.com:your-username/legesher-dot-io.git
cd legesher-dot-io

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start the dev server
npm run dev
```

The site will be running at `localhost:4321`.

**Testing Commands:**
| Command           | What it does                                |
| :---------------- | :------------------------------------------ |
| `npm run dev`     | Start local dev server with hot reload      |
| `npm run build`   | Build production site (catches errors)      |
| `npm run preview` | Preview the production build locally        |

**Submitting Your Fix:**
1. Create a branch: `git checkout -b fix/describe-the-bug`
2. Make your changes and test locally
3. Run `npm run build` to ensure no errors
4. Commit with a clear message: `fix: description of what you fixed`
5. Open a pull request referencing this issue

</details>
