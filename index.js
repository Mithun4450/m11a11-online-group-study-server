const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId  } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://m11a11-online-group-study.web.app',
    'https://m11a11-online-group-study.firebaseapp.com'

],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  console.log('token in the middleware', token);
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded;
    next();
  })

}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcynqnr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {

  const assignmentCollection = client.db("assignmentDB").collection("assignment");
  const submittedAssignmentCollection = client.db("assignmentDB").collection("submittedAssignment");
  
  const featureCollection = client.db("assignmentDB").collection("feature");


  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    app.post("/jwt", async(req, res) =>{
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure:true,
        sameSite: 'none',
      })
      .send({success: true});
    })


    app.post("/logout", async(req, res) =>{
      const user = req.body;
      console.log('logging out', user);
      res
      .cookie('token', {maxAge:0})
      .send({success: true})
      
    })


    app.post('/assignments',  async(req, res) =>{

      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    })

    app.get('/assignments/all', async(req, res) =>{
      const cursor = assignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get("/assignments",  async(req, res) =>{
      console.log(req.query.difficulty);
      
      let query = {};
      if(req.query?.difficulty){
        query = {difficulty: req.query.difficulty}
      }
      
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    })

    app.delete("/assignments/:id", async(req, res) =>{

      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    })


    app.get('/assignments/assignmentWise/:id', verifyToken, async(req, res) =>{

 
      const id =  req.params.id;
      const query = {_id: new ObjectId(id)};
      console.log(query)
      const assignment = await assignmentCollection.findOne(query);
      res.send(assignment);

    })


    app.put('/assignments/assignmentWise/:id',  async(req, res) =>{

      const id = req.params.id;
      const assignment = req.body;
      console.log(id, assignment);
      const filter = {_id: new ObjectId(id) };
      const options = {upsert: true};
      const updatedAssignment = {
       $set : {
         title: assignment.title,
         photo: assignment.photo,
         marks: assignment.marks,
         difficulty: assignment.difficulty,
         date: assignment.date,
         description: assignment.description,
         
       }
      };
      const result = await assignmentCollection.updateOne(filter, updatedAssignment, options);
      res.send(result);
   })


  //  ::::::::: submitted assignment ::::::::::::

  app.post('/submittedAssignments',  async(req, res) =>{

    const submittedAssignment = req.body;
    console.log(submittedAssignment)
    const result = await submittedAssignmentCollection.insertOne(submittedAssignment);
    res.send(result);
  })

  

  app.get("/submittedAssignments", verifyToken, async(req, res) =>{
    console.log(req.query.AssignmentStatus);

   
    let query = {};
    if(req.query?.AssignmentStatus){
      query = {AssignmentStatus: req.query.AssignmentStatus}
    }
    
    const result = await submittedAssignmentCollection.find(query).toArray();
    res.send(result);
  })


  app.get('/submittedAssignments/submittedAssignmentWise/:id', verifyToken, async(req, res) =>{
    
    
    const id =  req.params.id;
    const query = {_id: new ObjectId(id)};
    console.log(query)
    const submittedAssignment = await submittedAssignmentCollection.findOne(query);
    res.send(submittedAssignment);

  })

  app.delete("/submittedAssignments/:id",  async(req, res) =>{

    const id = req.params.id;
    const query = {_id : new ObjectId(id)};
    const result = await submittedAssignmentCollection.deleteOne(query);
    res.send(result);
  })


   //  ::::::::: marked assignments ::::::::::::

 

  app.patch("/submittedAssignments/mark/:id",  async(req, res) =>{

    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const updatedSubmittedAssignment = req.body;
    console.log(updatedSubmittedAssignment)
    const updateDoc = {
      $set: {
        obtainedMarks: updatedSubmittedAssignment.obtainedMarks,
        feedback: updatedSubmittedAssignment.feedback,
        AssignmentStatus: updatedSubmittedAssignment.AssignmentStatus,
      },
    };

    const result = await submittedAssignmentCollection.updateOne(filter, updateDoc);
    res.send(result);

  })



  app.get("/submittedAssignments/mark", verifyToken,  async(req, res) =>{
    

    console.log(req.query.AssignmentStatus);
    
    let query = {};
    if(req.query?.AssignmentStatus){
      query = {AssignmentStatus: req.query.AssignmentStatus}
    }
    
    const result = await submittedAssignmentCollection.find(query).toArray();
    res.send(result);
  })


  app.get("/submittedAssignments/my", verifyToken, async(req, res) =>{
    console.log(req.query.userEmail);

    
    let query = {};
    if(req.query?.userEmail){
      query = {userEmail: req.query.userEmail}
    }
    
    const result = await submittedAssignmentCollection.find(query).toArray();
    res.send(result);
  })


    //  ::::::::: feature ::::::::::::

    app.get('/features', async(req, res) =>{
      const cursor = featureCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

 











    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res) =>{
    res.send("Online study group is running")
})

app.listen(port, () =>{
    console.log(`Online study group is running on port ${port}`)
})