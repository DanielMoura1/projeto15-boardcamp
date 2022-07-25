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

app.get('/games', async (req, res) => {
  const {name} =req.query;
  const nome =[];
  let jogos =''
  if(name){
    nome.push(`${name}%`)
    jogos= `WHERE games.name ILIKE $1`
  }
  try{
      
      const resultado = await db.query(`
      SELECT games.*, categories.name as "categoryName"
      FROM games
      JOIN categories ON games. "categoryId" = categories.id
      ${jogos}`,nome);
      res.send(resultado.rows);
  }catch(error){
      console.log('ERRO');
      console.log(error);
      res.sendStatus(500);
  }
});
app.post('/games', async (req, res) => {
 
  const game = req.body;
  
  const jogosScrema = joi.object({
    name: joi.string().required(),
    image:joi.string().uri().required(),
    stockTotal:joi.string().required(),
    categoryId: joi.number().required(),
    pricePerDay: joi.string().required()
  })
 
  const validation= jogosScrema.validate(game)
 
  if(validation.error){
    
    return res.sendStatus(400)
  } 
 
  try{
   
    const resultado = await db.query(`SELECT id FROM categories WHERE id = $1`,[game.categoryId])
    if(resultado.rowCount ==0){
      return res.sendStatus(400)
    }
    await db.query(`INSERT INTO games(name,image,"stockTotal","categoryId","pricePerDay")
    VALUES ($1, $2,$3,$4,$5)
    `,[game.name,game.image,Number(game.stockTotal),game.categoryId,Number(game.pricePerDay)])
    res.sendStatus(201) 
  }catch(error){
    
      console.log(error);
      res.sendStatus(500);
  }
});

app.get('/customers', async (req, res) => {
  const {cpf} = req.query;

  const parans = []
  let WhereCpf =''
  if(cpf){
    parans.push(`${cpf}%`)
    WhereCpf ='WHERE CPF ILIKE $1'
  }
  try{
    const resultado =await db.query(`
    SELECT * FROM customers
    ${WhereCpf}`,parans)
    res.send(resultado.rows)
  }catch(error){
 
      console.log(error);
      res.sendStatus(500)
  }

});

app.get('/customers/:id', async (req, res) => {
  const {id} = req.params;
  if(isNaN(parseInt(id))){
    return res.sendStatus(400)
  }
  try{
    const resultado = await db.query(`
    SELECT * FROM customers where id = $1
    `,[id])
    if(resultado.rowCount ==0){
      return res.sendStatus(404)
    }
    res.send(resultado.rows[0])
  }catch(error){
   
    console.log(error);
    res.sendStatus(500)
  }

});
app.post('/customers', async (req, res) => {
  const customer =req.body;
  try{
    const resultado = await db.query(`SELECT id FROM customers WHERE cpf = $1`,[customer.cpf])
    if(resultado.rowCount >0){
      return res.sendStatus(409)
    }
    await db.query(`
    INSERT INTO customers (name,phone,cpf,birthday)
    VALUES ($1,$2,$3,$4);
    `,[customer.name,customer.phone,customer.cpf,customer.birthday]);
    res.sendStatus(201);
  }catch(error){
   
      console.log(error);
      res.sendStatus(500)
  }

});

