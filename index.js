import express from 'express';
import chalk from "chalk";
import cors from "cors";


import db from './database-boardcamp/src/database.js';

const app = express();
app.use(express.json());


app.use(cors());

app.get('/categories', async (req, res) => {
    try{
        console.log('TEST')
        const resultado= await db.query(`
        SELECT * FROM categories
        `);
        res.send(resultado.rows);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    
    }
  
});



app.listen(4000, () => {
  console.log('Server is listening on port 4000.');
});