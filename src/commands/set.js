const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set")
    .setDescription("Set LFT & LFP post"),
  run: ({ interaction, client, handler }) => {
    const guild = interaction.guild;

    const description = [
      "# LFT & LFP Post",
      "*Find a team if you’re a player looking to join one, or find a player if you’re a team looking to recruit*",
      "## **LFT**           | **LFP**",
      "```",
      "• Name       | Team Name",
      "• Age        | Required Age",
      "• Rank       | Rank",
      "• Avail Time | Avail Time",
      "• Platform   | Platform",
      "• Casual/Comp| Casual/Comp",
      "```",
      "## **Registered Games:**",
      "```",
      "• Valorant",
      "• Apex Legends",
      "• League of Legends",
      "• CS:GO",
      "• Overwatch",
      "• Rocket League",
      "```",
    ].join("\n");

    const embed = new EmbedBuilder()
      .setDescription(description)
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1162553851187040329/1373574846360846417/TeamUp_Logo.png?ex=682ae8c3&is=68299743&hm=16cdb628f0a8999bb7a4a953bea92b851fc3a04f7398f920958c7614db7e4b28&"
      )
      .setColor("#ffa221")
      .setFooter({
        text: `${guild.name} | Your best Connection`,
        iconURL: guild.iconURL(),
      });

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("lft-lfp")
        .setPlaceholder("Select an option")
        .addOptions([
          {
            label: "LFT",
            value: "lft",
            description: "Looking for a team",
            emoji: { id: "1373583234650210304", name: "lft" },
          },
          {
            label: "LFP",
            value: "lfp",
            description: "Looking for players",
            emoji: { id: "1373583232532086824", name: "lfp" },
          },
        ])
    );

    interaction.reply({ embeds: [embed], components: [selectMenu] });
  },
  options: {},
};
