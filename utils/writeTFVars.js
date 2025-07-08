const fs = require('fs');
const path = require('path');

const writeTFVars = (tfVarsData, targetDir) => {
  const tfVarsPath = path.join(targetDir, 'terraform.tfvars');

  const updates = {
    customer: `"${tfVarsData.customerName}"`,
    instance_name: `"lb-${tfVarsData.customerName}-jumpbox"`,
    public_ip: `"0.0.0.0/0"`,
    node_count: tfVarsData.nodes,
  };

  let lines = [];

  if (fs.existsSync(tfVarsPath)) {
    const content = fs.readFileSync(tfVarsPath, 'utf-8');
    lines = content.split('\n');
  }

  const updatedKeys = new Set();

  const updatedLines = lines.map(line => {
    const match = line.match(/^(\s*)(\w+)(\s*=\s*)(.*)$/);
    if (match) {
      const [, indent, key, separator, value] = match;
      if (updates.hasOwnProperty(key)) {
        updatedKeys.add(key);
        return `${indent}${key}${separator}${updates[key]}`;
      }
    }
    return line;
  });

  // Add any missing keys at the end
  Object.entries(updates).forEach(([key, value]) => {
    if (!updatedKeys.has(key)) {
      updatedLines.push(`${key} = ${value}`);
    }
  });

  fs.writeFileSync(tfVarsPath, updatedLines.join('\n'), 'utf-8');
  console.log('terraform.tfvars updated without overwriting other fields.');
};

module.exports = writeTFVars;
