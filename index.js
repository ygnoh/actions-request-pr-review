const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

const authFetch = url => axios({
    method: "get",
    headers: {
        Authorization: `token ${core.getInput("token")}`
    },
    url
}).then(res => res.data);

class Pull {
    constructor(pullInfo) {
        const {title, html_url, number} = pullInfo;

        this._title = title;
        this._url = html_url;
        this._number = number;
        this._reviewers = [];
    }

    get number() {
        return this._number;
    }

    addReviewer(reviewer) {
        this._reviewers.push(reviewer);
    }
}

const pulls = [];

(async () => {
    try {
        const BASE_URL = github.context.payload.repository.url;
        // const BASE_URL = "https://api.github.com/repos/ygnoh/actions-tutorial";
        const fetchPulls = () => authFetch(`${BASE_URL}/pulls`);
        const fetchReviewers = number => authFetch(`${BASE_URL}/pulls/${number}/requested_reviewers`)
            .then(({users/* , teams */}) => users); // 팀 단위로 리뷰를 요청한 경우는 고려하지 않는다
        const fetchUser = url => authFetch(url);

        for (const pullInfo of await fetchPulls()) {
            const pull = new Pull(pullInfo);

            pulls.push(pull);

            for (const user of await fetchReviewers(pull.number)) {
                const {url} = user;

                pull.addReviewer(await fetchUser(url));
            }
        }

        console.log(pulls);
        // todo send notifications
    } catch (e) {
        core.setFailed(e.message);
    }
})();
