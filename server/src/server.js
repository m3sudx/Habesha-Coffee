import 'dotenv/config'
import express from 'express'
import pool from './config/db.js'
import mainRouter from './routes/index.js'
import errorHandler from './middleware/errorHandler.js'
const app=express()

app.use(express.json())

app.use('/api',mainRouter)


app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "working" });
});


app.use(errorHandler)
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});