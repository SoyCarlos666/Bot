require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType
} = require("discord.js");

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================================================
// CONFIGURACIÓN
// =====================================================

const COLOR = 0x2ef59b;
const PURPLE = 0x9d5cff;
const PINK = 0xff5cbe;
const RED = 0xff4d4d;
const ORANGE = 0xff8a3d;

const tickets = new Map();
const warnings = new Map();
const giveaways = new Map();
const welcomeChannels = new Map();

// =====================================================
// EMOJIS
// =====================================================

const E = {
  dinosaur: "<:zt_dinosaur:1541544532577886341>",
  alert: "<:zt_alert_purple:1541544535589523487>",
  world: "<:wordl:1541544537992986755>",
  welcome: "<:welcome:1541544541243572244>",
  turtle: "<:turtle_spookmc:1541544544632569917>",
  tuerca: "<:tuerca:1541544550017794188>",
  ticket: "<:ticket:1541544555701342290>",
  sword: "<:sword:1541544565520207883>",
  star: "<:star_mineslime:1541544562403582103>",
  sun: "<:sol:1541544600639115334>",
  saludo: "<:saludo:1543334564095729815>",
  paypal: "<:rt_paypal:1541544572503724036>",
  clock: "<:reloj_krypton:1542101246050041976>",
  frog: "<:ranita:1541544597556174951>",
  pineapple: "<:pineapple_inmortalmc:1541544569869574184>",
  paypal2: "<:paypal:1543334554033725480>",
  clown: "<:payaso:1543334557443686463>",
  palm: "<:palmera:1542101226617839658>",
  key: "<:nukemc_llave:1542101232007651348>",
  barrier: "<:nukemc_barrier:1542101229591863386>",
  ball: "<:nukemc_ball:1541544607446470776>",
  water: "<:noct_agua:1541544603956543520>",
  media: "<:media:1542101235732320266>",
  yes: "<:md_yes:1542101241033789520>",
  no: "<:md_no:1542101237900644444>",
  one: "<:md_1:1543334568260665465>",
  three: "<:md_3:1543334572044062843>",
  three2: "<:md_3:1543334577299263578>",
  ma: "<:ma_19:1542101243848036362>",
  gift: "<:gift:1541544585103151114>",
  emoji22: "<:emoji_22:1543350209877123072>",
  emoji13: "<:emoji_13:1541544576500637848>",
  discord: "<:discord:1543334547041550487>",
  corona: "<:corona:1543334529836785767>",
  money: "<:cel_dineros:1542101249711931464>",
  box: "<:box:1543334526095335526>",
  booster: "<:booster:1542101222788698113>",
  boost: "<:boost:1542101220469116948>",
  alarm: "<:alarm:1543334580558364814>",
  a4: "<:a_4:1542101253012856912>",
  warning: "<:Recaucion:1543334538321862770>",
  krypt: "<:Krypt_Studio:1541544580694933616>",
  founder: "<:Fundador:1543334543417933968>",
  logo: "<:5cc966bb587b4f2c9ae4bc97bb842951:1541544586990592160>"
};

// =====================================================
// EMBEDS
// =====================================================

function makeEmbed(title, description, color = COLOR) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({
      text: "Kravex Studio • Bot"
    });
}

// =====================================================
// PERMISOS
// =====================================================

function hasPermission(interaction, permission) {
  return interaction.member.permissions.has(permission);
}

