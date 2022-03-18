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

    console.log(fetchPRs());
} catch (e) {
    core.setFailed(e.message);
}
