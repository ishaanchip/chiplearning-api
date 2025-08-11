const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//client account schemas
const clientAccountSchema = new Schema({
    first_name:{type:String, required:true},
    last_name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    fields:{type:[String], default: []},
    picked_interests:{type:Boolean, default:false},
    current_sessions:[Number],
    past_sessions:[Number],
    mail:{type:[Object], default:[]},
    mail_checked:{type: Boolean, default: false},
    create_date:{type:Date, default: Date.now},
})

const clientAccounts = mongoose.model('client_accounts', clientAccountSchema, 'client_accounts');

//tutor account schemas
const tutorAccountSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    reviews: [Number],
    tutor_info: {
      school: String,
      grade: Number,
      display_picture: String,
    },
    fields: [String],
    current_sessions:[Number],
    past_sessions:[Number],
    availability: Object,
    updated_availability: Object,
  });

const tutorAccounts = mongoose.model('tutor_accounts', tutorAccountSchema, 'tutor_accounts');


//session account schema
const sessionsSchema = new mongoose.Schema({
  client_email:{type: String, required: true},
  tutor_email:{type: String, required: true},
  meeting_status:{type:String, required:true},
  session_id:{type: Number, required:true},
  session_details: {
    date:String,
    raw_date:Date,
    timing:String,
    topic:String,
    location:String
  },
  accept_by:{type:Date},
})

const sessions = mongoose.model('sessions', sessionsSchema, 'sessions');




const mySchemas = {'clientAccounts':clientAccounts, 'tutorAccounts': tutorAccounts, 'sessions':sessions}

module.exports = mySchemas;