function isStaff(member) {
  return (
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

// =====================================================
// READY
// =====================================================

client.once("ready", () => {
  console.log("==========================================");
  console.log("          KRAVEX STUDIO BOT");
  console.log("==========================================");
  console.log(`Bot: ${client.user.tag}`);
  console.log(`Servidores: ${client.guilds.cache.size}`);
  console.log("Estado: ONLINE");
  console.log("==========================================");

  client.user.setPresence({
    activities: [
      {
        name: "Kravex Studio",
        type: ActivityType.Watching
      }
    ],
    status: "online"
  });
});

// =====================================================
// BIENVENIDA
// =====================================================

client.on("guildMemberAdd", async member => {
  const channelId = welcomeChannels.get(member.guild.id);

  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);

  if (!channel) return;

  const e = makeEmbed(
    `${E.welcome} ¡Bienvenido/a!`,
    `${E.saludo} Bienvenido/a ${member} a **${member.guild.name}**.\n\n` +
    `${E.star} Ya somos **${member.guild.memberCount}** miembros.\n\n` +
    `${E.discord} ¡Disfruta tu estancia!`,
    COLOR
  );

  e.setThumbnail(
    member.user.displayAvatarURL({
      dynamic: true
    })
  );

  await channel.send({
    content: `${member}`,
    embeds: [e]
  }).catch(console.error);
});

// =====================================================
// PANEL DE TICKETS
// =====================================================

function ticketPanelEmbed() {
  return makeEmbed(
    `${E.ticket} | Panel de soporte`,
    `${E.krypt} Bienvenido al panel de soporte de **Kravex Studio**.\n` +
    `En este panel podrás resolver todas tus dudas y problemas.\n\n` +

    `${E.sword} **- Soporte**\n` +
    `Abre ticket para resolver tus dudas o preguntas.\n\n` +

    `${E.money} **- Comprar**\n` +
    `Abre ticket para comprar algún producto de la tienda.\n\n` +

    `${E.gift} **- Reclamar**\n` +
    `Abre ticket para solicitar tu recompensa.\n\n` +

    `${E.alert} **- Quejas**\n` +
    `Abre ticket para reportar un problema o queja.\n\n` +

    `${E.media} **- Media**\n` +
    `Abre ticket para solicitar el rol Team Media.\n\n` +

    `${E.founder} **- Postulación**\n` +
    `Abre ticket para postularte al Staff.\n\n` +

    `${E.emoji22} **- Otros**\n` +
    `Ninguno de los anteriores. Crea ticket para otros asuntos.`
  );
}

function ticketButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_soporte")
        .setLabel("Soporte")
        .setEmoji(E.sword)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_comprar")
        .setLabel("Comprar")
        .setEmoji(E.money)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_reclamar")
        .setLabel("Reclamar")
        .setEmoji(E.gift)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_quejas")
        .setLabel("Quejas")
        .setEmoji(E.alert)
        .setStyle(ButtonStyle.Secondary)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_media")
        .setLabel("Media")
        .setEmoji(E.media)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_postulacion")
        .setLabel("Postulación")
        .setEmoji(E.founder)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_otros")
        .setLabel("Otros")
        .setEmoji(E.emoji22)
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

// =====================================================
// CREAR TICKET
// =====================================================

async function createTicket(interaction, type) {
  const guild = interaction.guild;

  const existing = guild.channels.cache.find(
    channel =>
      channel.name ===
      `ticket-${interaction.user.username.toLowerCase()}` &&
      channel.type === ChannelType.GuildText
  );

  if (existing) {
    return interaction.reply({
      content:
        `${E.alert} Ya tienes un ticket abierto: ${existing}`,
      ephemeral: true
    });
  }

  const names = {
    soporte: "Soporte",
    comprar: "Comprar",
    reclamar: "Reclamar",
    quejas: "Quejas",
    media: "Media",
    postulacion: "Postulación",
    otros: "Otros"
  };

  const category = names[type] || "Otros";

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [
          PermissionFlagsBits.ViewChannel
        ]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      }
    ]
  });

  tickets.set(channel.id, {
    owner: interaction.user.id,
    type: category,
    created: Date.now()
  });

  const e = makeEmbed(
    `${E.ticket} Ticket de ${category}`,
    `${E.welcome} Bienvenido/a ${interaction.user}.\n\n` +
    `Un miembro del equipo te atenderá lo antes posible.\n\n` +
    `${E.ticket} **Categoría:** ${category}\n` +
    `${E.clock} **Creado:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
    `Explica detalladamente tu problema o solicitud.\n\n` +
    `${E.alert} No abras múltiples tickets innecesariamente.`,
    COLOR
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Cerrar ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Tomar ticket")
      .setEmoji("🛠️")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content: `${interaction.user} ${E.ticket}`,
    embeds: [e],
    components: [buttons]
  });

  return interaction.reply({
    content:
      `${E.yes} Ticket creado correctamente: ${channel}`,
    ephemeral: true
  });
}

// =====================================================
// CERRAR TICKET
// =====================================================

async function closeTicket(interaction) {
  const data = tickets.get(interaction.channel.id);

  if (!data) {
    return interaction.reply({
      content:
        `${E.alert} Este canal no es un ticket.`,
      ephemeral: true
    });
  }

  if (
    interaction.user.id !== data.owner &&
    !isStaff(interaction.member)
  ) {
    return interaction.reply({
      content:
        `${E.no} No puedes cerrar este ticket.`,
      ephemeral: true
    });
  }

  const e = makeEmbed(
    "🔒 Ticket cerrado",
    `Este ticket será eliminado en **5 segundos**.\n\n` +
    `Cerrado por: ${interaction.user}`,
    RED
  );

  await interaction.reply({
    embeds: [e]
  });

  tickets.delete(interaction.channel.id);

  setTimeout(async () => {
    await interaction.channel.delete().catch(() => {});
  }, 5000);
}

// =====================================================
// INTERACCIONES
// =====================================================

client.on("interactionCreate", async interaction => {

  // ===================================================
  // BOTONES
  // ===================================================

  if (interaction.isButton()) {

    if (interaction.customId.startsWith("ticket_")) {

      const id = interaction.customId;

      if (id === "ticket_close") {
        return closeTicket(interaction);
      }

      if (id === "ticket_claim") {

        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content:
              `${E.no} Solo el Staff puede tomar tickets.`,
            ephemeral: true
          });
        }

        const e = makeEmbed(
          `${E.yes} Ticket tomado`,
          `${interaction.user} está atendiendo este ticket.`,
          COLOR
        );

        return interaction.reply({
          embeds: [e]
        });
      }

      const type = id.replace("ticket_", "");

      return createTicket(
        interaction,
        type
      );
    }
  }

  // ===================================================
  // COMANDOS
  // ===================================================

  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  try {

    // =================================================
    // PING
    // =================================================

    if (command === "ping") {

      return interaction.reply({
        embeds: [
          makeEmbed(
            `${E.discord} Pong!`,
            `${E.yes} Bot online.\n\nLatencia: **${client.ws.ping}ms**`,
            COLOR
          )
        ]
      });
    }

    // =================================================
    // HELP
    // =================================================

    if (command === "help") {

      const e = makeEmbed(
        `${E.krypt} Centro de comandos`,
        `Sistema completo de **Kravex Studio**.`
      );

      e.addFields(
        {
          name: `${E.sword} Moderación`,
          value:
            "`/ban` `/kick` `/warn` `/warnings`\n" +
            "`/timeout` `/untimeout` `/clear`\n" +
            "`/lock` `/unlock` `/slowmode` `/nick`"
        },
        {
          name: `${E.ticket} Tickets`,
          value:
            "`/ticketpanel`\n" +
            "Soporte • Comprar • Reclamar • Quejas\n" +
            "Media • Postulación • Otros"
        },
        {
          name: `${E.star} Comunidad`,
          value:
            "`/welcome` `/invites` `/reseñas`\n" +
            "`/encuesta` `/avatar` `/userinfo`"
        },
        {
          name: `${E.gift} Eventos`,
          value:
            "`/sorteo` `/cancelarsorteo`"
        },
        {
          name: `${E.discord} Utilidades`,
          value:
            "`/msg` `/say` `/announce`\n" +
            "`/serverinfo` `/ping`"
        }
      );

      return interaction.reply({
        embeds: [e]
      });
    }

    // =================================================
    // TICKET PANEL
    // =================================================

    if (command === "ticketpanel") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageGuild
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso para crear el panel.`,
          ephemeral: true
        });
      }

      await interaction.channel.send({
        embeds: [ticketPanelEmbed()],
        components: ticketButtons()
      });

      return interaction.reply({
        content:
          `${E.yes} Panel de tickets enviado.`,
        ephemeral: true
      });
    }

    // =================================================
    // SERVERINFO
    // =================================================

    if (command === "serverinfo") {

      const guild = interaction.guild;

      const e = makeEmbed(
        `${E.world} Información del servidor`,
        `**${guild.name}**`
      );

      e.addFields(
        {
          name: "👥 Miembros",
          value: `${guild.memberCount}`,
          inline: true
        },
        {
          name: "💬 Canales",
          value: `${guild.channels.cache.size}`,
          inline: true
        },
        {
          name: "🎭 Roles",
          value: `${guild.roles.cache.size}`,
          inline: true
        },
        {
          name: "🆔 ID",
          value: guild.id,
          inline: true
        }
      );

      if (guild.iconURL()) {
        e.setThumbnail(guild.iconURL());
      }

      return interaction.reply({
        embeds: [e]
      });
    }

    // =================================================
    // USERINFO
    // =================================================

    if (command === "userinfo") {

      const user =
        interaction.options.getUser("usuario") ||
        interaction.user;

      const member =
        await interaction.guild.members
          .fetch(user.id)
          .catch(() => null);

      const e = makeEmbed(
        `👤 ${user.username}`,
        `${E.discord} Información del usuario`
      );

      e.setThumbnail(
        user.displayAvatarURL({
          dynamic: true
        })
      );

      e.addFields(
        {
          name: "🆔 ID",
          value: user.id
        },
        {
          name: "📅 Cuenta",
          value:
            `<t:${Math.floor(
              user.createdTimestamp / 1000
            )}:F>`
        },
        {
          name: "📥 Entrada",
          value: member
            ? `<t:${Math.floor(
                member.joinedTimestamp / 1000
              )}:R>`
            : "Desconocida"
        }
      );

      return interaction.reply({
        embeds: [e]
      });
    }

    // =================================================
    // AVATAR
    // =================================================

    if (command === "avatar") {

      const user =
        interaction.options.getUser("usuario") ||
        interaction.user;

      const e = makeEmbed(
        `🖼️ Avatar de ${user.username}`,
        `[Abrir avatar](${user.displayAvatarURL({
          size: 4096
        })})`
      );

      e.setImage(
        user.displayAvatarURL({
          size: 4096
        })
      );

      return interaction.reply({
        embeds: [e]
      });
    }

    // =================================================
    // INVITES
    // =================================================

    if (command === "invites") {

      const user =
        interaction.options.getUser("usuario") ||
        interaction.user;

      let total = 0;

      try {

        const invites =
          await interaction.guild.invites.fetch();

        invites.forEach(invite => {

          if (
            invite.inviter &&
            invite.inviter.id === user.id
          ) {
            total += invite.uses || 0;
          }

        });

      } catch {}

      return interaction.reply({
        embeds: [
          makeEmbed(
            `${E.discord} Invitaciones`,
            `${user} tiene **${total}** invitaciones utilizadas.`,
            COLOR
          )
        ]
      });
    }

    // =================================================
    // WELCOME
    // =================================================

    if (command === "welcome") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageGuild
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const canal =
        interaction.options.getChannel("canal");

      welcomeChannels.set(
        interaction.guild.id,
        canal.id
      );

      return interaction.reply({
        embeds: [
          makeEmbed(
            `${E.welcome} Bienvenida configurada`,
            `Los nuevos usuarios serán recibidos en ${canal}.`,
            COLOR
          )
        ]
      });
    }

    // =================================================
    // MSG
    // =================================================

    if (command === "msg") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageMessages
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const canal =
        interaction.options.getChannel("canal");

      const texto =
        interaction.options.getString("texto");

      await canal.send({
        content: texto
      });

      return interaction.reply({
        content:
          `${E.yes} Mensaje enviado en ${canal}.`,
        ephemeral: true
      });
    }

    // =================================================
    // SAY
    // =================================================

    if (command === "say") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageMessages
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const texto =
        interaction.options.getString("texto");

      await interaction.channel.send({
        content: texto
      });

      return interaction.reply({
        content:
          `${E.yes} Mensaje enviado.`,
        ephemeral: true
      });
    }

    // =================================================
    // ANNOUNCE
    // =================================================

    if (command === "announce") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageGuild
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const canal =
        interaction.options.getChannel("canal") ||
        interaction.channel;

      const titulo =
        interaction.options.getString("titulo");

      const texto =
        interaction.options.getString("texto");

      await canal.send({
        embeds: [
          makeEmbed(
            `${E.alert} ${titulo}`,
            texto,
            PURPLE
          )
        ]
      });

      return interaction.reply({
        content:
          `${E.yes} Anuncio enviado.`,
        ephemeral: true
      });
    }

    // =================================================
    // ENCUESTA
    // =================================================

    if (command === "encuesta") {

      const pregunta =
        interaction.options.getString("pregunta");

      const canal =
        interaction.options.getChannel("canal") ||
        interaction.channel;

      const e = makeEmbed(
        `${E.star} Encuesta`,
        `## ${pregunta}\n\n` +
        `${E.yes} **Sí**\n` +
        `${E.no} **No**`,
        PURPLE
      );

      const message =
        await canal.send({
          embeds: [e]
        });

      await message.react("👍");
      await message.react("👎");

      return interaction.reply({
        content:
          `${E.yes} Encuesta enviada.`,
        ephemeral: true
      });
    }

    // =================================================
    // RESEÑAS
    // =================================================

    if (command === "reseñas") {

      const texto =
        interaction.options.getString("texto");

      const estrellas =
        interaction.options.getInteger("estrellas");

      return interaction.reply({
        embeds: [
          makeEmbed(
            `${E.star} Nueva reseña`,
            `${E.saludo} **${interaction.user}**\n\n` +
            `> ${texto}\n\n` +
            `Calificación: ${"⭐".repeat(estrellas)} **${estrellas}/5**`,
            0xffd43b
          )
        ]
      });
    }

    // =================================================
    // CLEAR
    // =================================================

    if (command === "clear") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageMessages
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const cantidad =
        interaction.options.getInteger("cantidad");

      const deleted =
        await interaction.channel.bulkDelete(
          cantidad,
          true
        );

      return interaction.reply({
        content:
          `${E.yes} Eliminados **${deleted.size}** mensajes.`,
        ephemeral: true
      });
    }

    // =================================================
    // WARN
    // =================================================

    if (command === "warn") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ModerateMembers
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const user =
        interaction.options.getUser("usuario");

      const razon =
        interaction.options.getString("razon") ||
        "Sin razón.";

      const key =
        `${interaction.guild.id}-${user.id}`;

      const list =
        warnings.get(key) || [];

      list.push({
        reason: razon,
        moderator: interaction.user.id,
        date: Date.now()
      });

      warnings.set(key, list);

      return interaction.reply({
        embeds: [
          makeEmbed(
            `${E.warning} Advertencia`,
            `${user} recibió una advertencia.\n\n` +
            `**Razón:** ${razon}\n` +
            `**Total:** ${list.length}`,
            ORANGE
          )
        ]
      });
    }

    // =================================================
    // WARNINGS
    // =================================================

    if (command === "warnings") {

      const user =
        interaction.options.getUser("usuario");

      const key =
        `${interaction.guild.id}-${user.id}`;

      const list =
        warnings.get(key) || [];

      if (!list.length) {
        return interaction.reply({
          content:
            `${E.yes} ${user} no tiene advertencias.`,
          ephemeral: true
        });
      }

      const texto =
        list.map(
          (w, i) =>
            `**${i + 1}.** ${w.reason}`
        ).join("\n");

      return interaction.reply({
        embeds: [
          makeEmbed(
            `${E.warning} Advertencias`,
            `${user}\n\n${texto}`,
            ORANGE
          )
        ]
      });
    }

    // =================================================
    // KICK
    // =================================================

    if (command === "kick") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.KickMembers
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const user =
        interaction.options.getUser("usuario");

      const razon =
        interaction.options.getString("razon") ||
        "Sin razón.";

      const member =
        await interaction.guild.members
          .fetch(user.id)
          .catch(() => null);

      if (!member || !member.kickable) {
        return interaction.reply({
          content:
            `${E.no} No puedo expulsar a ese usuario.`,
          ephemeral: true
        });
      }

      await member.kick(razon);

      return interaction.reply({
        content:
          `${E.sword} **${user.tag}** fue expulsado.\n` +
          `Razón: **${razon}**`
      });
    }

    // =================================================
    // BAN
    // =================================================

    if (command === "ban") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.BanMembers
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const user =
        interaction.options.getUser("usuario");

      const razon =
        interaction.options.getString("razon") ||
        "Sin razón.";

      const member =
        await interaction.guild.members
          .fetch(user.id)
          .catch(() => null);

      if (!member || !member.bannable) {
        return interaction.reply({
          content:
            `${E.no} No puedo banear a ese usuario.`,
          ephemeral: true
        });
      }

      await member.ban({
        reason: razon
      });

      return interaction.reply({
        content:
          `${E.sword} **${user.tag}** fue baneado.\n` +
          `Razón: **${razon}**`
      });
    }

    // =================================================
    // TIMEOUT
    // =================================================

    if (command === "timeout") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ModerateMembers
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const user =
        interaction.options.getUser("usuario");

      const minutos =
        interaction.options.getInteger("minutos");

      const razon =
        interaction.options.getString("razon") ||
        "Sin razón.";

      const member =
        await interaction.guild.members
          .fetch(user.id)
          .catch(() => null);

      if (!member || !member.moderatable) {
        return interaction.reply({
          content:
            `${E.no} No puedo aplicar timeout.`,
          ephemeral: true
        });
      }

      await member.timeout(
        minutos * 60 * 1000,
        razon
      );

      return interaction.reply({
        content:
          `${E.clock} ${user} recibió timeout durante **${minutos} minutos**.`
      });
    }

    // =================================================
    // UNTIMEOUT
    // =================================================

    if (command === "untimeout") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ModerateMembers
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const user =
        interaction.options.getUser("usuario");

      const member =
        await interaction.guild.members
          .fetch(user.id)
          .catch(() => null);

      if (!member) {
        return interaction.reply({
          content:
            `${E.no} Usuario no encontrado.`,
          ephemeral: true
        });
      }

      await member.timeout(null);

      return interaction.reply({
        content:
          `${E.yes} Timeout retirado a ${user}.`
      });
    }

    // =================================================
    // LOCK
    // =================================================

    if (command === "lock") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageChannels
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          SendMessages: false
        }
      );

      return interaction.reply({
        content:
          `${E.barrier} Canal bloqueado.`
      });
    }

    // =================================================
    // UNLOCK
    // =================================================

    if (command === "unlock") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageChannels
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          SendMessages: null
        }
      );

      return interaction.reply({
        content:
          `${E.yes} Canal desbloqueado.`
      });
    }

    // =================================================
    // SLOWMODE
    // =================================================

    if (command === "slowmode") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageChannels
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const segundos =
        interaction.options.getInteger("segundos");

      await interaction.channel.setRateLimitPerUser(
        segundos
      );

      return interaction.reply({
        content:
          `${E.clock} Slowmode: **${segundos}s**`
      });
    }

    // =================================================
    // NICK
    // =================================================

    if (command === "nick") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageNicknames
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const user =
        interaction.options.getUser("usuario");

      const nombre =
        interaction.options.getString("nombre");

      const member =
        await interaction.guild.members
          .fetch(user.id)
          .catch(() => null);

      if (!member || !member.manageable) {
        return interaction.reply({
          content:
            `${E.no} No puedo cambiar ese nombre.`,
          ephemeral: true
        });
      }

      await member.setNickname(nombre);

      return interaction.reply({
        content:
          `${E.yes} Nickname actualizado.`
      });
    }

    // =================================================
    // SORTEO
    // =================================================

    if (command === "sorteo") {

      if (!hasPermission(
        interaction,
        PermissionFlagsBits.ManageGuild
      )) {
        return interaction.reply({
          content:
            `${E.alert} No tienes permiso.`,
          ephemeral: true
        });
      }

      const premio =
        interaction.options.getString("premio");

      const minutos =
        interaction.options.getInteger("minutos");

      const ganadores =
        interaction.options.getInteger("ganadores");

      const e = makeEmbed(
        `${E.gift} ¡SORTEO!`,
        `${E.corona} **Premio:** ${premio}\n\n` +
        `${E.clock} **Duración:** ${minutos} minutos\n` +
        `${E.star} **Ganadores:** ${ganadores}\n\n` +
        `🎉 Reacciona con 🎉 para participar.`,
        PINK
      );

      const message =
        await interaction.channel.send({
          embeds: [e]
        });

      await message.react("🎉");

      giveaways.set(message.id, {
        messageId: message.id,
        channelId: message.channel.id,
        prize: premio,
        winners: ganadores
      });

      setTimeout(async () => {

        const data =
          giveaways.get(message.id);

        if (!data) return;

        try {

          const channel =
            await client.channels.fetch(
              data.channelId
            );

          const msg =
            await channel.messages.fetch(
              data.messageId
            );

          const reaction =
            msg.reactions.cache.get("🎉");

          if (!reaction) {
            await channel.send(
              `${E.gift} El sorteo terminó sin participantes.`
            );

            giveaways.delete(message.id);
            return;
          }

          const users =
            await reaction.users.fetch();

          const participants =
            [...users.values()].filter(
              u => !u.bot
            );

          if (!participants.length) {
            await channel.send(
              `${E.gift} El sorteo terminó sin participantes.`
            );

            giveaways.delete(message.id);
            return;
          }

          const winners = [];

          while (
            winners.length < data.winners &&
            participants.length
          ) {

            const index =
              Math.floor(
                Math.random() * participants.length
              );

            winners.push(
              participants.splice(index, 1)[0]
            );
          }

          await channel.send(
            `${E.gift} **¡SORTEO TERMINADO!**\n\n` +
            `${E.corona} Premio: **${data.prize}**\n` +
            `🏆 Ganador(es): ${winners.join(", ")}`
          );

          giveaways.delete(message.id);

        } catch (error) {
          console.error(error);
        }

      }, minutos * 60 * 1000);

      return interaction.reply({
        content:
          `${E.yes} Sorteo creado.`,
        ephemeral: true
      });
    }

  } catch (error) {

    console.error(error);

    if (!interaction.replied) {
      await interaction.reply({
        content:
          `${E.alert} Ocurrió un error.`,
        ephemeral: true
      });
    }
  }
});

// =====================================================
// ERRORES
// =====================================================

client.on("error", console.error);

process.on(
  "unhandledRejection",
  console.error
);

// =====================================================
// LOGIN
// =====================================================

client.login(process.env.TOKEN);