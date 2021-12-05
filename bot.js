const {
  Client,
} = require('discord.js');

const bot = new Client({
  intents: 32767
});

const config = require('./config.json');
const Discord = require('discord.js');
const fetchTimeout = require('fetch-timeout');

  const url = config.URL_SERVER;
  const playerfile = new URL('/players.json',config.URL_SERVER).toString();
  const infofile = new URL('/info.json',config.URL_SERVER).toString();
  const TICK_MAX = 1 << 9;
  const FETCH_TIMEOUT = 900;
  const CHANNEL_ID = config.CHANNEL_ID;
  const UPDATE_TIME = 2500; 

  const FETCH_OPS = {
    'cache': 'no-cache',
    'method': 'GET',
  };


  
  var TICK_N = 0;
  var MESSAGE;
  var LAST_COUNT;
  var STATUS;


  var loop_callbacks = []; 
  bot.on('ready',()  => 
  {
    console.log(`Bot ${bot.user.tag} is logged in!`);
  })


  const getPlayers = function() {
    return new Promise((resolve,reject) => {
      fetchTimeout(playerfile,FETCH_OPS,FETCH_TIMEOUT).then((res) => {
        res.json().then((players) => {
          resolve(players);
        }).catch(reject);
      }).catch(reject);
    })
  };

  const getVars = function() {
    return new Promise((resolve,reject) => {
      fetchTimeout(infofile,FETCH_OPS,FETCH_TIMEOUT).then((res) => {
        res.json().then((info) => {
          resolve(info.vars);
        }).catch(reject);
      }).catch(reject);
    });
  };


const sendOrUpdate = function(embed) {
    if (MESSAGE !== undefined) {
      MESSAGE.edit(embed).then(() => {
        console.log('Update was a success');
      }).catch(() => {
        console.log('Update has failed');
      })
    } else {
      let channel = bot.channels.cache.get(CHANNEL_ID);
      if (channel !== undefined) {
        channel.messages.fetch(CHANNEL_ID).then((message) => {
          MESSAGE = message;
          message.edit(embed).then(() => {
            console.log('Update was a success');
          }).catch(() => {
            console.log('Update has failed');
          });
        }).catch(() => {
          channel.send(embed).then((message) => {
            MESSAGE = message;
            console.log(`Sent message (${message.id})`);
          }).catch(console.error);
        })
      } else {
        console.log('Update channel has not been set');
      }
    }
  };

  const UpdateEmbed = function() {
    let embed = new Discord.MessageEmbed()
    .setAuthor(config.SERVER_NAME, config.SERVER_LOGO_URL)
    .setColor(0x03be31)
    .addField('\n\u200b\n**Server #1**:'+ ' ' + config.SERVER_NAME,'\n\u200b\n**Server Connect URL**:' + ' '+ config.connectURL,false)
    .setFooter(TICK_N % 2 === 0 ? '🟢' : '🔴')
    .setTimestamp(new Date())
    if (STATUS !== undefined)
    {
      embed.addField('<a:9549_check_no:736099324731064452> ERROR WARNING !',`${STATUS}\n\u200b\n`);
      embed.setColor(0x03be31)
    }
    return embed;
    
  };
  const offline = function() {
    console.log(Array.from(arguments));
    if (LAST_COUNT !== null) console.log(`Server is offline ${url} (${playerfile} ${infofile})`);
    let embed = UpdateEmbed()
    .setColor(0xff0000)
    .addField('Server Status',':x: Offline',true)
    .addField('Queue','?',true)
    .addField('Online Players','?\n\u200b\n',true);
    sendOrUpdate({embeds: [embed] });
    LAST_COUNT = null;
  };

  const updateMessage = function() {
    getVars().then((vars) => {
      getPlayers().then((players) => {
        if (players.length !== LAST_COUNT) console.log(`${players.length} players`);
        if(typeof(vars.sv_queueCount) == 'undefined')
        {
        let embed = UpdateEmbed()
        .addField('Server Status',' ✅ Online ',true)
        .addField('Queue', '0',true)
    
        .addField('Online Players',`${players.length}/${config.MAX_PLAYERS}\n\u200b\n`,true)
        sendOrUpdate({embeds: [embed] })
      }
      else
        {
        let embed = UpdateEmbed()
        .addField('Server Status',' ✅ Online ',true)
        .addField('Queue', `${vars.sv_queueCount}`,true)

        .addField('Online Players',`${players.length}/${config.MAX_PLAYERS}\n\u200b\n`,true)
        sendOrUpdate({embeds: [embed] })
      }
        LAST_COUNT = players.length;
      }).catch(offline);
    }).catch(offline);
  
    TICK_N++;
    if (TICK_N >= TICK_MAX) {
      TICK_N = 0;
    }
    for (var i=0;i<loop_callbacks.length;i++) {
      let callback = loop_callbacks.pop(0);
      callback();
    }
  };

  bot.on('ready',() => {
    setInterval(updateMessage, UPDATE_TIME);
  });


  bot.login(config.BOT_TOKEN)

  return bot;
