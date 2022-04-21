# request-pr-review

슬랙으로 PR 리뷰 요청을 보내는 Github Actions

<img src="https://user-images.githubusercontent.com/13075245/164355227-bb405486-d598-4414-b654-2129826b039c.png" width="500" alt="intro">

## Usage

1. 메시지 전달을 위해 `SLACK_BOT_TOKEN` 이름의 secret을 세팅하세요.

> 세팅할 Repo > Settings > Secrets > New repository secret

이때, Value는 슬랙에서 제공하는 `xoxb-` 형태의 토큰이어야 합니다.

2. `.github/workflow/request-pr-review.yml` 파일을 만드세요:

```yml
name: Request PR Review

on:
  schedule:
    - cron: '0 1 * * 1-5' # 평일 오전 10시마다 수행
    
jobs:
  cron:
    runs-on: [self-hosted]
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

**Required** Github에서 제공하는 토큰

### `slackBotToken`

**Required** slack bot을 통해 메시지를 보내기 위한 토큰

e.g. `xoxb-798572638592-435243279588-9aCaWNnzVYelK9NzMMqa1yxz`

### `repoUrl`

**Required** 본 액션이 적용될 Github Repo URL

e.g. `github.com/username/reponame`

