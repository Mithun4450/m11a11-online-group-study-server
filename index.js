const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId  } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



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


  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    app.post('/assignments', async(req, res) =>{
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