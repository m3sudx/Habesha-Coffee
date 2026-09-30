import {Pool} from 'pg'

const pool=new Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_NAME,
    password:process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

pool.connect()
  .then((client) => {
    console.log('database is connected');
    client.release();
  })
  .catch((err) => console.log('database connection fails', err.message));

export default pool;