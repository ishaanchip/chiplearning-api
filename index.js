
const express = require('express')
const cors = require('cors')
const bodyParser = require("body-parser")
const clientAccountRouter =  require("./routes/clientRouter.js");
const bookingRouter = require("./routes/bookingRouter.js");
const tutorAccountRouter = require("./routes/tutorRouter.js")
const sessionsRouter = require("./routes/sessionRouter.js")
const autoCheckSessionSubmission = require("./automateSessions.js")

const mongoose = require("mongoose");
require("dotenv").config({ 
    path: process.env.NODE_ENV === 'development' 
      ? './.env.development' 
      : './.env.production' 
  })


const app = express();


app.use(bodyParser.json())


app.use(bodyParser.urlencoded({extended:false}))


const corsOptions = {
   origin:["https://www.chiplearning.org", process.env.ORIGIN],
   credentials:true,
   optionSuccessStatus:200,
   methods: ["GET", "POST", "PUT", "DELETE"],
   allowedHeaders: ["Content-Type", "Authorization"],
}


app.use(cors(corsOptions));
app.use('/client-account', clientAccountRouter);
app.use('/booking', bookingRouter)
app.use('/tutor-account', tutorAccountRouter)
app.use('/sessions', sessionsRouter)

mongoose
.connect(process.env.DB_URI, {})
.then(() => console.log("MONGODB Connected!"))
.catch((err)=> console.log(err));


const port = process.env.PORT;

//run autochecker of sessions
autoCheckSessionSubmission()



const server = app.listen(port, ()=>{
   console.log(`Server is running: PORT ${port}`)
})

