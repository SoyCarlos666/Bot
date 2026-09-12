require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const express = require('express');
const fs = require('fs');
const app = express();
app.get('/', (req,res)=>res.send('KRAX STUDIO ONLINE'));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildModeration],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// --- CONFIG DE TUS CATEGORIAS CON TUS EMOJIS ---
const CATS = {
  banners: { label: 'Banners', emojiId: '1548144207670026281', emojiName: 'win', desc: 'Solicitudes de banners, logos, miniaturas y diseños.' },
  tebex: { label: 'Tebex', emojiId: '1548144124610224170', emojiName: 'dinero_AT', desc: 'Diseño, configuración, compras y soporte para tiendas.' },
  builds: { label: 'Builds', emojiId: '1548144132944433272', emojiName: 'picon_2001', desc: 'Construcciones, mapas y encargos para Minecraft.' },
  configuraciones: { label: 'Configuraciones', emojiId: '1548144158550528040', emojiName: 'tuerca', desc: 'Configuración de servidores, plugins y modalidades.' },
  bots: { label: 'Bots de Discord', emojiId: '1548144099012644866', emojiName: 'staff', desc: 'Desarrollo y configuración de bots personalizados.' },
  otros: { label: 'Otros', emojiId: '1548144114954928138', emojiName: 'caja_AT', desc: 'Servicios generales que no aparecen en las categorías anteriores.' }
};

// --- SISTEMA DE NIVELES SIMPLE ---
let niveles = {};
if (fs.existsSync('./niveles.json')) niveles = JSON.parse(fs.readFileSync('./niveles.json'));
function saveNiveles(){ fs.writeFileSync('./niveles.json', JSON.stringify(niveles)); }

client.on('ready', ()=> console.log(`✅ KRAX STUDIO BOT: ${client.user.tag}`));

// --- BIENVENIDAS Y DESPEDIDAS ---
client.on('guildMemberAdd', async member => {
  const canal = member.guild.channels.cache.get(process.env.CANAL_BIENVENIDAS_ID);
  if(!canal) return;
  const embed = new EmbedBuilder()
   .setTitle('<:Add_carta:1548144231808372776> ¡Bienvenido a Krax Studio!')
   .setDescription(`<:emoji_20:1548144222538960966> Hola ${member}!\n<:md_flecha:1548144181707415612> Somos **KRAX STUDIO** - Banners, Tebex, Builds, Configs y Bots.\n<:arrow_right_infection:1548144175961215006> Ve a <#${process.env.CANAL_BIENVENIDAS_ID}> y abre ticket en <#tickets>`)
   .setColor(0xFF0000).setThumbnail(member.user.displayAvatarURL());
  canal.send({ content: `${member}`, embeds: [embed] });
});

