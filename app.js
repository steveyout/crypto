const cron = require("node-cron");
const createError = require('http-errors'),
  express = require('express'),
  logger = require('morgan'),
  helmet = require('helmet'),
  expressSanitizer = require('express-sanitizer'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  session = require('express-session'),
  RedisStore = require("connect-redis")(session),
  redis = require("redis").createClient(),
  redisClient = require('redis').createClient({host : 'localhost', port : 6379,password:'yout'}),
  path = require('path'),
  flash = require('connect-flash'),
  axios = require('axios');

const moment = require('moment-timezone');

function toTimeZone(time, zone) {
  var format = 'YYYY-MM-DD HH:mm:ss ZZ';
  return moment(time, format).tz(zone).format(format);
}

const fileUpload = require('express-fileupload');
const { sendEmail } = require('./utils/mail');

const Coinpayments = require('coinpayments');
const client = new Coinpayments({
  key: process.env.COINPAYMENT_KEY,
  secret: process.env.COINPAYMENT_SECRET
});

const app = express();

const User = require('./db/models').User;
const models = require('./db/models');
app.io = require('socket.io')();

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

let addTime = (hours) => {
  return new Date( (new Date)*1 + 1000*3600*hours );
};

let addToDefault = (current_time, hours) => {
  return new Date( (current_time)*1 + 1000*3600*hours );
};

app.use((req, res, next) => {
  const settings = {};

  return redisClient.get("sett:crypto-mine.siteName", (err, resName) => {
    return redisClient.get("sett:crypto-mine.siteOwner", (err, siteOwner) => {
      return redisClient.get("sett:crypto-mine.siteDescription", (err, siteDescription) => {
        return redisClient.get("sett:crypto-mine.siteMail", (err, siteMail) => {
          return redisClient.get("sett:crypto-mine.facebookUri", (err, facebookUri) => {
            return redisClient.get("sett:crypto-mine.twitterUri", (err, twitterUri) => {
              return redisClient.get("sett:crypto-mine.googleUri", (err, googleUri) => {
                settings.siteName = resName;
                settings.siteOwner = siteOwner;
                settings.siteDescription = siteDescription;
                settings.siteMail = siteMail;
                settings.facebookUri = facebookUri;
                settings.twitterUri = twitterUri;
                settings.googleUri = googleUri;

                res.locals.settings = settings;
                next()

              });
            });
          });
        });
      });
    });
  });
});

let monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

app.use((req, res, next) => {
  if (req.url === '/favicon.ico')
    return res.end();
  res.locals.year = new Date().getFullYear();
  res.locals.monthNames = monthNames;
  next()
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(fileUpload());
app.set('trust proxy', 1); // trust first proxy
app.use(logger('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));
var sess = {
  key: 'user_sid',
  secret: 'Blem Blem - Flat Key - Secret',
  saveUninitialized: true,
  resave: true,
  httpOnly: true,
  cookie: { maxAge: 1200000 },
  store: new RedisStore({ host: 'localhost', port: 6379, client: redis })
};
app.use(flash());
app.use(expressSanitizer());
//app.use(helmet())
app.use(express.static(path.join(__dirname, 'public/src')));
if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess));

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid');
  }
  next();
});

