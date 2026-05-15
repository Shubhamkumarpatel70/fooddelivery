#!/bin/bash

echo "Starting Swiggy Clone Application..."
echo ""

# Check if MongoDB is running (optional check)
# You can uncomment this if you want to check MongoDB
# if ! pgrep -x "mongod" > /dev/null; then
#     echo "Warning: MongoDB doesn't seem to be running"
#     echo "Please start MongoDB before running the application"
# fi

echo "Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

sleep 3

echo "Starting Frontend Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

