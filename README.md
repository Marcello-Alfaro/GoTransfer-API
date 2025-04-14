## GoTransfer API

A scalable file-sharing web app built with Express.js.

### Features

- Memory-efficient file handling
- Download files via email links
- Supports transfers up to 10GB (or configurable via `.env`)
- Sends confirmation emails on file downloads
- Automatic file expiration after 7 days (configurable)
- Real-time progress tracking via WebSockets
- Scalable backend via a separate storage API

### Technologies Used

- Node.js (Express.js)
- MySQL + Sequelize
- WebSockets
- SendGrid
- dotenv

## Getting Started

### Prerequisites

- **Node.js v22+**
- **Relational Database** (e.g., MySQL, PostgreSQL)  
  This API uses Sequelize ORM, so most SQL-based databases are supported.

### Environment Variables

- `NODE_EV`: (e.g., `development`)
- `PORT`: Port number to run the server (e.g., `3000`)
- `LOGS_DESTINATION`: Leave blank "" if running in "development"
- `JWT_SECRET`: Jsonwebtoken secret string (e.g., `somesupersecretkey`)
- `API_URL`: Base URL of the main API (used by the front-end and storage API to communicate)
- `API_PATH`: Root path for API endpoints (e.g., `/api`)
- `ORIGIN_URL`: Frontend URL used for CORS validation (e.g., `http://localhost:1234`)
- `DB_HOST`: Database host (e.g., `localhost`)
- `DB_PORT`: Database port (e.g., `3306`)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `DB_DIALECT`: Database dialect (e.g., `mysql`)
- `SENDGRID_API_KEY`: API key for SendGrid email service
- `FROM_EMAIL`: Sender email address
- `FILE_WATCHER_INTERVAL`: Time in milliseconds for checking transfer expirations (e.g., `900000` for every 15 min)
- `TRANSFER_EXPIRE_TIME`: Custom number of days before a transfer expires
- `MAX_TRANSFER_SIZE`: Max allowed transfer size in bytes (e.g., `10737418240` for 10GB)

### API Endpoints

| Method | Route                        | Description                                                      |
| ------ | ---------------------------- | ---------------------------------------------------------------- |
| `GET`  | `/download/:token`           | Retrieves and downloads a transfer via unique token.             |
| `GET`  | `/upload/result/:transferId` | Returns the message if the upload succeded and sends the emails. |
| `POST` | `/upload/allocate-transfer`  | Allocates resources and returns a unique ID for a transfer.      |
| `PUT`  | `/upload/:transferId`        | Handles file uploads.                                            |

### How to Run

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up a .env file with the required variables.
4. Start the server: `npm run start:dev`

### Notes

This project was created as a free alternative to services like WeTransfer.
It allows larger file uploads, extended expiration times, and download confirmations
without requiring a paid subscription.

**⚠️ Disclaimer**: This project is intended for academic demonstration purposes only. Redistribution or commercial use is not permitted without prior permission.
