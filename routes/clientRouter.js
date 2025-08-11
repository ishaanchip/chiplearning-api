const express  = require("express");
const router = express.Router();
const schemas = require("../models/schema");
const emailSender =  require("../emailSender.js");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../middleware/auth");
require("dotenv/config")

//GENERAL ROUTES


//[COMPONENT NAME SPECIFIC] ROUTES



//SAMPLES

//getting user information, now using an authenticateToken
router.get('/get-account', authenticateToken,  async(req, res) =>{
    try{
        let email = req.user.email;
        const accountQuery = schemas.clientAccounts;
        const result = await accountQuery.findOne(
            {'email':email},
            {_id:0}
        )
        res.status(200).json({result})
    }
    catch(err){
        console.log(`there was backend error getting account info: ${err}`)
    }
})


//pass in email to crete encryption key
router.post('/login', async (req, res) =>{
    try{
        let {email, firstName, lastName} = req.body;
        const clientAccountQuery = schemas.clientAccounts
        const userExists = await clientAccountQuery.find({email:email})
        if (userExists.length === 0){                
        //preparing insert document
            const clientAccountInsert = {
                first_name:firstName,
                last_name:lastName,
                email:email,
                fields:[],
                picked_interests:false,
                current_sessions:[],
                past_sessions:[],
            }
        //sending account to be made
            const newAccount = new clientAccountQuery(clientAccountInsert)
            const result = await newAccount.save()
            //external email account creation
                const emailResults = await emailSender([email], [firstName], "account-creation", {})
            
            //interal email account creation
                let mailContent = {
                    subject:"Account Created!",
                    content:"Congrats. Check your email for more information",
                    time:Date.now(),
                }
                const clientMailResults = await clientAccountQuery.updateOne(
                    {email:email},
                    {$push: {mail: mailContent}}
                )
            console.log('email made ! ! !')
        }
        const token = jwt.sign(
            { email: email},
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );
        console.log('token made ! ')
        return res.status(200).json({ token });
    }
    catch(err){
        console.log(`there was backend error logging account: ${err}`)
    }
})


//checking email 

router.put('/check-mail', authenticateToken, async(req, res) =>{
    try{
        let email = req.user.email;
        const clientQuery = schemas.clientAccounts;
        const result = await clientQuery.updateOne(
            {'email':email},
            {$set : {mail_checked:true}}
        )
        if (result){
            return res.status(201).json({ message: "mail checker updated successfully!"});
        }

    }    
    catch(err){
        console.log(`there was backend error checking emails: ${err}`)
    }
})


module.exports = router;
