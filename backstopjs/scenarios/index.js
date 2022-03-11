const fs = require('fs');

var jsonText = fs.readFileSync('scenarios/backstop-regression-tests.json');

const scenarios = JSON.parse(jsonText);

const scenariosWithCookies = scenarios.map((v) => {
  v.cookiePath = "engine_scripts/cookies.json";
  return v;
});

module.exports = scenariosWithCookies;
