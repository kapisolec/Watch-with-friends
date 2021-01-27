const videos = [];

const addVideo = ({ room, videoID }) => {
    if (videoID === 'ttps://www.youtube.com/watch') return;
    const videoIsTheSame = videos.find((obj) => obj.videoID === videoID);
    if (videoIsTheSame) return;
    const index = videos.findIndex((object) => object.room === room);
    if (index === -1) {
        videos.push({ room, videoID });
        console.log(videos);
        return videos;
    }
    videos.splice(index, 1, { room, videoID });
    console.log(videos);
    return videos;
};

const getVideo = (room) => {
    const video = videos.find((object) => object.room === room);
    if (!video) return;
    return video.videoID;
};

module.exports = {
    addVideo,
    getVideo,
};
