const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// Création d'une application express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/futuriste', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connecté à MongoDB"))
    .catch(err => console.log("Erreur de connexion MongoDB:", err));

// Schéma et modèle pour les informations
const InfoSchema = new mongoose.Schema({
    label: String,
    value: String,
});

const Info = mongoose.model('Info', InfoSchema);

// Serveur de l'API
app.get('/infos', async (req, res) => {
    const infos = await Info.find();
    res.json(infos);
});

app.post('/infos', async (req, res) => {
    const { label, value } = req.body;
    const newInfo = new Info({ label, value });
    await newInfo.save();

    // Diffuser l'info à tous les clients via WebSocket
    io.emit('newInfo', { label, value });

    res.status(201).send(newInfo);
});

// Serveur Socket.io
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');
    
    // Envoyer les infos à chaque nouveau client
    socket.emit('loadInfos', async () => {
        const infos = await Info.find();
        socket.emit('loadInfos', infos);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur est déconnecté');
    });
});

// Lancer le serveur
server.listen(3000, () => {
    console.log("Le serveur fonctionne sur http://localhost:3000");
});