// --- MENSAJES Y NIVELES + COMANDOS ---
client.on('messageCreate', async msg => {
  if(msg.author.bot) return;

  // NIVELES
  if(!niveles[msg.author.id]) niveles[msg.author.id] = { xp:0, level:0 };
  niveles[msg.author.id].xp += Math.floor(Math.random()*10)+5;
  if(niveles[msg.author.id].xp >= (niveles[msg.author.id].level+1)*300){
    niveles[msg.author.id].level++;
    msg.channel.send(`<:hit:1548144219342905386> ${msg.author} subiste al nivel **${niveles[msg.author.id].level}**!`);
  }
  saveNiveles();

  //!panel TICKETS - SOLO ADMIN
  if(msg.content === '!panel' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)){
    const embed = new EmbedBuilder()
     .setTitle('<:estrella:1548144077231497289> Sistema de Tickets | Krax Studio')
     .setDescription(`<:fantasma:1548144162493304842> **Información importante.**\n> <:md_flecha:1548144181707415612> Abre un ticket solamente si estás interesado en un servicio.\n> <:md_flecha:1548144181707415612> No menciones al equipo innecesariamente.\n> <:md_flecha:1548144181707415612> Evita abrir varios tickets al mismo tiempo.\n\n<:llave_inglesa:1548144171619983363> **Servicios Disponibles.**\n\n**<:win:1548144207670026281> Banners** - Banners, logos, miniaturas\n**<:dinero_AT:1548144124610224170> Tebex** - Tiendas\n**<:picon_2001:1548144132944433272> Builds** - Construcciones\n**<:tuerca:1548144158550528040> Configuraciones** - Plugins\n**<:staff:1548144099012644866> Bots de Discord** - Bots custom\n**<:caja_AT:1548144114954928138> Otros** - Otros servicios`)
     .setColor(0xFF0000).setFooter({text:'Krax Studio | 2026'});

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('banners').setLabel('Banners').setStyle(ButtonStyle.Secondary).setEmoji({id: CATS.banners.emojiId}),
      new ButtonBuilder().setCustomId('tebex').setLabel('Tebex').setStyle(ButtonStyle.Secondary).setEmoji({id: CATS.tebex.emojiId}),
      new ButtonBuilder().setCustomId('builds').setLabel('Builds').setStyle(ButtonStyle.Secondary).setEmoji({id: CATS.builds.emojiId})
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('configuraciones').setLabel('Configuraciones').setStyle(ButtonStyle.Secondary).setEmoji({id: CATS.configuraciones.emojiId}),
      new ButtonBuilder().setCustomId('bots').setLabel('Bots de Discord').setStyle(ButtonStyle.Secondary).setEmoji({id: CATS.bots.emojiId}),
      new ButtonBuilder().setCustomId('otros').setLabel('Otros').setStyle(ButtonStyle.Secondary).setEmoji({id: CATS.otros.emojiId})
    );
    msg.channel.send({ embeds: [embed], components: [row1, row2] });
  }

  // --- MODERACION ---
  if(msg.content.startsWith('!ban') && msg.member.permissions.has(PermissionsBitField.Flags.BanMembers)){
    const user = msg.mentions.members.first(); if(!user) return msg.reply('<:pregunta_AT:1548144105203306617> Menciona a alguien');
    user.ban({reason: msg.content.split(' ').slice(2).join(' ') || 'Krax Studio'}); msg.reply(`<:fantasma:1548144162493304842> ${user.user.tag} baneado`);
  }
  if(msg.content.startsWith('!kick') && msg.member.permissions.has(PermissionsBitField.Flags.KickMembers)){
    const user = msg.mentions.members.first(); user.kick(); msg.reply(`Kick a ${user.user.tag}`);
  }
  if(msg.content.startsWith('!clear') && msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages)){
    const cant = parseInt(msg.content.split(' ')[1]); msg.channel.bulkDelete(cant || 10); msg.channel.send(`<:portapapeles:1548144129115033691> ${cant} mensajes borrados`).then(m=>setTimeout(()=>m.delete(),3000));
  }
  if(msg.content === '!lock' && msg.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){
    msg.channel.permissionOverwrites.edit(msg.guild.id, { SendMessages: false }); msg.reply('<:llave_inglesa:1548144171619983363> Canal bloqueado');
  }
  if(msg.content === '!unlock' && msg.member.permissions.has(PermissionsBitField.Flags.ManageChannels)){
    msg.channel.permissionOverwrites.edit(msg.guild.id, { SendMessages: true }); msg.reply('<:llave_inglesa:1548144171619983363> Canal desbloqueado');
  }

  // --- RESEÑAS ---
  if(msg.content.startsWith('!reseña')){
    const canal = msg.guild.channels.cache.get(process.env.CANAL_RESEÑAS_ID);
    const embed = new EmbedBuilder().setTitle('<:estrella:1548144077231497289> Nueva Reseña | Krax Studio').setDescription(msg.content.replace('!reseña','')).setColor(0xFF0000).setFooter({text:`Reseña por ${msg.author.tag}`});
    canal.send({ embeds: [embed] }); msg.reply('<:estrella:1548144077231497289> Reseña enviada!');
  }

  // --- NIVELES ---
  if(msg.content === '!rank'){
    const data = niveles[msg.author.id] || {level:0,xp:0};
    msg.reply(`<:emoji_16:1548144185008328716> ${msg.author} | Nivel **${data.level}** - XP: ${data.xp}/${(data.level+1)*300}`);
  }
  if(msg.content === '!top'){
    const top = Object.entries(niveles).sort((a,b)=>b[1].level-a[1].level).slice(0,10).map((u,i)=>`**${i+1}.** <@${u[0]}> - Nivel ${u[1].level}`).join('\n');
    const embed = new EmbedBuilder().setTitle('<:hit:1548144219342905386> Top Niveles Krax Studio').setDescription(top || 'Sin datos').setColor(0xFF0000);
    msg.channel.send({embeds:[embed]});
  }
});

