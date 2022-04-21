# request-pr-review

Github Actions to request PR reviews using Slack

<img src="https://user-images.githubusercontent.com/13075245/164359905-a63a6782-1a77-41ca-aed5-f453af1d99e2.png" width="500" alt="intro">

## Usage

1. Set the secret `SLACK_BOT_TOKEN` for messaging

> Your repository > Settings > Secrets > New repository secret

The Value have to be a token in the form of `xoxb-` provided by Slack.

2. Create a file `.github/workflow/request-pr-review.yml`:

```yml
name: Request PR Review

on:
  schedule:
    - cron: '0 1 * * 1-5' # The notification period you want. See https://crontab.guru/
    
jobs:
  requestReview:
    runs-on: ubuntu-latest
    steps:
      - name: Request PR Review
        uses: ygnoh/actions-request-pr-review@v1.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          slackBotToken: ${{ secrets.SLACK_BOT_TOKEN }}
          repoUrl: 'https://github.com/ygnoh/actions-tutorial'
```

## Inputs

### `token`

**Required** A token provided by Github

### `slackBotToken`

**Required** A token of your Slack Bot for sending messages

e.g. `xoxb-798572638592-435243279588-9aCaWNnzVYelK9NzMMqa1yxz`

### `repoUrl`

**Required** URL of your repository

e.g. `github.com/username/reponame`

