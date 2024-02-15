// libs

const fs = require('node:fs');
const path = require('node:path');
const wait = require('node:timers/promises').setTimeout;
const { ActivityType, Client, Collection, Events, GatewayIntentBits, REST, Routes, StringSelectMenuInteraction } = require('discord.js');
const cron = require('cron');

// config

const { BOT_TOKEN, CLIENT_ID, GUILD_ID, POLL_CHANNEL_ID } = require('./config.json');

// start

console.log('[INFO] Starting.');

// import commands

const commands = [];
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
	console.log('[INFO] Clearing old commands...');
	
	try
	{
		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
			.then(async () =>
			{
				console.log('[DEBUG] Successfully cleared guild commands.');

				await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
					.then(async () =>
					{
						console.log('[DEBUG] Successfully cleared application commands.');
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
					})
					.catch(console.error);
			})
			.catch(console.error);
	}
	catch (error)
	{
		console.error(error);
	}
})();