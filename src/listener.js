// src/listener.js
class Listener {
  constructor(playlistsService, mailSender) {
    this._playlistsService = playlistsService;
    this._mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());
      
      console.log(`📥 Processing export request for playlist: ${playlistId}`);
      console.log(`📧 Target email: ${targetEmail}`);

      // Validate email format
      if (!this._isValidEmail(targetEmail)) {
        throw new Error('Invalid email format');
      }

      const playlist = await this._playlistsService.getPlaylistById(playlistId);
      console.log(`✅ Playlist found: ${playlist.playlist.name}`);
      
      const result = await this._mailSender.sendEmail(targetEmail, JSON.stringify(playlist, null, 2));
      
      console.log('✅ Email sent successfully:', result.messageId);
      console.log(`📧 Playlist exported to: ${targetEmail}`);
      
    } catch (error) {
      console.error('❌ Error processing export request:', error.message);
      
      // Specific error handling
      if (error.message.includes('Playlist tidak ditemukan')) {
        console.error('🔍 Playlist not found in database');
      } else if (error.message.includes('self-signed certificate')) {
        console.error('🔒 SMTP SSL/TLS certificate issue');
        console.error('💡 Try setting NODE_TLS_REJECT_UNAUTHORIZED=0 in your environment variables for development');
        console.error('💡 Or configure your email provider to use proper SSL certificates');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('📧 SMTP server connection failed');
        console.error('Please check your email configuration in .env file');
        console.error('Current SMTP config:', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? '***configured***' : 'not set'
        });
      } else if (error.message.includes('Invalid email format')) {
        console.error('📧 Invalid target email address');
      } else {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Listener;