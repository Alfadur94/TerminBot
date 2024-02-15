const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
//const { MessageActionRow, MessageButton } = require('discord-buttons');
const cron = require('cron');
//require('discord-buttons')(client);
const { BOT_TOKEN, CLIENT_ID, POLL_CHANNEL_ID } = require('./config.json');

// config

//const BOT_TOKEN = "NzQ0MTQ5MzE3MTg2NjE3Mzc2.GRbGCG.smk03WjIkjwL8INzRNAH_-QRZHQ-IWiBts8n9o";
//const CLIENT_ID = 744149317186617376;
//const POLL_CHANNEL_ID = 1206629980155412570;
const pollTitle = 'Wann hast du nächste Woche Zeit?';
const pollOptions = [
	'Montag komplett', 'Montag 18-19 Uhr', 'Montag 19-20 Uhr', 'Montag 20-21 Uhr', 'Montag 21-22 Uhr',
	'Dienstag komplett', 'Dienstag 18-19 Uhr', 'Dienstag 19-20 Uhr', 'Dienstag 20-21 Uhr', 'Dienstag 21-22 Uhr',
	'Mittwoch komplett', 'Mittwoch 18-19 Uhr', 'Mittwoch 19-20 Uhr', 'Mittwoch 20-21 Uhr', 'Mittwoch 21-22 Uhr',
	'Donnerstag komplett', 'Donnerstag 18-19 Uhr', 'Donnerstag 19-20 Uhr', 'Donnerstag 20-21 Uhr', 'Donnerstag 21-22 Uhr',
	'Freitag komplett', 'Freitag 18-19 Uhr', 'Freitag 19-20 Uhr', 'Freitag 20-21 Uhr', 'Freitag 21-22 Uhr',
	'Samstag komplett', 'Samstag 11-12 Uhr', 'Samstag 12-13 Uhr', 'Samstag 13-14 Uhr', 'Samstag 14-15 Uhr', 'Samstag 15-16 Uhr', 'Samstag 16-17 Uhr', 'Samstag 17-18 Uhr', 'Samstag 18-19 Uhr', 'Samstag 19-20 Uhr', 'Samstag 20-21 Uhr', 'Samstag 21-22 Uhr',
	'Sonntag komplett', 'Sonntag 11-12 Uhr', 'Sonntag 12-13 Uhr', 'Sonntag 13-14 Uhr', 'Sonntag 14-15 Uhr', 'Sonntag 15-16 Uhr', 'Sonntag 16-17 Uhr', 'Sonntag 17-18 Uhr', 'Sonntag 18-19 Uhr', 'Sonntag 19-20 Uhr', 'Sonntag 20-21 Uhr', 'Sonntag 21-22 Uhr',
	'URLAUB'
];

// init

const polls = {};
const pollResults = {};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
//const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();

// import commands

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders)
{
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	
	for (const file of commandFiles)
	{
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		
		if ('data' in command && 'execute' in command)
		{
			console.log(`[INFO] Registered command at ${filePath} as $(command.data.name).`);
			client.commands.set(command.data.name, command);
		}
		else
		{
			console.log(`[ERROR] The command at ${filePath} has no "data" nor "execute" property.`);
		}
	}
}

// interactive functions

client.on(Events.InteractionCreate, interaction =>
{
	console.log(`Got interaction: $(interaction)`);
	if (!interaction.isChatInputCommand()) return;
});

