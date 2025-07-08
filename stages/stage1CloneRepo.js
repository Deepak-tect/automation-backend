const fs = require('fs');
const path = require('path');
const runCommand = require('../utils/runCommand');
const { broadcast } = require('../socket');
const { REPO_URL, LOCAL_REPO_DIR } = require('../config/constants');

const stage1CloneRepo = async () => {
  try {
    if (fs.existsSync(LOCAL_REPO_DIR)) {
      console.log('Stage 1: Removing existing repo...');
      fs.rmSync(LOCAL_REPO_DIR, { recursive: true, force: true });
      console.log('Repo folder deleted successfully.');
    }

    console.log('Stage 1: Cloning repo...');
    await runCommand(`git clone ${REPO_URL} "${LOCAL_REPO_DIR}"`);
    console.log('Repo cloned successfully.');

    broadcast({ stage: 1, message: 'Repo cloned successfully' });
  } catch (err) {
    console.error('Stage 1 failed:', err);
    broadcast ({ stage: 1, error: true, message: `Stage 1 failed: ${err.message}` });
    throw err; 
  }
};

module.exports = stage1CloneRepo;
