const { exec } = require('child_process');
const { broadcast } = require('../socket');
const fs = require('fs');
const path = require('path');
const { REPO_URL, LOCAL_REPO_DIR } = require('../config/constants');

const runCommand = (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command failed: ${cmd}\n${stderr}`);
                return reject(stderr);
            }
            resolve(stdout);
        });
    });
};

const startDeployment = async (req, res) => {
    console.log(req.body);
    try {
    if (fs.existsSync(LOCAL_REPO_DIR)) {
      console.log('Stage 1: Removing existing repo...');
      fs.rmSync(LOCAL_REPO_DIR, { recursive: true, force: true });
      console.log('Repo folder deleted successfully.');
    }

    console.log('Stage 1: Cloning repo...');
    await runCommand(`git clone ${REPO_URL} "${LOCAL_REPO_DIR}"`);
    console.log('Repo cloned successfully.');

    // ✅ Notify UI for Stage 1
    broadcast({ stage: 1, message: 'Repo cloned successfully' });

    // Send immediate response so Postman doesn't hang
    res.status(200).json({ stage: 1, message: 'Repo cloned successfully. Stage 2 will proceed in background.' });

    // Stage 2 (continue in background)
    console.log('Stage 2: Simulating next step...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    console.log('Stage 2: Completed.');

    // ✅ Notify UI for Stage 2
    broadcast({ stage: 2, message: 'Stage 2 complete: Something completed' });

    // res.status(200).json({ stage: 1, message: 'Stage 1 complete: Repo cloned' });

  } catch (error) {
    console.error('Error during stage 1:', error);
    res.status(500).json({ stage: 1, message: 'Stage 1 failed', error: error.toString() });
  }
};

module.exports = { startDeployment };
