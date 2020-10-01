const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Missing arguments !! Format : node process.js OUTPUT_DIR');
  process.exit(1);
}

console.log('Preparing processing...');
const OUTPUT_DIR = process.argv[2];
// let PARTICIPANT_0 = null;
// let PARTICIPANT_1 = null;
let PARTICIPANT = []
let ind = 0

const data = require(`./${OUTPUT_DIR}/output.json`);
for (let key of Object.keys(data.messageCounts)) {
  if (key !== 'total' && key !== 'share') {
    PARTICIPANT[ind] = key
    ind = ind+1
    // if (PARTICIPANT_0 = = = null) { PARTICIPANT_0 = key; }
    // else { PARTICIPANT_1 = key; }
  }
}
console.log('Participants in conv:')
console.log(PARTICIPANT)

function getCSVStr(array) {
  let str = '';
  array.forEach((arrayRow) => {
    let row = arrayRow.join(',');
    str += row + '\r\n';
  });
  return str;
}

// Global
console.log('Processing global data...');
let globalRows = [];
globalRows.push(['Messages sent', data.messageCounts.total]);
for (let participant of PARTICIPANT){
    globalRows.push([`Messages sent by ${participant}`, data.messageCounts[participant]]);
}
globalRows.push(['Links sent', data.messageCounts.share]);
globalRows.push(['Photos sent', data.photoCounts.total]);
for (let participant of PARTICIPANT){
    globalRows.push([`Photos sent by ${participant}`, data.photoCounts[participant]]);
}
globalRows.push(['Videos sent', data.videoCounts.total]);
for (let participant of PARTICIPANT){
    globalRows.push([`Videos sent by ${participant}`, data.videoCounts[participant]]);
}
globalRows.push(['Audios sent', data.audioCounts.total]);
for (let participant of PARTICIPANT){
    globalRows.push([`Audios sent by ${participant}`, data.audioCounts[participant]]);
}
globalRows.push(['Calls made', data.calls.count.total]);
for (let participant of PARTICIPANT){
    globalRows.push([`Calls made by ${participant}`, data.calls.count[participant]]);
}
globalRows.push(['Unanswered calls', data.calls.count.unanswered]);
globalRows.push(['Average call length', data.calls.averageLength]);
for (let participant of PARTICIPANT){
    globalRows.push([`Average message length sent by ${participant}`, data.text.lengths[participant].averageLength]);
}
globalRows.push(['Emojis sent', data.text.emojis.count.total]);
for (let participant of PARTICIPANT){
    globalRows.push([`Emojis sent by ${participant}`, data.text.emojis.count[participant]]);
}
console.log('Creating global.csv...');
fs.writeFileSync(`./${OUTPUT_DIR}/global.csv`, getCSVStr(globalRows));


// Hours-Week
console.log('Processing hours-week data...');
let hoursWeekRows = [];
hoursWeekRows.push(['Hour', 'Number of messages sent', '', 'Day of the week', 'Number of messages sent']);
for (let i=0; i<data.timestamps.hours.length; i++) {
  const row = [`${i}h`, data.timestamps.hours[i], ''];
  if (i === 0) { row.push('Monday', data.timestamps.week[i]); }
  else if (i === 1) { row.push('Tuesday', data.timestamps.week[i]); }
  else if (i === 2) { row.push('Wednesday', data.timestamps.week[i]); }
  else if (i === 3) { row.push('Thursday', data.timestamps.week[i]); }
  else if (i === 4) { row.push('Friday', data.timestamps.week[i]); }
  else if (i === 5) { row.push('Saturday', data.timestamps.week[i]); }
  else if (i === 6) { row.push('Sunday', data.timestamps.week[i]); }
  else { row.push('', ''); }
  hoursWeekRows.push(row);
}

console.log('Creating hours-week.csv...');
fs.writeFileSync(`./${OUTPUT_DIR}/hours-week.csv`, getCSVStr(hoursWeekRows));

