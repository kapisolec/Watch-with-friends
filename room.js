"use strict";
const ytPlayer = document.getElementById("yt-player-iframe");
const linkBtn = document.getElementById("link-do-filmu-btn");
const linkForm = document.getElementById("yt-link");
let link, index;
console.log(ytPlayer.src);


linkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log(linkForm.value);
    if(!linkForm.value) return alert("Wklej link do filmu na Youtube!");
    link = linkForm.value;
    index = link.lastIndexOf('youtube.com/watch?v=')+20;
    link = link.substr(index);
    link = 'https://www.youtube.com/embed/' + link;
    ytPlayer.src = link;
    console.log(ytPlayer);
    linkForm.value = ''
});
