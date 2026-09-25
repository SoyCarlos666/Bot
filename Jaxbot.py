import os
import re
import sqlite3
import asyncio
import logging
from datetime import datetime, timezone
from collections import defaultdict

import discord
from discord import app_commands
from discord.ext import commands, tasks
from dotenv import load_dotenv


# ============================================================
# JAX NETWORK - DISCORD BOT
# Todo en un solo archivo
# ============================================================

load_dotenv()

TOKEN = os.getenv("TOKEN") or os.getenv("DISCORD_TOKEN") or os.getenv("BOT_TOKEN")

if not TOKEN:
    raise RuntimeError(
        "No se encontró TOKEN, DISCORD_TOKEN o BOT_TOKEN en el archivo .env"
    )

DATABASE = "jax_network.db"

# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("JAX_NETWORK")


# ============================================================
# INTENTS
# ============================================================

intents = discord.Intents.default()

intents.guilds = True
intents.members = True
intents.message_content = True
intents.messages = True
intents.invites = True
intents.moderation = True


# ============================================================
# BOT
# ============================================================

class JaxNetwork(commands.Bot):

    def __init__(self):
        super().__init__(
            command_prefix="!",
            intents=intents,
            help_command=None,
        )

        self.invite_cache = {}
        self.ready_once = False

    async def setup_hook(self):

        # Crear DB
        init_database()

        # Cargar vistas persistentes
        self.add_view(TicketPanelView())
        self.add_view(TicketControlView())

        # Sincronizar slash commands
        try:
            synced = await self.tree.sync()
            logger.info(f"Slash commands sincronizados: {len(synced)}")
        except Exception as e:
            logger.error(f"Error sincronizando comandos: {e}")

    async def on_ready(self):

        if self.ready_once:
            return

        self.ready_once = True

        logger.info("---------------------------------------")
        logger.info("JAX NETWORK ONLINE")
        logger.info(f"Bot: {self.user}")
        logger.info(f"ID: {self.user.id}")
        logger.info(f"Servidores: {len(self.guilds)}")
        logger.info("---------------------------------------")

        await self.cache_invites()

    async def cache_invites(self):

        for guild in self.guilds:

            try:
                invites = await guild.invites()

                self.invite_cache[guild.id] = {
                    invite.code: invite.uses or 0
                    for invite in invites
                }

            except discord.Forbidden:
                logger.warning(
                    f"No se pueden obtener invites en {guild.name}"
                )

            except Exception as e:
                logger.error(
                    f"Error cargando invites de {guild.name}: {e}"
                )


bot = JaxNetwork()


# ============================================================
# DATABASE
# ============================================================

def get_db():

    connection = sqlite3.connect(DATABASE)

    connection.row_factory = sqlite3.Row

    return connection


