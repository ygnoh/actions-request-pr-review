const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

try {
    const authFetch = url => axios({
        method: "get",
        headers: {
            Authorization: `token ${core.getInput("token")}`
        },
        url
    });
    const fetchPRs = () => authFetch(`${github.context.payload.repository.url}/pulls`);

    fetchPRs().then(res => {
        console.log(JSON.stringify(res, undefined, 2));
    });
} catch (e) {
    core.setFailed(e.message);
}
