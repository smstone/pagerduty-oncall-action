const pd = require("@pagerduty/pdjs");
const core = require("@actions/core");

async function run() {
  // parse action inputs
  const pdToken = core.getInput("token");
  const scheduleId = core.getInput("schedule-id");
  const escalationPolicyId = core.getInput("escalation-policy-id");
  const startDate = core.getInput("start-date");
  const endDate = core.getInput("end-date");

  if (startDate && !endDate) {
    core.setFailed("An end date is required when a start date is passed in");
  }

  // set up API client
  const pdClient = pd.api({ token: pdToken });
  var params = {
    since: startDate,
    until: endDate,
  };

  if (scheduleId) {
    params["schedule_ids[]"] = scheduleId
  }

  if (escalationPolicyId) {
    params["escalation_policy_ids[]"] = escalationPolicyId
  }

  const queryParams = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  core.info(`query params: ${JSON.stringify(queryParams)}`);

  pdClient
    .get(`/oncalls?${queryParams}`)
    .then(({ resource }) => {
      // `resource` should be a list of oncall entries
      if (resource.length > 0) {
        core.info(`Oncalls found: ${JSON.stringify(resource)}`);

        // Variables for user on call at escalation level 1
        let person;
        let userId;
        let foundEscalationLevelOne = false;
        // Variable to display all people on call at varying escalation levels
        let peopleOnCall = []
        for (let i = 0; i < resource.length; i++) {
          let name = resource[i]["user"]["summary"];
          let pdUserId = resource[i]["user"]["id"];
          let escalationLevel = resource[i]["escalation_level"];
          if (typeof name !== "undefined" && typeof pdUserId !== "undefined" && typeof escalationLevel !== "undefined") {
            peopleOnCall.push({'name': name, 'userId': pdUserId, 'escalationLevel': escalationLevel})
          } else {
            core.setFailed("❓ Could not parse on-call entry");
          }
          if (escalationLevel == 1 && foundEscalationLevelOne == false) {
            person = name
            userId = pdUserId
            foundEscalationLevelOne = true
          }
        }
        if (foundEscalationLevelOne == false) {
          core.setFailed(`❓ No one is set to escalation level 1. Exiting.`);
        }

        core.setOutput("person", person);
        core.setOutput("userId", userId);

        let peopleOnCallSorted = peopleOnCall.sort((a, b) => a.escalationLevel - b.escalationLevel);
        core.info(`🎉 List of people on-call at each escalation level: `);
        for(const p in peopleOnCallSorted) {
          core.info(`📟 ` + peopleOnCallSorted[p].name + ` at level ` + peopleOnCallSorted[p].escalationLevel)
        }
      } else {
        core.setFailed("❓ No one is on the schedule or escalation policy.");
      }
    })
    .catch((error) => {
      core.setFailed(`❌ Unable to fetch on-call data: ${error}`);
    });
}

run();
