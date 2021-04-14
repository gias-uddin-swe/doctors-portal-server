const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;

const ObjectId = require("mongodb").ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jqsch.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const port = 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("doctors"));
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

client.connect((err) => {
  const appointmentsCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("appointment");
  const doctorCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("doctors");

  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;
    appointmentsCollection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  // app.post("/appointmentsByDate", (req, res) => {
  //   const date = req.body;
  //   console.log(date.date);
  //   appointmentsCollection
  //     .find({ date: date.date })
  //     .toArray((err, documents) => {
  //        res.send(documents);
  //     });
  // });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { date: date.date };
      if (doctors.length === 0) {
        filter.email = email;
      }
      appointmentsCollection.find(filter).toArray((err, documents) => {
        console.log(email, date.date, doctors, documents);
        res.send(documents);
      });
    });
  });

  app.get("/allPatient", (req, res) => {
    appointmentsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/addDoctor", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString("base64");
    // file.mv(`${__dirname}/doctors/${file.name}`, (err) => {
    //  if (err) {
    //console.log(err);
    //     return res.status(500).send({ meg: "can not upload file" });
    //   }
    //   return res.send({ name: file.name, path: `/${file.name}` });
    // });
    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: file.name,
    };

    doctorCollection.insertOne({ name, email, image }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.get("/allPatient", (req, res) => {
    appointmentsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/isDoctor", (req, res) => {
    const email = req.body.email;
    doctorCollection
      .find({ email: req.body.email })
      .toArray((err, documents) => {
        res.send(documents.length > 0);
      });
  });
});

app.listen(process.env.PORT || port);
