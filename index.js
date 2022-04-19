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
const createRequestPRData = (user) => ({
    text: "좋은 아침이에요 :wave:",
    blocks: [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "좋은 아침입니다 :wave:"
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `<@${user.name}> 님의 리뷰를 애타게 기다리는 :pray: 동료의 PR이 있어요. 리뷰에 참여해 주세요:`
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: user.requestedPRs
                    .map(({title, url}) => `• <${url}|${title}>`)
                    .join("\n")
            }
        }
    ]
});
/**
 * @param {User} user
 * @param {object} data
 */
const sendSlack = (user, data) => axios({
    method: "post",
    headers: {
        Authorization: `Bearer ${core.getInput("slackBotToken")}`,
        "Content-Type": "application/json"
    },
    url: "https://slack.com/api/chat.postMessage",
    data: {
        channel: `@${user.name}`,
        ...data
    }
});

class Pull {
    /**
     * @type {{[key: string]: Pull}}
     * @private
     */
    static _instances = {};

    /**
     * @param {{title: string, html_url: string, number: number}} pullInfo
     * @returns {Pull}
     */
    static create(pullInfo) {
        const {html_url: url} = pullInfo;

        return Pull._instances[url] || (Pull._instances[url] = new Pull(pullInfo));
    }

    constructor(pullInfo) {
        const {title, html_url, number} = pullInfo;

        this._title = title;
        this._url = html_url;
        this._number = number;
    }

    get title() {
        return this._title;
    }

    get url() {
        return this._url;
    }

    get number() {
        return this._number;
    }
}

class User {
    /**
     * @returns {User[]}
     */
    static getUsers() {
        return Object.values(User._instances);
    }

    /**
     * @type {{[key: string]: User}}
     * @private
     */
    static _instances = {};

    /**
     * @param {{email: string}} userInfo
     * @returns {User}
     */
    static create(userInfo) {
        const {email} = userInfo;

        return User._instances[email] || (User._instances[email] = new User(userInfo));
    }

    constructor(userInfo) {
        const {email} = userInfo;

        /**
         * @type {string}
         * @private
         */
        // this._email = email;
        this._email = "yonggoo.noh@";
        /**
         * @type {Pull[]}
         * @private
         */
        this._requestedPRs = [];
    }

    get name() {
        return this._email?.split("@")[0];
    }

    get requestedPRs() {
        return this._requestedPRs;
    }

    /**
     * @param {Pull} pull
     */
    requestReview(pull) {
        this._requestedPRs.push(pull);
    }
}

(async () => {
    try {
        const BASE_URL = github.context.payload.repository.url;
        // const BASE_URL = "https://api.github.com/repos/ygnoh/actions-tutorial";
        const fetchPulls = () => authFetch(`${BASE_URL}/pulls`);
        const fetchReviewers = number => authFetch(`${BASE_URL}/pulls/${number}/requested_reviewers`)
            .then(({users/* , teams */}) => users); // 팀 단위로 리뷰를 요청한 경우는 고려하지 않는다
        const fetchUser = url => authFetch(url);

        for (const pullInfo of await fetchPulls()) {
            const pull = Pull.create(pullInfo);

            for (const userInfo of await fetchReviewers(pull.number)) {
                const user = User.create(await fetchUser(userInfo.url));

                user.requestReview(pull);
            }
        }

        const users = User.getUsers();

        users.forEach(user => {
            if (!user.name) {
                return; // oss public email 미등록 사용자
            }

            sendSlack(user, createRequestPRData(user));
        });

        core.info("Messages sent");
    } catch (e) {
        core.setFailed(e.message);
    }
})();
