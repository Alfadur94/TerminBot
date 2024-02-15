// libs

const fs = require('node:fs');
const path = require('node:path');
const wait = require('node:timers/promises').setTimeout;
const { ActivityType, Client, Collection, Events, GatewayIntentBits, REST, Routes, StringSelectMenuInteraction } = require('discord.js');
const cron = require('cron');

// config

const { BOT_TOKEN, CLIENT_ID, GUILD_ID, POLL_CHANNEL_ID } = require('./config.json');

// constants

global.pollTitle = 'Wann hast du nächste Woche Zeit?';
global.pollOptions = [
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

global.pollResults = [];
const commands = [];
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

console.log('[INFO] Starting.');

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
			console.log('[INFO] Loaded command at "' + filePath + '" as "' + command.data.name + '".');
			client.commands.set(command.data.name, command);
			commands.push(command.data.toJSON());
		}
		else
		{
			console.error('[ERROR] The command at "' + filePath + '" has no "data" or no "execute" property.');
		}
	}
}

// register global commands

const rest = new REST().setToken(BOT_TOKEN);

(async () =>
{
	return;
	
	console.log('[INFO] Clearing old commands...');
	
	try
	{
		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
			.then(() => console.log('[DEBUG] Successfully cleared guild commands.'))
			.catch(console.error);

		await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
			.then(() => console.log('[DEBUG] Successfully cleared application commands.'))
			.catch(console.error);
	}
	catch (error)
	{
		console.error(error);
	}
	
	console.log('[INFO] Registering commands...');
		
	try
	{
		const data = await rest.put(
			Routes.applicationCommands(CLIENT_ID),
			{ body: commands },
		);

		console.log('[INFO] Successfully registered ' + data.length + ' global commands.');
		
		const data2 = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commands },
		);

		console.log('[INFO] Successfully registered ' + data2.length + ' guild commands.');
	}
	catch (error)
	{
		console.error(error);
	}
})();

// static functions

client.on('ready', () =>
{
	console.log('[INFO] Logged in as bot user "' + client.user.tag + '".');
	client.user.setActivity('League of Legends', { type: ActivityType.Competing });
});

// interactive functions

client.on(Events.InteractionCreate, async interaction =>
{
	//console.log('[DEBUG] Got interaction:');
	//console.log(interaction);
	
	if (interaction.isStringSelectMenu())
	{
		//console.log('[DEBUG] Replying to StringSelectMenuInteraction.');
		
		if (!interaction.customId.startsWith('pollSelects-')) return;
		
		var customIdParts = interaction.customId.split('-');
		var blockId = parseInt(customIdParts[1]);
		var userId = interaction.user.id;
		
		if (blockId > Math.floor(pollOptions.length / 25)) return;
		if (pollResults[userId] == undefined || pollResults[userId] == null) pollResults[userId] = [];
		
		for (var n = 0; n < 25; n++)
			pollResults[userId][n + blockId * 25] = 0;
		
		for (var n = 0; n < interaction.values.length; n++)
		{
			pollResults[userId][interaction.values[n]] = 1;
		}
		
		await interaction.reply
		(
			{content: 'Your training times were updated successfully!', ephemeral: true}
		);
		
		return;
	}
	
	if (!interaction.isChatInputCommand()) return;
	
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command)
	{
		console.error('[ERROR] Command "' + interaction.commandName + '" was not found.');
		return;
	}

	try
	{
		await command.execute(interaction);
	}
	catch (error)
	{
		console.error('[ERROR] ' + error);
		
		if (interaction.replied || interaction.deferred)
		{
			await interaction.followUp
			(
				{content: 'There was an error while executing this command!', ephemeral: true}
			);
		}
		else
		{
			await interaction.reply
			(
				{content: 'There was an error while executing this command!', ephemeral: true}
			);
		}
	}
});

// scheduled functions

const postResultsCronjob = new cron.CronJob
('10 10 * * 1', () =>
	{
		// every monday, 10:10 AM, UTC
		postResults();
	},
	null, true, 'UTC'
);

// global functions

global.postResults = function postResults(interaction = null, postPublic = false)
{
	// summarize all votes
	
	var totalVotes = [];

	for (var n = 0; n < pollOptions.length; n++)
	{
		totalVotes[n] = 0;
	}
	
	for (var key in pollResults)
	{
		var userVotes = pollResults[key];
		for (var n = 0; n < pollOptions.length; n++)
		{
			totalVotes[n] += userVotes[n] != undefined &&  userVotes[n] != null ? userVotes[n] : 0;
		}
	};
	
	// show results
	
	var output = '@everyone\n\n**Ergebnis von dieser Woche**\n\n';
	var results = false;
	
	for (var n = 0; n < pollOptions.length; n++)
	{
		if (totalVotes[n] > 4)
		{
			output += pollOptions[n] + ": **" + totalVotes[n] + "** :fire: :muscle: :sweat_drops:\n";
			results = true;
		}
		else if (totalVotes[n] > 1)
		{
			output += pollOptions[n] + ": **" + totalVotes[n] + "**\n";
			results = true;
		}
	}
	
	if (!results || interaction != null)
	{
		for (var n = 0; n < pollOptions.length; n++)
		{
			if (totalVotes[n] == 1)
			{
				output += pollOptions[n] + ": **" + totalVotes[n] + "**\n";
				results = true;
			}
		}
	}
	
	if (!results)
	{
		output += "Tote Hose. :gengar_frown:\n";
	}
	
	output += "\nIhr könnt eure Zeiten eintragen, indem ihr den Bot privat anschreibt und ihm `/poll` sagt. :slight_smile:";

	if (interaction == null || postPublic)
	{
		const channel = client.channels.cache.get(POLL_CHANNEL_ID);
		
		if (channel)
		{
			channel.send(output);
			
			if (interaction != null)
				interaction.reply
				(
					{content: 'Published results successfully.', ephemeral: true}
				);
		}
		else
		{
			console.error('[ERROR] Result message could not be sent to channel: ' + POLL_CHANNEL_ID);
		}
	}
	else
	{
		interaction.reply
		(
			{content: output, ephemeral: true}
		);
	}
	
	// clear old results
	
	pollResults = [];
}

// bot login

console.log('[INFO] Starting bot login...');
client.login(BOT_TOKEN);