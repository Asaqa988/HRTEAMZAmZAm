import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy configuration for Apify API
app.use('/apify-api', createProxyMiddleware({
    target: 'https://api.apify.com',
    changeOrigin: true,
    pathRewrite: {
        '^/apify-api': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Forwarding ${req.method} ${req.url} to Apify`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Received ${proxyRes.statusCode} from Apify for ${req.url}`);
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
    onError: (err, req, res) => {
        console.error('[Proxy] Error:', err);
    }
}));

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: return index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
