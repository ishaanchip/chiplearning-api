const cron = require("node-cron")
const emailSender = require("./emailSender")
const schemas = require("./models/schema");


//every minute...
const CRONEXPRESSION = "* * * * *"

//will run every minute or so to check all sessions that are currently pending, if active for > 24 hrs, will reject
const autoCheckSessionSubmission = () =>{
    cron.schedule(CRONEXPRESSION, () =>{
        console.log("60 seeconds ! ! !")
        pendingChecker()
    })
}

const pendingChecker = async() =>{
    try{
        //0. establishing queries
        const sessionQuery =  schemas.sessions;
        const clientQuery = schemas.clientAccounts;
        const tutorQuery = schemas.tutorAccounts;

        //1. checking all sessions for pending
        const now = Date.now()
        let expiredSessions = []
        const overduePendingSession = await sessionQuery.find({
            accept_by:{$lte: now},
            meeting_status:"pending"
        })

        for (let i = 0; i < overduePendingSession.length; i++){
            let expiredSession = overduePendingSession[i]
            expiredSessions.push({
                session_id:expiredSession.session_id,
                client_email:expiredSession.client_email,
                tutor_email:expiredSession.tutor_email
            })
        }

        //2. updating all expired sessions
        for (let i = 0; i < expiredSessions.length; i++){
            //2a. est essential vars
            let expiredSessionID = expiredSessions[i].session_id;
            let expiredSessionClientEmail = expiredSessions[i].client_email;
            let expiredSessionTutorEmail = expiredSessions[i].tutor_email;

        
            //2b. getting session contents
            console.log(expiredSessionID)

            const clientInfo = await clientQuery.findOne({email: expiredSessionClientEmail})
            const tutorInfo = await tutorQuery.findOne({email: expiredSessionTutorEmail})
            const currentSession = await sessionQuery.find({session_id:expiredSessionID})

            console.log(currentSession)
            const emailData = {
                clientEmail:currentSession[0].client_email,
                tutorEmail:currentSession[0].tutor_email,
                date:currentSession[0].session_details.date,
                timing:currentSession[0].session_details.timing,
                topic:currentSession[0].session_details.topic,
                location:currentSession[0].session_details.location
            }

            //2c. changing db w new values
            let sessionResult = await sessionQuery.updateOne(
                {session_id:expiredSessionID},
                {$set: {'meeting_status': "rejected"}}
            )

            let clientResult = await clientQuery.updateOne(
                {email: expiredSessionClientEmail},
                {
                    $pull: {current_sessions: expiredSessionID},
                    $push:{past_sessions:expiredSessionID},
                } 
            )
            let tutorResult = await tutorQuery.updateOne(
                {email: expiredSessionTutorEmail},
                {
                    $pull: {current_sessions: expiredSessionID},
                    $push:{past_sessions:expiredSessionID},
                } 
            )

            //2d. sending corresponding email
            if (sessionResult && tutorResult && clientResult){
                    let emailResults = await emailSender([expiredSessionClientEmail, expiredSessionTutorEmail], [clientInfo.first_name, tutorInfo.first_name],"session-rejected" ,emailData)
                    //2c-i. internal mail handling 
                    let mailContent = {
                        subject:"Session Rejected...",
                        content:"Check your email for more information",
                        time:Date.now(),
                        read_status:"unread"
                    }
                    //CLIENT QUERY used for both because all mail goes to client account regardless of who is tutor in the transaction
                    const clientMailResults = await clientQuery.updateOne(
                        {email:expiredSessionClientEmail},
                        {$push: {mail: mailContent}, $set:{mail_checked:false}}
                    )
                    const tutorMailResults = await clientQuery.updateOne(
                        {email:expiredSessionTutorEmail},
                        {$push: {mail: mailContent}, $set:{mail_checked:false}}
                    )
                
                console.log('email auto-rejected !')
                console.log('sending session back now !')
            }


        }

    }
    catch(err){
        console.log(`error in backend auto-checking session statuses: ${err}`)
    }
}






module.exports = autoCheckSessionSubmission