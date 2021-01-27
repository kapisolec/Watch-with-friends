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
const { addVideo, getVideo } = require('./utils/videos');

const app = express();
app.set('view engine', 'hbs');
app.engine('html', require('hbs').__express);
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

app.get('/chat', (req, res) => {
    res.render('chat.html', {});
});

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

        socket.emit('joinSynchronization', getVideo(user.room));

        socket.broadcast
            .to(user.room)
            .emit(
                'welcomeMessage',
                generateMessage(`${user.username} has joined`)
            );

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
        callback();
    });

    socket.on('videoSync', (time, id) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('videoSync', time, id);
    });

    socket.on('changeVideo', (videoId) => {
        const user = getUser(socket.id);
        if (!user) return;
        io.to(user.room).emit('changeVideo', videoId);
    });

    socket.on('message', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) message = filter.clean(message);
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

    // Changing state of yt player after recv -> send data.e
    socket.on('onPlayerState', (data, time, videoID) => {
        const user = getUser(socket.id);
        if (user) {
            addVideo({ room: user.room, videoID });

            io.to(user.room).emit('onPlayerState', data, time);
        }
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                'message',
                generateMessage(`${user.username} has left!`)
            );
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });

    socket.on('sendLocation', (object, callback) => {
        callback('Location shared');
        socket.broadcast.emit('recvObject', generateMessage(object));
    });
});

server.listen(port, () => console.log(`Server is listening at ${port}`));
