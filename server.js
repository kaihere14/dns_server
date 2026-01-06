const dns2 = require('dns2');
const ioredis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();

const { Packet } = dns2;
const redis = new ioredis({
  host:process.env.REDIS_HOST 
  ,port:process.env.REDIS_PORT
  ,password:process.env.REDIS_PASSWORD
  ,username:'default' 
});
redis.on('connect', () => {
  console.log('Connected to Redis');
});



const server = dns2.createServer({
  udp: true,
  handle: async (request, send) => {
  const response = Packet.createResponseFromRequest(request);
  const [question] = request.questions;
  const { name } = question;

  // Only serve your zone
  if (!name.endsWith(".pawpick.store")) {
    response.header.rcode = Packet.RCODE.REFUSED;
    return send(response);
  }

  try {
    const cached = await redis.get(name);

    if (!cached) {
      response.header.rcode = Packet.RCODE.NXDOMAIN;
      return send(response);
    }

    const record = JSON.parse(cached);

    if (record.type === "A") {
      response.answers.push({
        name,
        type: Packet.TYPE.A,
        class: Packet.CLASS.IN,
        ttl: record.ttl || 300,
        address: record.target,
      });
    }

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
      response.header.rcode = Packet.RCODE.NOTIMP;
    }

    send(response);
  } catch (err) {
    console.error("DNS error:", err);
    response.header.rcode = Packet.RCODE.SERVFAIL;
    send(response);
  }
}

});

server.on('request', (request, response, rinfo) => {
  console.log(request.header.id, request.questions[0]);
});



server.on('listening', () => {
  console.log(server.addresses());
});



server.listen({
  // Optionally specify port, address and/or the family of socket() for udp server:
  udp: { 
    port: 53,
    address: "0.0.0.0",
    type: "udp4",  // IPv4 or IPv6 (Must be either "udp4" or "udp6")
  },
  
});