app.put('/customers/:id', async (req, res) => {

   const {id} = req.params;
   const customer = req.body;

   if(isNaN(parseInt(id))){
    return res.sendStatus(400);
   }

   try{

    const resultado = await db.query(`
    SELECT id from customers WHERE CPF = $1 AND id != $2
    `,[customer.cpf,id])
    if(resultado.cpf >0){
      return res.sendStatus(409)
    }
    await db.query(`
    UPDATE customers
    SET
      name = $1
      phone = $2
      cpf = $3
      birthday = $4
    WHERE id = $5
    `,[customer.name,customer.phone,customer.cpf,customer.birthday,id])
   
    res.sendStatus(200);
   }catch(error){
   
      console.log(error);
      res.sendStatus(500)
   }
})
app.get('/rentals', async (req, res) => {

  const {customerId,gameId} = req.query

  const params = []
  let whereRentals ='';
 
  const condi =[]
  if(customerId){
    params.push(customerId)
    condi.push(`rentals."customerId" = $${params.length}`)
  }
 
  if(gameId){
    params.push(gameId)
    condi.push(`rentals."gameId" = $${params.length}`)
  }
 
  if(params.length >0){
   whereRentals =`WHERE ${condi.join(" AND ")}`
  }

  const resultado= await db.query({
    text:`SELECT rentals.*, customers.name AS customer, games.name, categories.*
    FROM rentals
    JOIN customers ON customers.id=rentals."customerId"
    JOIN games ON games.id=rentals."gameId"
    JOIN categories ON categories.Id=games."categoryId" ${whereRentals}
    `,rowMode: "array"
  },params);
  
  res.send(resultado.rows.map(fun))

});
function fun(row){
  const [
    id,customerId,gameId,rentDate,
    daysRented,returnDate,originalPrice,
    delayFee,customerName,gameName,
    categoryId,categoryName
  ] = row;
  return{
    id,
    customerId,
    gameId,
    rentDate,
    daysRented,
    returnDate, 
    originalPrice,
    delayFee,
    customer: {
     id: customerId,
     name: customerName
    },
    game: {
      id: gameId,
      name: gameName,
      categoryId,
      categoryName
  }
}
}

app.post('/rentals', async (req, res) => {

  const rental = req.body;

  try{
   
      const customersResult =await db.query(`
        SELECT * FROM customers WHERE id=$1
      `,[rental.customerId]);
      if(customersResult.rowCount ==0){
        return res.sendStatus(400)
      }
      const gameResultado = await db.query(`
        SELECT * FROM games WHERE id =$1
      `,[rental.gameId])
      if(gameResultado.rowCount ===0){
        return res.sendStatus(400);
      }
      const game = gameResultado.rows[0];
      const originalPrice = rental.daysRented * game.pricePerDay;
      await db.query(`
        INSERT INTO
        rentals(
          "customerId","gameId","rentDate",
          "daysRented","returnDate","originalPrice","delayFee"
        )
        Values ($1,$2,NOW(),$3,null,$4,null);
      `,[rental.customerId,rental.gameId,rental.daysRented,originalPrice])
    
      res.sendStatus(201);
  }catch(error){
   
    console.log(error);
    res.sendStatus(500)
  }

})

app.post('/rentals/:id/return', async (req, res) => {
  const {id} =req.params;
  try{
   const resultado =await db.query(`SELECT * FROM rentals WHERE id = $1`,[id])
  if(resultado.rowCount ==0){
    return res.sendStatus(400);
  }
  const rental = resultado.rows[0];
  if(rental.returnDate){
    return res.sendStatus(400)
  } 
  else{
    const diff = new Date().getTime() -new Date(rental.rentDate).getTime();
    const diffInDays =Math.floor(diff / (24 * 3600 * 1000));
    let delayFee =0
    if(diffInDays >rental.daysRented){
      const addicionalDays =diffInDays -rental.daysRented;
      delayFee =addicionalDays * rental.originalPrice;
      console.log("delayFee",addicionalDays);
    };
    await db.query(`
    UPDATE rentals
    SET "returnDate" = NOW(),"delayFee" = $1
    WHERE id = $2
    `,[delayFee,id]);
    res.sendStatus(200);
  }
  }catch(error){
  
    console.log(error);
    res.sendStatus(500)
  }
})
app.delete('/rentals/:id', async (req, res) => {
  const {id} = req.params;
  try{
    const resultado = await db.query(`SELECT * FROM rentals WHERE id = $1`,[id]);
    if(resultado.rowCount ==0){
      res.sendStatus(404)
    }else {
      const rental = resultado.rows[0]
      
      if(!rental.returnDate) res.sendStatus(400);
      else{
        await db.query(`DELETE FROM rentals WHERE id = $1`,[id]);
      }
    }
  }catch(error){

    console.log(error);
    res.sendStatus(500)
  }

})
app.listen(4000, () => {
  console.log('Server is listening on port 4000.');
});