const express = require('express');
const db = require('../db');
const ExpressError = require('../expressError');

let router = new express.Router();

const companies = [];

// GET /companies : Returns list of companies, like {companies: [{code, name}, ...]}

router.get('/', async function (req, res, next) {
    try {
        const results = await db.query('SELECT code,name FROM companies');
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
});

// GET /companies/[code] : Return obj of company: {company: {code, name, description}}
// If the company given cannot be found, this should return a 404 status response.

router.get('/:code', async function (req, res, next) {
    try {
        let code = req.params.code;

        const compResult = await db.query('SELECT code,name,description FROM companies WHERE code=$1', [code]);
        const invResult = await db.query('SELECT id FROM invoices WHERE comp_code=$1', [code]);

        if (compResult.rows.length === 0) throw new ExpressError('Not found!', 404);

        const company = compResult.rows[0];
        const invoices = invResult.rows;

        company.invoices = invoices.map((inv) => inv.id);

        return res.json({ company: company });
    } catch (e) {
        return next(e);
    }
});

// POST /companies : Adds a company. Needs to be given JSON like: {code, name, description} Returns obj of new company:  {company: {code, name, description}}

router.post('/', async function (req, res, next) {
    try {
        const { code, name, description } = req.body;

        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

//   PUT /companies/[code] : Edit existing company. Should return 404 if company cannot be found.
//   Needs to be given JSON like: {name, description} Returns update company object: {company: {code, name, description}}

router.put('/:code', async function (req, res, next) {
    try {
        const { name, description } = req.body;
        const code = req.params.code;

        const result = await db.query(
            `UPDATE companies SET name=$1, description=$2
             WHERE code = $3
             RETURNING code, name, description`,
            [code, name, description]
        );
        if (result.rows.length === 0) throw new ExpressError('Not found!', 404);
        return res.json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// DELETE /companies/[code] : Deletes company. Should return 404 if company cannot be found.
// Returns {status: "deleted"}

router.delete('/:code', async function (req, res, next) {
    try {
        const result = await db.query('DELETE FROM users WHERE code = $1 RETURNING code', [req.params.code]);
        if (result.rows.length === 0) throw new ExpressError('Not found!', 404);
        return res.json({ message: 'Deleted' });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
