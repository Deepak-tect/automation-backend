const path = require('path');
const runCommand = require('../utils/runCommand');
const { broadcast } = require('../socket');


function findResourceByTypeAndName(tfState, type, name) {
  const search = (module) => {
    if (module.resources) {
      const match = module.resources.find(r => r.type === type && r.name === name);
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

const stage4DomainMapping = async (formData, baseRepoPath) => {
  try {
    console.log(formData)
    console.log(baseRepoPath)
    const hostedZoneId = process.env.AWS_HOSTED_ZONE_ID;
    const domainName = formData.domain; // from frontend form
    const gkeDir = baseRepoPath;

    if (!hostedZoneId || !domainName) {
      throw new Error('Hosted Zone ID or domain name not provided');
    }

    console.log('[Stage 4] Extracting public IP from Terraform output...');
    const jsonOutput = await runCommand('terraform show -json', gkeDir);
    const tfState = JSON.parse(jsonOutput);
    const staticIpResource = findResourceByTypeAndName(tfState, 'google_compute_global_address', 'gke_static_ip');

    const publicIp = staticIpResource.values.address

    console.log(`[Stage 4] Mapping domain ${domainName} to IP ${publicIp}`);

    const changeBatch = {
      Comment: 'Automated domain mapping via deployment pipeline',
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: domainName,
            Type: 'A',
            TTL: 300,
            ResourceRecords: [{ Value: publicIp }],
          },
        },
      ],
    };

    const changeFilePath = path.join(gkeDir, 'route53_change_batch.json');
    require('fs').writeFileSync(changeFilePath, JSON.stringify(changeBatch, null, 2));

    const awsCmd = `aws route53 change-resource-record-sets --hosted-zone-id ${hostedZoneId} --change-batch file://${changeFilePath}`;
    await runCommand(awsCmd);

    broadcast({ stage: 4, message: 'Stage 4 complete: Domain mapped to IP successfully' });
  } catch (err) {
    console.error('Stage 4 failed:', err);
    broadcast({ stage: 4, error: true, message: `Stage 4 failed: ${err.message}` });
    throw err;
  }
};

module.exports = stage4DomainMapping;
