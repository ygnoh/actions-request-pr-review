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
const userUrlEmailPair = {};

(async () => {
    try {
        const BASE_URL = github.context.payload.repository.url;
        const fetchPulls = () => authFetch(`${BASE_URL}/pulls`);
        const fetchReviewers = number => authFetch(`${BASE_URL}/pulls/${number}/requested_reviewers`)
            .then(({users/* , teams */}) => users); // 팀 단위로 리뷰를 요청한 경우는 고려하지 않는다
        const fetchUser = url => authFetch(url);
        const pulls = await fetchPulls();

        for (const pull of pulls) {
            const {number} = pull;
            const users = await fetchReviewers(number);

            for (const user of users) {
                const {url} = user;

                if (userUrlEmailPair[url]) {
                    return;
                }

                const info = await fetchUser(url);
                const {email} = info;

                userUrlEmailPair[url] = email;
            }
        }

        console.log(JSON.stringify(userUrlEmailPair, undefined, 2));
        // todo send notifications
    } catch (e) {
        core.setFailed(e.message);
    }
})();
