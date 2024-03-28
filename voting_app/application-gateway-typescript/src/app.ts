/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));

// Path to user certificate directory.
const certDirectoryPath = envOrDefault('CERT_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts'));

// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();
const voteID = `10012`;
const timeStamp=`${new Date(Date.now()).toLocaleString()}`


import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());
const port = 3000;

app.set('view engine', 'ejs');

// Make sure the views directory is correctly set up
app.set('views', './views');

app.get('/', (req: Request, res: Response) => {
    res.render('index', {
        // Your variables for the view can be passed here
    });
});


interface Option {
    optionID: string;
    optionName: string;
    numVote: number;
  }
  
interface VotingSession {
    sessionID: string;
    sessionName: string;
    sessionInformation: string;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
    options: Option[];
  }
  
interface Vote {
    type: string;
    voteID: string;
    votedOption:string;
    sessionID: string;
    voteTimeStamp: string;
    // Add other properties as needed for votes
}


type VoteResult = VotingSession | Vote;
import { Gateway, Network } from '@hyperledger/fabric-gateway';

let gateway: Gateway ;
let network: Network ;
let contract: Contract ;


async function initHyperledgerConnection(): Promise<void> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    const client = new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });

    gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
    });

    network = await gateway.getNetwork(channelName);
    contract = network.getContract(chaincodeName);
}


async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function getFirstDirFileName(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath);
    return path.join(dirPath, files[0]);
}

async function newSigner(): Promise<Signer> {
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function initLedger(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
    const result = await queryAllVotes(contract);
    console.log("HERE!!!");
    // Assuming an empty ledger results in an empty array, adjust the check accordingly.
    if (result && result.length === 0) {
        await contract.submitTransaction('InitLedger');
    }

    console.log('*** Transaction committed successfully');
}


//queryAllVotes
async function queryAllVotes(contract: Contract): Promise<any[]> {
    console.log('\n--> Evaluate Transaction: GetAllAssets');

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** All Votes Result:', result);
    return result;
}
async function queryByID(contract: Contract,sessionID:string,type:string): Promise<void> {
    console.log('\n--> Query vote given session ID');

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');
    const resultJson = utf8Decoder.decode(resultBytes);
    let results = JSON.parse(resultJson);
    if (sessionID == 'all'){
        results = results.filter((result: VoteResult) => result.type === type );
    }
    else{
        results = results.filter((result: VoteResult) => result.type === type && result.sessionID === sessionID);
    }
    console.log('*** All Votes Result:', results);
    return results
}
/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createVote(contract: Contract,  sessionID: string, voteTimeStamp: string, votedOption: string): Promise<string> {
    console.log('\n--> Submit Transaction: CreateVote');
    const votes = JSON.parse(JSON.stringify(await queryByID(contract,sessionID,'vote')));
    console.log('submitting vote',`V${votes.length}${sessionID}` ); 
    const newVoteID = `V${votes.length}${sessionID}`;

    await contract.submitTransaction('CreateVote', newVoteID, sessionID, voteTimeStamp, votedOption.toString());
    console.log(`*** Vote ${newVoteID} created successfully`);
    return voteID;
}

async function createSession(contract: Contract, sessionName: string, sessionInformation: string, startTime: string,
    endTime: string, options: string): Promise<string> {
    console.log('\n--> Submit Transaction: CreateSession');
    const sessions = JSON.parse(JSON.stringify(await queryByID(contract, 'all', 'session')));
    console.log('Submitting session', `S${sessions.length}`);
    const newSessionID = `S${sessions.length}`;
    console.log(options);
    
    await contract.submitTransaction('CreateSession', newSessionID, sessionName, sessionInformation, startTime, endTime, options);
    console.log(`*** Session ${newSessionID} created successfully`);
    return newSessionID;
}



async function updateOption(contract: Contract, sessionID:string, optionID: string): Promise<void> {
    console.log('\n--> Submit Transaction: update session option number');
    let curSess=JSON.parse(JSON.stringify(await queryByID(contract,sessionID,'session')));
    console.log("Updating option: ",optionID)
    curSess.forEach((session: VotingSession) => {
        console.log(`Session ID: ${session.sessionID}`);
        session.options.forEach((option, index) => {
          console.log(`Option ${index}:`, option);

        });
      });

    curSess.forEach((session: VotingSession) => {
        console.log(`Session ID: ${session.sessionID}`);
        console.log(session.options[parseInt(optionID)],"should be updated");
        session.options[parseInt(optionID)].numVote=session.options[parseInt(optionID)].numVote+1;
      });


      curSess.forEach((session: VotingSession) => {
        console.log(`Session ID: ${session.sessionID}`);
        session.options.forEach((option, index) => {
          console.log(`Option ${index}:`, option);

        });
      });

      await contract.submitTransaction(
        'UpdateSession',
        sessionID,
        curSess[0].status,
        curSess[0].sessionName,
        curSess[0].endTime,
        curSess[0].sessionInformation,
        JSON.stringify(curSess[0].options) // Serialize the options array
    );
    console.log(`*** Session ${sessionID} updated`);
}
/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters(): Promise<void> {
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certDirectoryPath: ${certDirectoryPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}



// Set EJS as templating engine
app.set('view engine', 'ejs');

// Needed to parse the body of POST requests
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Display a form to the user
app.get('/', (req, res) => {
    res.render('index'); // Ensure you have an 'index.ejs' file in your 'views' directory
});

// Process the form and display votes
app.get('/api/query', async (req, res) => {
    try{
        const sessionID = String(req.query.search || 'all'); // Assuming your form has an input with name='sessionID'
        console.log(`querying ${sessionID}`);
        
        const sessions = await queryByID(contract,sessionID,'session');
        console.log('*** Find', sessions);
        res.json(sessions);
    }catch (error) {
        console.error('Error querying sessions:', error);
        res.status(500).send('Server error while querying sessions.');
    }
});

// Process the form and display votes
app.post('/api/vote', async (req, res) => {
    try{
        const sessionID = String(req.body.sessionID);
        const option = String(req.body.votedOptionID);

        const newVoteID = createVote(contract,sessionID,String(new Date(Date.now()).toLocaleString()),option);
        updateOption(contract, sessionID, option)

        console.log('submitted vote',newVoteID ); 
        res.status(200).json({voteID:newVoteID, message: 'Vote successfully submitted' });
        // console.log("session becomes ",JSON.parse(JSON.stringify(await queryByID(contract,sessionID,'session'))));

    }catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).send('Server error while querying sessions.');
    }
});

