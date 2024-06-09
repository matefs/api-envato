import express from 'express';
import bodyParser from 'body-parser';
import controller from './controller.js';

const app = express();
const port = 3002;

// Sua API key secreta
const API_KEY = 'teste';

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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
