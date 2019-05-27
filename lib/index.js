const output = require('./output');
const Twitch = require('./twitch');

function main(argv) {
  const videoId = argv['video-id'];
  const clientId = argv['twitch-client-id'];

  const res = Twitch(clientId, videoId);

  // Where should output be directed
  // Possible values are keys found in `output/index.js`.
  const target = argv['destination'];

  // Take the appropriate
  const onValueFn = output[target];

  res.onValue(onValueFn(argv));
}

module.exports = main;
