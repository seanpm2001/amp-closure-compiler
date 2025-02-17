#!/usr/bin/env node
/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const {exec, execOrDie} = require('./exec.js');

/**
 * Mapping from process.platform to the OS name / directory.
 */
const platformOsMap = {
  linux: 'linux',
  darwin: 'osx',
  win32: 'windows',
};

/**
 * Returns the Closure OS name for the corresponding platform.
 * @return {string}
 */
function getOsName() {
  return platformOsMap[process.platform];
}

/**
 * For pull request builds, verifies the set of pending commits.
 * For push builds, rebases the branch on upstream and pushes pending commits.
 */
function pushPendingCommits() {
  if (process.env.GITHUB_EVENT_NAME == 'pull_request') {
    console.log('Verifying files in new commit(s)...');
    execOrDie(`git diff --stat ${process.env.GITHUB_SHA}..HEAD`);
  } else if (process.env.GITHUB_EVENT_NAME == 'push') {
    console.log('Syncing to origin and pushing commit(s)...');
    let retries = 3;
    const delaySec = 10;
    const pushCommits = () => {
      if (retries == 0) {
        console.log('Could not push commit(s) to origin.');
        process.exitCode = 1;
        return;
      }
      if (exec('git pull origin --rebase && git push').status != 0) {
        --retries;
        console.log(`Push failed. Retrying in ${delaySec} seconds...`);
        setTimeout(pushCommits, delaySec * 1000);
      }
    };
    pushCommits();
  }
}

/**
 * For pull request builds, verifies the set of pending tags.
 * For push builds, rebases the branch on upstream and pushes pending tags.
 */
function pushPendingTags() {
  if (process.env.GITHUB_EVENT_NAME == 'pull_request') {
    console.log('Verifying tags(s)...');
    execOrDie('git tag --list');
  } else if (process.env.GITHUB_EVENT_NAME == 'push') {
    console.log('Syncing to origin and pushing tag(s)...');
    let retries = 3;
    const delaySec = 10;
    const pushTags = () => {
      if (retries == 0) {
        console.log('Could not push tags(s) to origin.');
        process.exitCode = 1;
        return;
      }
      if (
        exec('git pull origin --rebase && git push origin --tags').status != 0
      ) {
        --retries;
        console.log(`Push failed. Retrying in ${delaySec} seconds...`);
        setTimeout(pushCommits, delaySec * 1000);
      }
    };
    pushTags();
  }
}

module.exports = {
  getOsName,
  pushPendingCommits,
  pushPendingTags,
};
