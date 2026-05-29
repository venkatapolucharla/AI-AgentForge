// config/jenkins.config.js
module.exports = {
  baseUrl: 'http://your-jenkins-url',
  jobs: {
    smoke:      'qa-smoke-tests',
    regression: 'qa-regression-tests',
    full:       'qa-full-suite'
  },
  schedules: {
    smoke:      '0 8 * * *',   // daily 8am
    regression: '0 22 * * 5',  // Friday 10pm
  }
}