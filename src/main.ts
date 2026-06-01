import { AppComponent } from "./app/app.component";
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { enableProdMode } from "@angular/core";
import { environment } from "../environments/environment";

// bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));

if (environment.production) {
  enableProdMode();
  // removes all console.log
  window.console.log = function () {};
  window.console.warn = function () {};
}
// if (environmentProduction.production) {
//   enableProdMode();
//   // removes all console.log
//   window.console.log = function () {};
//   window.console.warn = function () {};
// }

// Load ReCAPTCHA script dynamically
function loadReCaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(environment.scriptFile);
    if (existingScript) {
      resolve(); // Script is already loaded
      return;
    }

    const script = document.createElement("script");
    script.src = environment.recaptchaSiteKeyWithURL;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = (error) => reject(error);

    document.head.appendChild(script);
  });
}

function loadGtagScript(): void {
  const script = document.createElement("script");
  script.src = environment.gtagURL;
  script.async = true;
  document.body.appendChild(script);
}

function loadDataLayerScript(): void {
  const dataLayerScript = document.createElement("script");
  dataLayerScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${environment.gtagKey}');`;
  document.body.appendChild(dataLayerScript);
}

loadGtagScript();
loadDataLayerScript();

// Wait for the script to load before bootstrapping the application
loadReCaptchaScript()
  .then(() => {
    bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
  })
  .catch((error) => {
    console.error("Failed to load ReCAPTCHA script:", error);
  });
async function loadUserActivityScript(): Promise<void> {
  if ((environment as any).activityScriptPath) {
    const activityScriptPath = (environment as any).activityScriptPath;

    try {
      const response = await fetch(activityScriptPath);

      if (!response.ok) {
        console.warn(`Activity script not found: ${activityScriptPath}`);

        return;
      }

      const scriptContent = await response.text();

      const dataLayerScript = document.createElement("script");

      dataLayerScript.type = "text/javascript";

      const blob = new Blob([scriptContent], { type: "application/javascript" });
      dataLayerScript.src = URL.createObjectURL(blob);

      document.body.appendChild(dataLayerScript);
    } catch (error) {
      console.error("Error fetching the activity script:", error);
    }
  }
}

loadUserActivityScript();
