const path = require('path');
const express = require('express');

const app = express();

app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'dist')));

app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'public/index.html')));
app.listen(4200, () => console.log('Local test server started at http://localhost:4200'));