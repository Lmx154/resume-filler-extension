document.getElementById("extract-btn").addEventListener("click", async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
  
      const results = await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => document.body.innerText,
      });
  
      const extractedText = results[0].result;
      console.log("Extracted text length:", extractedText.length);
  
      const response = await fetch("http://127.0.0.1:8000/api/application/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ text: extractedText })
      });
  
      const data = await response.json();
      console.log("Response from FastAPI:", data);

      window.close();
    } catch (error) {
      console.error("Error:", error);
      alert("Error processing data. Check console for details.");
    }
});
