const tsjl = require('tsjl-node');
const logger = new tsjl.Logger('nTree', 'index');
const fs = require('fs');

const storePath = process.env.NTREE_STORE_PATH || './store.json';
const htmlSrcPath = './src/index.html';
const htmlOutPath = './public/index.html';

// Create storage if it doesn't exist
try {
    if (!fs.existsSync(storePath)) {
        logger.info('No existing store found, creating new one...');
        fs.writeFileSync(storePath, JSON.stringify({
            rows: [
                [ {
                    name: 'SystemNezz Discord',
                    url: 'https://discord.systemnezz.xyz',
                    colour: '#123123',
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

// Function to make HTML
const renderHTML = (data) => {
    const htmlSrc = fs.readFileSync(htmlSrcPath).toString();
    let html = '<!-- Auto Generated nTree -->\n';
    data.rows.forEach((row) => {
        html += '<div class="row">';
        row.forEach((link) => {
            html += `<div class="column"><a href="${link.url}"><div class="card" style="background-color: ${link.colour}">${link.name}</div></a></div>`
        })
        html += '</div>\n';
    });

    fs.writeFileSync(htmlOutPath, htmlSrc.replace('<nTree>', html));
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
    res.send(store.links);
});

app.route('/admin')
    .get((req, res) => {
        res.send('omg admin');
    })
    .post((req, res) => {
        if (!req.body) return res.sendStatus(400);
        if (typeof req.body.rows != 'object') return res.status(400).send('Rows');

        // Verify format of links
        req.body.rows.forEach((row) => {
            row.forEach((link) => {
                if (typeof link.name != 'string') return res.status(400).send('Link Name');
                if (typeof link.url != 'string') return res.status(400).send('Link Url');
                if (typeof link.colour != 'string') return res.status(400).send('Link Colour');
            });
        });

        fs.writeFileSync(storePath, JSON.stringify(req.body)); // Save to store
        store = require(storePath); // Reload store
        renderHTML(store);
        res.sendStatus(200);
    });

// Anywhere else redirects to index
app.all('*', (req, res) => {
    res.redirect('/');
});

app.listen(port, () => {
    logger.success(`Listening on port ${port}`);
});