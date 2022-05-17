const tsjl = require('tsjl-node');
const logger = new tsjl.Logger('nTree', 'index');
const fs = require('fs');

const storePath = process.env.NTREE_STORE_PATH || './store.json';

// Create storage if it doesn't exist
try {
    if (!fs.existsSync(storePath)) {
        logger.info('No existing store found, creating new one...');
        fs.writeFileSync(storePath, JSON.stringify({ links: [] }));
    }
}
catch (err) {
    logger.error(err);
}

// Load Storage
let store = require(storePath);

if (!store.links) {
    logger.fatal('Invalid store file (no links)', { storePath: storePath, store: store });
    process.exit(1);
}

logger.debug('Store loaded', { storePath: storePath, store: store });

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
        if (typeof req.body.links != 'object') return res.sendStatus(400);

        // Verify format of links
        req.body.links.forEach((link) => {
            if (typeof link.name != 'string') return res.sendStatus(400);
            if (typeof link.url != 'string') return res.sendStatus(400);
            if (typeof link.colour != 'string') return res.sendStatus(400);
        });

        fs.writeFileSync(storePath, JSON.stringify(req.body)); // Save to store
        store = require(storePath); // Reload store
        res.sendStatus(200);
    });

// Anywhere else redirects to index
app.all('*', (req, res) => {
    res.redirect('/');
});

app.listen(port, () => {
    logger.success(`Listening on port ${port}`);
});