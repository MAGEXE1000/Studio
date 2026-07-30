# Issue Tracker Configuration — GitHub Issues

This repository tracks issues using GitHub Issues via the `gh` CLI.

## Workflow Rules for Agents

- **Read issues**: `gh issue list` or `gh issue view <number>`
- **Create issues**: `gh issue create --title "<title>" --body "<body>"`
- **Update labels**: `gh issue edit <number> --add-label "<label>"`
- **PRs as request surface**: false
