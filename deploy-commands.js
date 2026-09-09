require("dotenv").config();

const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Comprueba la latencia del bot."),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra todos los comandos."),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Crea el panel completo de tickets.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild.bitfield.toString()
    ),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Muestra información del servidor."),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Muestra información de un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Muestra el avatar de un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("invites")
    .setDescription("Muestra las invitaciones de un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configura el canal de bienvenida.")
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal de bienvenida.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("msg")
    .setDescription("Envía un mensaje a otro canal.")
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal donde enviar.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Mensaje.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Envía un mensaje en este canal.")
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Mensaje.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Envía un anuncio.")
    .addStringOption(option =>
      option
        .setName("titulo")
        .setDescription("Título.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Contenido.")
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("encuesta")
    .setDescription("Crea una encuesta.")
    .addStringOption(option =>
      option
        .setName("pregunta")
        .setDescription("Pregunta.")
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("reseñas")
    .setDescription("Publica una reseña.")
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Texto de la reseña.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("estrellas")
        .setDescription("Calificación de 1 a 5.")
        .setMinValue(1)
        .setMaxValue(5)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Elimina mensajes.")
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad entre 1 y 100.")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Advierte a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Muestra las advertencias.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Aplica timeout.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutos")
        .setDescription("Duración.")
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Quita un timeout.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Bloquea el canal."),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Desbloquea el canal."),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Configura slowmode.")
    .addIntegerOption(option =>
      option
        .setName("segundos")
        .setDescription("Segundos.")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("nick")
    .setDescription("Cambia el nickname.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("nombre")
        .setDescription("Nuevo nombre.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("sorteo")
    .setDescription("Crea un sorteo.")
    .addStringOption(option =>
      option
        .setName("premio")
        .setDescription("Premio.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutos")
        .setDescription("Duración.")
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("ganadores")
        .setDescription("Número de ganadores.")
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("cancelarsorteo")
    .setDescription("Cancela un sorteo.")

].map(command => command.toJSON());

const rest = new REST({
  version: "10"
}).setToken(process.env.TOKEN);

(async () => {

  try {

    console.log("Registrando comandos...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log(
      `✅ ${commands.length} comandos registrados.`
    );

  } catch (error) {

    console.error(error);

  }

})();