const path = require('path');
const { broadcast } = require('../socket');
const runCommand = require('../utils/runCommand');
const { PLATFORM, SSH_USER, SSH_KEY_PATH } = require('../config/constants');

function findResourceByTypeAndName(tfState, type, name) {
  const search = (module) => {
    if (module.resources) {
      const match = module.resources.find(r => r.type === type || r.name === name);
      if (match) return match;
    }
    if (module.child_modules) {
      for (const child of module.child_modules) {
        const match = search(child);
        if (match) return match;
      }
    }
    return null;
  };

  return search(tfState.values.root_module);
}

const stage3SetupJumpbox = async (baseRepoPath) => {
  try {
    const gkeDir = baseRepoPath;

    console.log('[Stage 3] Fetching jumpbox IP using terraform show -json...');
    const jsonOutput = await runCommand('terraform show -json', gkeDir);
    const tfState = JSON.parse(jsonOutput);
    const resources = tfState.values.root_module.resources;

    const jumpbox_ip = resources[0].values.address;
    console.log(`[Stage 3] Jumpbox IP: ${jumpbox_ip}`);

    const saResource = findResourceByTypeAndName(tfState, 'google_service_account', 'gke_service_account');
    console.log(saResource)
    const cluster = findResourceByTypeAndName(tfState, 'google_container_cluster');
    console.log(cluster)
    if (!jumpbox_ip || !saResource || !cluster) throw new Error('Required resource missing from tfstate');

    const saEmail = saResource.values.email;
    const projectId = saResource.values.project;
    const zone = cluster.values.location;
    const clusterName = cluster.values.name;

    console.log(`[Stage 3] Jumpbox IP: ${jumpbox_ip}`);
    console.log(`[Stage 3] SA Email: ${saEmail}`);
    console.log(`[Stage 3] Project: ${projectId}`);
    console.log(`[Stage 3] Zone: ${zone}`);
    console.log(`[Stage 3] Cluster: ${clusterName}`);

    const scriptLocalPath = path.join(gkeDir, 'jumpbox_req.sh');
    const keyPath = path.join(gkeDir, 'gcp-key.json');
    const remotePath = '/home/deepak';
    const remoteRootPath = '/root';
    const isWindows = PLATFORM === 'windows';

    // Generate the service account key locally
    await runCommand(`gcloud iam service-accounts keys create "${keyPath}" --iam-account="${saEmail}" --project="${projectId}"`);

    // Copy both files to the jumpbox
    const scpFilesCmd = isWindows
      ? `scp -o StrictHostKeyChecking=no -i "${SSH_KEY_PATH}" "${scriptLocalPath}" "${keyPath}" ${SSH_USER}@${jumpbox_ip}:${remotePath}`
      : `scp -o StrictHostKeyChecking=no -i ${SSH_KEY_PATH} ${scriptLocalPath} ${keyPath} ${SSH_USER}@${jumpbox_ip}:${remotePath}`;
    console.log('[Stage 3] Copying jumpbox script and key to jumpbox...');
    await runCommand(scpFilesCmd);

    // Run SSH to move and execute everything on the jumpbox
    const sshCmd = isWindows
      ? `ssh -o StrictHostKeyChecking=no -i "${SSH_KEY_PATH}" ${SSH_USER}@${jumpbox_ip} `
      : `ssh -o StrictHostKeyChecking=no -i ${SSH_KEY_PATH} ${SSH_USER}@${jumpbox_ip} `;

    const remoteSetupCmd = `
      sudo mv ${remotePath}/jumpbox_req.sh ${remoteRootPath}/jumpbox_req.sh &&
      sudo mv ${remotePath}/gcp-key.json ${remoteRootPath}/gcp-key.json &&
      sudo apt-get update &&
      sudo apt-get install -y dos2unix &&
      sudo dos2unix ${remoteRootPath}/jumpbox_req.sh &&
      sudo chmod +x ${remoteRootPath}/jumpbox_req.sh &&
      sudo bash ${remoteRootPath}/jumpbox_req.sh &&
      sudo apt-get install -y google-cloud-sdk-gke-gcloud-auth-plugin &&
      sudo gcloud auth activate-service-account --key-file=${remoteRootPath}/gcp-key.json &&
      sudo gcloud container clusters get-credentials ${clusterName} --zone=${zone} --project=${projectId}
    `.replace(/\s+/g, ' '); 

    console.log('[Stage 3] Executing setup on jumpbox...');
    await runCommand(`${sshCmd} "${remoteSetupCmd}"`);

    // remove the keys from vm
    // await runCommand(`rm -f "${keyPath}"`);

    broadcast({ stage: 3, message: 'Stage 3 complete: GKE credentials set up on jumpbox' });

  } catch (err) {
    console.error('Stage 3 failed:', err);
    broadcast({ stage: 3, error: true, message: `Stage 3 failed: ${err.message}` });
    throw err;
  }
};

module.exports = stage3SetupJumpbox;





















// const path = require('path');
// const { broadcast } = require('../socket');
// const runCommand = require('../utils/runCommand');
// const { PLATFORM, SSH_USER, SSH_KEY_PATH } = require('../config/constants');

