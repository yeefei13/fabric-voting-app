/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Vote, VotingSession,Option} from './asset';

@Info({title: 'AssetTransfer', description: 'Smart contract for trading assets'})
export class AssetTransferContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const votes: Vote[] = [
            {
                voteID: 'V0S0',
                votedOption: '0',
                voteTimeStamp: "2022-03-15T12:00:00Z",
                sessionID: 'S0',
                type:'vote',
            },
            {
                voteID: 'V1S0',
                votedOption: '1',
                voteTimeStamp: "2022-03-15T12:05:00Z",
                sessionID: 'S0',
                type:'vote',

            },
            {
                voteID: 'V0S1',
                votedOption: '0',
                voteTimeStamp: "2022-03-15T12:10:00Z",
                sessionID: "S1",
                type:'vote',
            },
        ];
        
        const votingSessions: VotingSession[] = [
            {
                sessionID: "S0",
                sessionName: "Class President Election",
                startTime: "2022-03-15T10:00:00Z",
                endTime: "2022-03-15T15:00:00Z",
                status: "closed",
                sessionInformation: "Choose your class president. option1: flyfly, option2: Maya",
                options: [
                {
                    optionID: "0",
                    optionName: "flyfly",
                    numVote: 1,
                },
                {
                    optionID: "1",
                    optionName: "Maya",
                    numVote: 1,
                }
            ],
                type:'session',

            },
            {
                sessionID: "S1",
                sessionName: "Student Council Election",
                startTime: "2022-03-16T09:00:00Z",
                endTime: "2022-03-16T14:00:00Z",
                status: "open",
                sessionInformation: "Vote for the Student Council Treasurer, option 1: Amy W, option 2: John D, option 3: Claire A.",
                options: [ // Adjusted to be an array of `Option` objects
                {
                    optionID: "0",
                    optionName: "Amy W",
                    numVote: 1, // Placeholder value, adjust as needed
                },
                {
                    optionID: "1",
                    optionName: "John D",
                    numVote: 0, // Placeholder value, adjust as needed
                },
                {
                    optionID: "2",
                    optionName: "Claire A",
                    numVote: 0, // Placeholder value, adjust as needed
                }
            ],
                type:'session',
            },
        ];
        


        for (const vote of votes) {
            // votes.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(vote.voteID, Buffer.from(stringify(sortKeysRecursive(vote))));
            console.info(`Vote ${vote.voteID} for session ${vote.sessionID} initialized`);
        }
        for (const sess of votingSessions) {
            // votes.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(sess.sessionID, Buffer.from(stringify(sortKeysRecursive(sess))));
            console.info(`Session ${sess.sessionID} initialized`);
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    @Transaction()
    public async CreateVote(ctx: Context, voteID: string, sessionID: string, voteTimeStamp:string, votedOption:string): Promise<void> {
        const exists = await this.VoteExists(ctx, voteID);
        if (exists) {
            throw new Error(`The vote ${voteID} for session ${sessionID} already exists`);
        }

        const asset = {
            voteID:voteID,
            sessionID:sessionID,
            voteTimeStamp:voteTimeStamp,
            votedOption:votedOption,
            type:'vote',
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(voteID, Buffer.from(stringify(sortKeysRecursive(asset))));
    }
    public async createOptionList(optionNames: string): Promise<{ optionID: string, optionName: string, numVote: number }[]> {
        // throw new Error(`Received optionNames: ${optionNames}`); // Add this line to log the input
        const options = optionNames.split(',');

        const optionList = [];
    
        for (let index = 0; index < options.length; index++) {
            const name = options[index].trim(); // Trim whitespace from the option name
            const optionID = (index).toString();
            optionList.push({ optionID: optionID, optionName: name, numVote: 0 });
        }
    
        // This line is for debugging; remove or comment out in production code
        // throw new Error(`parsed options: ${JSON.stringify(options)}, option length: ${options.length}, optionList ${JSON.stringify(optionList)}`);
        return optionList;
    }
    
    @Transaction() 
    public async CreateSession(ctx: Context, sessionID: string, sessionName: string, sessionInformation: string, startTime: string,
        endTime: string, optionsJSON: string): Promise<void> {
        const exists = await this.SessionExists(ctx, sessionID);
        if (exists) {
            throw new Error(`session ${sessionID} already exists`);
        }   

        const optionList= await this.createOptionList(optionsJSON);
        // throw new Error(`session ${optionsJSON} passed in, ${optionList} created!!!`);

        const asset = {
            sessionID: sessionID,
            sessionName: sessionName,
            startTime: startTime,
            endTime: endTime,
            status: "open",
            sessionInformation: sessionInformation,
            options: optionList, // Now options is an array of strings
            type: "session",
        };

        console.log(`Creating session ${asset}`);

        // Insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(sessionID, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadVote(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The vote ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // ReadAsset returns the asset stored in the world state with given id.
    @Transaction(false)
    public async ReadSession(ctx: Context, id: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The session ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    @Transaction()
    public async UpdateVote(ctx: Context, id: string, option: string): Promise<void> {
        const exists = await this.VoteExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        const assetAsBytes = await ctx.stub.getState(id); // get the asset from chaincode state as bytes
        if (!assetAsBytes || assetAsBytes.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        
        const oldAsset = JSON.parse(assetAsBytes.toString()); // Deserialize the byte array to object
        
        // Overwriting original asset with new asset
        const updatedAsset = {
            voteID: oldAsset.voteID,
            sessionID: oldAsset.sessionID,
            voteTimeStamp: `${Date.now()}`,
            votedOption: option,
        };
        
        // Insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }


    @Transaction()
    public async UpdateSession(ctx: Context, id: string, 
        status: string, sessionName:string, endTime: string,sessionInformation:string,
        optionsSerialized: string): Promise<void> {
        const exists = await this.SessionExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
    
        const assetAsBytes = await ctx.stub.getState(id);
        if (!assetAsBytes || assetAsBytes.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
    
        const oldAsset = JSON.parse(assetAsBytes.toString());
    
        // Deserialize the options string back into an array of objects
        const options: Option[] = JSON.parse(optionsSerialized);
    
        const updatedAsset = {
            sessionID: oldAsset.sessionID,
            sessionName: sessionName,
            startTime: oldAsset.startTime,
            endTime: endTime,
            status: status,
            sessionInformation: sessionInformation,
            options: options, // Now this is the parsed array of objects
            type:'session',
        };
        console.log("updated session looks like: ",updatedAsset);
        // Insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(oldAsset.sessionID, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    @Transaction()
    public async DeleteVote(ctx: Context, id: string): Promise<void> {
        const exists = await this.VoteExists(ctx, id);
        if (!exists) {
            throw new Error(`The vote ${id[0]} for session ${id[1]} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async VoteExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // AssetExists returns true when asset with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async SessionExists(ctx: Context, id: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // GetAllAssets returns all assets found in the world state.
    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}





