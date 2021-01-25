'use strict';
const socket = io();
const buttonLocation = document.querySelector('#sendLocation');
const form = document.querySelector('#sendMessForm');
const formButton = document.querySelector('#formButton');
const input = form.childNodes[1];
const button = form.childNodes[3];
const messageContainer = document.querySelector('#messages-container');
const sidebarContainer = document.querySelector('.chat__sidebar');
const changeVideoButton = document.querySelector('#changeVideo');
const syncVideosButton = document.querySelector('#syncVideos');

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
let videoId = '';

// YT PLAYER LOGIC

// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/player_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Replace the 'ytplayer' element with an <iframe> and
// YouTube player after the API code downloads.
var player;
function onYouTubePlayerAPIReady() {
    player = new YT.Player('ytplayer', {
        height: '420',
        width: '860',
        videoId: 'xFqeAUKU09o',
    });

    // STATE OF PLAYER
    player.addEventListener('onStateChange', (e) => {
        // 3 bufforing, 1 playing, 2 paused, -1 stopped entirely
        if (e.data !== 3) {
            const time = e.target.getCurrentTime();
            socket.emit('onPlayerState', e.data, time);
        }
    });
}

// ON PLAYER STATE DATA RECV
socket.on('onPlayerState', (data, time) => {
    if (data === 1 || data === -1) {
        // player.seekTo(time, true);
        player.playVideo();
    } else if (data === 2) {
        if (Math.abs(player.getCurrentTime() - time) > 2) {
            player.seekTo(time, true);
            player.playVideo();
        } else {
            player.pauseVideo();
        }
    } else if (data === 0) player.stopVideo();
});

const videoIdParse = (link) => {
    return link.slice(link.indexOf('v=') + 2);
};

// SYNC VIDEOS
syncVideosButton.addEventListener('click', () => {
    // console.log('syncing');
    const time = player.getCurrentTime();
    const id = videoIdParse(player.getVideoUrl());
    // console.log(time);
    socket.emit('videoSync', time, id);
});

socket.on('videoSync', (time, id) => {
    // console.log(time, id);
    player.loadVideoById(id, time);
    // player.seekTo(time);
});

// Change video
changeVideoButton.addEventListener('click', () => {
    let link = input.value;
    if (!link) return alert('You should pass the youtube link');
    const videoId = videoIdParse(link);
    socket.emit('changeVideo', videoId);
    player.loadVideoById(`${videoId}`, 5, 'large');
    input.value = '';
});

socket.on('changeVideo', (videoId) => {
    player.loadVideoById(`${videoId}`, 5, 'large');
});

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
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
};

const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

socket.on('message', (object) => {
    // console.log(object);
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

        // console.log('not includes');
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
        // console.log('Message delivered');
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
            // console.log('Location delivered');
            buttonLocation.removeAttribute('disabled');
        });
    });
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users });
    sidebarContainer.innerHTML = html;
});

socket.on('videoData', (videoData) => {
    player.loadVideoById(`${videoData}`, 5, 'large');
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
