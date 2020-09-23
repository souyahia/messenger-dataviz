const fs = require('fs');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

if (process.argv.length < 5) {
  console.error('Missing arguments !! Format : node analyse.js INPUT_DIR OUTPUT_DIR MAX_FILE_INDEX');
  process.exit(1);
}

const INPUT_DIR = process.argv[2];
const OUTPUT_DIR = process.argv[3];
const MAX_FILE_INDEX = Number.parseInt(process.argv[4]);
const TEMP_DIR = `temp_${Date.now()}`;
mkdirp.sync(OUTPUT_DIR);
mkdirp.sync(TEMP_DIR);

let PARTICIPANT_0 = 'error';
let PARTICIPANT_1 = 'error';

let _TOTAL_MESSAGES_TO_PROCESS = 0;
let _CURRENT_MESSAGE_PROCESSED = 1;

console.log('Preparing analyse...');

for (let i=1; i<MAX_FILE_INDEX+1; i++) {
  const fileName = `message_${i}.json`;
  const data = require(`./${INPUT_DIR}/${fileName}`);
  fs.writeFileSync(`./${TEMP_DIR}/message_${i}.json`, JSON.stringify(data), { encoding: 'ascii' });
  _TOTAL_MESSAGES_TO_PROCESS += data.messages.length;
}


const namesData = require(`./${TEMP_DIR}/message_1.json`);
PARTICIPANT_0 = namesData.participants[0].name;
PARTICIPANT_1 = namesData.participants[1].name;

const result = {
  messageCounts: {
    total: 0,
    [PARTICIPANT_0]: 0,
    [PARTICIPANT_1]: 0,
    share: 0,
  },
  timestamps: {
    hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    week: [0, 0, 0, 0, 0, 0, 0],
    days: {
      values: {}
    },
  },
  text: {
    emojis: {
      count: {
        total: 0,
        [PARTICIPANT_0]: 0,
        [PARTICIPANT_1]: 0,
      },
      total: {
        values: {},
      },
      [PARTICIPANT_0]: {
        values: {},
      },
      [PARTICIPANT_1]: {
        values: {},
      },
    },
    lengths: {
      [PARTICIPANT_0]: {
        averageLength: 0,
        _currentCount: 0,
      },
      [PARTICIPANT_1]: {
        averageLength: 0,
        _currentCount: 0,
      },
    },
  },
  reactions: {
    count: {
      total: 0,
      [PARTICIPANT_0]: 0,
      [PARTICIPANT_1]: 0,
    },
    total: {
      self: 0,
    },
    [PARTICIPANT_0]: {
      self: 0,
    },
    [PARTICIPANT_1]: {
      self: 0,
    },
  },
  stickers: {
    count: {
      total: 0,
      [PARTICIPANT_0]: 0,
      [PARTICIPANT_1]: 0,
    },
    [PARTICIPANT_0]: {
      values: {},
    },
    [PARTICIPANT_1]: {
      values: {},
    },
  },
  photoCounts: {
    total: 0,
    [PARTICIPANT_0]: 0,
    [PARTICIPANT_1]: 0,
  },
  videoCounts: {
    total: 0,
    [PARTICIPANT_0]: 0,
    [PARTICIPANT_1]: 0,
  },
  audioCounts: {
    total: 0,
    [PARTICIPANT_0]: 0,
    [PARTICIPANT_1]: 0,
  },
  calls: {
    count: {
      total: 0,
      [PARTICIPANT_0]: 0,
      [PARTICIPANT_1]: 0,
      unanswered: 0,
    },
    averageLength: 0,
    _currentCount: 0,
  },
};

