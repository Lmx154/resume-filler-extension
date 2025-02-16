document.getElementById("extract-btn").addEventListener("click", async () => {
    // Query the active tab in the current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject a script to extract all text from the page
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    }, async (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      const extractedText = results[0].result;
      console.log("Extracted text length:", extractedText.length);
  
      // Send the extracted text to the FastAPI server as JSON
      try {
        const response = await fetch("http://127.0.0.1:5000/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: extractedText })
        });
        const data = await response.json();
        console.log("Response from FastAPI:", data);
        alert("Data sent successfully!");
      } catch (error) {
        console.error("Error sending data:", error);
        alert("Error sending data to FastAPI server.");
      }
    });
  });
  