// --- INTERACCIONES DE TICKETS ---
client.on('interactionCreate', async i => {
  if(!i.isButton()) return;

  // CREAR TICKET
  if(CATS[i.customId]){
    const cat = CATS[i.customId];
    const canalExist = i.guild.channels.cache.find(c=>c.name.includes(i.user.id) && c.parentId === process.env.CATEGORIA_TICKETS_ID);
    if(canalExist) return i.reply({content:`<:alarma_mineback:1548144135897088062> Ya tienes un ticket: ${canalExist}`, ephemeral:true});

    const channel = await i.guild.channels.create({
      name: `${i.customId}-${i.user.username}`,
      type: ChannelType.GuildText,
      parent: process.env.CATEGORIA_TICKETS_ID,
      permissionOverwrites: [
        { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
        { id: process.env.ROL_STAFF_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const embed = new EmbedBuilder()
     .setTitle(`<:portapapeles:1548144129115033691> ¡Bienvenido a tu ticket!`)
     .setDescription(`**${cat.label} | Krax Studio**\n\n<:pregunta_AT:1548144105203306617> **Información importante.**\nExplica detalladamente el servicio que necesitas.\nUn miembro del equipo te atenderá lo antes posible.\n\n<:staff:1548144099012644866> **Cliente**\n<@${i.user.id}>\n\n<:llave_inglesa:1548144171619983363> **Servicio**\n${cat.label}`)
     .setColor(0x0a0a0a).setFooter({text:'Krax Studio | 2026'});

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('reclamar').setLabel('Reclamar').setStyle(ButtonStyle.Secondary).setEmoji('🧑‍💼'),
      new ButtonBuilder().setCustomId('cerrar').setLabel('Cerrar').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );

    await channel.send({ content: `<@&${process.env.ROL_STAFF_ID}> | <@${i.user.id}>`, embeds: [embed], components: [row] });
    await i.reply({ content: `<:mail_prismamc:1548144211998547978> Ticket creado: ${channel}`, ephemeral: true });
  }

  if(i.customId === 'cerrar'){
    const embed = new EmbedBuilder().setTitle('<:estrella:1548144077231497289> ¿Enviar reseña antes de cerrar?').setDescription('**Si** -> Se enviará reseña por MD y se cerrará.\n**No** -> Se cerrará sin reseña.').setColor(0xFF0000);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('si_resena').setLabel('Si, enviar y cerrar').setStyle(ButtonStyle.Success).setEmoji('⭐'),
      new ButtonBuilder().setCustomId('no_resena').setLabel('No, cerrar sin reseña').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );
    await i.reply({ embeds: [embed], components: [row] });
  }

  if(i.customId === 'si_resena' || i.customId === 'no_resena'){
    const transcriptCanal = i.guild.channels.cache.get(process.env.CANAL_TRANSCRIPTS_ID);
    if(transcriptCanal){
      const embedLog = new EmbedBuilder()
       .setTitle(`📄 TICKET TRANSCRIPT #${Math.floor(Math.random()*900000)}`)
       .setDescription(`<:fecha:1548144225202208898> Ticket: ${i.channel.name}\n<:portapapeles:1548144129115033691> Cerrado por: <@${i.user.id}>\n<:dinero_AT:1548144124610224170> Con reseña: ${i.customId === 'si_resena'? 'Si' : 'No'}`)
       .setColor(0xFF0000);
      transcriptCanal.send({ embeds: [embedLog] });
    }
    await i.channel.send('✅ Cerrando ticket en 3 segundos...');
    setTimeout(()=> i.channel.delete().catch(()=>{}), 3000);
  }

  if(i.customId === 'reclamar'){
    await i.reply({ content: `<:staff:1548144099012644866> Ticket reclamado por <@${i.user.id}>` });
  }
});

client.login(process.env.TOKEN);
