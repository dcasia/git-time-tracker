# git-time-tracker

---

## Usage

You can use the [Git Time Tracker GitHub Action](https://github.com/dcasia/git-time-tracker) in a [GitHub Actions Workflow](https://help.github.com/en/articles/about-github-actions) by configuring a YAML-based workflow file, e.g. `.github/workflows/time-tracker.yml`, with the following:

```yaml
name: Time Tracker

on:
  push:
  issue_comment:
  pull_request:
    types:
      - opened
      - closed
      - edited

jobs:
  test:
    runs-on: ubuntu-20.04
    name: Track Time
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Update PR Title
        uses: dcasia/git-time-tacker
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          durationPattern: 'h:mm'
          titlePattern: '[:duration] capitalize(:title)'
```

# Configuration Options

| Key                   | Required | Description                                                                                                                                                                                                      |
|-----------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `token`               | Required | Usually set to `secrets.GITHUB_TOKEN`.                                                                                                                                                                           |
| `scanPullRequestBody` | Optional | Scan the pull request body in search for time annotations. Default: `true`.                                                                                                                                      |
| `scanComments`        | Optional | Scan every comment posted on the pull request in search for time annotations. Default: `true`.                                                                                                                   |
| `durationPattern`     | Optional | Define the pattern you would like to see the duration, it is formatted using [Luxon Duration](https://moment.github.io/luxon/docs/class/src/duration.js~Duration.html#instance-method-toFormat). Default: `h:mm` |
| `titlePattern`        | Optional | Define the pattern you would like for the title of the PR. Default: `[:duration] capitalize(:title)`                                                                                                             |

# Functions

These functions can be applied directly to the `titlePattern`, e.g:

```yml
titlePattern: ':duration • capitalize(trim(:title))'
```

| Key            | Description                                                                              |
|----------------|------------------------------------------------------------------------------------------|
| `title()`      | Convert value to title case. e.g: from `example one and two` to `Example One and Two`    |
| `capitalize()` | Capitalize the first character. e.g: from `example one and two` to `Example one and two` |
| `trim()`       | Remove white spaces before and after string.                                             |
| `trimLeft()`   | Remove white spaces at the start of the string.                                          |
| `trimRight()`  | Remove white spaces at the end of the string.                                            |
| `upper()`      | Convert all characters to upper case.                                                    |
| `lower()`      | Convert all characters to lower case.                                                    |

# Title Pattern Tokens

These tokens are used `titlePattern`:

| Key         | Description                                                                                                      |
|-------------|------------------------------------------------------------------------------------------------------------------|
| `:duration` | Is replaced with the computed duration masked by `durationPattern`, for example: `[h'h'm'm']` outputs `[12h37m]` |
| `:title`    | The current title from the pull request.                                                                         |
