const { exec } = require('child_process');

const runCommand = (cmd, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command failed: ${cmd}\n${stderr}`);
        return reject(stderr);
      }
      console.log(stdout); // Optional: log output
      resolve(stdout);
    });
  });
};

module.exports = runCommand;
