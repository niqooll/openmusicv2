#!/bin/bash

# Startup script untuk OpenMusic API v3

echo "Starting OpenMusic API v3..."

# Buat direktori uploads jika belum ada
echo "Setting up upload directories..."
npm run setup

# Jalankan migrasi database
echo "Running database migrations..."
npm run migrate:up

# Start server dan consumer secara bersamaan
echo "Starting server and consumer..."

# Jalankan server di background
npm run start:prod &
SERVER_PID=$!

# Jalankan consumer di background
npm run start:consumer:prod &
CONSUMER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Consumer started with PID: $CONSUMER_PID"

# Cleanup function
cleanup() {
    echo "Stopping OpenMusic API v3..."
    kill $SERVER_PID $CONSUMER_PID
    wait $SERVER_PID $CONSUMER_PID
    echo "Stopped."
}

# Set trap untuk cleanup saat script dihentikan
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $SERVER_PID $CONSUMER_PID