const form = document.querySelector("#interest-form");
const formStatus = document.querySelector("#form-status");
const successCard = document.querySelector("#success-card");
const successMessage = document.querySelector("#success-message");
const submitButton = form.querySelector('button[type="submit"]');
const cuisineError = document.querySelector("#cuisine-error");
const ideas = form.elements.ideas;
const ideasCount = document.querySelector("#ideas-count");
const newSubmissionButton = document.querySelector("#new-submission");
const config = window.VENDEGCHEF_CONFIG ?? { demoMode: true, submissionEndpoint: "" };

const importanceLabels = {
  1: "Nem számít",
  2: "Kevésbé fontos",
  3: "Jó, ha van",
  4: "Fontos",
  5: "Kiemelten fontos",
};

const spiceLabels = {
  1: "Egyáltalán nem",
  2: "Enyhén",
  3: "Közepesen",
  4: "Csípősen",
  5: "Nagyon csípősen",
};

document.querySelector("#year").textContent = new Date().getFullYear();
document.querySelectorAll('input[type="range"]').forEach(initializeRange);

ideas.addEventListener("input", () => {
  ideasCount.textContent = ideas.value.length;
});

form.addEventListener("change", (event) => {
  if (event.target.name === "cuisines") validateCuisines();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  if (!form.checkValidity() || !validateCuisines()) {
    form.reportValidity();
    showStatus("Kérjük, ellenőrizd a kiemelt mezőket.");
    return;
  }

  const data = new FormData(form);
  if (data.get("website")) {
    showSuccess(false);
    return;
  }

  const payload = {
    name: clean(data.get("name")),
    email: clean(data.get("email")),
    location: clean(data.get("location")),
    peopleCount: Number(data.get("peopleCount")),
    portionSize: clean(data.get("portionSize")),
    priceBracket: clean(data.get("priceBracket")),
    orderFrequency: clean(data.get("orderFrequency")),
    cuisines: data.getAll("cuisines").map(clean),
    dislikedFoods: clean(data.get("dislikedFoods")),
    allergies: clean(data.get("allergies")),
    spiceTolerance: Number(data.get("spiceTolerance")),
    priorities: {
      ingredientQuality: Number(data.get("importanceIngredients")),
      nutritionBalance: Number(data.get("importanceNutrition")),
      packagingQuality: Number(data.get("importancePackaging")),
      finishAtHomeKit: Number(data.get("importanceKit")),
      menuDiversity: Number(data.get("importanceDiversity")),
      price: Number(data.get("importancePrice")),
      deliveryConvenience: Number(data.get("importanceConvenience")),
    },
    ideas: clean(data.get("ideas")),
    consent: data.get("consent") === "on",
    submittedAt: new Date().toISOString(),
    source: "vendegchef-interest-survey",
  };

  setSubmitting(true);

  try {
    if (config.demoMode || !config.submissionEndpoint) {
      await wait(650);
      saveDemoSubmission(payload);
      showSuccess(true);
    } else {
      const response = await fetch(config.submissionEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Submission failed with status ${response.status}`);
      showSuccess(false);
    }
  } catch (error) {
    console.error(error);
    showStatus("A beküldés most nem sikerült. Kérjük, próbáld újra egy kicsit később.");
  } finally {
    setSubmitting(false);
  }
});

newSubmissionButton.addEventListener("click", () => {
  successCard.hidden = true;
  form.hidden = false;
  form.reset();
  ideasCount.textContent = "0";
  document.querySelectorAll('input[type="range"]').forEach(initializeRange);
  clearStatus();
  form.elements.location.focus();
});

function initializeRange(range) {
  updateRange(range);
  range.addEventListener("input", () => updateRange(range));
}

function updateRange(range) {
  const progress = ((Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
  range.style.setProperty("--range-progress", `${progress}%`);
  const output = document.querySelector(`[data-output="${range.id}"]`);
  if (output) output.textContent = range.name === "spiceTolerance" ? spiceLabels[range.value] : importanceLabels[range.value];
}

function validateCuisines() {
  const isValid = form.querySelectorAll('input[name="cuisines"]:checked').length > 0;
  cuisineError.classList.toggle("visible", !isValid);
  document.querySelector("#cuisine-options").classList.toggle("invalid", !isValid);
  return isValid;
}

function clean(value) {
  return String(value ?? "").trim();
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.classList.toggle("is-loading", isSubmitting);
  submitButton.querySelector("span").textContent = isSubmitting ? "Küldés folyamatban…" : "Válaszok elküldése";
}

function showStatus(message) {
  formStatus.textContent = message;
  formStatus.classList.add("visible");
  formStatus.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearStatus() {
  formStatus.textContent = "";
  formStatus.classList.remove("visible");
}

function showSuccess(isDemo) {
  form.hidden = true;
  successCard.hidden = false;
  successMessage.textContent = isDemo
    ? "Ez most egy demó beküldés volt, ezért a válaszokat csak ebben a böngészőben mentettük el."
    : "Jelentkezünk, amint kóstolható a Vendég Chef első ebédje.";
  successCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function saveDemoSubmission(payload) {
  const storageKey = "vendegchef-demo-submissions";
  const current = JSON.parse(localStorage.getItem(storageKey) || "[]");
  current.push(payload);
  localStorage.setItem(storageKey, JSON.stringify(current.slice(-25)));
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
