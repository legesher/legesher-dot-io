const heroLanguages = ["English", "عربي", "Español", "日本語", "한국어", "हिन्दी", "Français"];
const languageElement = document.querySelector('.language-cycler');
let heroCurrentIndex = 0;

async function typeText(element, text) {
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
    await typeText(languageElement, heroLanguages[heroCurrentIndex]);
    heroCurrentIndex = (heroCurrentIndex + 1) % heroLanguages.length;
  }
}

// Set the initial language immediately
if (languageElement) {
  languageElement.textContent = heroLanguages[heroCurrentIndex];
}

// Initial update
updateLanguage();

// Update every 2 seconds (quicker animation)
setInterval(updateLanguage, 2000);