client.on('messageCreate', async (msg) =>
{
	console.log('messageCreate triggered.');
    if (msg.content === '/startPoll')
	{
		console.log('/startPoll triggered.');
        if (polls[msg.channel.id])
		{
            msg.channel.send('Die Umfrage wird bereits angezeigt.');
            return;
        }

        polls[msg.channel.id] =
		{
            question: pollTitle,
            options: pollOptions,
            votes: {},
        };

        msg.channel.send(pollTitle);
        polls[msg.channel.id].stage = 'askQuestion';
    }
	else {
        if (polls[msg.channel.id]) {
            switch (polls[msg.channel.id].stage) {
                case 'askQuestion':
                    polls[msg.channel.id].question = pollTitle;
                    const row = new MessageActionRow();

                    polls[msg.channel.id].options.forEach
					(
						(option) =>
						{
							row.addComponents
							(
								new MessageButton()
									.setCustomId(option)
									.setLabel(option)
									.setStyle('PRIMARY'),
							);
						}
					);

                    row.addComponents
					(
                        new MessageButton()
                            .setCustomId('submitPoll')
                            .setLabel('Abschicken')
                            .setStyle('SUCCESS'),
                    );

                    msg.channel.send
					({
                        content: `**${polls[msg.channel.id].question}**`,
                        components: [row],
                    });

                    polls[msg.channel.id].stage = 'voting';
                    break;

                case 'voting':
                    if (msg.isButtonInteraction)
					{
                        const chosenOption = msg.customId;

                        if (chosenOption === 'submitPoll')
						{
                            const pollEmbed = new Discord.MessageEmbed()
                                .setTitle('Ergebnisse')
                                .setDescription(`${polls[msg.channel.id].question}\n\n**Auswahl:**\n${JSON.stringify(polls[msg.channel.id].votes, null, 2)}`);
                            msg.channel.send(pollEmbed);
                            delete polls[msg.channel.id];
                        }
						else
						{
                            const userId = msg.clicker.user.id;
                            polls[msg.channel.id].votes[userId] = chosenOption;
							toggleVote(userId, chosenOption);
							
                            console.log(`Choice for "${chosenOption}" by ${msg.clicker.user.username} counted!`);
                        }
                    }
                    break;
            }
        }
    }
});

client.on('clickButton', async (button) => {
    button.defer();
    client.emit('messageCreate', button.message);
});

// scheduled functions

const sendPollToChannel = (channelId, poll) =>
{
    const channel = client.channels.cache.get(channelId);

    if (!channel)
	{
        console.error(`Channel with ID ${channelId} does not exist!`);
        return;
    }

    const row = new MessageActionRow();

    poll.options.forEach((option) =>
	{
        row.addComponents(
            new MessageButton()
                .setCustomId(option)
                .setLabel(option)
                .setStyle('PRIMARY'),
        );
    });

    row.addComponents
	(
        new MessageButton()
            .setCustomId('submitPoll')
            .setLabel('Abschicken')
            .setStyle('SUCCESS'),
    );

    channel.send
	({
        content: `**${poll.question}**`,
        components: [row],
    });
};

const scheduledPoll = new cron.CronJob('0 1 * * 6', () => {
	// every saturday, 0 am, GMT+1
    if (polls[POLL_CHANNEL_ID])
	{
        console.log('A poll is already in progress for this channel.');
        return;
    }

    polls[POLL_CHANNEL_ID] =
	{
        question: 'pollTitle',
        options: pollOptions,
        votes: {},
    };

    sendPollToChannel(POLL_CHANNEL_ID, polls[POLL_CHANNEL_ID]);
}, null, true, 'UTC');

const scheduledPollResults = new cron.CronJob('0 22 * * 7', () =>
	{
		// every sundday, 23 pm, GMT+1
		// Ergebnisse verschicken.. rest später.. gute nacht
	}, null, true, 'UTC');

// general functions

function toggleVote(userId, chosenOption)
{
	if (!array_key_exists(userId, pollResults)) pollResults[userId] = {};
	if (!array_key_exists(chosenOption, pollResults[userId])) pollResults[userId][chosenOption] = true;
	else pollResults[userId][chosenOption] ^= true;
}

// commands

const commands =
[
  {
    name: 'startPoll',
    description: 'Shows poll options for this week.',
  },
];

// register commands
/*
const rest = new REST({ version: '10' }).setToken(TOKEN);

try
{
	console.log('Started refreshing application (/) commands.');
	rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
	console.log('Successfully reloaded application (/) commands.');
}
catch (error)
{
	console.error(error);
}
*/
// main routine

client.on('ready', () =>
{
	console.log('Logged in as ' + client.user.tag + '.');
});

/*
client.on('interactionCreate', async interaction => {
	//if (!interaction.isChatInputCommand()) return;

	if (interaction.commandName === 'ping')
	{
		await interaction.reply('Pong!');
	}
});
*/

client.login(BOT_TOKEN);