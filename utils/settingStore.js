const redis = require('redis');


class SettingService extends redis.RedisClient {
  constructor() {
    super();
    this.client = redis.createClient({host : 'localhost', port : 6379}); //initialize redis client
  }

  get() {
    return new Promise((resolve, reject) => {
      // return this.client.get("sett:crypto-mine.", (err, res) => {
      //   if(err) return reject(err);
      //   else return resolve(res);
      // });

      return this.client.get("sett:crypto-mine.siteName", (err, resName) => {
        return this.client.get("sett:crypto-mine.siteOwner", (err, siteOwner) => {
          return this.client.get("sett:crypto-mine.siteDescription", (err, siteDescription) => {
            return this.client.get("sett:crypto-mine.siteMail", (err, siteMail) => {
              return this.client.get("sett:crypto-mine.facebookUri", (err, facebookUri) => {
                return this.client.get("sett:crypto-mine.twitterUri", (err, twitterUri) => {
                  return this.client.get("sett:crypto-mine.googleUri", (err, googleUri) => {
                    if(err) return reject(err);
                    else return resolve({
                      siteName: resName,
                      siteOwner: siteOwner,
                      siteDescription: siteDescription,
                      siteMail: siteMail,
                      facebookUri: facebookUri,
                      twitterUri: twitterUri,
                      googleUri: googleUri

                });
                  });
                });
              });
            });
          });
        });
      });
    })
  }

  save(data){
    return new Promise((resolve, reject) => {
      this.client.set("sett:crypto-mine.siteName", data.siteName);
      this.client.set("sett:crypto-mine.siteOwner", data.siteOwner);
      this.client.set("sett:crypto-mine.siteDescription", data.siteDescription);
      this.client.set("sett:crypto-mine.siteMail", data.siteMail);
      this.client.set("sett:crypto-mine.facebookUri", data.facebookUri);
      this.client.set("sett:crypto-mine.twitterUri", data.twitterUri);
      this.client.set("sett:crypto-mine.googleUri", data.googleUri);
      resolve(data)
    });
  }

  // delete token from sore
  delete(key){
    return new Promise((resolve, reject) => {
      return this.client.del("sett:crypto-mine."+key, (err, res) => {
        if(err) return reject(err);
        else return resolve(true);
      });
    });
  }
}

module.exports = {
  SettingStore: new SettingService()
};
