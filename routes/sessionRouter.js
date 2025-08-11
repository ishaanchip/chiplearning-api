const express  = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const emailSender =  require("../emailSender.js");
const schemas = require("../models/schema");


//BOOKING SESSION

    //creating a session
    router.post('/create-session', authenticateToken, async(req, res) =>{
        try{
            //1. creating a session 
                let clientEmail = req.user.email;
                let {tutorEmail, sessionDate, rawSessionDate, sessionTime, sessionTopic, sessionLocation} = req.body;
                const sessionQuery = schemas.sessions;
                const sessionNumber = await sessionQuery.countDocuments()
                let randomSessionId = 10000000 + sessionNumber
                const sessionInsert = {
                    client_email:clientEmail,
                    tutor_email:tutorEmail,
                    meeting_status:"pending",
                    session_id:randomSessionId,
                    session_details:{
                        date:sessionDate,
                        raw_date: rawSessionDate,
                        timing:sessionTime,
                        topic:sessionTopic,
                        location:sessionLocation
                    },
                    accept_by:(Date.now() + 1000*60*60*24)
                }
                const newSession  = new sessionQuery(sessionInsert)
                const sessionResult = await newSession.save()
                console.log(`session successfully created !`)
            
            //2. adding session to client & tutor
                const clientQuery = schemas.clientAccounts
                const tutorQuery = schemas.tutorAccounts

                const clientInfo = await clientQuery.findOne({email: clientEmail})
                const tutorInfo = await tutorQuery.findOne({email: tutorEmail})

                const clientResult = await clientQuery.updateOne(
                    {email: clientEmail},
                    {$push: {current_sessions: randomSessionId},}
                )
                const tutorResult = await tutorQuery.updateOne({email: tutorEmail}, {$push: {current_sessions: randomSessionId}})

                if (sessionResult && tutorResult && clientResult){
                    console.log(`session interconnected !`)
                        //2a. external emailing session creation
                        const emailData = {
                            clientEmail:clientEmail,
                            tutorEmail:tutorEmail,
                            date:sessionDate,
                            timing:sessionTime,
                            topic:sessionTopic,
                            location:sessionLocation
                        }
                        
                        let emailResults = await emailSender([clientEmail, tutorEmail], [clientInfo.first_name, tutorInfo.first_name],"session-booked" ,emailData)
                        
                        //2b. internal mail handling 
                        let mailContent = {
                            subject:"Session Booked!",
                            content:"Check your email for more information",
                            time:Date.now(),
                            read_status:"unread"
                        }
                        //CLIENT QUERY used for both because all mail goes to client account regardless of who is tutor in the transaction
                        const clientMailResults = await clientQuery.updateOne(
                            {email:clientEmail},
                            {$push: {mail: mailContent}, $set:{mail_checked:false}}
                        )
                        const tutorMailResults = await clientQuery.updateOne(
                            {email:tutorEmail},
                            {$push: {mail: mailContent}, $set:{mail_checked:false}}
                        )
                    console.log('email booked !')
                    console.log('sending session back now !')
                    return res.status(201).json({ message: "session  created successfully!", session: newSession });
                }
                else {
                    console.error("Failed to interconnect session.");
                    return res.status(400).json({ error: "Failed to interconnect session." });
                }




        }
        catch(err){
            console.log(`there was backend error creating session: ${err}`)
        }
    })


    //fetching tutor sessions
    router.post('/fetch-sessions', async(req, res) =>{
        try{
            let {sessionIds} = req.body;
            if (!sessionIds || sessionIds.length === 0) {
                return res.status(200).json({ sessions: [] });
              }
            const sessionQuery = schemas.sessions;
            const result = await sessionQuery.find({
                session_id:{$in: sessionIds}
            })
            return res.status(200).json({ sessions: result });
        }
        catch(err){
            console.log(`there was backend error fetching tutor sessions: ${err}`)
        }
    })

    //canceling a session
    router.put("/cancel-session", authenticateToken, async(req, res) =>{
        try{
            //0. base variables
                let {sessionId, tutorEmail} = req.body
                let clientEmail = req.user.email;
                const sessionQuery = schemas.sessions;

            //1. getting info of canceled session
                const canceledSession = await sessionQuery.find({session_id:sessionId})
                console.log(canceledSession[0].client_email)
                const emailData = {
                    clientEmail:canceledSession[0].client_email,
                    tutorEmail:canceledSession[0].tutor_email,
                    date:canceledSession[0].session_details.date,
                    timing:canceledSession[0].session_details.timing,
                    topic:canceledSession[0].session_details.topic,
                    location:canceledSession[0].session_details.location
                }


            //2. changing session status
                const sessionResult = await sessionQuery.updateOne(
                    {
                        session_id:sessionId
                    },
                    {
                        $set: {meeting_status: "canceled"}
                    }
                )
                console.log(`session successfully updated !`)
            
            //3. altering session status' to client & tutor
                const clientQuery = schemas.clientAccounts
                const tutorQuery = schemas.tutorAccounts

                const clientInfo = await clientQuery.findOne({email: clientEmail})
                const tutorInfo = await tutorQuery.findOne({email: tutorEmail})

                console.log(clientEmail)
                console.log(tutorEmail)
                console.log(sessionId)

                const clientResult = await clientQuery.updateOne(
                    {email: clientEmail},
                    {
                        $pull: {current_sessions: sessionId},
                        $push:{past_sessions:sessionId},
                    } 
                )
                const tutorResult = await tutorQuery.updateOne(
                    {email: tutorEmail},
                    {
                        $pull: {current_sessions: sessionId},
                        $push:{past_sessions:sessionId},
                    } 
                )

                if (sessionResult && tutorResult && clientResult){
                    console.log(`session interconnected !`)
                    let emailResults = await emailSender([clientEmail, tutorEmail], [clientInfo.first_name, tutorInfo.first_name],"session-canceled" ,emailData)
                    //4. internal mail handling 
                    let mailContent = {
                        subject:"Session Canceled...",
                        content:"Check your email for more information",
                        time:Date.now(),
                        read_status:"unread"
                    }
                    //CLIENT QUERY used for both because all mail goes to client account regardless of who is tutor in the transaction
                    const clientMailResults = await clientQuery.updateOne(
                        {email:clientEmail},
                        {$push: {mail: mailContent}, $set:{mail_checked:false}}
                    )
                    const tutorMailResults = await clientQuery.updateOne(
                        {email:tutorEmail},
                        {$push: {mail: mailContent}, $set:{mail_checked:false}}
                    )
                    console.log('email cancel !')
                    console.log('sending session back now !')
                    return res.status(201).json({ message: "session  updated successfully!"});
                }
                else {
                    console.error("Failed to interconnect session.");
                    return res.status(400).json({ error: "Failed to interconnect session." });
                }

        }
        catch(err){
            console.log(`there was backend error updating session: ${err}`)
        }

    })

    //rejecting a session
    router.put("/tutor-session-decision", authenticateToken, async(req, res) =>{
        try{
            //0. base variables
                let {sessionId, clientEmail, tutorDecision} = req.body
                let tutorEmail = req.user.email;

                const clientQuery = schemas.clientAccounts
                const tutorQuery = schemas.tutorAccounts

                const clientInfo = await clientQuery.findOne({email: clientEmail})
                const tutorInfo = await tutorQuery.findOne({email: tutorEmail})
                const sessionQuery = schemas.sessions;

                let clientResult = true;
                let tutorResult = true;
                let sessionResult = true;

                
            //1. getting info of accepted || rejected session
                const currentSession = await sessionQuery.find({session_id:sessionId})
                console.log(currentSession[0].client_email)
                const emailData = {
                    clientEmail:currentSession[0].client_email,
                    tutorEmail:currentSession[0].tutor_email,
                    date:currentSession[0].session_details.date,
                    timing:currentSession[0].session_details.timing,
                    topic:currentSession[0].session_details.topic,
                    location:currentSession[0].session_details.location
                }


            //2. changing session status
            if (tutorDecision == "rejected"){
                 sessionResult = await sessionQuery.updateOne(
                    {
                        session_id:sessionId
                    },
                    {
                        $set: {meeting_status: "rejected"}
                    }
                )
                //2a. altering session status' to client & tutor
                clientResult = await clientQuery.updateOne(
                    {email: clientEmail},
                    {
                        $pull: {current_sessions: sessionId},
                        $push:{past_sessions:sessionId},
                    } 
                )
                tutorResult = await tutorQuery.updateOne(
                    {email: tutorEmail},
                    {
                        $pull: {current_sessions: sessionId},
                        $push:{past_sessions:sessionId},
                    } 
                )

            }
            else if (tutorDecision == "approved"){
                 sessionResult = await sessionQuery.updateOne(
                    {
                        session_id:sessionId
                    },
                    {
                        $set: {meeting_status: "approved"}
                    }
                )
            }
                console.log(`session successfully updated !`)
            

                if (sessionResult && tutorResult && clientResult){
                    console.log(`session interconnected !`)
                    if (tutorDecision == "rejected"){
                        let emailResults = await emailSender([clientEmail, tutorEmail], [clientInfo.first_name, tutorInfo.first_name],"session-rejected" ,emailData)
                        //3a. internal mail handling 
                        let mailContent = {
                            subject:"Session Rejected...",
                            content:"Check your email for more information",
                            time:Date.now(),
                            read_status:"unread"
                        }
                        //CLIENT QUERY used for both because all mail goes to client account regardless of who is tutor in the transaction
                        const clientMailResults = await clientQuery.updateOne(
                            {email:clientEmail},
                            {$push: {mail: mailContent}, $set:{mail_checked:false}}
                        )
                        const tutorMailResults = await clientQuery.updateOne(
                            {email:tutorEmail},
                            {$push: {mail: mailContent}, $set:{mail_checked:false}}
                        )
                    }
                    else if (tutorDecision == "approved"){
                        let emailResults = await emailSender([clientEmail, tutorEmail], [clientInfo.first_name, tutorInfo.first_name],"session-approved" ,emailData)
                        //3b. internal mail handling 
                        let mailContent = {
                            subject:"Session Approved!",
                            content:"Check your email for more information",
                            time:Date.now(),
                            read_status:"unread"
                        }
                        //CLIENT QUERY used for both because all mail goes to client account regardless of who is tutor in the transaction
                        const clientMailResults = await clientQuery.updateOne(
                            {email:clientEmail},
                            {$push: {mail: mailContent}, $set:{mail_checked:false}}
                        )
                        const tutorMailResults = await clientQuery.updateOne(
                            {email:tutorEmail},
                            {$push: {mail: mailContent}, $set:{mail_checked:false}}
                        )
                    }
                    console.log('email approved || rejected !')
                    console.log('sending session back now !')
                    return res.status(201).json({ message: "session  updated successfully!"});
                }
                else {
                    console.error("Failed to interconnect session.");
                    return res.status(400).json({ error: "Failed to interconnect session." });
                }

        }
        catch(err){
            console.log(`there was backend error updating session: ${err}`)
        }

    })


module.exports = router;