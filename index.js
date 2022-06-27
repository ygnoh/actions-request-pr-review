const core = require("@actions/core");
const axios = require("axios");

const ENCODE_PAIR = {
    "<": "&lt;",
    ">": "&gt;"
};
const encodeText = text => text.replace(/[<>]/g, matched => ENCODE_PAIR[matched]);
const authFetch = url => axios({
    method: "get",
    headers: {
        Authorization: `token ${core.getInput("token")}`
    },
    url
}).then(res => res.data);
const createRequestPRData = (user) => {
    const {name} = user;

    return {
        text: `Hello <@${name}> :wave:`,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `Hello <@${name}> :wave:`
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `These are some PRs waiting for your precious review. Please review them for your colleagues :pray::`
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: user.requestedPRs
                        .map(({title, url}) => ({title: encodeText(title), url}))
                        .map(({title, url}) => `• <${url}|${title}>`)
                        .join("\n")
                }
            }
        ]
    };
};

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
     * @param {{login: string, email: string}} userInfo
     * @returns {User}
     */
    static create(userInfo) {
        const {email} = userInfo;

        return User._instances[email] || (User._instances[email] = new User(userInfo));
    }

    constructor(userInfo) {
        const {login, email} = userInfo;

        /**
         * @type {string}
         * @private
         */
        this._login = login;
        this._email = email;
        /**
         * @type {Pull[]}
         * @private
         */
        this._requestedPRs = [];
    }

    get login() {
        return this._login;
    }

    get name() {
        return this._email ? this._email.split("@")[0] : null;
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

const refineToApiUrl = repoUrl => {
    const enterprise = !repoUrl.includes("github.com");
    const [host, pathname] = repoUrl
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .split(/\/(.*)/); // github.com/abc/def -> ['github.com', 'abc/def', '']

    if (enterprise) {
        return `https://${host}/api/v3/repos/${pathname}`;
    }

    return `https://api.${host}/repos/${pathname}`;
};

(async () => {
    try {
        const BASE_API_URL = refineToApiUrl(core.getInput("repoUrl"));

        core.info(`Running for: ${BASE_API_URL}`);

        const fetchPulls = () => authFetch(`${BASE_API_URL}/pulls`);
        const fetchReviewers = number => authFetch(`${BASE_API_URL}/pulls/${number}/requested_reviewers`)
            .then(({users/* , teams */}) => users); // Ignore teams as of now
        const fetchUser = url => authFetch(url);

        core.info("Fetching pulls...");

        for (const pullInfo of await fetchPulls()) {
            const pull = Pull.create(pullInfo);

            core.info(`Fetching reviewers of #${pull.number}...`);

            for (const userInfo of await fetchReviewers(pull.number)) {
                const user = User.create(await fetchUser(userInfo.url));

                user.requestReview(pull);
            }
        }

        const users = User.getUsers();

        core.info("Starting sending messages...");

        await Promise.all(users.map(user => {
            if (!user.name) {
                core.warning(`'${user.login}' has no public email.`);
                return;
            }

            core.info(`Sending a message to ${user.name}...`);

            return sendSlack(user, createRequestPRData(user));
        }));

        core.info("Messages sent successfully");
    } catch (e) {
        core.setFailed(e.message);
    }
})();