// const stage3SetupJumpbox = async (baseRepoPath) => {
//   try {
//     const gkeDir = baseRepoPath;

//     // Step 1: Parse terraform show -json to extract IP
//     console.log('[Stage 3] Fetching jumpbox IP using terraform show -json...');
//     const jsonOutput = await runCommand('terraform show -json', gkeDir);
//     const tfState = JSON.parse(jsonOutput);

//     const resources = tfState.values.root_module.resources;
//     const jumpbox_ip = resources[0].values.address;


//     console.log(`[Stage 3] Jumpbox IP: ${jumpbox_ip}`);

//     const scriptLocalPath = path.join(gkeDir, 'jumpbox_req.sh');
//     const isWindows = PLATFORM === 'windows';
//     const remotePath = '/home/deepak';
//     const remoteRootPath = '/root'

//     const scpCmd = isWindows
//       ? `scp -o StrictHostKeyChecking=no -i "${SSH_KEY_PATH}" "${scriptLocalPath}" ${SSH_USER}@${jumpbox_ip}:${remotePath}`
//       : `scp -o StrictHostKeyChecking=no -i ${SSH_KEY_PATH} ${scriptLocalPath} ${SSH_USER}@${jumpbox_ip}:${remotePath}`;

//     console.log('[Stage 3] Copying script to jumpbox...');
//     await runCommand(scpCmd);

//     const sshCmd = isWindows
//       ? `ssh -o StrictHostKeyChecking=no -i "${SSH_KEY_PATH}" ${SSH_USER}@${jumpbox_ip} "sudo mv ${remotePath}/jumpbox_req.sh ${remoteRootPath} && sudo apt-get update && sudo apt-get install -y dos2unix && sudo dos2unix /root/jumpbox_req.sh && sudo chmod +x ${remoteRootPath}/jumpbox_req.sh && sudo bash ${remoteRootPath}/jumpbox_req.sh"`
//       : `ssh -o StrictHostKeyChecking=no -i ${SSH_KEY_PATH} ${SSH_USER}@${jumpbox_ip} "sudo mv ${remotePath} ${remoteRootPath} && sudo chmod +x ${remoteRootPath} && sudo ${remoteRootPath}"`;

//     console.log('[Stage 3] Moving script to /root and executing it...');
//     await runCommand(sshCmd);

//     // ---------- Extract details ----------
//     const saResource = resources.find(r => r.type === 'google_service_account' && r.name === 'gke_service_account');
//     if (!saResource) throw new Error('Service account not found in terraform state');
//     const saEmail = saResource.values.email;
//     const projectId = saResource.values.project;

//     const cluster = resources.find(r => r.type === 'google_container_cluster');
//     if (!cluster) throw new Error('GKE cluster not found in terraform state');
//     const zone = cluster.values.location;
//     const clusterName = cluster.values.name;

//     console.log(`[Stage 3] SA Email: ${saEmail}`);
//     console.log(`[Stage 3] Project: ${projectId}`);
//     console.log(`[Stage 3] Zone: ${zone}`);
//     console.log(`[Stage 3] Cluster: ${clusterName}`);

//     // ---------- Generate service account key ----------
//     const keyPath = path.join(gkeDir, 'gcp-key.json');
//     await runCommand(`gcloud iam service-accounts keys create "${keyPath}" --iam-account="${saEmail}" --project="${projectId}"`);

//     // ---------- Transfer key to jumpbox ----------
//     const scpKeyCmd = isWindows
//       ? `scp -o StrictHostKeyChecking=no -i "${SSH_KEY_PATH}" "${keyPath}" ${SSH_USER}@${jumpbox_ip}:${remotePath}`
//       : `scp -o StrictHostKeyChecking=no -i ${SSH_KEY_PATH} ${keyPath} ${SSH_USER}@${jumpbox_ip}:${remotePath}`;
//     console.log('[Stage 3] Transferring service account key to jumpbox...');
//     await runCommand(scpKeyCmd);

//     // ---------- Run gcloud auth + connect to GKE ----------
//     const gcloudCmds = `
//   gcloud auth activate-service-account --key-file=${remotePath}/gcp-key.json &&
//   gcloud container clusters get-credentials ${clusterName} --zone=${zone} --project=${projectId}
// `;
//     const sshGcloudCmd = isWindows
//       ? `ssh -o StrictHostKeyChecking=no -i "${SSH_KEY_PATH}" ${SSH_USER}@${jumpbox_ip} "${gcloudCmds}"`
//       : `ssh -o StrictHostKeyChecking=no -i ${SSH_KEY_PATH} ${SSH_USER}@${jumpbox_ip} "${gcloudCmds}"`;

//     console.log('[Stage 3] Running gcloud auth and fetching GKE credentials...');
//     await runCommand(sshGcloudCmd);

//     broadcast({ stage: 3, message: 'Stage 3 complete: Script copied to jumpbox' });

//   } catch (err) {
//     console.error('Stage 3 failed:', err);
//     broadcast({ stage: 3, error: true, message: `Stage 3 failed: ${err.message}` });
//     throw err;
//   }
// };

// module.exports = stage3SetupJumpbox;
