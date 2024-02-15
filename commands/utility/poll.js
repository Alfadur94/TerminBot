const { ButtonBuilder, BaseSelectMenuBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');

module.exports =
{
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Opens up the schedule vote options.'),
	async execute(interaction)
	{
		if (interaction.guildId != null)
		{
			await interaction.reply
			(
				{content: 'Bitte privat anschreiben. :kissing_heart: :shushing_face:', ephemeral: true}
			);
			return;
		}
		
		var rows = [];
		var selectMenu = null;
		var n = 0
		
		for (; n < pollOptions.length; n++)
		{
			var blockId = parseInt(Math.floor(n / 25));
			var isEnabled = pollResults[interaction.user.id] != undefined && pollResults[interaction.user.id] != null && pollResults[interaction.user.id][n] == 1;
			
			if (n % 25 == 0)
			{
				//console.log('[DEBUG] Creating new menu block with blockId: ' + blockId);
				selectMenu = new StringSelectMenuBuilder()
					.setCustomId('pollSelects-' + blockId);
			}
			
			selectMenu.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(pollOptions[n])
					.setValue(n.toString())
					.setDefault(isEnabled)
			);
			
			if (n % 25 == 24)
			{
				rows.push
				(
					new ActionRowBuilder()
						.addComponents
						(
							selectMenu
								.setMinValues(0)
								.setMaxValues(selectMenu.options.length)
						)
				);
			}
		}
		n--;
		
		if (n % 25 != 24)
		{
			rows.push
			(
				new ActionRowBuilder()
					.addComponents
					(
						selectMenu
							.setMinValues(0)
							.setMaxValues(selectMenu.options.length)
					)
			);
		}
		
		console.log('[DEBUG] Showing ' + rows.length + ' select menus with ' + n + ' options.');

		await interaction.reply
		({
			content: pollTitle,
			components: [...rows],
			ephemeral: true,
		});
	},
};
