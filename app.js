const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes.js');
const authGoogleRoutes = require('./routes/authGoogleRoutes.js');
const deploymentRoutes = require('./routes/deploymentRoutes.js');
const authenticateToken = require('./middlewares/authMiddleware.js');

// Standard Express app
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/test', (req, res) => res.send('test'));
app.use('/api/auth', authRoutes);
app.use('/api/google-auth', authGoogleRoutes);
app.use('/api/deploy', authenticateToken, deploymentRoutes);

// --- WebSocket Setup ---

const { initSocket } = require('./socket.js');
const http = require('http');
const server = http.createServer(app);
initSocket(server);


// Start the HTTP server instead of app.listen
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const authRoutes = require('./routes/authRoutes.js');
// const authGoogleRoutes = require('./routes/authGoogleRoutes.js');
// const deploymentRoutes = require('./routes/deploymentRoutes.js');
// const authenticateToken = require('./middlewares/authMiddleware.js');
// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use('/api/test', ()=>{console.log("test") });
// app.use('/api/auth', authRoutes);
// app.use('/api/google-auth', authGoogleRoutes);
// app.use('/api/deploy', authenticateToken, deploymentRoutes)

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
