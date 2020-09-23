const fs = require('fs');

if (process.argv.length < 3) {
  console.error('Missing arguments !! Format : node process.js OUTPUT_DIR');
  process.exit(1);
}

console.log('Preparing processing...');

const OUTPUT_DIR = process.argv[2];
let PARTICIPANT_0 = null;
let PARTICIPANT_1 = null;

const data = require(`./${OUTPUT_DIR}/output.json`);
for (let key of Object.keys(data.messageCounts)) {
  if (key !== 'total' && key !== 'share') {
    if (PARTICIPANT_0 === null) { PARTICIPANT_0 = key; }
    else { PARTICIPANT_1 = key; }
  }
}

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
globalRows.push([`Messages sent by ${PARTICIPANT_0}`, data.messageCounts[PARTICIPANT_0]]);
globalRows.push([`Messages sent by ${PARTICIPANT_1}`, data.messageCounts[PARTICIPANT_1]]);
globalRows.push(['Links sent', data.messageCounts.share]);
globalRows.push(['Photos sent', data.photoCounts.total]);
globalRows.push([`Photos sent by ${PARTICIPANT_0}`, data.photoCounts[PARTICIPANT_0]]);
globalRows.push([`Photos sent by ${PARTICIPANT_1}`, data.photoCounts[PARTICIPANT_1]]);
globalRows.push(['Videos sent', data.videoCounts.total]);
globalRows.push([`Videos sent by ${PARTICIPANT_0}`, data.videoCounts[PARTICIPANT_0]]);
globalRows.push([`Videos sent by ${PARTICIPANT_1}`, data.videoCounts[PARTICIPANT_1]]);
globalRows.push(['Audios sent', data.audioCounts.total]);
globalRows.push([`Audios sent by ${PARTICIPANT_0}`, data.audioCounts[PARTICIPANT_0]]);
globalRows.push([`Audios sent by ${PARTICIPANT_1}`, data.audioCounts[PARTICIPANT_1]]);
globalRows.push(['Calls made', data.calls.count.total]);
globalRows.push([`Calls made by ${PARTICIPANT_0}`, data.calls.count[PARTICIPANT_0]]);
globalRows.push([`Calls made by ${PARTICIPANT_1}`, data.calls.count[PARTICIPANT_1]]);
globalRows.push(['Unanswered calls', data.calls.count.unanswered]);
globalRows.push(['Average call length', data.calls.averageLength]);
globalRows.push([`Average message length sent by ${PARTICIPANT_0}`, data.text.lengths[PARTICIPANT_0].averageLength]);
globalRows.push([`Average message length sent by ${PARTICIPANT_1}`, data.text.lengths[PARTICIPANT_1].averageLength]);
globalRows.push(['Emojis sent', data.text.emojis.count.total]);
globalRows.push([`Emojis sent by ${PARTICIPANT_0}`, data.text.emojis.count[PARTICIPANT_0]]);
globalRows.push([`Emojis sent by ${PARTICIPANT_1}`, data.text.emojis.count[PARTICIPANT_1]]);

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
emojisRows.push(['Most used emojis', 'Used', '', `Most used emojis by ${PARTICIPANT_0}`, 'Used', '', `Most used emojis by ${PARTICIPANT_1}`, 'Used']);

let totalArray = [];
for (let key of Object.keys(data.text.emojis.total.values)) {
  totalArray.push({ emoji: key, value: data.text.emojis.total.values[key] });
}
totalArray.sort((a, b) => { return b.value - a.value; });

let participant0Array = [];
for (let key of Object.keys(data.text.emojis[PARTICIPANT_0].values)) {
  participant0Array.push({ emoji: key, value: data.text.emojis[PARTICIPANT_0].values[key] });
}
participant0Array.sort((a, b) => { return b.value - a.value; });

let participant1Array = [];
for (let key of Object.keys(data.text.emojis[PARTICIPANT_1].values)) {
  participant1Array.push({ emoji: key, value: data.text.emojis[PARTICIPANT_1].values[key] });
}
participant1Array.sort((a, b) => { return b.value - a.value; });

for (let i=0; i<totalArray.length; i++) {
  let row = [`${totalArray[i].emoji}`, `${totalArray[i].value}`, ''];
  if (i < participant0Array.length) {
    row.push(`${participant0Array[i].emoji}`, `${participant0Array[i].value}`, '');
  } else {
    row.push('', '', '');
  }
  if (i < participant1Array.length) {
    row.push(`${participant1Array[i].emoji}`, `${participant1Array[i].value}`);
  } else {
    row.push('', '');
  }
  emojisRows.push(row);
}

console.log('Creating emojis.csv...');
fs.writeFileSync(`./${OUTPUT_DIR}/emojis.csv`, getCSVStr(emojisRows));

// Reactions
console.log('Processing reactions data...');
let reactionsRows = [];
reactionsRows.push(['Name', 'Number of times he/she reacted to him/herself', '', '', '', '', '', '']);
reactionsRows.push([`${PARTICIPANT_0}`, `${data.reactions[PARTICIPANT_0].self}`, '', '', '', '', '', '']);
reactionsRows.push([`${PARTICIPANT_1}`, `${data.reactions[PARTICIPANT_1].self}`, '', '', '', '', '', '']);
reactionsRows.push(['', '', '', '', '', '', '', '']);
reactionsRows.push(['Most used reaction', 'Used', '', `Most used reaction by ${PARTICIPANT_0}`, 'Used', '', `Most used reaction by ${PARTICIPANT_1}`, 'Used']);

totalArray = [];
for (let key of Object.keys(data.reactions.total)) {
  if (key !== 'self') {
    totalArray.push({ reaction: key, value: data.reactions.total[key] });
  }
}
totalArray.sort((a, b) => { return b.value - a.value; });

participant0Array = [];
for (let key of Object.keys(data.reactions[PARTICIPANT_0])) {
  if (key !== 'self') {
    participant0Array.push({ reaction: key, value: data.reactions[PARTICIPANT_0][key] });
  }
}
participant0Array.sort((a, b) => { return b.value - a.value; });

participant1Array = [];
for (let key of Object.keys(data.reactions[PARTICIPANT_1])) {
  if (key !== 'self') {
    participant1Array.push({ reaction: key, value: data.reactions[PARTICIPANT_1][key] });
  }
}
participant1Array.sort((a, b) => { return b.value - a.value; });

for (let i=0; i<totalArray.length; i++) {
  let row = [`${totalArray[i].reaction}`, `${totalArray[i].value}`, ''];
  if (i < participant0Array.length) {
    row.push(`${participant0Array[i].reaction}`, `${participant0Array[i].value}`, '');
  } else {
    row.push('', '', '');
  }
  if (i < participant1Array.length) {
    row.push(`${participant1Array[i].reaction}`, `${participant1Array[i].value}`);
  } else {
    row.push('', '');
  }
  reactionsRows.push(row);
}

console.log('Creating reactions.csv...');
fs.writeFileSync(`./${OUTPUT_DIR}/reactions.csv`, getCSVStr(reactionsRows));

console.log('Done !');
