# dns_server

Minimal Node.js DNS server

## Overview

A small DNS server implemented in Node.js. The entry point is [server.js](server.js).

## Requirements

- Node.js 14+ (LTS recommended)

## Install

From the project root (where [package.json](package.json) lives):

```bash
npm install
```

## Run

Start the server using the npm script:

```bash
npm start
# or directly
node server.js
```

## Configuration

This project uses environment variables loaded via `dotenv`. Create a `.env` file if needed (see `server.js` for expected variables).

## Dependencies

See `package.json` for full dependency list. Key packages:

- `dns2` — DNS server utilities
- `dotenv` — environment variable loading
- `ioredis` — Redis client

## Files

- [server.js](server.js): main server file
- [package.json](package.json): npm scripts and dependencies

## License

ISC
