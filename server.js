const dns2 = require("dns2");
const Redis = require("ioredis");
require("dotenv").config();

const { Packet } = dns2;

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  username: "default",
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

const server = dns2.createServer({
  udp: true,

  handle: async (request, send) => {
    const response = Packet.createResponseFromRequest(request);
    const [question] = request.questions;
    const name = question.name;

    // Only answer for your domain
    if (!name.endsWith("pawpick.store")) {
      response.header.rcode = 5; // REFUSED
      return send(response);
    }

    const cached = await redis.get(name);

    if (!cached) {
      response.header.rcode = 3; // NXDOMAIN
      return send(response);
    }

    const record = JSON.parse(cached);

    // A record
    if (record.type === "A") {
      response.answers.push({
        name,
        type: Packet.TYPE.A,
        class: Packet.CLASS.IN,
        ttl: record.ttl || 300,
        address: record.target,
      });
    }

    // CNAME record
    else if (record.type === "CNAME") {
      response.answers.push({
        name,
        type: Packet.TYPE.CNAME,
        class: Packet.CLASS.IN,
        ttl: record.ttl || 300,
        domain: record.target,
      });
    }

    else {
      response.header.rcode = 4; // NOTIMP
    }

    send(response);
  },
});

server.on("listening", () => {
  console.log(server.addresses());
});

server.listen({
  udp: {
    port: 53,
    address: "0.0.0.0",
    type: "udp4",
  },
});
