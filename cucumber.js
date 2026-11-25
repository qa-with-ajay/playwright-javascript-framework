export default {
  require: [
    "fixtures/hooks.js",
    "step-definitions/*.js"
  ],
  format: [
    "progress",
    "html:reports/cucumber-report.html"
  ],
  paths: [
    "features/*.feature"
  ]
};
