const amqp = require('amqplib');

const ConsumerService = {
  consumeMessage: async (queue, callback) => {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });
    await channel.consume(queue, callback, { noAck: true });
  },
};

module.exports = ConsumerService;