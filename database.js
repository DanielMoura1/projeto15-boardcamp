import dotenv from "dotenv";
import { Db } from "mongodb";
import pg from 'pg';

dotenv.config();
const { Pool } = pg;
const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  export default connection;