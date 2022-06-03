const tsjl = require('tsjl-node');
const logger = new tsjl.Logger('nTree', 'index');
const fs = require('fs');
const path = require('path');

const storePath = process.env.NTREE_STORE_PATH || './store.json';
const htmlSrcPath = './src/index.html';
const htmlOutPath = './public/index.html';

// Create storage if it doesn't exist
try {
    if (!fs.existsSync(storePath)) {
        logger.info('No existing store found, creating new one...');
        fs.writeFileSync(storePath, JSON.stringify({
            title: "nTree",
            subtitle: "nTree is a fully custom link tree site.",
            rows: [
                [ {
                    name: 'SystemNezz Discord',
                    url: 'https://discord.systemnezz.xyz',
                    bgcolour: '#000000',
                    txtcolour: '#ffffff',
                } ],
            ],
        }));
    }
}
catch (err) {
    logger.error(err);
}

// Load Storage
let store = require(storePath);

if (!store.rows) {
    logger.fatal('Invalid store file (no rows)', { storePath: storePath, store: store });
    process.exit(1);
}

logger.debug('Store loaded', { storePath: storePath, store: store });

store = null; // Store could be modified from now, so it is void

// Function to make HTML
const renderHTML = (data) => {
    logger.info('Rendering HTML');
    const htmlSrc = fs.readFileSync(htmlSrcPath).toString();

    let html = '<!-- Auto Generated nTree -->\n';
    data.rows.forEach((row) => {
        html += '<div class="row">';
        row.forEach((link) => {
            html += `<div class="column"><a href="${link.url}"><div class="card" style="background-color: ${link.bgcolour}; color: ${link.txtcolour}">${link.name}</div></a></div>`;
        });
        html += '</div>\n';
    });

    let htmlOut = htmlSrc.replace('<nTree>', html);

    html = `<h1 align="center">${data.title}</h1><p align="center"><strong>${data.subtitle}</strong></p>`

    htmlOut = htmlOut.replace('<nTreeTitle>', html);

    fs.writeFileSync(htmlOutPath, htmlOut);

};

// Finally, fire up express
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.route('/admin')
    .get((req, res) => {
        res.send('omg admin');
    })
    .post((req, res) => {
        if (!req.body) return res.sendStatus(400);

        if (typeof req.body.title != 'string') return res.status(400).send('Title');
        if (typeof req.body.subtitle != 'string') return res.status(400).send('Subtitle');
        if (typeof req.body.rows != 'object') return res.status(400).send('Rows');

        // Verify format of links
        req.body.rows.forEach((row) => {
            row.forEach((link) => {
                if (typeof link.name != 'string') return res.status(400).send('Link Name');
                if (typeof link.url != 'string') return res.status(400).send('Link Url');
                if (typeof link.bgcolour != 'string') return res.status(400).send('Link BG Colour');
                if (typeof link.txtcolour != 'string') return res.status(400).send('Link TXT Colour');
            });
        });

        fs.writeFileSync(storePath, JSON.stringify(req.body)); // Save to store
        renderHTML(req.body);
        res.sendStatus(200);
    });

// Static Files
app.use(express.static('public'));

// Anywhere else redirects to index
app.all('*', (req, res) => {
    res.redirect('/');
});

app.listen(port, () => {
    logger.success(`Listening on port ${port}`);
});