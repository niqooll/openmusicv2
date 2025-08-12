// src/consumer.js
require('dotenv').config();

const amqp = require('amqplib');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const MailSender = require('./services/mail/MailSender');
const Listener = require('./listener');

const init = async () => {
  console.log('Starting OpenMusic Consumer...');
  
  try {
    // Initialize services
    const collaborationsService = new CollaborationsService();
    const playlistsService = new PlaylistsService(collaborationsService);
    const mailSender = new MailSender();
    const listener = new Listener(playlistsService, mailSender);

    // Connect to RabbitMQ dengan retry mechanism
    console.log('Connecting to RabbitMQ...');
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();

    await channel.assertQueue('export:playlist', {
      durable: true,
    });

    console.log('Consumer ready, waiting for messages...');
    
    // Set prefetch untuk membatasi pesan yang diproses bersamaan
    await channel.prefetch(1);
    
    channel.consume('export:playlist', listener.listen, { noAck: true });

    // Handle connection errors
    connection.on('error', (error) => {
      console.error('❌ RabbitMQ connection error:', error.message);
    });

    connection.on('close', () => {
      console.log('🔌 RabbitMQ connection closed');
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n📴 Received SIGINT, closing connections...');
      try {
        await channel.close();
        await connection.close();
        console.log('✅ Connections closed gracefully');
      } catch (error) {
        console.error('❌ Error closing connections:', error.message);
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start consumer:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔴 RabbitMQ Connection Failed!');
      console.error('Please make sure RabbitMQ server is running on:', process.env.RABBITMQ_SERVER);
      console.error('\nTo install RabbitMQ:');
      console.error('- Windows: Download from https://www.rabbitmq.com/install-windows.html');
      console.error('- Docker: docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management');
      console.error('- Linux: sudo apt-get install rabbitmq-server');
    }
    
    // Retry after delay untuk development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Retrying in 10 seconds...');
      setTimeout(init, 10000);
    } else {
      process.exit(1);
    }
  }
};

init();