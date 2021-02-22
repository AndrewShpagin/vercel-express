const app = require('express')();
const { v4 } = require('uuid');
const CryptoJS = require('crypto-js');
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

const APP_ID = 'YzfeftUVcZ6twZw1OoVKPRFYTrGEg01Q';
const APP_SECRET = '4G91qSoboqYO4Y0XJ0LPPKIsq8reHdfa';

class ewSimple {
  constructor(email, password, region) {
    this.email = email;
    this.password = password;
    this.region = region;
    this.auth = null;
    this.base = `https://${region}-api.coolkit.cc:8080/api/user`;
    this.ts = Math.floor(Date.now());
  }

  async login() {
    if (!this.auth) {
      try {
        const payload = JSON.stringify({ appid: APP_ID, email: this.email, password: this.password, ts: this.ts, version: 8 });
        const sign = CryptoJS.HmacSHA256(payload, APP_SECRET).toString(CryptoJS.enc.Base64);
        const request = await fetch(`${this.base}/login`, { method: 'post', headers: { Authorization: `Sign ${sign}` }, body: payload });
        const result = await request.json();
        if (result.hasOwnProperty('at')) { this.auth = result.at; return this.auth; }
      } catch (error) {
        console.log(error);
      }
    }
    return null;
  }

  async getDevice(deviceid) {
    try {
      if (await this.login()) {
        const uri = `${this.base}/device/${deviceid}?deviceid=${deviceid}&appid=${APP_ID}&version=8`;
        const options = { method: 'get', headers: { Authorization: `Bearer ${this.auth}` } };
        const data = await fetch(uri, options);
        return await data.json();
      }
    } catch (error) {
      console.log(error);
    }
    return {};
  }

  async getDevices() {
    try {
      if (await this.login()) {
        const uri = `${this.base}/device?lang=en&appid=${APP_ID}&version=8&getTags=1`;
        const options = { method: 'get', headers: { Authorization: `Bearer ${this.auth}` } };
        const data = await fetch(uri, options);
        return await data.json();
      }
    } catch (error) {
      console.log(error);
    }
    return {};
  }

  async switchDevice(device, state) {
    try {
      if (await this.login()) {
        const uri = `${this.base}/device/status`;
        const data = JSON.stringify({ deviceid: device, params: { switch: state }, appid: APP_ID, version: 8 });
        const options = { headers: { Authorization: `Bearer ${this.auth}` }, method: 'post', contentType: 'application/json', payload: data };
        const res = await fetch(uri, options);
        const answ = await JSON.parse(res.getContentText());
        return answ.error === 0;
      }
    } catch (error) {
      console.log(error);
    }
    return false;
  }
}

function extract(path, key) {
  const idx = path.indexOf(key);
  if (idx >= 0) {
    let sub = path.substring(idx + key.length);
    const r = sub.indexOf('/');
    if (r > 0)sub = sub.substring(0, r);
    return sub;
  }
  return null;
}

app.get('/*', (req, res) => {
  console.log(req.path);
  if (req.path.indexOf('/email=') >= 0 || req.path.indexOf('/auth=') >= 0) {
    const email = extract(req.path,'/email=');
    const password = extract(req.path,'/password=');
    const region = extract(req.path,'/region=');
    try {
      const connection = new ewSimple(email, password, region);
      if (connection) {
        connection.getDevices().then( result => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(result, null, '\t'));
          res.end();
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
});

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
});

module.exports = app;
