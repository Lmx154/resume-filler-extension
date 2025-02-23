document.getElementById("extract-btn").addEventListener("click", async () => {
  try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      // Step 1: Extract full DOM (outerHTML) instead of just innerText
      const results = await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => document.documentElement.outerHTML,
      });

      const domContent = results[0].result;
      console.log("Extracted DOM length:", domContent.length);

      // Step 2: Send DOM to backend /api/application/enhance
      // Assume resume content is stored locally or fetched from your app state (you’ll need to handle this)
      const resumeResponse = await fetch('http://127.0.0.1:8000/api/resume/last_upload', { method: 'GET' });
      const resumeData = await resumeResponse.json();
      if (!resumeData.content) {
          throw new Error('No resume data available. Please upload a resume first.');
      }

      const enhanceResponse = await fetch("http://127.0.0.1:8000/api/application/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              enhancement_focus: "Clarity & Conciseness", // Default or fetch from UI if needed
              resume_content: resumeData.content,
              application_content: domContent, // Use DOM instead of text
              industry_focus: "Technology", // Default or fetch from UI
              target_keywords: "software, developer", // Default or fetch from UI
              company_culture: "innovative", // Default or fetch from UI
              additional_info: {} // Default or fetch from UI if needed
          }),
      });

      const enhanceData = await enhanceResponse.json();
      console.log("Response from FastAPI enhance:", enhanceData);

      // Step 3: Parse enhanced content into key-value pairs
      const fieldValues = {};
      enhanceData.enhanced_content.split("\n").forEach(line => {
          const [field, value] = line.split(": ");
          if (field && value) fieldValues[field.toLowerCase()] = value;
      });

      // Step 4: Inject script to fill fields based on AI-identified selectors
      await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: (values) => {
              const fieldMappings = {}; // AI will infer mappings in the backend
              for (const [field, value] of Object.entries(values)) {
                  // Use a generic selector or rely on AI-provided mappings (if added to response)
                  const input = document.querySelector(`input[name="${field}"], input[placeholder*="${field}"], textarea[name="${field}"]`);
                  if (input) input.value = value;
              }
          },
          args: [fieldValues],
      });

      window.close();
  } catch (error) {
      console.error("Error:", error);
      alert("Error processing data. Check console for details.");
  }
});