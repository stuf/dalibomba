const A = require('axios');
const K = require('kefir');
const L = require('partial.lenses');

//

/**
 * Returns an Observable containing the response data from the API
 *
 * @param {*} client
 * @param {*} id
 * @param {*} cursor
 */
const getWithClient = (client, id, cursor) =>
  K.fromPromise(client.get(`videos/${id}/comments`, { params: { cursor } }))
   .map(L.get('data'));

//

/**
 * Create an Observable that emits comments one at a time, in contrast to
 * a chunk of `n` comments.
 *
 * @param {string} clientId
 * @param {string} videoId
 * @return {K.Property<Twitch.IComment, any>}
 */
function main(clientId, videoId) {
  const client = A.create({
    baseURL: 'https://api.twitch.tv/v5/',
  });

  // @todo Can probably be done through headers or defaults, smh
  client.interceptors.request.use(config => {
    config.params = L.set('client_id', clientId, config.params);
    return config;
  });

  /**
   * Recursive getter.
   *
   * If the response data contains a field named `_next`, instantly emit
   * the current data, and call itself again with the video ID and the `_next` cursor value.
   *
   * @param {string} id
   * @param {string} cursor
   * @return {K.Property<Twitch.IComment, any>}
   */
  const doRecGet = (id, cursor) =>
    getWithClient(client, id, cursor)
      .flatMapConcat(data =>
        data._next
          // If `_next` is defined, create a combined Observable that instantly emits the current
          // data (`K.constant(data)`) and a second observable by calling itself with the new `_next` cursor value.
          ? K.merge([K.constant(data),
                     doRecGet(id, data._next)])
          : K.constant(data));

  // First request, no cursor/_next here yet.
  return doRecGet(videoId)
    // From every response, get `comments`
    .map(L.get('comments'))
    // Flatten the result so that instead of emitting a list of comments,
    // it will emit every comment separately.
    .flatten();
}

module.exports = main;
