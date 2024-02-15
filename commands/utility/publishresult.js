const { SlashCommandBuilder } = require('discord.js');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName('publishresult')
		.setDescription('Shows the intermediate result for next week.'),
	async execute(interaction)
	{
		await postResults(interaction, true);
	},
};
