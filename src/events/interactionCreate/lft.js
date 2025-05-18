const supabase = require("../../utils/supabase");
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SectionBuilder,
} = require("discord.js");

module.exports = async (interaction, client) => {
  if (interaction.customId !== "lft-lfp") return;
  const selection = interaction.values[0];
  if (selection !== "lft") return;

  const user = interaction.user;
  const dmChannel = await user.createDM().catch(() => null);
  if (!dmChannel) {
    return interaction.reply({
      content: "Bitte aktiviere DMs, um dein LFT-Formular zu erhalten.",
      ephemeral: true,
    });
  }

  const { data: existingUser, error: fetchError } = await supabase
    .from("LFT")
    .select("userId")
    .eq("userId", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Fehler beim Überprüfen des Benutzers:", fetchError);
    return dmChannel.send(
      "Fehler beim Überprüfen deiner Daten. Bitte versuche es später erneut."
    );
  }

  // Wenn der Benutzer bereits existiert, Nachricht senden und abbrechen
  if (existingUser) {
    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          StringSelectMenuBuilder.from(
            interaction.message.components[0].components[0]
          )
        ),
      ],
    });

    return interaction.reply({
      content:
        "❌ Du hast bereits ein LFT-Profil erstellt. Bitte lösche dein bestehendes Profil, bevor du ein neues erstellst.",
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: "Bitte überprüfe deine DMs für das LFT-Formular.",
    ephemeral: true,
  });

  await interaction.message.edit({
    components: [
      new ActionRowBuilder().addComponents(
        StringSelectMenuBuilder.from(
          interaction.message.components[0].components[0]
        )
      ),
    ],
  });

  const questions = [
    { key: "gamertag", question: "Was ist dein Gamertag?" },
    { key: "age", question: "Wie alt bist du?" },
    { key: "game", question: "Welches Spiel spielst du?" },
    { key: "rank", question: "Was ist dein Rang?" },
    { key: "platform", question: "Auf welcher Plattform spielst du?" },
    { key: "time", question: "Wann bist du verfügbar?" },
    { key: "mode", question: "Spielst du Casual oder Competitive?" },
  ];

  const gameSpecificQuestions = {
    "Rocket League": [
      { key: "rl_mode", question: "Lieblingsmodus? (1s, 2s, 3s, 4s)" },
      { key: "rl_bumperUse", question: "Verwendest du Bumper? (Ja/Nein)" },
    ],
    "Apex Legends": [
      {
        key: "apex_legend",
        question: "Welche Legende spielst du am häufigsten?",
      },
      {
        key: "apex_playstyle",
        question: "Wie würdest du deinen Spielstil beschreiben?",
      },
    ],
  };

  const answers = new Map();
  let step = 0;
  const duration = 60;
  let embedMessage;
  let interval;
  let messageCollector;
  let buttonCollector;

  const askQuestion = async () => {
    if (step === questions.findIndex((q) => q.key === "mode") + 1) {
      const selectedGame = answers.get("game");
      if (gameSpecificQuestions[selectedGame]) {
        questions.push(...gameSpecificQuestions[selectedGame]);
      }
    }

    if (step >= questions.length) {
      if (messageCollector) messageCollector.stop("done");
      if (buttonCollector) buttonCollector.stop("done");
      return;
    }

    const cancelButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Abbrechen")
        .setStyle(ButtonStyle.Danger)
    );

    const q = questions[step];
    const embed = new EmbedBuilder()
      .setTitle(`Frage ${step + 1}/${questions.length}`)
      .setColor("Yellow")
      .setAuthor({
        name: `${user.tag} | LFT Antragsformular`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(
        "https://media.discordapp.net/attachments/1162553851187040329/1373574846360846417/TeamUp_Logo.png?ex=682ae8c3&is=68299743&hm=16cdb628f0a8999bb7a4a953bea92b851fc3a04f7398f920958c7614db7e4b28&=&format=webp&quality=lossless&width=930&height=930"
      )
      .setDescription(`### ${q.question}`)
      .addFields(
        {
          name: "⏳ Verbleibende Zeit",
          value: `\`${duration}s\``,
          inline: true,
        },
        {
          name: "\u200b", // Invisible spacer
          value: "\u200b",
          inline: true,
        }
      )
      .setFooter({
        text: "TeamUp Connect • Bitte antworte hier",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    embedMessage = await dmChannel.send({
      embeds: [embed],
      components: [cancelButton],
    });

    // Erstelle einen Button-Collector für den Cancel-Button
    buttonCollector = embedMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === user.id && i.customId === "cancel",
      time: duration * 1000,
    });

    buttonCollector.on("collect", async (buttonInteraction) => {
      await buttonInteraction.deferUpdate();
      clearInterval(interval);
      if (messageCollector) messageCollector.stop("cancel");
      buttonCollector.stop("cancel");
      return dmChannel.send("❌ Formular abgebrochen.");
    });

    const start = Date.now();
    clearInterval(interval);
    interval = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, duration - elapsed);

      if (embed.data.fields && embed.data.fields[0]) {
        embed.data.fields[0].value = `\`${remaining}s\``;
        await embedMessage.edit({ embeds: [embed] }).catch(() => {
          // Falls das Editieren fehlschlägt, z.B. weil die Nachricht gelöscht wurde
          clearInterval(interval);
        });
      }

      if (remaining <= 0) {
        clearInterval(interval);
        if (messageCollector) messageCollector.stop("time");
        if (buttonCollector) buttonCollector.stop("time");
      }
    }, 1000);
  };

  await askQuestion();

  // Erstelle einen Message-Collector für die Textantworten
  messageCollector = dmChannel.createMessageCollector({
    filter: (m) => m.author.id === user.id,
    time: duration * 1000,
  });

  messageCollector.on("collect", async (msg) => {
    answers.set(questions[step].key, msg.content);
    step++;

    // Alte Collector stoppen
    if (buttonCollector) buttonCollector.stop();
    clearInterval(interval);

    // Neue Frage stellen
    await askQuestion();
  });

  messageCollector.on("end", async (_collected, reason) => {
    clearInterval(interval);
    if (buttonCollector) buttonCollector.stop();

    if (reason === "time") {
      // "time" ist der tatsächliche Grund, wenn die Zeit abläuft (nicht "timeout")
      return dmChannel
        .send({
          content:
            "⏰ Zeit abgelaufen! Bitte starte das Formular neu, wenn du bereit bist.",
          embeds: [],
          components: [], // Entfernt den Button
        })
        .catch(() => {});
    }

    if (reason === "cancel") {
      return; // Die Abbruchnachricht wurde bereits im buttonCollector gesendet
    }

    if (reason !== "done") {
      return dmChannel.send(
        "Etwas ist schiefgelaufen. Bitte versuche es erneut."
      );
    }

    const allAnswers = Object.fromEntries(answers.entries());

    const extra = {};
    const selectedGame = allAnswers.game;
    (gameSpecificQuestions[selectedGame] || []).forEach((q) => {
      const antwort = allAnswers[q.key];
      if (antwort) {
        extra[q.question] = antwort;
      }
    });

    const { error } = await supabase.from("LFT").insert([
      {
        userId: user.id,
        gamertag: allAnswers.gamertag,
        age: allAnswers.age,
        game: allAnswers.game,
        rank: allAnswers.rank,
        platform: allAnswers.platform,
        time: allAnswers.time,
        mode: allAnswers.mode,
        gameQues: extra,
      },
    ]);

    if (error) {
      console.error("Fehler beim Speichern in Supabase:", error);
      return dmChannel.send(
        "Fehler beim Speichern deiner Daten. Bitte versuche es später erneut."
      );
    }

    await dmChannel.send(
      "✅ Deine Daten wurden erfolgreich gespeichert! Viel Glück bei der Teamsuche!"
    );

    const channelId = "1201226652156440596";
    const channel = client.channels.cache.get(channelId);

    if (!channel) {
      console.error("Channel not found");
      return dmChannel.send(
        "Fehler: Der Kanal für die LFT-Anfragen wurde nicht gefunden."
      );
    }

    const thumbnail = new ThumbnailBuilder().setURL(
      `${user.displayAvatarURL()}`
    );

    const text = new TextDisplayBuilder().setContent(
      `**LFT Anfrage von ${user.tag}**\n\n` +
        `**Gamertag:** ${allAnswers.gamertag}\n` +
        `**Alter:** ${allAnswers.age}\n` +
        `**Spiel:** ${allAnswers.game}\n` +
        `**Rang:** ${allAnswers.rank}\n` +
        `**Plattform:** ${allAnswers.platform}\n` +
        `**Verfügbarkeit:** ${allAnswers.time}\n` +
        `**Modus:** ${allAnswers.mode}`
    );

    const section = new SectionBuilder()
      .addTextDisplayComponents(text)
      .setThumbnailAccessory(thumbnail);

    const container = new ContainerBuilder().addSectionComponents(section);

    await channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  });
};
