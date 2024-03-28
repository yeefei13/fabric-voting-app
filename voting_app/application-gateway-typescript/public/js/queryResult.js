document.addEventListener('DOMContentLoaded',function(){
    const form = document.getElementById('sessionCreation');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Collecting form values
        const sessionNameValue = document.getElementById('sessionName').value;
        const sessionInfoValue = document.getElementById('sessionInfo').value || "No Info Provided";
        const startDateValue = document.getElementById('startDate').value;
        const endDateValue = document.getElementById('endDate').value;
        

        const optionInputsContainer = document.getElementById('optionInputsContainer');
        const inputElements = optionInputsContainer.getElementsByTagName('input'); // Or use .querySelectorAll('input') for more complex selectors
        let optionNames = ``;
        
        for (let i = 0; i < inputElements.length; i++) {
            // Append the input value to the string, followed by a comma
            optionNames += inputElements[i].value;
            
            // Add a comma after each value except the last one
            if (i < inputElements.length - 1) {
                optionNames += `,`;
            }
        }

        const optionCount = optionNames.length;
        
        console.log(optionNames);
        
        const allInfo={
            sessionName: sessionNameValue,
            sessionInfo: sessionInfoValue,
            startDate: startDateValue,
            endDate: endDateValue,
            numOptions: optionCount,
            options:optionNames,

        }
        console.log(allInfo);

        fetch(`/api/CreateSession`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Set the Content-Type to application/json
            },
            body: JSON.stringify(allInfo),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => { 
            console.log(data);  
        })
        .catch(error => console.error('Error:', error));
        



    });
});

// script.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('queryForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevents the form from submitting traditionally

        // const query = document.getElementById('queryInput').value;
        const query = document.getElementById('queryInput').value || '';
        fetch(`/api/query?search=${encodeURIComponent(query)}`, {
            method: 'GET',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {   
            displayResults(data);
        })
        .catch(error => console.error('Error:', error));
    });

    function displayResults(sessions) {
        console.log('printing results now',sessions)
        const resultsContainer = document.getElementById('queryResults');
        resultsContainer.innerHTML = ''; // Clear previous results
    
        // Iterate over each session
        sessions.forEach(session=> {
            // Create the container for this session
            const sessionDiv = document.createElement('div');
            sessionDiv.classList.add('session-details');
            
            const buttonId = `detailsButton-${session.sessionID}`;
            // Add session details
            sessionDiv.innerHTML = `
                <h2>${session.sessionName}</h2>
                <p><strong>Information:</strong> ${session.sessionInformation}</p>
                <p><strong>Status:</strong> ${session.status}</p>
                <p><strong>Start Time:</strong> ${session.startTime}</p>
                <p><strong>End Time:</strong> ${session.endTime}</p>
                <p><strong>Session ID:</strong> ${session.sessionID}</p>
                <button id="${buttonId}">More Details</button>
            `;
    
            // Append the session div to the results container
            resultsContainer.appendChild(sessionDiv);

            // Add click event listener to the More Details button
            document.getElementById(buttonId).addEventListener('click', () => {
                // Redirect to a new page for displaying session details
                // Assuming you have a route like '/session-details/:id' where :id is the session ID
                // Replace `session.id` with the appropriate property that uniquely identifies the session
                window.location.href = `/session-details/${session.sessionID}`;
            });
        });
    }
});



const sessionInfo = document.getElementById('sessionInfo');

sessionInfo.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});


document.getElementById('optionCountSlider').addEventListener('input', function() {
    const countDisplay = document.getElementById('optionCountDisplay');
    countDisplay.textContent = this.value;
});
document.getElementById('editOptionButton').addEventListener('click', function(event) {
    event.preventDefault(); // This line prevents the form from being submitted.
    
    const optionCount = parseInt(document.getElementById('optionCountSlider').value, 10);
    const container = document.getElementById('optionInputsContainer');
    
    // Clear existing inputs
    container.innerHTML = '';
    
    // Create new inputs
    for (let i = 1; i <= optionCount; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id=`option_${i}`
        input.placeholder = `Option ${i} Name`;
        input.name = `option${i}`;
        const linebreak=document.createElement('p');
        container.appendChild(input);
        container.appendChild(linebreak);
    }
});


