const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    // Welcome message

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) return callback(error);

        socket.join(user.room); //Join the room

        // emit the message to() specific room
        socket.emit(
            'message',
            generateMessage(`Welcome to the server, ${username}!`)
        );
        socket.broadcast
            .to(user.room)
            .emit('message', generateMessage(`${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
        callback();
    });

    // On recv message
    socket.on('message', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) message = filter.clean(message);
        //callback('Profanity is not allowed');
        console.log(user);
        try {
            io.to(user.room).emit(
                'message',
                generateMessage(message, user.username)
            );
        } catch (error) {
            console.log(error);
        }

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user)
            io.to(user.room).emit(
                'message',
                generateMessage(`${user.username} has left!`)
            );
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
    });

    socket.on('sendLocation', (object, callback) => {
        callback('Location shared');
        socket.broadcast.emit('recvObject', generateMessage(object));
    });
});

server.listen(port, () => console.log(`Server is listening at ${port}`));
