const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  StringSelectMenuBuilder
} = require("discord.js");

const mineflayer = require("mineflayer");

/* ================= CONFIG ================= */
const TOKEN = "SEU_TOKEN_DO_DISCORD";
const CHANNEL_ID = "ID_DO_CANAL";
const MAX_BOTS_PER_USER = 3;

/* ================= BOT STORAGE ================= */
const userBots = {};

/* ================= RANDOM NAME ================= */
const nomes = [
  "Caspian", "Luan", "Rodrigo", "Matheus",
  "Pedro", "Lucas", "Gabriel", "Rafael",
  "Arthur", "Bruno", "Daniel"
];

const sobrenomes = [
  "Rodrigues", "Oliveira", "Silva",
  "Santos", "Pereira", "Costa"
];

function gerarNome() {
  return (
    nomes[Math.floor(Math.random() * nomes.length)] +
    sobrenomes[Math.floor(Math.random() * sobrenomes.length)]
  );
}

/* ================= DISCORD CLIENT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

/* ================= READY ================= */
client.once("ready", async () => {
  console.log("✅ Bot do Discord ligado!");

  const channel = await client.channels.fetch(CHANNEL_ID);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("add_bot")
      .setLabel("AddBot")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("list_bot")
      .setLabel("List")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("remove_bot")
      .setLabel("RemoveBot")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: "**Server IP + Port**",
    components: [row]
  });
});

/* ================= INTERACTIONS ================= */
client.on("interactionCreate", async (interaction) => {

  /* ===== ADD BOT BUTTON ===== */
  if (interaction.isButton() && interaction.customId === "add_bot") {
    const userId = interaction.user.id;

    if (!userBots[userId]) userBots[userId] = [];

    if (userBots[userId].length >= MAX_BOTS_PER_USER) {
      return interaction.reply({
        content: "❌ Você já atingiu o limite de 3 bots.",
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("add_bot_modal")
      .setTitle("Adicionar Bot Minecraft");

    const ipInput = new TextInputBuilder()
      .setCustomId("ip")
      .setLabel("IP do servidor")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const portInput = new TextInputBuilder()
      .setCustomId("port")
      .setLabel("Porta")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ipInput),
      new ActionRowBuilder().addComponents(portInput)
    );

    await interaction.showModal(modal);
  }

  /* ===== MODAL SUBMIT ===== */
  if (
    interaction.type === InteractionType.ModalSubmit &&
    interaction.customId === "add_bot_modal"
  ) {
    const userId = interaction.user.id;
    const ip = interaction.fields.getTextInputValue("ip");
    const port = parseInt(interaction.fields.getTextInputValue("port"));

    const nomeBot = gerarNome();

    const mcBot = mineflayer.createBot({
      host: ip,
      port: port,
      username: nomeBot
    });

    mcBot.on("login", () => {
      console.log(`🤖 ${nomeBot} conectado em ${ip}:${port}`);
    });

    mcBot.on("error", (err) => {
      console.log(`❌ Erro ${nomeBot}:`, err.message);
    });

    userBots[userId].push({
      name: nomeBot,
      host: ip,
      port: port,
      bot: mcBot
    });

    await interaction.reply({
      content: `✅ Bot **${nomeBot}** criado em **${ip}:${port}**`,
      ephemeral: true
    });
  }

  /* ===== LIST BOTS ===== */
  if (interaction.isButton() && interaction.customId === "list_bot") {
    const userId = interaction.user.id;
    const bots = userBots[userId];

    if (!bots || bots.length === 0) {
      return interaction.reply({
        content: "❌ Você não tem bots criados.",
        ephemeral: true
      });
    }

    let texto = "**🤖 Seus bots:**\n\n";

    bots.forEach((b, i) => {
      texto += `**${i + 1}. ${b.name}**\n🌐 ${b.host}:${b.port}\n\n`;
    });

    interaction.reply({
      content: texto,
      ephemeral: true
    });
  }

  /* ===== REMOVE BOT BUTTON ===== */
  if (interaction.isButton() && interaction.customId === "remove_bot") {
    const userId = interaction.user.id;
    const bots = userBots[userId];

    if (!bots || bots.length === 0) {
      return interaction.reply({
        content: "❌ Você não tem bots para remover.",
        ephemeral: true
      });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId("remove_select")
      .setPlaceholder("Selecione o bot para remover")
      .addOptions(
        bots.map((b, i) => ({
          label: b.name,
          description: `${b.host}:${b.port}`,
          value: i.toString()
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);

    interaction.reply({
      content: "🗑️ Escolha o bot que deseja remover:",
      components: [row],
      ephemeral: true
    });
  }

  /* ===== REMOVE SELECT ===== */
  if (interaction.isStringSelectMenu() && interaction.customId === "remove_select") {
    const userId = interaction.user.id;
    const index = parseInt(interaction.values[0]);
    const botData = userBots[userId][index];

    try {
      botData.bot.quit();
    } catch {}

    userBots[userId].splice(index, 1);

    interaction.update({
      content: `✅ Bot **${botData.name}** removido.`,
      components: []
    });
  }
});

/* ================= LOGIN ================= */
client.login(TOKEN);
