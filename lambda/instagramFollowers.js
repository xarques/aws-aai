const https = require('https');

exports.handler = async (event) => {
  let dataString = '';
  const instagramAccount = event['pathParameters']['instagramAccount'];
  const url = `https://www.instagram.com/${instagramAccount}/`;
  console.log('Fetching URL', url);
  const response = await new Promise((resolve, reject) => {
    let redirs = [url];
    const fetch = (url) => {
      const req = https.get(url, function (res) {
        console.log('Got response: ' + res.statusCode);
        if ([301, 302].indexOf(res.statusCode) >= 0) {
          if (redirs.length > 10) {
            reject({
              statusCode: 500,
              body: 'excessive 302 redirects detected',
            });
          } else {
            if (redirs.indexOf(res.headers.location) < 0) {
              redirs.push(res.headers.location);
              console.log('Redirect', res.headers.location);
              return fetch(res.headers.location);
            } else {
              reject({
                statusCode: 500,
                body: '302 redirect loop detected',
              });
            }
          }
        } else {
          res.on('data', (chunk) => {
            dataString += chunk;
          });
          res.on('end', () => {
            const regexp = /"edge_followed_by":{"count":([0-9]*)}.*/;
            const [regexpResult, followers] = dataString.match(regexp);
            console.log(
              `Number of followers for account ${instagramAccount}:`,
              followers
            );
            resolve({
              statusCode: 200,
              body: followers,
            });
          });
        }
      });

      req.on('error', (e) => {
        reject({
          statusCode: 500,
          body: 'Something went wrong!',
        });
      });
    };
    fetch(url);
  });

  return response;
};
