const core = require("@actions/core");
const github = require("@actions/github");

try {
    const token = core.getInput("token");
    const apiUrl = github.context.apiUrl;

    console.log("TOKEN: \n", token);
    console.log("API URL: \n", apiUrl);
} catch (e) {
    core.setFailed(e.message);
}
