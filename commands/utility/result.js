const { SlashCommandBuilder } = require('discord.js');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName('result')
		.setDescription('Shows the intermediate result for next week.'),
	async execute(interaction)
	{
		await postResults(interaction);
	},
};
