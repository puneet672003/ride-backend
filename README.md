# Ride Backend

This is the backend service for the Ride application, built using Node.js, Express.js, and MongoDB.

## Requirements

- Node.js >= 18.x
- pnpm >= 8.x

## Installation

```bash
pnpm install
```

## Running the Application

```bash
pnpm run start
```

This command starts the development server using `nodemon` and runs `src/app.js`.

## Running Tests

```bash
pnpm test
```

The test suite uses `supertest` and `mongodb-memory-server` to run integration tests against an in-memory MongoDB instance.

## Environment Variables

Create a `.env` file in the root directory and define `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`