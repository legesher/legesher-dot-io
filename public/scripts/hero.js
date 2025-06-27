const languages = ["English", "عربي", "Español", "日本語", "한국어", "हिन्दी", "Français"];
const languageElement = document.querySelector('.language-cycler') as HTMLElement;
let currentIndex = 0;

async function typeText(element: HTMLElement, text: string) {
  // Keep the element's width consistent by using a non-breaking space
  element.textContent = '\u00A0';

  // Type the text with variable timing for more natural feel
  for (let i = 0; i < text.length; i++) {
    element.textContent = text.substring(0, i + 1);
    // Random delay between 50ms and 150ms for more natural typing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  // Wait before erasing
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Erase the text with variable timing
  for (let i = text.length; i > 0; i--) {
    element.textContent = text.substring(0, i - 1) + '\u00A0';
    // Random delay between 30ms and 80ms for more natural erasing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 30));
  }
}

async function updateLanguage() {
  if (languageElement) {
    await typeText(languageElement, languages[currentIndex]);
    currentIndex = (currentIndex + 1) % languages.length;
  }
}

// Initial update
updateLanguage();

// Update every 5 seconds (giving more time for the complete animation)
setInterval(updateLanguage, 5000);