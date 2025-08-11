const nodemailer = require('nodemailer')


//EMAIL TEMPLATES
const emailTemplates = (emailType, emailData) => {
    
    let emailTypes = {
        "account-creation":{
            subject:"ChipLearning: Account Created",
            text: "Your account was succesfully created! 🥳\n\n" + 
                "Booking a tutor is only a couple clicks away (keep in mind tutors are given a 1 day period to accept or decline booked slots). "
        },
        "session-booked":{
            subject: "ChipLearning: Tutoring Session Booked",
            text: `A new tutoring session was booked!🎇\n\n` +
            `Client: ${emailData.clientEmail}\n` +
            `Tutor: ${emailData.tutorEmail}\n\n` +
            `📚 Topic: ${emailData.topic}\n\n` +
            `📅 Date: ${emailData.date}\n\n` +
            `⏰ Time: ${emailData.timing}\n\n` +
            `📍 Location: ${emailData.location}\n\n` +
            `Client: Give tutors one day to accept or decline your request. You will be notified once the tutor responds.\n\n` +
            `Tutor: Please accept or deny the client's request as soon as possible.\n\n`
        },
        "session-canceled":{
            subject: "ChipLearning: Tutoring Session Canceled",
            text: `A booked tutoring session was canceled by the client...🥺\n\n` +
            `Client: ${emailData.clientEmail}\n` +
            `Tutor: ${emailData.tutorEmail}\n\n` +
            `📚 Topic: ${emailData.topic}\n\n` +
            `📅 Date: ${emailData.date}\n\n` +
            `⏰ Time: ${emailData.timing}\n\n` +
            `📍 Location: ${emailData.location}\n\n` +
            `Client: You have successfully canceled your appointment.\n\n` +
            `Tutor: This timing slot is now open to others, granted it is over a day away.\n\n`
        },
        "session-rejected":{
            subject: "ChipLearning: Tutoring Session Rejected",
            text: `A booked tutoring session was rejected by the tutor...🥺\n\n` +
            `Client: ${emailData.clientEmail}\n` +
            `Tutor: ${emailData.tutorEmail}\n\n` +
            `📚 Topic: ${emailData.topic}\n\n` +
            `📅 Date: ${emailData.date}\n\n` +
            `⏰ Time: ${emailData.timing}\n\n` +
            `📍 Location: ${emailData.location}\n\n` +
            `Client: We are sorry that this tutor could not offer you their assistance. Try to book another.\n\n` +
            `Tutor: You have successfully rejected the client's request.\n\n`
        },
        "session-approved":{
            subject: "ChipLearning: Tutoring Session Approved",
            text: `It's official! This tutoring session has been agreed upon by both parties 🤩\n\n` +
            `Client: ${emailData.clientEmail}\n` +
            `Tutor: ${emailData.tutorEmail}\n\n` +
            `📚 Topic: ${emailData.topic}\n\n` +
            `📅 Date: ${emailData.date}\n\n` +
            `⏰ Time: ${emailData.timing}\n\n` +
            `📍 Location: ${emailData.location}\n\n` +
            `Client & Tutor: Show up on time ! ! !\n\n` 
        }
    }
    return emailTypes[emailType];
}


//EMAIL ROUTING
const sendEmail = async(recieverEmails, recieverNames,  emailType, emailData) =>{

    //0. init email transporter
        const transport = nodemailer.createTransport({
            host: "live.smtp.mailtrap.io",
            port: 587,
            auth: {
            user: "api",
            pass: process.env.MAILCHIMP_API_KEY
            }
        });

    //1. create greeting tag
    let greetingSnippet = ""
        if (recieverNames.length == 2){
            greetingSnippet = `${recieverNames[0]} & ${recieverNames[1]}`
        }
        else if (recieverNames.length == 1){
            greetingSnippet = recieverNames[0]
        }


    //2. sending acc email
        let info = await transport.sendMail({
            from:"support@chiplearning.org",
            to:recieverEmails,
            subject:(emailTemplates(emailType, emailData)).subject,
            text:`Hi ${greetingSnippet},\n\n` + (emailTemplates(emailType, emailData)).text + "\n\n- ChipLearning Team"
        })

    console.log(`message sent! ${info.messageId}`)

}


module.exports = sendEmail;