const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors({
    origin: ['http://localhost:5173',
        'https://dream-catalyst.web.app'],
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.iz3zu0d.mongodb.net/?retryWrites=true&w=majority`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middleware
const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl)
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middleware', token)
    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(401).send({ message: 'not authorized' })
        }
        console.log('value in the token', decoded)
        req.user = decoded;
        next();
    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const jobCollection = client.db("jobDB").collection("jobs");
        const appliedJobCollection = client.db("jobDB").collection("appliedJobs");


        // auth related api
        app.post("/jwt", logger, async (req, res) => {
            const user = req.body;
            // console.log(user);
            // insert the data in the database
            // const result = await bookingCollections.insertOne(booking);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    //   sameSite:'none'
                })
                .send({ success: true });
        })



        // app.get("/jobs", async (req, res) => {
        //     const cursor = allJobCollection.find();
        //     const result = await cursor.toArray();//find data in array
        //     res.send(result);
        // })


        // get the specific data search by email in server site.
        app.get('/jobs', logger, async (req, res) => {
            console.log(req.query.email);
            // console.log("tok tok token",req.cookies.token);
            // console.log("user in the valid token",req.user);

            // if(req.query.email !== req.user.email){
            //     return res.status(403).send({message: 'forbidden access'})
            // }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }

            const result = await jobCollection.find(query).toArray();

            res.send(result);
        });



        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) } //unique objectId to delete one data
            const result = await jobCollection.findOne(query);
            res.send(result);
        });

        // for pass the data from client side to server site and site the data in database
        app.post("/jobs", async (req, res) => {
            const newJob = req.body;
            // console.log("new jobs:", newJob);
            // Insert the defined document into the "jobs" collection
            const result = await jobCollection.insertOne(newJob);
            res.send(result);
        })



        // app.post("/jobs", async (req, res) => {
        //     const newJob = req.body;
        //     // console.log("new jobs:", newJob);
        //     // Insert the defined document into the "jobs" collection
        //     const result = await allJobCollection.insertOne(newJob);
        //     res.send(result);
        // })

        app.put("/jobs/:id", async (req, res) => {
            const id = req.params.id;

            // console.log(user);
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedJob = req.body;
            const job = {
                $set: {

                    url: updatedJob.url,
                    title: updatedJob.title,
                    name: updatedJob.name,
                    postdate: updatedJob.postdate,
                    category: updatedJob.category,
                    deadline: updatedJob.deadline,
                    number: updatedJob.number,
                    salary: updatedJob.salary,
                    company: updatedJob.company,
                    email: updatedJob.email,
                    description: updatedJob.description
                }
            }
            const result = await jobCollection.updateOne(filter, job, options);
            res.send(result);

        })


        app.put("/updatejobs/:id", async (req, res) => {
            const id = req.params.id;

           
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const appliedJob = req.body; 
            console.log(appliedJob);
            const job = {
                $set: {
                    number: parseInt(appliedJob.number)+1,
                }
            }
            const result = await jobCollection.updateOne(filter, job, options);
            res.send(result);

        })

        app.delete("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            // console.log("please delete from database");
            const query = { _id: new ObjectId(id) } //unique objectId to delete one data
            const result = await jobCollection.deleteOne(query);
            res.send(result);
        })

        // appliedJob

        // app.get("/appliedJobs", async (req, res) => {
        //     const cursor = appliedJobCollection.find();
        //     const result = await cursor.toArray();//find data in array
        //     res.send(result);
        // })

        app.get('/appliedJobs', logger, async (req, res) => {
            // console.log(req.query.email);

            // console.log("tok tok token",req.cookies.token);
            // console.log("user in the valid token",req.user);

            // if(req.query.email !== req.user.email){
            //     return res.status(403).send({message: 'forbidden access'})
            // }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await appliedJobCollection.find(query).toArray();
            res.send(result);
        });

        // for pass the data from client side to server site and site the data in database
        app.post("/appliedJobs", async (req, res) => {
            const appliedJob = req.body;
            // console.log("new jobs:", newJob);
            // Insert the defined document into the "appliedJobCollection" collection
            const result = await appliedJobCollection.insertOne(appliedJob);
            res.send(result);



            // try {
            //     const result = await appliedJobCollection.insertOne(appliedJob);

            //     // Increment the number of applicants for the job by 1
            //     const jobId = appliedJob._id;
            //     await appliedJobCollection.updateOne({ _id: jobId }, { $inc: { number: 1 } });

            //     res.status(200).json({ insertedId: result.insertedId });
            // } catch (error) {
            //     console.error('Error applying for job:', error);
            //     res.status(500).json({ error: 'Failed to apply for job' });
            // }
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



app.get('/', (req, res) => {
    res.send('Job portal website server is running');
});

app.listen(port, () => {
    console.log(`Job portal website server is running on port : ${port}`);
});