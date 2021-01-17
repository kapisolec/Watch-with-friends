const fs = require('fs');
// dodac funkcje usuwania i filtrowania
const loadFromJson = () => {
    try {
        const dataBuffer = fs.readFileSync('src/utils/roomsIDs.json');
        const dataJson = dataBuffer.toString();
        return JSON.parse(dataJson);
    } catch (e) {
        return [];
    }
};

const addToJson = (id) => {
    const dataLoaded = loadFromJson();
    dataLoaded.push({
        id,
    });
    const dataJSON = JSON.stringify(dataLoaded);
    fs.writeFileSync('src/utils/roomsIDs.json', dataJSON);
};

const checkIfInJson = (id) => {
    const data = loadFromJson();
    let inJson = false;
    data.forEach((roomID) => {
        // console.log(roomID.id);
        if (roomID.id === id) inJson = true;
    });
    return inJson;
};
module.exports = {
    addToJson,
    checkIfInJson,
};
