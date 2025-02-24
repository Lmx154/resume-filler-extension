document.getElementById("extract-btn").addEventListener("click", async () => {
  try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      // Step 1: Extract full DOM (outerHTML)
      const results = await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => document.documentElement.outerHTML,
      });

      const domContent = results[0].result;
      console.log("Extracted DOM length:", domContent.length);

      // Step 2: Send DOM to backend /api/application/enhance
      const resumeResponse = await fetch('http://127.0.0.1:8000/api/resume/last_upload', { method: 'GET' });
      const resumeData = await resumeResponse.json();
      if (!resumeData.content) {
          throw new Error('No resume data available. Please upload a resume first.');
      }

      const enhanceResponse = await fetch("http://127.0.0.1:8000/api/application/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              enhancement_focus: "Clarity & Conciseness",
              resume_content: resumeData.content,
              application_content: domContent,
              industry_focus: "Technology",
              target_keywords: "software, developer",
              company_culture: "innovative",
              additional_info: {}
          }),
      });

      const enhanceData = await enhanceResponse.json();
      console.log("Response from FastAPI enhance:", enhanceData);

      // Step 3: Parse enhanced content into field-value-selector triples
      const fieldData = {};
      enhanceData.enhanced_content.split("\n").forEach(line => {
          const match = line.match(/(.+?):\s(.+?)(?:\s\[(.*?)\])?$/);
          if (match) {
              const field = match[1].trim();
              const value = match[2].trim();
              const selector = match[3] ? match[3].trim() : null;
              fieldData[field.toLowerCase()] = { value, selector };
          }
      });

      // Step 4: Inject script to fill fields using AI-provided selectors with fallbacks
      await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: (data) => {
              for (const [field, { value, selector }] of Object.entries(data)) {
                  let input;
                  if (selector) {
                      // Try the AI-provided selector first
                      input = document.querySelector(selector);
                      if (!input) {
                          // Fallback: Use generic selectors based on field name
                          input = document.querySelector(
                              `input[name="${field}"], input[placeholder*="${field}"], textarea[name="${field}"], textarea[placeholder*="${field}"]`
                          );
                      }
                  } else {
                      // If no selector provided, use generic selectors
                      input = document.querySelector(
                          `input[name="${field}"], input[placeholder*="${field}"], textarea[name="${field}"], textarea[placeholder*="${field}"]`
                      );
                  }

                  if (input) {
                      input.value = value;
                      // Simulate user input to trigger any event listeners
                      input.dispatchEvent(new Event('input'));
                      input.dispatchEvent(new Event('change'));
                  } else {
                      console.warn(`No input found for field: ${field}`);
                  }
              }
          },
          args: [fieldData],
      });

      window.close();
  } catch (error) {
      console.error("Error:", error);
      alert("Error processing data. Check console for details.");
  }
});