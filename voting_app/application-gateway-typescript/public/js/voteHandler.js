

document.addEventListener('DOMContentLoaded', (event) => {
    const voteForm = document.getElementById('voteForm');

    voteForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission

        const formData = new FormData(voteForm);
        const sessionID = formData.get('sessionID');
        const votedOptionID = formData.get('votedOptionID');
        // const votedOptionName = formData.get('votedOptionName');

        console.log("read sessonID:", sessionID, "votedOption ID: ", votedOptionID);
        // Use Fetch API to send the vote to your server
        fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'sessionID': sessionID,
                'votedOptionID': votedOptionID,
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch((error) => {
            console.error('Error submitting vote:', error);
            // Handle errors, e.g., display an error message
        });

        //-------------------Update Vote Count------------------
        // Select the element containing the vote count for this option
        const voteCountElement = document.getElementById(`optionVotes-${votedOptionID}`);

        if (voteCountElement) {
            // Assuming the text is in the format: "Option Name gets X votes."
            // Extract the current vote count using a regular expression
            const matches = voteCountElement.textContent.match(/(\d+) votes/);
            
            if (matches && matches.length > 1) {
                // Parse the current vote count, add one, and update the element's text
                let currentVoteCount = parseInt(matches[1], 10);
                // We assume the option name and the text structure remains constant
                // Update only the vote count part of the text
                voteCountElement.textContent = voteCountElement.textContent.replace(/\d+ votes/, `${currentVoteCount + 1} votes`);
            }
        }


        //-------------------Update Vote timeline------------------
        // Select the last <p> element within voteDetails
        const lastVoteParagraph = document.querySelector('#voteDetails p:last-child');

        let lastVoteID = "V0S0"; // Default if no last vote exists
        if (lastVoteParagraph) {
            const lastVoteText = lastVoteParagraph.textContent;
            const match = lastVoteText.match(/Vote ID: (V(\d+)S\d+)/);

            if (match) {
                const lastVoteNumber = parseInt(match[2], 10);
                const sessionID = match[1].slice(match[1].indexOf("S")); // Extracts "S0" from "V3S0"
                const newVoteNumber = lastVoteNumber + 1;
                lastVoteID = `V${newVoteNumber}${sessionID}`;
            }
            const voteCountElement = document.getElementById(`voteDetails`);
                        // Add session details
            const voteDetailDiv = document.createElement('p');
            voteDetailDiv.innerHTML = `Vote ID: ${lastVoteID}, Option: ${votedOptionID}, TimeStamp: ${new Date(Date.now()).toLocaleString()}`;
            voteCountElement.appendChild(voteDetailDiv);
        }


    });


});
