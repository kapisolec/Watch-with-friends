'use strict';

const button = document.getElementById('create-room');
const roomCreateForm = document.getElementById('create-room-form');
const ID = () => Math.random().toString(36).substr(2, 12);

const sendDataJson = function (data) {
    fetch('/room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data);
        })
        .catch((error) => {
            // console.error('Error:', error);
        });
};

button.addEventListener('click', (e) => {
    e.preventDefault();
    const idOfRoom = ID();
    sendDataJson({ id: idOfRoom });
    console.log('button dziala');
    location.href = `/room/${idOfRoom}`;
});
