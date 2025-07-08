const { broadcast } = require('../socket');
const provisionCluster = require('../stages/stage2ProvisionCluster');
const stage3SetupJumpbox = require('../stages/stage3SetupJumpbox')
const stage1CloneRepo = require('../stages/stage1CloneRepo');
const { DEV_LOCAL_REPO_DIR } = require('../config/constants');

const startDeployment = async (req, res) => {
  const formData = req.body;
  broadcast({ stage: 0, message: 'Started deplyoment' });
  try {
    // Stage 1
    await stage1CloneRepo();

    res.status(200).json({
      stage: 1,
      message: 'Repo cloned. Stage 2 running in background.',
    });

    // Stage 2
    console.log('Stage 2: Provisioning...');
    await provisionCluster(formData, DEV_LOCAL_REPO_DIR);
    console.log('Stage 2: Completed.');

    broadcast({ stage: 2, message: 'Stage 2 complete: Provision successful' });
 
    await stage3SetupJumpbox(DEV_LOCAL_REPO_DIR)
    broadcast({ stage: 3, message: 'Stage 3 complete: Jumpbox setup successful' });
  } catch (error) {
    res.status(500).json({ message: 'Deployment failed', error: error.toString() });
  }
};

module.exports = { startDeployment };


















// const { broadcast } = require('../socket');
// const fs = require('fs');
// const path = require('path');
// const { REPO_URL, LOCAL_REPO_DIR, DEV_LOCAL_REPO_DIR } = require('../config/constants');
// const provisionCluster = require('../stages/provisionCluster');
// const runCommand  = require('../utils/runCommand')


// const startDeployment = async (req, res) => {
//     console.log(req.body);
//     const formData = req.body
//     try {
//     if (fs.existsSync(LOCAL_REPO_DIR)) {
//       console.log('Stage 1: Removing existing repo...');
//       fs.rmSync(LOCAL_REPO_DIR, { recursive: true, force: true });
//       console.log('Repo folder deleted successfully.');
//     }

//     console.log('Stage 1: Cloning repo...');
//     await runCommand(`git clone ${REPO_URL} "${LOCAL_REPO_DIR}"`);
//     console.log('Repo cloned successfully.');

//     // ✅ Notify UI for Stage 1
//     broadcast({ stage: 1, message: 'Repo cloned successfully' });

//     // Send immediate response so Postman doesn't hang
//     res.status(200).json({ stage: 1, message: 'Repo cloned successfully. Stage 2 will proceed in background.' });

//     // Stage 2 (continue in background)
//     console.log('Stage 2: Simulating next step...');
//     // await new Promise(resolve => setTimeout(resolve, 20000));
//     await provisionCluster(formData, DEV_LOCAL_REPO_DIR);
//     console.log('Stage 2: Completed.');

//     // ✅ Notify UI for Stage 2
//     broadcast({ stage: 2, message: 'Stage 2 complete: Something completed' });

//     // res.status(200).json({ stage: 1, message: 'Stage 1 complete: Repo cloned' });

//   } catch (error) {
//     console.error('Error during stage 1:', error);
//     res.status(500).json({ stage: 1, message: 'Stage 1 failed', error: error.toString() });
//   }
// };

// module.exports = { startDeployment };
