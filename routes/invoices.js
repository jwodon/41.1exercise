const express = require('express');
const db = require('../db');
const ExpressError = require('../expressError');

let router = new express.Router();

// GET /invoices : Return info on invoices: like {invoices: [{id, comp_code}, ...]}

router.get('/', async function (req, res, next) {
    try {
        const results = await db.query('SELECT id, comp_code FROM invoices');
        return res.json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
});

// GET /invoices/[id] : Returns obj on given invoice.
// If invoice cannot be found, returns 404. Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}

router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;

        const result = await db.query(
            `SELECT i.id, 
                      i.comp_code, 
                      i.amt, 
                      i.paid, 
                      i.add_date, 
                      i.paid_date, 
                      c.name, 
                      c.description 
               FROM invoices AS i
                 INNER JOIN companies AS c ON (i.comp_code = c.code)  
               WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) throw new ExpressError('Not found!', 404);

        const data = result.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description,
            },
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
        };

        return res.json({ invoice: invoice });
    } catch (e) {
        return next(e);
    }
});

// POST /invoices : Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

router.post('/', async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2)
             RETURNING id,comp_code,amt,paid,add_date,paid_date`,
            [comp_code, amt]
        );

        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// PUT /invoices/[id] : Updates an invoice. If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of {amt} Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

router.put('/:id', async function (req, res, next) {
    try {
        const { amt, paid } = req.body;
        const id = req.params.id;

        // Determine the paid_date based on the current paid status
        let paid_date;
        const currentInvoice = await db.query(`SELECT paid FROM invoices WHERE id = $1`, [id]);

        if (currentInvoice.rows.length === 0) throw new ExpressError('Not found!', 404);

        if (paid && !currentInvoice.rows[0].paid) {
            paid_date = new Date(); // Set today's date if paying an unpaid invoice
        } else if (!paid) {
            paid_date = null; // Set to null if un-paying the invoice
        } else {
            paid_date = currentInvoice.rows[0].paid_date; // Keep the current paid_date if no change in paid status
        }

        const result = await db.query(
            `UPDATE invoices SET amt = $1, paid = $2, paid_date = $3
             WHERE id = $4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paid_date, id]
        );

        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// DELETE /invoices/[id] : Deletes an invoice.If invoice cannot be found, returns a 404. Returns: {status: "deleted"} Also, one route from the previous part should be updated:

router.delete('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        const result = await db.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) throw new ExpressError('Not found!', 404);
        return res.json({ message: 'Deleted' });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
