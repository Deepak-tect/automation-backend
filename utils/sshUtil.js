const { exec } = require('child_process');

const runSSHCommand = (ip, username, command) => {
  return new Promise((resolve, reject) => {
    exec(`ssh ${username}@${ip} "${command}"`, (error, stdout, stderr) => {
      if (error) return reject(stderr);
      resolve(stdout);
    });
  });
};

const copyFileToJumpbox = (ip, username, localPath, remotePath) => {
  return new Promise((resolve, reject) => {
    exec(`scp "${localPath}" ${username}@${ip}:"${remotePath}"`, (error, stdout, stderr) => {
      if (error) return reject(stderr);
      resolve(stdout);
    });
  });
};

module.exports = { runSSHCommand, copyFileToJumpbox };
