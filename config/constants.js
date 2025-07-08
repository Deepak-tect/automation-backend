
const path = require('path');

module.exports = {
  REPO_URL: 'https://github.com/Deepak-tect/Bank-Management-System.git',
  LOCAL_REPO_DIR: path.resolve(__dirname, '../../Bank-Management-System'),
  DEV_LOCAL_REPO_DIR: path.resolve(__dirname, '../../terraform'),
  PLATFORM: 'windows',
  SSH_USER: 'deepak',
  SSH_KEY_PATH: 'C:\\Users\\Deepak\\Documents\\deepak_new_ssh.pem', // Use Linux path later like '/home/deepak/.ssh/id_rsa'
};