function analyseData(data) {
  const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;

  for (let message of data.messages) {

    console.log(`Processing message ${_CURRENT_MESSAGE_PROCESSED} / ${_TOTAL_MESSAGES_TO_PROCESS}`);

    // Message Counts
    if (message.type !== 'Call') {
      result.messageCounts.total++;
      result.messageCounts[message.sender_name]++;
      if (message.type === 'Share') { result.messageCounts.share++; }
    }

    // Timestamps
    const date = new Date(message.timestamp_ms);
    result.timestamps.hours[date.getHours()]++;
    const index = (date.getDay() === 0 ? 7 : date.getDay()) - 1;
    result.timestamps.week[index]++;
    let day = `${date.getDate()}`;
    if (day.length === 1) { day = '0' + day; }
    let month = `${date.getMonth()+1}`;
    if (month.length === 1) { month = '0' + month; }
    const key = `${day}/${month}/${date.getFullYear()}`;
    if (result.timestamps.days.values[key] === undefined) {
      result.timestamps.days.values[key] = 1;
    } else { result.timestamps.days.values[key]++; }

    // Text
    if (message.type === 'Generic' && message.content !== undefined && message.content.length > 0) {
      let temp = result.text.lengths[message.sender_name].averageLength * result.text.lengths[message.sender_name]._currentCount;
      temp += message.content.length;
      result.text.lengths[message.sender_name]._currentCount++;
      temp = temp / result.text.lengths[message.sender_name]._currentCount;
      result.text.lengths[message.sender_name].averageLength = temp;

      let m;
      while ((m = emojiRegex.exec(message.content)) !== null) {
        if (m.index === emojiRegex.lastIndex) {
          emojiRegex.lastIndex++;
        }
        m.forEach((match) => {
          result.text.emojis.count.total++;
          result.text.emojis.count[message.sender_name]++;
          for (let key of [ 'total', message.sender_name ]) {
            if (result.text.emojis[key].values[match] === undefined) {
              result.text.emojis[key].values[match] = 1;
            } else { result.text.emojis[key].values[match]++; }
          }
        });
      }
    }

    // Reactions
    if (message.reactions !== undefined) {
      for (let reaction of message.reactions) {
        result.reactions.count.total++;
        result.reactions.count[message.sender_name]++;
        if (reaction.actor === message.sender_name) {
          result.reactions.total.self++;
          result.reactions[message.sender_name].self++;
        }
        if (result.reactions.total[reaction.reaction] === undefined) {
          result.reactions.total[reaction.reaction] = 1;
        } else { result.reactions.total[reaction.reaction]++; }
        if (result.reactions[message.sender_name][reaction.reaction] === undefined) {
          result.reactions[message.sender_name][reaction.reaction] = 1;
        } else { result.reactions[message.sender_name][reaction.reaction]++; }
      }
    }

    // Stickers
    if (message.sticker !== undefined) {
      result.stickers.count.total++;
      result.stickers.count[message.sender_name]++;
      if (result.stickers[message.sender_name].values[message.sticker.uri] === undefined) {
        result.stickers[message.sender_name].values[message.sticker.uri] = 1;
      } else { result.stickers[message.sender_name].values[message.sticker.uri]++; }
    }

    // Photo Counts
    if (message.photos !== undefined) {
      result.photoCounts.total += message.photos.length;
      result.photoCounts[message.sender_name] += message.photos.length;
    }

    // Video Counts
    if (message.videos !== undefined) {
      result.videoCounts.total += message.videos.length;
      result.videoCounts[message.sender_name] += message.videos.length;
    }

    // Audio Counts
    if (message.audio_files !== undefined) {
      result.audioCounts.total += message.audio_files.length;
      result.audioCounts[message.sender_name] += message.audio_files.length;
    }

    // Calls
    if (message.type === 'Call') {
      result.calls.count.total++;
      result.calls.count[message.sender_name]++;
      if (message.call_duration === 0) {
        result.calls.count.unanswered++;
      } else {
        let temp = result.calls.averageLength * result.calls._currentCount;
        temp += message.call_duration;
        result.calls._currentCount++;
        temp = temp / result.calls._currentCount;
        result.calls.averageLength = temp;
      }
    }

    _CURRENT_MESSAGE_PROCESSED++;
  }
}

for (let i=1; i<MAX_FILE_INDEX+1; i++) {
  const fileName = `message_${i}.json`;
  const data = require(`./${TEMP_DIR}/${fileName}`);
  analyseData(data);
}

console.log('Done !');
console.log('Finalizing analyse...');

let max = 0;
let maxKey = 'error';

for (let key of Object.keys(result.timestamps.days.values)) {
  if (result.timestamps.days.values[key] > max) {
    max = result.timestamps.days.values[key];
    maxKey = key;
  }
}

result.timestamps.days.max = {
  day: maxKey,
  value: max,
}

maxKey = 'error';

for (let participant of [ PARTICIPANT_0, PARTICIPANT_1 ]) {
  max = 0;
  for (let key of Object.keys(result.stickers[participant].values)) {
    if (result.stickers[participant].values[key] > max) {
      max = result.stickers[participant].values[key];
      maxKey = key;
    }
  }
  result.stickers[participant].max = {
    sticker: maxKey,
    value: max,
  }
}

maxKey = 'error';

for (let participant of [ 'total', PARTICIPANT_0, PARTICIPANT_1 ]) {
  const rankingArray = [];
  for (let key of Object.keys(result.text.emojis[participant].values)) {
    rankingArray.push({ emoji: key, value: result.text.emojis[participant].values[key] });
  }
  rankingArray.sort((a, b) => { return b.value - a.value; });

  result.text.emojis[participant].ranking = [];
  for (let i=0; i<10; i++) {
    if (i >= rankingArray.length) { break; }
    result.text.emojis[participant].ranking.push(rankingArray[i]);
  }
}

delete result.text.lengths[PARTICIPANT_0]._currentCount;
delete result.text.lengths[PARTICIPANT_1]._currentCount;
delete result.calls._currentCount;

rimraf.sync(`./${TEMP_DIR}`);

console.log('Done !');
console.log('Creating output file...');

fs.writeFileSync(`./${OUTPUT_DIR}/output.json`, JSON.stringify(result, null, 2));

console.log('Job done.');
