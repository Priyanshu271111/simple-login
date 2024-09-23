require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const dbUsername = process.env.DB_USERNAME; // Get username from .env
const dbPassword = process.env.DB_PASSWORD; // Get password from .env

mongoose.connect(`mongodb+srv://${dbUsername}:${dbPassword}@cluster0.mst39.mongodb.net/simpleLogin`)
    .then(() => {
        console.log("MongoDB Atlas connected");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

// Update Schema to Store Multiple Texts
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    texts: { type: [String], default: [] } // Store an array of texts
});

const User = mongoose.model('User', userSchema);

// Route for the root path
app.get('/', (req, res) => {
    res.send(
        `<h1>Welcome to the Login Page</h1>
        <a href="/login">Login</a><br>
        <a href="/register">Register</a>`
    );
});

// Register User
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hashing the password
    const newUser = new User({ username, password: hashedPassword });
    try {
        await newUser.save();
        res.status(201).send('User registered');
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).send('Error registering user');
    }
});

// Login User
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(401).send('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
        res.send('Login successful');
    } else {
        res.status(401).send('Invalid username or password');
    }
});

// Save Text
app.post('/save-text', async (req, res) => {
    const { username, text } = req.body;
    try {
        await User.updateOne(
            { username },
            { $push: { texts: text } } // Use $push to add text to the array
        );
        res.send('Text saved');
    } catch (err) {
        console.error("Error saving text:", err);
        res.status(500).send('Error saving text');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
