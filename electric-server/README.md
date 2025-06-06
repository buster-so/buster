# Electric SQL Server

This directory contains the Electric SQL server configuration and setup for local development.

## Overview

Electric SQL is a local-first sync platform that enables real-time synchronization between client applications and PostgreSQL databases. This server handles the synchronization layer, providing conflict-free replication and offline-first capabilities.

## Local Development

The Electric SQL server runs locally on port **3003**.

### Getting Started

1. Ensure you have the Electric SQL server installed and configured
2. Start the server to begin syncing data between your local database and client applications
3. The server will be accessible at `http://localhost:3003`

## Features

- **Real-time sync**: Bidirectional synchronization between client and server
- **Offline-first**: Applications work seamlessly without internet connectivity
- **Conflict resolution**: Automatic handling of concurrent data modifications
- **PostgreSQL integration**: Direct integration with your existing PostgreSQL database

## Configuration

Server configuration and environment variables should be set up according to your project's specific requirements. Refer to the Electric SQL documentation for detailed configuration options.

## Documentation

For more information about Electric SQL, visit the [official documentation](https://electric-sql.com/docs).
