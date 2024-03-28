#!/bin/bash

# Navigate to the test-network directory
cd test-network

# Take down the network if it's up
./network.sh down

# Bring up the network and create a channel
./network.sh up createChannel -c mychannel -ca

# Deploy the chaincode
./network.sh deployCC -ccn basic -ccp ../voting_app/chaincode-typescript/ -ccl typescript

# Navigate back and into the voting_app application directory
cd ../voting_app/application-gateway-typescript

# Install npm dependencies
npm install

# Start the application
npm start

