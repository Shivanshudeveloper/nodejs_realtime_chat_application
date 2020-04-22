const express = require('express');
const path = require('path');

// http Module for socket.io
const http = require('http');
// Bring the SocketIO Path
const socketio = require('socket.io');

// Format Message
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/Users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Bot Name
const botName= 'CharCord Bot';

// Set Static Folder in Public
app.use(express.static(path.join(__dirname, 'public')));

// Run when client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id ,username, room);
        
        socket.join(user.room);


        // Welcome Current User to Chat
        socket.emit('message', formatMessage(botName ,'Welcome to ChatCord!'));

        // Brodcast when a user connects except the client connecting
        socket.broadcast.to(user.room).emit('message', 
            formatMessage(botName ,`${user.username} joind the chat`)
        );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    

    

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        // Knwo which user leaves
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName ,`${user.username} has left the chat`));
        
            // Send users and room info if the user disconnect
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });

    // Brodcast to everyone
    // io.emit();
});



const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));