let timeAgo = (time) => {

  switch (typeof time) {
    case 'number':
      break;
    case 'string':
      time = +new Date(time);
      break;
    case 'object':
      if (time.constructor === Date) time = time.getTime();
      break;
    default:
      time = +new Date();
  }
  let time_formats = [
    [60, 'seconds', 1], // 60
    [120, '1 minute ago', '1 minute from now'], // 60*2
    [3600, 'minutes', 60], // 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], // 60*60*2
    [86400, 'hours', 3600], // 60*60*24, 60*60
    [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
    [604800, 'days', 86400], // 60*60*24*7, 60*60*24
    [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
    [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
    [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
    [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
  ];
  let seconds = (+new Date() - time) / 1000,
    token = 'ago',
    list_choice = 1;

  if (seconds == 0) {
    return 'Just now'
  }
  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = 'from now';
    list_choice = 2;
  }
  let i = 0,
    format;
  while (format = time_formats[i++])
    if (seconds < format[0]) {
      if (typeof format[2] == 'string')
        return format[list_choice];
      else
        return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
    }
  return time;
};

app.use((req, res, next) => {
  res.locals.adminId = '';
  res.locals.adminMail = '';

  User.find({where: {
      isAdmin: true, adminType: 1
    }}).then(admin => {
    if(admin){
      res.locals.adminId = admin.id
      res.locals.adminMail = admin.email
    }
  });

  res.locals.timeAgo = (time) => {

    switch (typeof time) {
      case 'number':
        break;
      case 'string':
        time = +new Date(time);
        break;
      case 'object':
        if (time.constructor === Date) time = time.getTime();
        break;
      default:
        time = +new Date();
    }
    let time_formats = [
      [60, 'seconds', 1], // 60
      [120, '1 minute ago', '1 minute from now'], // 60*2
      [3600, 'minutes', 60], // 60*60, 60
      [7200, '1 hour ago', '1 hour from now'], // 60*60*2
      [86400, 'hours', 3600], // 60*60*24, 60*60
      [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
      [604800, 'days', 86400], // 60*60*24*7, 60*60*24
      [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
      [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
      [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
      [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
      [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
      [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
      [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
      [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    let seconds = (+new Date() - time) / 1000,
      token = 'ago',
      list_choice = 1;

    if (seconds == 0) {
      return 'Just now'
    }
    if (seconds < 0) {
      seconds = Math.abs(seconds);
      token = 'from now';
      list_choice = 2;
    }
    let i = 0,
      format;
    while (format = time_formats[i++])
      if (seconds < format[0]) {
        if (typeof format[2] == 'string')
          return format[list_choice];
        else
          return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
      }
    return time;
  };

  res.locals.isGlobalAdmin = false;
  res.locals.isMinorAdmin = false;
  res.locals.isAdmin = false;

  let images = [
    '/images/carousel/22.jpg',
    '/images/carousel/23.jpg',
    '/images/carousel/24.jpeg',
    '/images/carousel/25.jpg'
  ];

  res.locals.coverThumb = images[Math.floor(Math.random()*images.length)];

  res.locals.userDetails = {}
  if(!req.session.user || !req.cookies.user_sid) return next();

  User.findById(req.session.user).then(user => {
    if(!user) return next();
    res.locals.userDetails = user;
    if(user.isAdmin){
      res.locals.isAdmin = true;

      if(user.adminType === 1){
        res.locals.isGlobalAdmin = true
      }
      else {
        res.locals.isMinorAdmin = true
      }
    }
    return next();
  })
});

app.use((req, res, next) => {
  if(req.session.user){
    //check if user has been blocked or deleted

    User.findById(req.session.user).then(user => {
      if(!user) {
        return res.redirect('/signin');
      }else if(user.isDeleted) {
        req.flash('message', 'This account has been deleted from our platform.')

        return res.redirect('/access/reject');
      }else if(user.isBanned){
        req.flash('message', 'This account has been locked by our admin till further notice.')

        return res.redirect('/access/reject');
      }

    })
  }

  return next();
});


cron.schedule("* * * * *", function() {
  models.Transaction.findAll({
    where: {
      end: false
    }
  }).then(transactions => {
    if(transactions) {
      transactions.forEach((transaction) => {
        client.getTx(transaction.transactionId, function(err,result){
          if(err) {
            console.log(err)

            return ;
          }
          let endingTime = new Date(result.time_expires*1000);
          let currentTime = new Date();

          if(currentTime < endingTime){
            User.find({where: {
                isAdmin: true, adminType: 1
              }}).then(admin => {
              if(result.status != 1){

                models.Trade.findById(transaction.transaction).then(trade => {
                  let durationTime = addTime((trade.duration * 24));

                  let startTime = '';

                  if(durationTime.getHours() == 12 || durationTime.getHours() < 6){
                    let newDate = addTime(24);

                    startTime = new Date(newDate.setHours(6, 0, 0))
                    durationTime = new Date(durationTime.setHours(6, 0, 0))
                  }else if(durationTime.getHours() >= 6 && durationTime.getHours() < 12){
                    let newDate = addTime(24);
                    console.log("to 12")

                    startTime = new Date(newDate.setHours(24, 0, 0))
                    durationTime = new Date(durationTime.setHours(24, 0, 0))
                  }else if(durationTime.getHours() == 24 || durationTime.getHours() < 18){
                    let newDate = addTime(24);
                    console.log("12")

                    startTime = new Date(newDate.setHours(18, 0, 0))
                    durationTime = new Date(durationTime.setHours(18, 0, 0))
                  }else if(durationTime.getHours() >= 18 && durationTime.getHours() < 24){
                    let newDate = addTime(24);
                    console.log("after 6")

                    startTime = new Date(newDate.setHours(12, 0, 0))
                    durationTime = new Date(durationTime.setHours(12, 0, 0))
                  }

                  console.log("Normal Time: ", startTime)
                  console.log("Saved Time: ", toTimeZone(startTime, 'America/Los_Angeles'))

                  models.Trade.update({
                    endingTime:  toTimeZone(durationTime, 'America/Los_Angeles'),
                    earningStart: toTimeZone(startTime, 'America/Los_Angeles'),
                    status: 1
                  }, {
                    where: {
                      id: transaction.transaction
                    }
                  }).then(tradeEdited => {
                    models.Wallet.update({
                      ongoingTransactions: models.Sequelize.literal('ongoingTransactions + 1'),
                      investment: models.Sequelize.literal('investment + '+transaction.amount)
                    }, {where: {user: transaction.user}}).then(wallet => {
                      models.Transaction.update({
                        end: true
                      }, {where: {id: transaction.id}}).then(editTransaction => {

                        models.User.findById(transaction.user).then(user => {
                          if(user.referred){
                            models.Refferal.findOne({where: {user: user.id}}).then(refer => {
                              let commisionStatus = (refer.firstTransaction)?true:true;
                              let commisionAmount = (refer.firstTransaction)?(transaction.amount * 5)/100:(transaction.amount * 10)/100;
                              models.Refferal.update({
                                firstTransaction: commisionStatus,
                                commission:  models.Sequelize.literal('commission + '+commisionAmount)
                              }, {where: {id: refer.id}}).then(referDone => {
                                models.Payments.create({
                                  user: refer.referral,
                                  amount: commisionAmount,
                                  reason: 'For referring '+user.name+'.'
                                }).then(payment => {
                                  models.Wallet.update({
                                    referralBonus: models.Sequelize.literal('referralBonus + '+commisionAmount)
                                  }, {where: {user: refer.referral}}).then(refWallet => {
                                    let msg = 'Your account has been credited with $ '+commisionAmount+' for referring '+user.name+'.<br>Refer more to gain more, Thank you!';
                                    let briefMsg = msg.substr(0, 45);

                                    briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                                    models.Notification.create({
                                      recipient: refer.referral,
                                      title: 'Referral Bonus',
                                      message: msg,
                                      briefMessage: briefMsg
                                    }).then(notification => {
                                      app.io.sockets.emit('newNotification.' + notification.recipient, {
                                        briefMessage: briefMsg,
                                        id: notification.id,
                                        createdAt: notification.createdAt,
                                        title: notification.title
                                      })

                                    });

                                    let msg2 = 'There is a new user to pay for referral. Go to payments for mor info.';
                                    let briefMsg2 = msg.substr(0, 45);

                                    briefMsg2 = briefMsg2.substr(0, Math.min(briefMsg2.length, briefMsg2.lastIndexOf(" ")));

                                    models.Notification.create({
                                      recipient: admin.id,
                                      title: 'New Payment',
                                      message: msg2,
                                      briefMessage: briefMsg2
                                    }).then(notification => {
                                      app.io.sockets.emit('newNotification.' + notification.recipient, {
                                        briefMessage: briefMsg2,
                                        id: notification.id,
                                        createdAt: notification.createdAt,
                                        title: notification.title
                                      })

                                    })
                                  })
                                });

                              })
                            })
                          }

                          let msg = 'Your payment of &dollar; '+transaction.amount+' has been received and your transaction initiated successfully.' +
                            '<br>You can see transaction details in transaction tab.';
                          let briefMsg = msg.substr(0, 45);

                          briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                          models.Notification.create({
                            recipient: user.id,
                            title: 'Transaction',
                            message: msg,
                            briefMessage: briefMsg
                          }).then(notification => {
                            app.io.sockets.emit('newNotification.' + notification.recipient, {
                              briefMessage: briefMsg,
                              id: notification.id,
                              createdAt: notification.createdAt,
                              title: notification.title
                            });

                            let msg2 = 'A user has just initiated a transaction of &dollar; '+transaction.amount+'.';
                            let briefMsg2 = msg2.substr(0, 45);

                            briefMsg2 = briefMsg2.substr(0, Math.min(briefMsg2.length, briefMsg2.lastIndexOf(" ")));

                            models.Notification.create({
                              recipient: admin.id,
                              title: 'New Transaction',
                              message: msg2,
                              briefMessage: briefMsg2
                            }).then(notification => {
                              app.io.sockets.emit('newNotification.' + notification.recipient, {
                                briefMessage: briefMsg2,
                                id: notification.id,
                                createdAt: notification.createdAt,
                                title: notification.title
                              })

                            })

                          });
                        });
                      })
                    })
                  });
                });

              }
            })
          }else{
            models.Transaction.update({
              end: true
            }, {where: {id: transaction.id}})

            //delete user transaction
            models.Trade.destroy({
              where: {
                id: transaction.transaction
              }
            });

            let msg = 'Hello dear, your transaction has been deleted because your payment time has exceeded payment time of 5 hours.';
            let briefMsg = msg.substr(0, 45);

            briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

            models.Notification.create({
              recipient: transaction.user,
              title: 'Transaction Deleted',
              message: msg,
              briefMessage: briefMsg
            }).then(notification => {
              app.io.sockets.emit('newNotification.' + notification.recipient, {
                briefMessage: briefMsg,
                id: notification.id,
                createdAt: notification.createdAt,
                title: notification.title
              })

            });
          }

        });
      })
    }
  })
});

// cron.schedule("00 00 06 * * *", function() {
cron.schedule("0 0 0 * * *", function() {
  models.Trade.findAll({
    where: {
      status: 1
    }
  }).then(trades => {
    console.log("NONE")
    if(!trades) return;

    trades.forEach((trade) => {
      let currentTime = new Date();

      if(new Date(trade.earningStart).getHours() == 12){
        console.log("CHECK HOUR")
        if(currentTime <= new Date(trade.endingTime)){
          console.log("CHECK ENDING DATE")
          if(new Date(trade.earningStart).getDate() <= currentTime.getDate()){
            console.log("CHECK START HOUR")
            models.User.find({where: {
                isAdmin: true, adminType: 1
              }}).then(admin => {
                console.log("BEFORE ADMIN CHECK")
              if (admin) {
                console.log("ADMIN CHECKED")
                models.User.findById(trade.user).then(user => {
                  models.Payments.create({
                    user: user.id,
                    amount: trade.dailyEarning,
                    transaction: trade.id,
                    reason: 'For transaction'
                  }).then(payment => {
                    let msg = 'There is a new user to pay for transaction. Go to payments for mor info.';
                    let briefMsg = msg.substr(0, 45);

                    briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                    models.Notification.create({
                      recipient: admin.id,
                      title: 'New Payment',
                      message: msg,
                      briefMessage: briefMsg
                    }).then(notification => {
                      app.io.sockets.emit('newNotification.' + notification.recipient, {
                        briefMessage: briefMsg,
                        id: notification.id,
                        createdAt: notification.createdAt,
                        title: notification.title
                      })

                    });
                  })
                });
              }
            })
          }
        }
      }

    })
  })
});


cron.schedule("0 0 23 * * *", function() {
  models.Trade.findAll({
    where: {
      status: 1
    }
  }).then(trades => {
    if (!trades) return;

    trades.forEach((trade) => {
      let currentTime = new Date();

      if (new Date(trade.earningStart).getHours() == 24) {
        if (currentTime <= new Date(trade.endingTime)) {
          if (new Date(trade.earningStart).getDate() <= currentTime.getDate()) {
            models.User.find({
              where: {
                isAdmin: true, adminType: 1
              }
            }).then(admin => {
              if (admin) {
                models.User.findById(trade.user).then(user => {
                  models.Payments.create({
                    user: user.id,
                    amount: trade.dailyEarning,
                    transaction: trade.id,
                    reason: 'For transaction'
                  }).then(payment => {
                    let msg = 'There is a new user to pay for transaction. Go to payments for mor info.';
                    let briefMsg = msg.substr(0, 45);

                    briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                    models.Notification.create({
                      recipient: admin.id,
                      title: 'New Payment',
                      message: msg,
                      briefMessage: briefMsg
                    }).then(notification => {
                      app.io.sockets.emit('newNotification.' + notification.recipient, {
                        briefMessage: briefMsg,
                        id: notification.id,
                        createdAt: notification.createdAt,
                        title: notification.title
                      })

                    });
                  })
                });
              }
            })
          }
        }
      }
    })
  });
});

cron.schedule("0 0 6 * * *", function() {
  models.Trade.findAll({
    where: {
      status: 1
    }
  }).then(trades => {
    if (!trades) return;
    console.log("HEY")
    trades.forEach((trade) => {
      let currentTime = new Date();

      if (new Date(trade.earningStart).getHours() == 6) {
        if (currentTime <= new Date(trade.endingTime)) {
          if (new Date(trade.earningStart).getDate() <= currentTime.getDate()) {
            models.User.find({
              where: {
                isAdmin: true, adminType: 1
              }
            }).then(admin => {
              if (admin) {
                models.User.findById(trade.user).then(user => {
                  models.Payments.create({
                    user: user.id,
                    amount: trade.dailyEarning,
                    transaction: trade.id,
                    reason: 'For transaction'
                  }).then(payment => {
                    let msg = 'There is a new user to pay for transaction. Go to payments for mor info.';
                    let briefMsg = msg.substr(0, 45);

                    briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                    models.Notification.create({
                      recipient: admin.id,
                      title: 'New Payment',
                      message: msg,
                      briefMessage: briefMsg
                    }).then(notification => {
                      app.io.sockets.emit('newNotification.' + notification.recipient, {
                        briefMessage: briefMsg,
                        id: notification.id,
                        createdAt: notification.createdAt,
                        title: notification.title
                      })

                    });
                  })
                });
              }
            })
          }
        }
      }
    })
  });
});



cron.schedule("0 0 18 * * *", function() {
  models.Trade.findAll({
    where: {
      status: 1
    }
  }).then(trades => {
    if (!trades) return;

    trades.forEach((trade) => {
      let currentTime = new Date();

      if (new Date(trade.earningStart).getHours() == 18) {
        if (currentTime <= new Date(trade.endingTime)) {
          if (new Date(trade.earningStart).getDate() <= currentTime.getDate()) {
            models.User.find({
              where: {
                isAdmin: true, adminType: 1
              }
            }).then(admin => {
              if (admin) {
                models.User.findById(trade.user).then(user => {
                  models.Payments.create({
                    user: user.id,
                    amount: trade.dailyEarning,
                    transaction: trade.id,
                    reason: 'For transaction'
                  }).then(payment => {
                    let msg = 'There is a new user to pay for transaction. Go to payments for mor info.';
                    let briefMsg = msg.substr(0, 45);

                    briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                    models.Notification.create({
                      recipient: admin.id,
                      title: 'New Payment',
                      message: msg,
                      briefMessage: briefMsg
                    }).then(notification => {
                      app.io.sockets.emit('newNotification.' + notification.recipient, {
                        briefMessage: briefMsg,
                        id: notification.id,
                        createdAt: notification.createdAt,
                        title: notification.title
                      })

                    });
                  })
                });
              }
            })
          }
        }
      }
    })
  });
});


app.use('', require('./routes')(app.io));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
});

//error handler
// app.use((err, req, res, next) => {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('errors/error')
// });

module.exports = app;
