'use strict';
const socket = io();
const buttonLocation = document.querySelector('#sendLocation');
const form = document.querySelector('#sendMessForm');
const formButton = document.querySelector('#formButton');
const input = form.childNodes[1];
const button = form.childNodes[3];
const messageContainer = document.querySelector('#messages-container');
const sidebarContainer = document.querySelector('.chat__sidebar');

// TEMPLATES
const sidebarTemplate = `<h2 class="room-title">{{room}}</h2>
<h3 class="list-title">Users</h3>
<ul class="users">
  {{#users}}
    <li>{{username}}</li>
  {{/users}}
</ul>`;

const htmlTemplate = [
    `<div class="message">
    <p> 
        <span class="message__name"> {{user}} </span>
        <span class="message__meta"> {{createdAt}} </span>
    </p>
    <p>{{string}}</p>
</div>`,
    `<div class="message">
    <p> 
        <span class="message__name"> {{user}} </span>
        <span class="message__meta"> {{createdAt}} </span>
    </p>
    <p><a href="{{string}}">Link</a></p>
</div>`,
    `<div class="message">
<p class="welcome-mess">{{string}}</p>
</div>`,
];

let message = '';
// let user = window.prompt('Please state your username', 'User');

const autoscroll = () => {
    // New message elemnt
    const newMessage = messageContainer.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = messageContainer.offsetHeight;

    // Height of messages container
    const containerHeight = messageContainer.scrollHeight;

    // scrolloffset
    const scrolloffset = messageContainer.scrollTop + visibleHeight + 15;

    if (containerHeight - newMessageHeight <= scrolloffset) {
        console.log('should scroll down');
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
};

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});
console.log(username, room);

socket.on('message', (object) => {
    console.log(object);
    const string = object.text;
    const user = object.username;
    const createdAt = moment(object.createdAt).format('HH:mm:ss');

    if (string.includes('https') || string.includes('http')) {
        const html = Mustache.render(htmlTemplate[1], {
            user,
            string,
            createdAt,
        });
        messageContainer.insertAdjacentHTML('beforeend', html);
        autoscroll();

        console.log('not includes');
    } else if (string.includes('Welcome to the server')) {
        const html = Mustache.render(htmlTemplate[2], {
            string,
        });
        messageContainer.insertAdjacentHTML('beforeend', html);
        autoscroll();
    } else {
        const html = Mustache.render(htmlTemplate[0], {
            string,
            user,
            createdAt,
        });
        messageContainer.insertAdjacentHTML('beforeend', html);
        autoscroll();
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    input.focus();

    // Disable form

    if (input.value === '') return;
    button.setAttribute('disabled', 'disabled');

    socket.emit('message', input.value, (error) => {
        // Re-enable form
        button.removeAttribute('disabled');
        if (error) return console.log(error);
        console.log('Message delivered');
        input.value = '';
        input.focus();
    });
});

// Send location
buttonLocation.addEventListener('click', (e) => {
    e.preventDefault();

    if (!navigator.geolocation) return alert('No geolocation');
    buttonLocation.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const coordsObj = `https://www.google.com/maps/?q=${latitude},${longitude}`;

        socket.emit('message', coordsObj, () => {
            console.log('Location delivered');
            buttonLocation.removeAttribute('disabled');
        });
    });
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users });
    sidebarContainer.innerHTML = html;
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
