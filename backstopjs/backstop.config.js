const scenarios = require('./scenarios/index.js');

module.exports = {
  id: "uos_backstop",
  viewports: [
    {
      "label": "phone",
      "width": 360,
      "height": 640
    },
    {
      "label": "tablet",
      "width": 768,
      "height": 1024
    },
    {
      "label": "desktop",
      "width": 1920,
      "height": 1080
    }
  ],
  onBeforeScript: "puppet/onBefore.js",
  onReadyScript: "puppet/onReady.js",
  delay: 10000,
  scenarios: scenarios,
  paths: {
    bitmaps_reference: "backstop_data/bitmaps_reference",
    bitmaps_test: "backstop_data/bitmaps_test",
    engine_scripts: "engine_scripts",
    html_report: "backstop_data/html_report",
    ci_report: "backstop_data/ci_report"
  },
  puppeteerOffscreenCaptureFix: true,
  report: ["browser"],
  engine: "puppeteer",
  engineOptions: {
    args: ["--no-sandbox"]
  },
  engineFlags: [],
  asyncCaptureLimit: 10,
  asyncCompareLimit: 5,
  misMatchThreshold: 0.1,
  debug: false,
  debugWindow: false,
}
