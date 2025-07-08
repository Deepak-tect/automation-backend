const path = require('path');
const writeTFVars = require('../utils/writeTFVars');
const { broadcast } = require('../socket');
const runCommand = require("../utils/runCommand")
 
const stage2ProvisionCluster = async (formData, baseRepoPath) => {
    try {
        // const gkeDir = path.join(baseRepoPath, 'gke');
        console.log("testing")
        const gkeDir = baseRepoPath
        console.log(gkeDir)
        console.log('Stage 2: Writing terraform.tfvars to', gkeDir);

        await writeTFVars(formData, gkeDir);

        try {
            await runCommand(`terraform workspace new ${formData.customerName}`, gkeDir);
            console.log('Running terraform init...');
            await runCommand('terraform init', gkeDir);
            console.log('Running terraform apply...');
            await runCommand(`terraform apply -auto-approve`, gkeDir);
        } catch (err) {
            broadcast({ stage: 'error', message: 'Terraform failed: ' + err });
            throw new Error('Stage 2 failed: ' + err.message);

        }

        broadcast({ stage: 2, message: 'Stage 2 complete: terraform.tfvars written' });
        
    } catch (err) {
        console.error('Error in Stage 2:', err);
        broadcast({ stage: 2, message: 'Stage 2 failed: ' + err.message });
        throw err;
    }
};

module.exports = stage2ProvisionCluster;