def init_database():

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guild_config (
            guild_id INTEGER PRIMARY KEY,

            welcome_channel INTEGER,
            welcome_message TEXT,

            boost_channel INTEGER,
            boost_message TEXT,

            invite_channel INTEGER,

            log_channel INTEGER,

            ticket_channel INTEGER,
            ticket_category INTEGER,
            ticket_staff_role INTEGER,

            ticket_message TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS invites (
            guild_id INTEGER,
            user_id INTEGER,
            invites INTEGER DEFAULT 0,

            PRIMARY KEY (guild_id, user_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ticket_users (
            guild_id INTEGER,
            user_id INTEGER,
            channel_id INTEGER,

            PRIMARY KEY (guild_id, user_id)
        )
    """)

    db.commit()
    db.close()


def ensure_guild(guild_id: int):

    db = get_db()

    db.execute(
        """
        INSERT OR IGNORE INTO guild_config (guild_id)
        VALUES (?)
        """,
        (guild_id,),
    )

    db.commit()
    db.close()


def get_config(guild_id: int):

    ensure_guild(guild_id)

    db = get_db()

    row = db.execute(
        "SELECT * FROM guild_config WHERE guild_id = ?",
        (guild_id,),
    ).fetchone()

    db.close()

    return row


def update_config(guild_id: int, column: str, value):

    allowed = {
        "welcome_channel",
        "welcome_message",
        "boost_channel",
        "boost_message",
        "invite_channel",
        "log_channel",
        "ticket_channel",
        "ticket_category",
        "ticket_staff_role",
        "ticket_message",
    }

    if column not in allowed:
        raise ValueError("Configuración no permitida.")

    ensure_guild(guild_id)

    db = get_db()

    db.execute(
        f"""
        UPDATE guild_config
        SET {column} = ?
        WHERE guild_id = ?
        """,
        (value, guild_id),
    )

    db.commit()
    db.close()


# ============================================================
# EMBEDS
# ============================================================

JAX_COLOR = discord.Color.from_rgb(20, 20, 20)
SUCCESS_COLOR = discord.Color.from_rgb(46, 204, 113)
ERROR_COLOR = discord.Color.from_rgb(231, 76, 60)
INFO_COLOR = discord.Color.from_rgb(52, 152, 219)
BOOST_COLOR = discord.Color.from_rgb(255, 115, 250)


def success_embed(title, description):

    return discord.Embed(
        title=title,
        description=description,
        color=SUCCESS_COLOR,
        timestamp=datetime.now(timezone.utc),
    )


def error_embed(title, description):

    return discord.Embed(
        title=title,
        description=description,
        color=ERROR_COLOR,
        timestamp=datetime.now(timezone.utc),
    )


def info_embed(title, description):

    return discord.Embed(
        title=title,
        description=description,
        color=INFO_COLOR,
        timestamp=datetime.now(timezone.utc),
    )


# ============================================================
# PERMISSIONS
# ============================================================

def is_admin(interaction: discord.Interaction):

    if not interaction.guild:
        return False

    return interaction.user.guild_permissions.administrator


async def require_admin(interaction: discord.Interaction):

    if not interaction.guild:

        await interaction.response.send_message(
            embed=error_embed(
                "JAX NETWORK",
                "Este comando solamente puede utilizarse dentro de un servidor."
            ),
            ephemeral=True,
        )

        return False

    if not interaction.user.guild_permissions.administrator:

        await interaction.response.send_message(
            embed=error_embed(
                "Sin permisos",
                "Necesitas el permiso de **Administrador**."
            ),
            ephemeral=True,
        )

        return False

    return True


# ============================================================
# FORMAT MESSAGE
# ============================================================

def format_message(message: str, member: discord.Member):

    guild = member.guild

    replacements = {

        "{user}": member.mention,
        "{username}": member.name,
        "{displayname}": member.display_name,
        "{member}": member.mention,

        "{server}": guild.name,
        "{guild}": guild.name,

        "{member_count}": str(guild.member_count or 0),
        "{members}": str(guild.member_count or 0),

        "{user_id}": str(member.id),
        "{server_id}": str(guild.id),
    }

    for key, value in replacements.items():
        message = message.replace(key, value)

    return message


# ============================================================
# LOG SYSTEM
# ============================================================

async def send_log(guild: discord.Guild, embed: discord.Embed):

    try:

        config = get_config(guild.id)

        channel_id = config["log_channel"]

        if not channel_id:
            return

        channel = guild.get_channel(channel_id)

        if not channel:
            return

        await channel.send(embed=embed)

    except discord.Forbidden:
        pass

    except Exception as e:
        logger.error(f"Error enviando log: {e}")


# ============================================================
# WELCOME
# ============================================================

@bot.event
async def on_member_join(member: discord.Member):

    try:

        config = get_config(member.guild.id)

        channel_id = config["welcome_channel"]

        if not channel_id:
            return

        channel = member.guild.get_channel(channel_id)

        if not channel:
            return

        message = config["welcome_message"]

        if not message:
            message = (
                "👋 ¡Bienvenido/a {user} a **{server}**!\n"
                "Actualmente somos **{member_count}** miembros."
            )

        message = format_message(message, member)

        embed = discord.Embed(
            title=f"👋 Bienvenido/a a {member.guild.name}",
            description=message,
            color=JAX_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        embed.set_thumbnail(url=member.display_avatar.url)

        await channel.send(
            content=member.mention,
            embed=embed,
        )

        log = discord.Embed(
            title="📥 Miembro entró",
            description=(
                f"{member.mention} se unió al servidor.\n\n"
                f"**ID:** `{member.id}`"
            ),
            color=SUCCESS_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        await send_log(member.guild, log)

    except Exception as e:
        logger.error(f"Welcome error: {e}")


@bot.event
async def on_member_remove(member: discord.Member):

    try:

        embed = discord.Embed(
            title="📤 Miembro salió",
            description=(
                f"**Usuario:** {member.mention}\n"
                f"**ID:** `{member.id}`"
            ),
            color=ERROR_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        await send_log(member.guild, embed)

    except Exception as e:
        logger.error(f"Leave log error: {e}")


# ============================================================
# BOOST
# ============================================================

@bot.event
async def on_member_update(before, after):

    try:

        if before.premium_since == after.premium_since:
            return

        if after.premium_since is None:
            return

        config = get_config(after.guild.id)

        channel_id = config["boost_channel"]

        if not channel_id:
            return

        channel = after.guild.get_channel(channel_id)

        if not channel:
            return

        message = config["boost_message"]

        if not message:

            message = (
                "🚀 **¡Nuevo Boost!**\n\n"
                "Gracias {user} por apoyar a **{server}** 💜\n"
                "¡Tu apoyo ayuda muchísimo a la comunidad!"
            )

        message = format_message(message, after)

        embed = discord.Embed(
            title="🚀 ¡NUEVO BOOST!",
            description=message,
            color=BOOST_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        embed.set_thumbnail(url=after.display_avatar.url)

        await channel.send(embed=embed)

        log = discord.Embed(
            title="🚀 Servidor boosteado",
            description=f"{after.mention} ha dado boost al servidor.",
            color=BOOST_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        await send_log(after.guild, log)

    except Exception as e:
        logger.error(f"Boost error: {e}")


# ============================================================
# INVITES
# ============================================================

async def detect_inviter(guild: discord.Guild):

    try:

        current = await guild.invites()

        old = bot.invite_cache.get(guild.id, {})

        new_cache = {}

        inviter = None

        for invite in current:

            uses = invite.uses or 0

            new_cache[invite.code] = uses

            previous = old.get(invite.code, 0)

            if uses > previous:
                inviter = invite.inviter

        bot.invite_cache[guild.id] = new_cache

        return inviter

    except Exception as e:

        logger.error(f"Invite detection error: {e}")

        return None


@bot.event
async def on_member_join_invite(member):

    pass


@bot.event
async def on_invite_create(invite):

    try:

        guild_id = invite.guild.id

        if guild_id not in bot.invite_cache:
            bot.invite_cache[guild_id] = {}

        bot.invite_cache[guild_id][invite.code] = invite.uses or 0

    except Exception:
        pass


@bot.event
async def on_invite_delete(invite):

    try:

        if invite.guild.id in bot.invite_cache:

            bot.invite_cache[invite.guild.id].pop(
                invite.code,
                None
            )

    except Exception:
        pass


# ============================================================
# REAL MEMBER JOIN + INVITE DETECTION
# ============================================================

_original_member_join = bot.on_member_join


@bot.event
async def on_member_join(member: discord.Member):

    # Invite detection
    inviter = await detect_inviter(member.guild)

    if inviter and inviter.id != member.id:

        try:

            db = get_db()

            db.execute(
                """
                INSERT OR IGNORE INTO invites
                (guild_id, user_id, invites)
                VALUES (?, ?, 0)
                """,
                (member.guild.id, inviter.id),
            )

            db.execute(
                """
                UPDATE invites
                SET invites = invites + 1
                WHERE guild_id = ? AND user_id = ?
                """,
                (member.guild.id, inviter.id),
            )

            db.commit()
            db.close()

        except Exception as e:
            logger.error(f"Invite DB error: {e}")

    # Welcome
    try:

        config = get_config(member.guild.id)

        channel_id = config["welcome_channel"]

        if channel_id:

            channel = member.guild.get_channel(channel_id)

            if channel:

                message = config["welcome_message"]

                if not message:
                    message = (
                        "👋 ¡Bienvenido/a {user} a **{server}**!\n"
                        "Actualmente somos **{member_count}** miembros."
                    )

                message = format_message(message, member)

                embed = discord.Embed(
                    title=f"👋 Bienvenido/a a {member.guild.name}",
                    description=message,
                    color=JAX_COLOR,
                    timestamp=datetime.now(timezone.utc),
                )

                embed.set_thumbnail(
                    url=member.display_avatar.url
                )

                await channel.send(
                    content=member.mention,
                    embed=embed,
                )

        # Log
        log = discord.Embed(
            title="📥 Miembro entró",
            description=(
                f"{member.mention} se unió al servidor.\n"
                f"**ID:** `{member.id}`"
            ),
            color=SUCCESS_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        if inviter:

            log.add_field(
                name="Invitado por",
                value=inviter.mention,
                inline=False,
            )

        await send_log(member.guild, log)

    except Exception as e:
        logger.error(f"Member join error: {e}")


# ============================================================
# INVITE COMMANDS
# ============================================================

@bot.tree.command(
    name="invites",
    description="Muestra tus invitaciones."
)
async def invites_command(interaction: discord.Interaction):

    if not interaction.guild:

        await interaction.response.send_message(
            "Este comando solo funciona en servidores.",
            ephemeral=True,
        )

        return

    db = get_db()

    row = db.execute(
        """
        SELECT invites
        FROM invites
        WHERE guild_id = ? AND user_id = ?
        """,
        (interaction.guild.id, interaction.user.id),
    ).fetchone()

    db.close()

    count = row["invites"] if row else 0

    embed = discord.Embed(
        title="📨 Tus invitaciones",
        description=(
            f"{interaction.user.mention}, tienes "
            f"**{count} invitaciones**."
        ),
        color=INFO_COLOR,
    )

    await interaction.response.send_message(
        embed=embed,
        ephemeral=True,
    )


@bot.tree.command(
    name="invite-info",
    description="Muestra las invitaciones de un usuario."
)
@app_commands.describe(
    usuario="Usuario que quieres consultar"
)
async def invite_info(
    interaction: discord.Interaction,
    usuario: discord.Member,
):

    db = get_db()

    row = db.execute(
        """
        SELECT invites
        FROM invites
        WHERE guild_id = ? AND user_id = ?
        """,
        (interaction.guild.id, usuario.id),
    ).fetchone()

    db.close()

    count = row["invites"] if row else 0

    embed = discord.Embed(
        title="📨 Información de invitaciones",
        color=INFO_COLOR,
    )

    embed.set_thumbnail(url=usuario.display_avatar.url)

    embed.add_field(
        name="Usuario",
        value=usuario.mention,
        inline=True,
    )

    embed.add_field(
        name="Invitaciones",
        value=str(count),
        inline=True,
    )

    await interaction.response.send_message(
        embed=embed
    )


@bot.tree.command(
    name="invite-leaderboard",
    description="Muestra el ranking de invitaciones."
)
async def invite_leaderboard(interaction: discord.Interaction):

    db = get_db()

    rows = db.execute(
        """
        SELECT user_id, invites
        FROM invites
        WHERE guild_id = ?
        ORDER BY invites DESC
        LIMIT 10
        """,
        (interaction.guild.id,),
    ).fetchall()

    db.close()

    if not rows:

        await interaction.response.send_message(
            embed=info_embed(
                "📨 Ranking",
                "Todavía no hay invitaciones registradas."
            )
        )

        return

    lines = []

    for index, row in enumerate(rows, start=1):

        member = interaction.guild.get_member(row["user_id"])

        name = (
            member.mention
            if member
            else f"<@{row['user_id']}>"
        )

        lines.append(
            f"**{index}.** {name} — `{row['invites']}`"
        )

    embed = discord.Embed(
        title="🏆 Ranking de invitaciones",
        description="\n".join(lines),
        color=INFO_COLOR,
    )

    await interaction.response.send_message(
        embed=embed
    )


# ============================================================
# WELCOME SETUP
# ============================================================

@bot.tree.command(
    name="setup-welcome",
    description="Configura el sistema de bienvenida."
)
@app_commands.describe(
    canal="Canal donde se enviarán las bienvenidas",
    mensaje="Mensaje de bienvenida"
)
async def setup_welcome(
    interaction: discord.Interaction,
    canal: discord.TextChannel,
    mensaje: str,
):

    if not await require_admin(interaction):
        return

    update_config(
        interaction.guild.id,
        "welcome_channel",
        canal.id,
    )

    update_config(
        interaction.guild.id,
        "welcome_message",
        mensaje,
    )

    await interaction.response.send_message(
        embed=success_embed(
            "👋 Bienvenidas configuradas",
            (
                f"**Canal:** {canal.mention}\n\n"
                f"**Mensaje:**\n{mensaje}"
            ),
        ),
        ephemeral=True,
    )


# ============================================================
# BOOST SETUP
# ============================================================

@bot.tree.command(
    name="setup-boost",
    description="Configura el sistema de boosts."
)
@app_commands.describe(
    canal="Canal para los boosts",
    mensaje="Mensaje de boost"
)
async def setup_boost(
    interaction: discord.Interaction,
    canal: discord.TextChannel,
    mensaje: str,
):

    if not await require_admin(interaction):
        return

    update_config(
        interaction.guild.id,
        "boost_channel",
        canal.id,
    )

    update_config(
        interaction.guild.id,
        "boost_message",
        mensaje,
    )

    await interaction.response.send_message(
        embed=success_embed(
            "🚀 Boost configurado",
            f"Los boosts se enviarán en {canal.mention}.",
        ),
        ephemeral=True,
    )


# ============================================================
# LOG SETUP
# ============================================================

@bot.tree.command(
    name="setup-logs",
    description="Configura el canal de logs."
)
@app_commands.describe(
    canal="Canal donde se enviarán los logs"
)
async def setup_logs(
    interaction: discord.Interaction,
    canal: discord.TextChannel,
):

    if not await require_admin(interaction):
        return

    update_config(
        interaction.guild.id,
        "log_channel",
        canal.id,
    )

    await interaction.response.send_message(
        embed=success_embed(
            "📋 Logs configurados",
            f"Los logs se enviarán en {canal.mention}.",
        ),
        ephemeral=True,
    )


# ============================================================
# MESSAGE LOGS
# ============================================================

@bot.event
async def on_message_delete(message):

    if message.author.bot:
        return

    try:

        content = message.content or "*Sin contenido de texto*"

        if len(content) > 1000:
            content = content[:1000] + "..."

        embed = discord.Embed(
            title="🗑️ Mensaje eliminado",
            color=ERROR_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        embed.add_field(
            name="Autor",
            value=message.author.mention,
            inline=True,
        )

        embed.add_field(
            name="Canal",
            value=message.channel.mention,
            inline=True,
        )

        embed.add_field(
            name="Contenido",
            value=content,
            inline=False,
        )

        await send_log(message.guild, embed)

    except Exception as e:
        logger.error(f"Message delete log error: {e}")


@bot.event
async def on_message_edit(before, after):

    if before.author.bot:
        return

    if before.content == after.content:
        return

    try:

        old = before.content or "*Vacío*"
        new = after.content or "*Vacío*"

        if len(old) > 700:
            old = old[:700] + "..."

        if len(new) > 700:
            new = new[:700] + "..."

        embed = discord.Embed(
            title="✏️ Mensaje editado",
            color=INFO_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        embed.add_field(
            name="Autor",
            value=before.author.mention,
            inline=False,
        )

        embed.add_field(
            name="Antes",
            value=old,
            inline=False,
        )

        embed.add_field(
            name="Después",
            value=new,
            inline=False,
        )

        await send_log(before.guild, embed)

    except Exception as e:
        logger.error(f"Message edit log error: {e}")


# ============================================================
# ROLE LOGS
# ============================================================

@bot.event
async def on_member_update(before, after):

    try:

        before_roles = {r.id for r in before.roles}
        after_roles = {r.id for r in after.roles}

        added = after_roles - before_roles
        removed = before_roles - after_roles

        for role_id in added:

            role = after.guild.get_role(role_id)

            if role:

                embed = discord.Embed(
                    title="➕ Rol añadido",
                    description=(
                        f"**Usuario:** {after.mention}\n"
                        f"**Rol:** {role.mention}"
                    ),
                    color=SUCCESS_COLOR,
                    timestamp=datetime.now(timezone.utc),
                )

                await send_log(after.guild, embed)

        for role_id in removed:

            role = after.guild.get_role(role_id)

            if role:

                embed = discord.Embed(
                    title="➖ Rol eliminado",
                    description=(
                        f"**Usuario:** {after.mention}\n"
                        f"**Rol:** {role.mention}"
                    ),
                    color=ERROR_COLOR,
                    timestamp=datetime.now(timezone.utc),
                )

                await send_log(after.guild, embed)

    except Exception as e:
        logger.error(f"Role log error: {e}")


# ============================================================
# MODERATION LOGS
# ============================================================

@bot.event
async def on_member_ban(guild, user):

    try:

        embed = discord.Embed(
            title="🔨 Usuario baneado",
            description=(
                f"**Usuario:** {user.mention}\n"
                f"**ID:** `{user.id}`"
            ),
            color=ERROR_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        await send_log(guild, embed)

    except Exception as e:
        logger.error(f"Ban log error: {e}")


@bot.event
async def on_member_unban(guild, user):

    try:

        embed = discord.Embed(
            title="🔓 Usuario desbaneado",
            description=(
                f"**Usuario:** {user.mention}\n"
                f"**ID:** `{user.id}`"
            ),
            color=SUCCESS_COLOR,
            timestamp=datetime.now(timezone.utc),
        )

        await send_log(guild, embed)

    except Exception as e:
        logger.error(f"Unban log error: {e}")


# ============================================================
# TICKET VIEW
# ============================================================

class TicketPanelView(discord.ui.View):

    def __init__(self):

        super().__init__(
            timeout=None
        )

    @discord.ui.button(
        label="Crear ticket",
        emoji="🎫",
        style=discord.ButtonStyle.primary,
        custom_id="jax_ticket_create",
    )
    async def create_ticket(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button,
    ):

        guild = interaction.guild

        if not guild:
            return

        config = get_config(guild.id)

        existing = guild.get_channel(
            config["ticket_channel"]
        ) if config["ticket_channel"] else None

        # Comprobar DB
        db = get_db()

        row = db.execute(
            """
            SELECT channel_id
            FROM ticket_users
            WHERE guild_id = ? AND user_id = ?
            """,
            (guild.id, interaction.user.id),
        ).fetchone()

        db.close()

        if row:

            channel = guild.get_channel(row["channel_id"])

            if channel:

                await interaction.response.send_message(
                    embed=info_embed(
                        "🎫 Ya tienes un ticket",
                        f"Tu ticket actual es {channel.mention}.",
                    ),
                    ephemeral=True,
                )

                return

        category = None

        if config["ticket_category"]:

            category = guild.get_channel(
                config["ticket_category"]
            )

            if not isinstance(category, discord.CategoryChannel):
                category = None

        staff_role = None

        if config["ticket_staff_role"]:

            staff_role = guild.get_role(
                config["ticket_staff_role"]
            )

        overwrites = {

            guild.default_role: discord.PermissionOverwrite(
                view_channel=False
            ),

            interaction.user: discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                read_message_history=True,
                attach_files=True,
            ),

            guild.me: discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                manage_channels=True,
                manage_messages=True,
            ),
        }

        if staff_role:

            overwrites[staff_role] = discord.PermissionOverwrite(
                view_channel=True,
                send_messages=True,
                read_message_history=True,
                manage_messages=True,
            )

        safe_name = re.sub(
            r"[^a-z0-9-]",
            "",
            interaction.user.name.lower().replace(" ", "-"),
        )

        if not safe_name:
            safe_name = "usuario"

        safe_name = safe_name[:20]

        channel_name = f"ticket-{safe_name}"

        try:

            channel = await guild.create_text_channel(
                name=channel_name,
                category=category,
                overwrites=overwrites,
                reason="JAX NETWORK Ticket",
            )

        except discord.Forbidden:

            await interaction.response.send_message(
                embed=error_embed(
                    "Error",
                    "No tengo permisos para crear canales."
                ),
                ephemeral=True,
            )

            return

        except Exception as e:

            logger.error(f"Ticket creation error: {e}")

            await interaction.response.send_message(
                embed=error_embed(
                    "Error",
                    "No se pudo crear el ticket."
                ),
                ephemeral=True,
            )

            return

        db = get_db()

        db.execute(
            """
            INSERT OR REPLACE INTO ticket_users
            (guild_id, user_id, channel_id)
            VALUES (?, ?, ?)
            """,
            (guild.id, interaction.user.id, channel.id),
        )

        db.commit()
        db.close()

        embed = discord.Embed(
            title="🎫 Ticket creado",
            description=(
                f"Hola {interaction.user.mention}.\n\n"
                "Describe tu problema y un miembro del staff te atenderá.\n\n"
                "Cuando termines puedes cerrar el ticket."
            ),
            color=JAX_COLOR,
        )

        await channel.send(
            content=(
                interaction.user.mention
                + (f" {staff_role.mention}" if staff_role else "")
            ),
            embed=embed,
            view=TicketControlView(),
        )

        await interaction.response.send_message(
            embed=success_embed(
                "🎫 Ticket creado",
                f"Tu ticket es {channel.mention}.",
            ),
            ephemeral=True,
        )


# ============================================================
# TICKET CONTROL
# ============================================================

class TicketControlView(discord.ui.View):

    def __init__(self):

        super().__init__(
            timeout=None
        )

    @discord.ui.button(
        label="Cerrar ticket",
        emoji="🔒",
        style=discord.ButtonStyle.danger,
        custom_id="jax_ticket_close",
    )
    async def close_ticket(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button,
    ):

        channel = interaction.channel

        if not isinstance(channel, discord.TextChannel):

            await interaction.response.send_message(
                "Este botón no puede utilizarse aquí.",
                ephemeral=True,
            )

            return

        guild = interaction.guild

        if not guild:
            return

        # Buscar propietario
        db = get_db()

        row = db.execute(
            """
            SELECT user_id
            FROM ticket_users
            WHERE guild_id = ? AND channel_id = ?
            """,
            (guild.id, channel.id),
        ).fetchone()

        db.close()

        if not row:

            if not interaction.user.guild_permissions.manage_channels:

                await interaction.response.send_message(
                    embed=error_embed(
                        "Sin permisos",
                        "Este canal no parece ser un ticket válido."
                    ),
                    ephemeral=True,
                )

                return

        else:

            owner_id = row["user_id"]

            config = get_config(guild.id)

            staff_role = (
                guild.get_role(config["ticket_staff_role"])
                if config["ticket_staff_role"]
                else None
            )

            allowed = (
                interaction.user.id == owner_id
                or interaction.user.guild_permissions.manage_channels
                or (
                    staff_role
                    and staff_role in interaction.user.roles
                )
            )

            if not allowed:

                await interaction.response.send_message(
                    embed=error_embed(
                        "Sin permisos",
                        "No puedes cerrar este ticket."
                    ),
                    ephemeral=True,
                )

                return

        await interaction.response.send_message(
            embed=info_embed(
                "🔒 Cerrando ticket",
                "Este ticket será eliminado en **5 segundos**.",
            )
        )

        await asyncio.sleep(5)

        try:

            if row:

                db = get_db()

                db.execute(
                    """
                    DELETE FROM ticket_users
                    WHERE guild_id = ? AND channel_id = ?
                    """,
                    (guild.id, channel.id),
                )

                db.commit()
                db.close()

            await channel.delete(
                reason="Ticket cerrado - JAX NETWORK"
            )

        except discord.NotFound:
            pass

        except Exception as e:
            logger.error(f"Ticket close error: {e}")


# ============================================================
# TICKET SETUP
# ============================================================

@bot.tree.command(
    name="setup-tickets",
    description="Configura el sistema de tickets."
)
@app_commands.describe(
    canal="Canal donde se enviará el panel",
    categoria="Categoría donde se crearán los tickets",
    staff="Rol del staff",
)
async def setup_tickets(
    interaction: discord.Interaction,
    canal: discord.TextChannel,
    categoria: discord.CategoryChannel,
    staff: discord.Role,
):

    if not await require_admin(interaction):
        return

    update_config(
        interaction.guild.id,
        "ticket_channel",
        canal.id,
    )

    update_config(
        interaction.guild.id,
        "ticket_category",
        categoria.id,
    )

    update_config(
        interaction.guild.id,
        "ticket_staff_role",
        staff.id,
    )

    embed = discord.Embed(
        title="🎫 Soporte JAX NETWORK",
        description=(
            "¿Necesitas ayuda?\n\n"
            "Pulsa el botón de abajo para crear un ticket."
        ),
        color=JAX_COLOR,
    )

    embed.set_footer(
        text="JAX NETWORK • Sistema de tickets"
    )

    try:

        await canal.send(
            embed=embed,
            view=TicketPanelView(),
        )

    except discord.Forbidden:

        await interaction.response.send_message(
            embed=error_embed(
                "Error",
                "No puedo enviar mensajes en ese canal."
            ),
            ephemeral=True,
        )

        return

    await interaction.response.send_message(
        embed=success_embed(
            "🎫 Tickets configurados",
            (
                f"**Panel:** {canal.mention}\n"
                f"**Categoría:** `{categoria.name}`\n"
                f"**Staff:** {staff.mention}"
            ),
        ),
        ephemeral=True,
    )


# ============================================================
# MANUAL TICKET COMMAND
# ============================================================

@bot.tree.command(
    name="ticket",
    description="Crea un ticket directamente."
)
async def ticket_command(interaction: discord.Interaction):

    config = get_config(interaction.guild.id)

    # Reutiliza el botón
    fake_view = TicketPanelView()

    # Buscar botón
    await fake_view.create_ticket(
        interaction,
        fake_view.children[0],
    )


# ============================================================
# CONFIG COMMAND
# ============================================================

@bot.tree.command(
    name="jax-config",
    description="Muestra la configuración de JAX NETWORK."
)
async def jax_config(interaction: discord.Interaction):

    if not await require_admin(interaction):
        return

    config = get_config(interaction.guild.id)

    def channel(id_):

        if not id_:
            return "❌ No configurado"

        obj = interaction.guild.get_channel(id_)

        return obj.mention if obj else f"`{id_}`"

    def role(id_):

        if not id_:
            return "❌ No configurado"

        obj = interaction.guild.get_role(id_)

        return obj.mention if obj else f"`{id_}`"

    embed = discord.Embed(
        title="⚙️ Configuración JAX NETWORK",
        color=JAX_COLOR,
    )

    embed.add_field(
        name="👋 Bienvenidas",
        value=channel(config["welcome_channel"]),
        inline=False,
    )

    embed.add_field(
        name="🚀 Boosts",
        value=channel(config["boost_channel"]),
        inline=False,
    )

    embed.add_field(
        name="📋 Logs",
        value=channel(config["log_channel"]),
        inline=False,
    )

    embed.add_field(
        name="🎫 Tickets",
        value=channel(config["ticket_channel"]),
        inline=False,
    )

    embed.add_field(
        name="📁 Categoría tickets",
        value=channel(config["ticket_category"]),
        inline=False,
    )

    embed.add_field(
        name="👮 Staff",
        value=role(config["ticket_staff_role"]),
        inline=False,
    )

    await interaction.response.send_message(
        embed=embed,
        ephemeral=True,
    )


# ============================================================
# ERROR HANDLER
# ============================================================

@bot.tree.error
async def on_app_command_error(
    interaction: discord.Interaction,
    error: app_commands.AppCommandError,
):

    logger.error(
        f"Command error: {interaction.command}: {error}"
    )

    try:

        if interaction.response.is_done():

            await interaction.followup.send(
                embed=error_embed(
                    "❌ Error",
                    "Ocurrió un error ejecutando el comando."
                ),
                ephemeral=True,
            )

        else:

            await interaction.response.send_message(
                embed=error_embed(
                    "❌ Error",
                    "Ocurrió un error ejecutando el comando."
                ),
                ephemeral=True,
            )

    except Exception:
        pass


@bot.event
async def on_error(event, *args, **kwargs):

    logger.exception(
        f"Error en evento: {event}"
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    try:

        bot.run(TOKEN)

    except discord.LoginFailure:

        logger.error(
            "TOKEN inválido. Revisa tu archivo .env."
        )

    except Exception as e:

        logger.exception(
            f"Error fatal iniciando JAX NETWORK: {e}"
        )