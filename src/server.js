// Import necessary modules
const http = require("http");
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const fs = require("fs");
const path = require('path');

// Set the port number for the server to listen on, defaulting to 8080
const port = process.env.PORT || 8080;

// Create an HTTP server using the Express app
const server = http.Server(app);

// Start the server and listen on the specified port
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Create a Socket.IO instance that works with the server
const io = socketIo(server);

// Create an empty object to keep track of connected clients
const clients = {};

// Define routes for serving HTML files
app.get("/", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/Static/home.html");
    stream.pipe(res);
});

app.get("/game",(req,res)=>{
    const stream = fs.createReadStream(__dirname + "/Static/index.html");
    stream.pipe(res);
});

// Serve static assets from appropriate directories
app.use(express.static(path.join(__dirname ,"/Static")))
app.use(express.static(path.join(__dirname , "/../node_modules/")));

// Create data structures for managing players and matches
var players = {}; 
var unmatched;

// Handle socket connections
io.on("connection", function(socket) {
    // Get the unique ID of the connected client
    let id = socket.id;

    // Log that a new client has connected
    console.log("New client connected. ID: ", socket.id);

    // Store the client's socket object for future reference
    clients[socket.id] = socket;

    // Handle disconnection event
    socket.on("disconnect", () => { 
        console.log("Client disconnected. ID: ", socket.id);
        // Remove the client's reference from the clients object
        delete clients[socket.id];
        // Notify other clients about the disconnection
        socket.broadcast.emit("clientdisconnect", id);
    });

    // Handle player joining and match initiation
    join(socket); 

    // If an opponent is available, start the game
    if (opponentOf(socket)) { 
        // Inform the current player about the game start
        socket.emit("game.begin", { 
            symbol: players[socket.id].symbol
        });

        // Inform the opponent about the game start
        opponentOf(socket).emit("game.begin", { 
            symbol: players[opponentOf(socket).id].symbol 
        });
    }

    // Handle player moves
    socket.on("make.move", function(data) {
        // Ensure the player has an opponent to play against
        if (!opponentOf(socket)) {
            return;
        }

        // Emit the move to both players
        socket.emit("move.made", data); 
        opponentOf(socket).emit("move.made", data); 
    });

    // Handle opponent disconnection
    socket.on("disconnect", function() {
        if (opponentOf(socket)) {
            // Notify the opponent about their opponent's disconnection
            opponentOf(socket).emit("opponent.left");
        }
    });
});

// Function to handle player joining
function join(socket) {
    players[socket.id] = {
        opponent: unmatched,
        symbol: "X",
        socket: socket
    };

    if (unmatched) { 
        players[socket.id].symbol = "O";
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {  
        unmatched = socket.id;
    }
}

// Function to find the opponent of a given player
function opponentOf(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}