// Days
console.log('Processing days data...');
const daysArray = [];
for (let key of Object.keys(data.timestamps.days.values)) {
  daysArray.push({ day: key, value: data.timestamps.days.values[key] });
}
daysArray.sort((a, b) => {
  const aa = a.day.split('/').reverse().join();
  const bb = b.day.split('/').reverse().join();
  return aa < bb ? -1 : (aa > bb ? 1 : 0);
});
let mean = 0;
for (let day of daysArray) { mean += day.value; }
mean = mean / daysArray.length;

let daysRows = [];
daysRows.push(['Day with max messages sent', 'Number of messages sent']);
daysRows.push([`${data.timestamps.days.max.day}`, `${data.timestamps.days.max.value}`]);
daysRows.push(['Average messages per day', `${mean}`]);
daysRows.push(['', '']);
daysRows.push(['Day', 'Number of messages sent']);
for (let day of daysArray) {
  daysRows.push([`${day.day}`, `${day.value}`]);
}

console.log('Creating days.csv...');
fs.writeFileSync(`./${OUTPUT_DIR}/days.csv`, getCSVStr(daysRows));

// Emojis
console.log('Processing emojis data...');
let emojisRows = [];
let emojiTitle = ['Most used emojis', 'Used']
for (let participant of PARTICIPANT){
    emojiTitle = emojiTitle.concat(['', `Most used emojis by ${participant}`, 'Used']);
}
emojisRows.push(emojiTitle);

let totalArray = [];
for (let key of Object.keys(data.text.emojis.total.values)) {
  totalArray.push({ emoji: key, value: data.text.emojis.total.values[key] });
}
totalArray.sort((a, b) => { return b.value - a.value; });

let participantArray = {}
for (let i=0; i<PARTICIPANT.length; i++){
    participantArray[i] = [];
    for (let key of Object.keys(data.text.emojis[PARTICIPANT[i]].values)) {
        participantArray[i].push({ emoji: key, value: data.text.emojis[PARTICIPANT[i]].values[key] });
    }
    participantArray[i].sort((a, b) => { return b.value - a.value; });
}

for (let i=0; i<totalArray.length; i++) {
  let row = [`${totalArray[i].emoji}`, `${totalArray[i].value}`, ''];
  for (let pInd = 0; pInd<PARTICIPANT.length; pInd++){
    if (i < participantArray[pInd].length) {
        row.push(`${participantArray[pInd][i].emoji}`, `${participantArray[pInd][i].value}`, '');
    } else {
        row.push('', '', '');
    }
    }
  emojisRows.push(row);
}

console.log('Creating emojis.csv...');
fs.writeFileSync(`./${OUTPUT_DIR}/emojis.csv`, getCSVStr(emojisRows));

// Reactions
console.log('Processing reactions data...');
let reactionsRows = [];
let reactionTitle = ['Most used reactions', 'Used']
for (let participant of PARTICIPANT){
    reactionTitle = reactionTitle.concat(['', `Most used reactions by ${participant}`, 'Used']);
}
reactionsRows.push(reactionTitle);

totalArray = [];
for (let key of Object.keys(data.reactions.total)) {
  if (key !== 'self') {
    totalArray.push({ reaction: key, value: data.reactions.total[key] });
  }
}
totalArray.sort((a, b) => { return b.value - a.value; });

participantArray = {}
for (let i=0; i<PARTICIPANT.length; i++){
    participantArray[i] = [];
    for (let key of Object.keys(data.reactions[PARTICIPANT[i]])) {
        participantArray[i].push({ reaction: key, value: data.reactions[PARTICIPANT[i]][key] })
    }
    participantArray[i].sort((a, b) => { return b.value - a.value; });
}

for (let i=0; i<totalArray.length; i++) {
  let row = [`${totalArray[i].reaction}`, `${totalArray[i].value}`, ''];
  for (let pInd = 0; pInd<PARTICIPANT.length; pInd++){
    if (i < participantArray[pInd].length) {
        row.push(`${participantArray[pInd][i].reaction}`, `${participantArray[pInd][i].value}`, '');
    } else {
        row.push('', '', '');
    }
    }
    reactionsRows.push(row);
}

console.log('Creating reactions.csv...');
fs.writeFileSync(`./${OUTPUT_DIR}/reactions.csv`, getCSVStr(reactionsRows));

console.log('Done !');
