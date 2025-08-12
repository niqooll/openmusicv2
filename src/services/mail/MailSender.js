// src/services/mail/MailSender.js
const nodemailer = require('nodemailer');

class MailSender {
  constructor() {
    this._transporter = nodemailer.createTransport({ // ← PERBAIKAN: createTransport (bukan createTransporter)
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT == 465, // true untuk port 465, false untuk port lain
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Tambahkan opsi TLS untuk mengatasi self-signed certificate
      tls: {
        // Untuk development/testing, bisa set false
        // Untuk production, sebaiknya true
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
      // Timeout untuk menghindari hanging connection
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  async sendEmail(targetEmail, content) {
    try {
      // Verify connection terlebih dahulu
      await this._transporter.verify();
      console.log('✅ SMTP connection verified');

      const message = {
        from: process.env.SMTP_USER || 'OpenMusic Apps',
        to: targetEmail,
        subject: 'Ekspor Playlist',
        text: 'Terlampir hasil dari ekspor playlist',
        attachments: [
          {
            filename: 'playlist.json',
            content,
            contentType: 'application/json',
          },
        ],
      };

      const result = await this._transporter.sendMail(message);
      console.log('✅ Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      throw error;
    }
  }
}

module.exports = MailSender;