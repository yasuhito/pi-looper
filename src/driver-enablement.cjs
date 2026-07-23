const { assertEnabled, withEnabledProjectLock } = require("./enabled-operation.cjs");

function assertDriverEnabled(project) {
  return assertEnabled(project);
}

function withEnabledDriverLock(project, operation, options) {
  return withEnabledProjectLock(project, operation, options);
}

module.exports = { assertDriverEnabled, withEnabledDriverLock };
