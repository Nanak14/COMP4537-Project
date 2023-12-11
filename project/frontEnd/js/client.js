function analyzeSentiment() {
    const inputText = document.getElementById('inputText').value;
  
    fetch('http://localhost:5001/sentiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: inputText }),
    })
      .then(response => response.json())
      .then(result => {
        // Process the sentiment result as usual
        const sentimentResult = result.label;
        document.getElementById('result').innerText = `Sentiment: ${sentimentResult}`;
      })
      .catch(error => {
        console.error('Error analyzing sentiment:', error);
        document.getElementById('result').innerText = 'Error analyzing sentiment';
      });
  }
  