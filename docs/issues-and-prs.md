# Issues and pull requests

Keep each issue or PR focused on one problem. Search existing issues and PRs
before opening a new one. Never include credentials or private applicant data.

## Create an issue

On GitHub, choose **Issues → New issue** and select **Bug report** or
**Improvement**.

- Use a specific title: “Project search drops the selected category”.
- For bugs, include the page, steps to reproduce, expected and actual behavior,
  and browser/device. Add a screenshot or relevant error when helpful.
- For improvements, explain who needs it, the proposed behavior, and what would
  make it done. Small content and design changes can use this template too.

## Create a PR

1. Create a branch for one change, such as `fix/project-category-filter`.
2. Implement and review the diff. For code, run `pnpm test`, `pnpm check`, and
   `pnpm build`; for docs only, check links and run `git diff --check`.
3. Commit and push the branch, then use **Compare & pull request** on GitHub.
4. Use a title such as `fix(projects): preserve category when searching` or
   `docs: clarify local setup`. Fill in the PR template with what changed, why,
   and the checks you actually ran. Include failures or checks not run.
5. Link an issue with `Closes #123` only when the PR resolves it; otherwise use
   `Related to #123`. Add before/after screenshots for UI and a short recording
   for motion or interaction changes. Upload evidence to the PR.

Open a draft if work or verification is still incomplete. An issue is useful
for discussion, but isn't required for a small, self-contained fix.

## Using GitHub CLI

With `gh` authenticated, run these from this repository. Write the relevant
issue or PR template sections into a temporary Markdown file first; CLI bodies
should follow the same structure as GitHub's forms.

```sh
gh issue list --search "category filter"
gh pr list --search "category filter"
gh issue create --title "Project search drops the selected category" --body-file /tmp/asilo-issue.md
gh pr create --draft --title "fix(projects): preserve category when searching" --body-file /tmp/asilo-pr.md
```
