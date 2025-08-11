class Listener {
  constructor(playlistsService, mailSender) {
    this._playlistsService = playlistsService;
    this._mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());
      
      console.log(`Processing export request for playlist: ${playlistId}`);
      console.log(`Target email: ${targetEmail}`);

      const playlist = await this._playlistsService.getPlaylistById(playlistId);
      const result = await this._mailSender.sendEmail(targetEmail, JSON.stringify(playlist));
      
      console.log('✅ Email sent successfully:', result.messageId);
      console.log(`📧 Playlist exported to: ${targetEmail}`);
    } catch (error) {
      console.error('❌ Error processing export request:', error.message);
      
      if (error.message.includes('Playlist tidak ditemukan')) {
        console.error('🔍 Playlist not found in database');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('📧 SMTP server connection failed');
        console.error('Please check your email configuration in .env file');
      } else {
        console.error('Stack trace:', error.stack);
      }
    }
  }
}

module.exports = Listener;