app.post('/api/CreateSession',async (req, res) => {
    const allInfo = req.body;
    console.log("get ",allInfo," in the API");
    console.log("get ",allInfo.options," in the API");
    const newSessionID = createSession(contract,allInfo.sessionName, allInfo.sessionInfo, allInfo.startDate,
        allInfo.endDate, allInfo.options);

    res.status(200).json( {newSessionID:newSessionID,message: 'Session successfully submitted'});

});

app.get('/session-details/:sessionID', async (req, res) => {
    const { sessionID } = req.params;

    // Fetch the session details from wherever they're stored.
    // This could involve calling a function similar to 'queryByID' or another database query.
    // For demonstration, let's assume you have a function 'getSessionDetailsByID' defined somewhere that does this.
    try {
        const sessionDetails = await queryByID(contract,sessionID,'session');
        const voteDetails = await queryByID(contract,sessionID,'vote');

        console.log("votedetails",voteDetails);
        // Render an EJS template with the session details
        // Assuming you have a 'session-details.ejs' template set up for this purpose
        res.render('session-details', {sessions: sessionDetails, votes: voteDetails});
    } catch (error) {   
        console.error('Error fetching session details:', error);
        res.status(500).send('Internal Server Error');
    }
});


async function startServer() {
    await initHyperledgerConnection(); // Initialize connection
    await initLedger(contract);
    await queryAllVotes(contract);
    // await createSession(contract, "Big Election2!!","NOsdadsaOO", `${Date.now()}`,"tmr", `sally,lisa`);
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer().catch(console.error);

process.on('exit', () => {
    console.log('Closing gateway...');
    if (gateway) {
        gateway.close();
    }
});