import express from 'express';
import chalk from "chalk";
import cors from "cors";
import joi from "joi"

import db from './database.js';

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
        console.log('ERRO');
        console.log(error);
        res.sendStatus(500);
    }
});
app.post('/categories', async (req, res) => {
   
    const categoria = req.body;
    const categoriaSchema = joi.object({
        name:joi.string().required()
    });
   
    const validation =categoriaSchema.validate(categoria);
   
    if(validation.error){
        return res.sendStatus(400);
    }
  
    try{
       
      const resultado = await db.query(`SELECT id FROM categories WHERE name = $1
      `,[categoria.name]);
     
      if(resultado.rowCount >0){
        return res.sendStatus(409);
      }
      
      await db.query(`
        INSERT INTO categories(name) VALUES ($1)
      `,[categoria.name]);
      res.sendStatus(201);
    }catch(error){
        console.log(error);
        res.sendStatus(500);
    }
});



app.listen(4000, () => {
  console.log('Server is listening on port 4000.');
});