const core = require("@actions/core");
const github = require("@actions/github");

try {
    const authFetch = (url, init) => fetch(
        url,
        {
            headers: {
                Authorization: `token ${core.getInput("token")}`
            },
            method: "get",
            ...init
        }
    );
    const fetchPRs = () => authFetch(`${github.context.payload.repository.url}/pulls`);

    console.log(fetchPRs());
} catch (e) {
    core.setFailed(e.message);
}
