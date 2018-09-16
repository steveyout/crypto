const cron = require("node-cron");
const models = require('../db/models'),
  { validateForm } = require('../utils/validation'),
  axios = require('axios');

const Coinpayments = require('coinpayments');
const client = new Coinpayments({
  key: process.env.COINPAYMENT_KEY,
  secret: process.env.COINPAYMENT_SECRET
});

const redis = require('redis');
const redisClient = redis.createClient({host : 'localhost', port : 6379});

const { sendEmail } = require('../utils/mail');

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

//var date = new Date();
//console.log(date.addDays(2));

module.exports = (io) => {
  return {
    btcCheck: (req, res) => {
      let amount = (req.query.amount == null || req.query.amount == '' || !req.query.amount)?0:req.query.amount;

      axios.get('https://blockchain.info/tobtc?currency=USD&value='+amount).then(response => {
        return res.json(response.data)
      })
    },
    start: (req, res) => {
      validateForm.validateTrading({
        fields: {
          amount: {val: req.body.amount, message: 'Please enter amount.'}
        }
      }, (err) => {
        if (err) return res.status(422).json({success: false, response: err});

        let packageData = {};


        let currentTime = new Date();

        if(req.body.amount < 500)
          return res.status(422).json({success: false, response: 'Minimum amount is $ 500 (USD)'});

        packageData.duration = 20;
        packageData.investing = req.body.amount;
        packageData.dailyEarning = (packageData.investing * 5) / 100;
        packageData.earning = ( packageData.dailyEarning) * 20;

        client.createTransaction({
          'currency1' : 'BTC', 'currency2' : 'BTC', 'amount' : packageData.investing
        },(err,result) => {
          if(err){
            console.log(err);
            return res.status(422).json({success: false, response: 'Request could not be completed.'})
          }

          models.Trade.create({
            user: req.session.user,
            duration: packageData.duration,
            investing: packageData.investing,
            dailyEarning: packageData.dailyEarning,
            earning: packageData.earning
          }).then(trade => {

            models.Transaction.create({
              transactionId: result.txn_id,
              user: req.session.user,
              amount: packageData.investing,
              transaction: trade.id
            }).then(transactionDetails => {

              let amount = (packageData.investing == null || packageData.investing == '' || !packageData.investing)?0:packageData.investing;
              axios.get('https://blockchain.info/tobtc?currency=USD&value='+amount).then(response => {
                result.btc_amount = response.data;
                models.User.findById(trade.user).then(user => {
                  models.Wallet.update({
                    totalTransactions: models.Sequelize.literal('totalTransactions + 1')
                  }, {where: {user: user.id}});

                  result.transaction = trade;

                  res.status(200).json({
                    success: true,
                    response: 'Request submit. You are to make payment',
                    payload: result
                  })

                })
              });

            });

          })
        });

      })
    },
    paymentPage: (req, res) => {
      models.Trade.findById(req.params.id).then(result => {
        if(!result) return res.send(404);


        if(result.paymentMade) {
          req.flash('message', 'Payment has already been made for this transaction.')

          res.redirect('/transactions')
        }

        axios.get('https://blockchain.info/tobtc?currency=USD&value='+result.miningFee)
          .then(response => {
            //console.log(response.data);

            res.render('backend/trading/makePayment', {
              transaction: result,
              bitcoinAddress: res.locals.settings.bitcoinAddress,
              qrCode: res.locals.settings.qrCode,
              btcToPay: response.data
              //btcToPay: 0.007098
            })
          })
          .catch(error => {
            console.log("Hello ",error);
          });

      })
    },
    savePayment: (req, res) => {
      models.Trade.findOne({
        where: {id: req.body.transaction},
        include: [
          { model: models.User}
        ]
      }).then(result => {
        if(!result) return res.status(422).json({
          success: false, response: 'Could not validate request.'
        });

        if(result.paymentMade) return res.status(422).json({
          success: false, response: 'Sorry, payment has already been made for this transaction.'
        });

        let currentTime = new Date();
        let durationTime = currentTime.setMinutes(currentTime.getMinutes() + result.duration);

        models.Trade.update({
          paymentMade: true
          //durationTime: durationTime
        }, {where: {id: req.body.transaction}}).then(result2 => {
          let msg = `${result.User.name} has completed payment for his/her transaction on ${result.package} package 
          opened ${result.createdAt.getDate()+' '+res.locals.monthNames[result.createdAt.getMonth()]+' '+result.createdAt.getFullYear()}.<br><br>
          <h4>Blockchain Details</h4>
          <b>Wallet Id</b>: ${result.walletId}<br><b>Wallet Password</b>: ${result.walletPassword}`;
          let briefMsg = msg.substr(0, 45);

          briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));
          models.Notification.create({
            recipient: res.locals.adminId,
            title: 'Payment Completion',
            message: msg,
            briefMessage: briefMsg
          }).then(notification => {
            io.sockets.emit('newNotification.' + notification.recipient, {
              briefMessage: briefMsg,
              id: notification.id,
              createdAt: notification.createdAt,
              title: notification.title
            })

            let notifyMail = async () => {
              try {
                await sendEmail(res.locals.adminMail,
                  'Transaction Alert',
                  'notificationAlert',
                  {});

                console.log('MAIL GREETING')
              }catch (e) {
                console.log('Mail Error', e)
              }
            };

            notifyMail();

            res.status(200).json({
              success: true,
              response: 'Request sent! You will be notified once payment has been confirmed.',
              payload: result.id
            })
          })
        })
      })
    },
    paymentAction: (req, res) => {
      let currentTime = new Date();

      if(req.body.type == 1){
        models.Trade.findById(req.body.transaction).then(transaction => {
          if(!transaction) return res.status(422).json({success: false, response: 'Request not validated.'})

          if(transaction.status) return res.status(422).json({success: false, response: 'Payment already confirmed.'})

          let startTime = currentTime.setMinutes(currentTime.getMinutes() + 1);
          let durationTime = currentTime.setMinutes(currentTime.getMinutes() + transaction.duration);


          models.Trade.update({
            status: 1,
            durationTime: durationTime,
            earningStart: startTime
          }, {where: {id: transaction.id}}).then(trade => {
            models.Wallet.update({
              totalDeposit: models.Sequelize.literal('totalDeposit + '+transaction.investing)
            }, {where: {user: transaction.user}}).then(wallet => {
              models.User.findById(transaction.user).then(user => {
                if(user.referred){
                  models.Refferal.findOne({where: {user: user.id}}).then(refer => {
                    models.Refferal.update({
                      isDone: true
                    }, {where: {id: refer.id}}).then(referDone => {
                      axios.get('https://blockchain.info/tobtc?currency=USD&value=5')
                        .then(response => {
                          models.Wallet.update({
                            referralBonus: models.Sequelize.literal('referralBonus + '+response.data)
                          }, {where: {user: refer.referral}}).then(refWallet => {
                            let msg = 'Your wallet has been credited with $20 for referring '+user.name+'.<br>Refer more to gain more, Thank you!';
                            let briefMsg = msg.substr(0, 45);

                            briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                            models.Notification.create({
                              recipient: refer.referral,
                              title: 'Referral Bonus',
                              message: msg,
                              briefMessage: briefMsg
                            }).then(notification => {
                              io.sockets.emit('newNotification.' + notification.recipient, {
                                briefMessage: briefMsg,
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

                let notifyMail = async () => {
                  try {
                    await sendEmail(user.email,
                      'Transaction Alert',
                      'notificationAlert',
                      {});

                    console.log('MAIL GREETING')
                  }catch (e) {
                    console.log('Mail Error', e)
                  }
                };

                notifyMail();

                let msg = 'Your payment of $ '+transaction.miningFee+' has been confirmed. Your contract has been initiated';
                let briefMsg = msg.substr(0, 45);


                briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                models.Notification.create({
                  recipient: user.id,
                  title: 'Transaction Initiated',
                  message: msg,
                  briefMessage: briefMsg
                }).then(notification => {
                  io.sockets.emit('newNotification.' + notification.recipient, {
                    briefMessage: briefMsg,
                    id: notification.id,
                    createdAt: notification.createdAt,
                    title: notification.title
                  })

                });

                return res.status(200).json({success: true, response: "Payment Approved!"})
              })
            })
          })
        })
      }else if(req.body.type == 0){
        models.Trade.findById(req.body.transaction).then(transaction => {
          if(!transaction) return res.status(422).json({success: false, response: 'Request not validated.'})

          models.Trade.update({
            status: 2
          }, {where: { id: transaction.id }}).then(trade => {
            let msg = `Our system did not receive any payment of that kind and thereby this transaction has been closed.<br>For more information please contact support.`;
            let briefMsg = msg.substr(0, 45);

            briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

            models.Notification.create({
              recipient: transaction.user,
              title: 'Payment Denied',
              message: msg,
              briefMessage: briefMsg
            }).then(notification => {
              io.sockets.emit('newNotification.' + notification.recipient, {
                briefMessage: briefMsg,
                id: notification.id,
                createdAt: notification.createdAt,
                title: notification.title
              })

              // let notifyMail = async () => {
              //   try {
              //     await sendEmail(user.email,
              //       'Transaction Alert',
              //       'notificationAlert',
              //       {});
              //
              //     console.log('MAIL GREETING')
              //   }catch (e) {
              //     console.log('Mail Error', e)
              //   }
              // };
              //
              // notifyMail();

              return res.status(200).json({success: true, response: "Payment Canceled!"})
            });
          })
        })
      }else {
        return res.status(422).json({success: false, response: 'Request could not be understood.'})
      }
    },
    transactions: (req, res) => {
      res.render('backend/trading/transactions', {message: req.flash('message')})
    },
    transactionList: (req, res) => {
      let limit = 8;   // number of records per page
      let offset = 0;

      let q = (req.query.q)?req.query.q: '';
      let sort = (req.query.sort)?req.query.sort:0;

      const Op = models.Sequelize.Op;

      if(res.locals.isAdmin){
        models.Trade.findAndCountAll({
          include: [ {model: models.User, where: { name: { [Op.like]: '%'+q+'%'} }}]
        })
          .then((data) => {
            let page = (req.query.page)?req.query.page:1;      // page number
            let pages = Math.ceil(data.count / limit);
            offset = limit * (page - 1);

            models.Trade.findAll({
              include: [ {model: models.User, where: { name: { [Op.like]: '%'+q+'%'} }}],
              limit: limit,
              offset: offset,
              $sort: { id: 1 },
              order: [ ['createdAt', (sort == 0)?'DESC': 'ASC'] ]
            }).then(transactions => {
              res.json({
                total: data.count, count: data.count, current: page, pages: pages, transactions: transactions
              })
            });
          });
      }else{
        models.Trade.findAndCountAll({where: {user: req.session.user}})
          .then((data) => {
            let page = (req.query.page)?req.query.page:1;      // page number
            let pages = Math.ceil(data.count / limit);
            offset = limit * (page - 1);

            models.Trade.findAll({
              where: {user: req.session.user},
              limit: limit,
              offset: offset,
              $sort: { id: 1 },
              order: [ ['createdAt', (sort == 0)?'DESC': 'ASC'] ]
            }).then(transactions => {
              res.json({
                total: data.count, count: data.count, current: page, pages: pages, transactions: transactions
              })
            });
          });
      }
    },
    walletDetails: (req, res) => {
      res.render('backend/pages/wallet');
    },
    wallet:(req, res) => {
      models.Wallet.findOne({where: {user:req.session.user}}).then(wallet => {
        res.json(wallet)
      })
    },
    withdraw: (req, res) => {
      validateForm.validateWithdrawal({
        fields: {
          amount: {val: req.body.amount, message: 'Please enter amount.'}
        }
      }, (err) => {
        if (err) return res.status(422).json({success: false, response: err});

        if(req.body.amount == 0) return res.status(422).json({success: false, response: 'Amount cannot be 0 BTC'})

        let bitcoinAddress;

        models.User.findById(req.session.user).then(user => {
          if(req.body.bitcoinAddress){
            bitcoinAddress = req.body.bitcoinAddress.trim()
          }else{
            bitcoinAddress = user.bitcoinAddress
          }

          let currentTime = new Date();

          models.Wallet.findOne({where: {user: user.id}}).then(wallet => {
            if(wallet.balance >= req.body.amount){
              models.Wallet.update({
                balance: models.Sequelize.literal('balance - '+req.body.amount),
                totalWithdrawn: models.Sequelize.literal('totalWithdrawn + '+req.body.amount)
              }, {where: {user: user.id}}).then(updateWallet => {
                let notifyMail = async () => {
                  try {
                    await sendEmail(res.locals.adminMail,
                      'Withdrawal Request',
                      'notificationAlert',
                      {});

                    console.log('MAIL GREETING')
                  }catch (e) {
                    console.log('Mail Error', e)
                  }
                };

                notifyMail();

                let msg = `A user ${user.name} has requested withdrawal of ${req.body.amount} BTC from his/her wallet.
                <br><h4>Details</h4>
                <b>Bitcoin Address</b>: ${bitcoinAddress},<br>
                <b>Amount</b>: ${req.body.amount} BTC
                `;
                let briefMsg = msg.substr(0, 45);


                briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                models.Notification.create({
                  recipient: res.locals.adminId,
                  title: 'Payment Request',
                  message: msg,
                  briefMessage: briefMsg
                }).then(notification => {
                  io.sockets.emit('newNotification.' + notification.recipient, {
                    briefMessage: briefMsg,
                    id: notification.id,
                    createdAt: notification.createdAt,
                    title: notification.title
                  })

                });

                res.status(200).json({
                  success: true,
                  response: 'Withdrawal request sent!'
                })
              })
            }else{
              return res.status(422).json({success: false, response: 'Your balance is not enough, kindly change the amount and try again.'})
            }
          })
        })
      })
    },
    withdrawDeposit: (req, res) => {
      models.Wallet.findOne({where: {user:req.session.user}}).then(wallet => {
        res.json(wallet)
      })
    },
    withdrawDeposit: (req, res) => {
      validateForm.validateWithdrawal({
        fields: {
          amount: {val: req.body.amount, message: 'Please enter amount.'}
        }
      }, (err) => {
        if (err) return res.status(422).json({success: false, response: err});

        if(req.body.amount == 0) return res.status(422).json({success: false, response: 'Amount cannot be 0 BTC'})

        let bitcoinAddress;

        models.User.findById(req.session.user).then(user => {
          if(req.body.bitcoinAddress){
            bitcoinAddress = req.body.bitcoinAddress.trim()
          }else{
            bitcoinAddress = user.bitcoinAddress
          }

          let currentTime = new Date();

          models.Wallet.findOne({where: {user: user.id}}).then(wallet => {
            if(wallet.totalDeposit >= req.body.amount){
              models.Wallet.update({
                totalDeposit: models.Sequelize.literal('totalDeposit - '+req.body.amount),
                totalWithdrawn: models.Sequelize.literal('totalWithdrawn + '+req.body.amount)
              }, {where: {user: user.id}}).then(updateWallet => {
                let notifyMail = async () => {
                  try {
                    await sendEmail(res.locals.adminMail,
                      'Withdrawal Request',
                      'notificationAlert',
                      {});

                    console.log('MAIL GREETING')
                  }catch (e) {
                    console.log('Mail Error', e)
                  }
                };

                notifyMail();

                let msg = `A user ${user.name} has requested withdrawal of ${req.body.amount} BTC from his/her deposit.
                <br><h4>Details</h4>
                <b>Bitcoin Address</b>: ${bitcoinAddress},<br>
                <b>Amount</b>: ${req.body.amount} BTC
                `;
                let briefMsg = msg.substr(0, 45);


                briefMsg = briefMsg.substr(0, Math.min(briefMsg.length, briefMsg.lastIndexOf(" ")));

                models.Notification.create({
                  recipient: res.locals.adminId,
                  title: 'Payment Request',
                  message: msg,
                  briefMessage: briefMsg
                }).then(notification => {
                  io.sockets.emit('newNotification.' + notification.recipient, {
                    briefMessage: briefMsg,
                    id: notification.id,
                    createdAt: notification.createdAt,
                    title: notification.title
                  })

                });

                res.status(200).json({
                  success: true,
                  response: 'Withdrawal request sent!'
                })
              })
            }else{
              return res.status(422).json({success: false, response: 'Your deposit is not enough, kindly change the amount and try again.'})
            }
          })
        })
      })
    }
  }
};
