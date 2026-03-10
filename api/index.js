const { Telegraf } = require('telegraf');
const config = require('../setting');

const bot = new Telegraf(config.botToken);

bot.start((ctx) => ctx.reply('Bot QRIS Pakasir Ready! 🚀\nGunakan /bayar [nominal]'));

bot.command('bayar', async (ctx) => {
    const input = ctx.message.text.split(' ')[1];
    const amount = parseInt(input) || config.defaultAmount;
    const orderId = `INV-${Date.now()}`;

    try {
        const res = await fetch(`https://api.pakasir.id/v1/create-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': config.pakasirApiKey
            },
            body: JSON.stringify({
                slug: config.pakasirSlug,
                amount: amount,
                order_id: orderId
            })
        });

        const json = await res.json();
        
        if (json.status) {
            await ctx.replyWithPhoto(json.data.qr_image, {
                caption: `✅ *QRIS GENERATED*\n\n` +
                         `Total: *Rp ${amount.toLocaleString()}*\n` +
                         `ID: \`${orderId}\`\n\n` +
                         `Silakan scan dan bayar.`,
                parse_mode: 'Markdown'
            });
        } else {
            ctx.reply(`❌ Gagal: ${json.message || 'Cek setting.js'}`);
        }
    } catch (e) {
        ctx.reply('⚠️ Error koneksi API Pakasir.');
    }
});

// Handler Vercel
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            res.status(500).send('Webhook Error');
        }
    } else {
        res.status(200).send('Server is Up!');
    }
};
