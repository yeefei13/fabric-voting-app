/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

@Object()
export class Vote {
    @Property()
    public votedOption: string;

    @Property()
    public voteTimeStamp: string;

    @Property()
    public sessionID: string;

    @Property()
    public voteID: string;

    @Property()
    public type: string; 
}

@Object()
export class VotingSession {
    @Property()
    public sessionID: string; // Unique identifier for the voting session

    @Property()
    public sessionName: string; 

    @Property()
    public sessionInformation: string; // Description or details about the voting session

    @Property()
    public startTime: string; // Start time of the voting session

    @Property()
    public endTime: string; // End time of the voting session

    @Property()
    public status: string; // Status of the voting session (e.g., "upcoming", "open", "closed", "archived")

    @Property()
    public options: Option[]; 

    @Property()
    public type: string; 
}

@Object()
export class Option {
  @Property()
  public optionID: string;

  @Property()
  public optionName: string;

  @Property()
  public numVote: number;


}