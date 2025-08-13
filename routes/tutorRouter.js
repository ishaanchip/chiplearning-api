const express  = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const authenticateToken = require("../middleware/auth");
const schemas = require("../models/schema");



//ROUTES

    //getting all tutors
    router.get("/fetch-tutors", async (req, res) =>{
        try{
            const tutorQuery = schemas.tutorAccounts
            const result = await tutorQuery.find({})
            console.log("success!");
            res.status(200).json({result})
            

        }
        catch(err){
            console.error("Backend error fetching tutors:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    })

    //fetching tutor specific sessions
    router.get('/fetch-tutor-view', authenticateToken , async(req, res) =>{
        try{
            //1. fetch specific tutor
            let email = req.user.email;
            const tutorQuery = schemas.tutorAccounts;
            const result = await tutorQuery.findOne({'email':email})

            //2. found tutor [return tutor object, grant access]
            if (result){
                res.status(200).json({tutorObject: result, accessGranted:true})
            }
            //3. tutor not found [do not grant access]
            else{
                res.status(200).json({tutorObject: {}, accessGranted:false})
            }

        }
        catch(err){
            console.error("Backend error fetching specific tutor:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    })



//INJECTION ROUTES

    //creating a tutor account
    router.post("/create-tutor-account", async (req, res) =>{
        try{
            let {
                first_name,
                last_name,
                email,
                reviews,
                tutor_info,
                fields,
                history,
                availability, 
                updated_availability,
                locations
            } = req.body

            const tutorQuery = schemas.tutorAccounts;

            const tutorAccountInsert = {
                first_name:first_name,
                last_name:last_name,
                email:email,
                reviews:reviews,
                tutor_info:tutor_info,
                fields:fields,
                updated_availability:updated_availability,
                locations:locations,
            }

            const newTutorAccount = new tutorQuery(tutorAccountInsert)
            const result = await newTutorAccount.save()

            if (result) {
                console.log("Tutor account created successfully!");
                return res.status(201).json({ message: "Tutor account created successfully!", tutor: newTutorAccount });
              } else {
                console.error("Failed to create tutor account.");
                return res.status(400).json({ error: "Failed to create tutor account." });
              }
            } catch (err) {
              console.error("Backend error creating tutor account:", err);
              return res.status(500).json({ error: "Internal server error" });
            }
    })


        //updating  a tutor account timings
        router.put("/update-tutor-account-timings", async (req, res) =>{
            try{

    
                const tutorQuery = schemas.tutorAccounts;
    
                const tutorAccountTimingInsert = {
                    monday: {
                        available: true,
                        slots: ["3:00 P.M", "4:00 P.M", "5:00 P.M","6:00 P.M", "7:00 P.M", "8:00 P.M"]
                    },
                    tuesday: {
                        available: true,
                        slots: ["3:00 P.M", "4:00 P.M", "5:00 P.M","6:00 P.M", "7:00 P.M", "8:00 P.M"]
                    },
                    wednesday: {
                        available: true,
                        slots: ["3:00 P.M", "4:00 P.M", "5:00 P.M","6:00 P.M", "7:00 P.M", "8:00 P.M"]
                    },
                    thursday: {
                        available: true,
                        slots: ["3:00 P.M", "4:00 P.M", "5:00 P.M","6:00 P.M", "7:00 P.M", "8:00 P.M"]
                    },
                    friday: {
                        available: true,
                        slots: ["3:00 P.M", "4:00 P.M", "5:00 P.M","6:00 P.M", "7:00 P.M", "8:00 P.M"]
                    },
                    saturday: {
                        available: true,
                        slots: ["2:00 P.M", "3:00 P.M", "4:00 P.M", "5:00 P.M", "6:00 P.M", "7:00 P.M"]
                    },
                    sunday: {
                        available: true,
                        slots: ["2:00 P.M", "3:00 P.M", "4:00 P.M", "5:00 P.M", "6:00 P.M", "7:00 P.M"]
                    }
                };
                
    
                const result = await tutorQuery.updateOne(
                    {email:"ishaanchiplunkar@gmail.com"},
                    {$set: {updated_availability: tutorAccountTimingInsert}}
                )
    
                if (result) {
                    console.log("Tutor account updated successfully!");
                    return res.status(201).json({ message: "Tutor account updated successfully!"});
                  } else {
                    console.error("Failed to update tutor account.");
                    return res.status(400).json({ error: "Failed to create tutor account." });
                  }
                } catch (err) {
                  console.error("Backend error creating tutor account:", err);
                  return res.status(500).json({ error: "Internal server error" });
                }
        })



module.exports = router;
