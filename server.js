import express from 'express';
import bodyParser from 'body-parser';
import controller from './controller.js';

const app = express();
const port = 3000;

// Sua API key secreta
const API_KEY = 'kayky';

// Middleware para verificar a API key
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === API_KEY) {
        next();
    } else {
        res.status(401).json({ status: false, message: 'Unauthorized' });
    }
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', controller.Home);

// Rotas protegidas pelo middleware da API key
app.post('/login', apiKeyMiddleware, controller.login);
app.get('/download_data', apiKeyMiddleware, controller.download_data);
app.post('/download', apiKeyMiddleware, controller.download);

const server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

// Handle EADDRINUSE error
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
