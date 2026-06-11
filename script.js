/* ───────────────────────────────────────────
   CareConnect · script.js
   Features:
     1. Form validation
     2. AI Symptom Analyser
     3. FAQ Chatbot (keyword-based)
─────────────────────────────────────────── */

'use strict';

/* ══════════════════════════════════════════
   1. FORM VALIDATION & SUBMISSION
══════════════════════════════════════════ */

const form        = document.getElementById('healthForm');
const submitBtn   = document.getElementById('submitBtn');
const aiCard      = document.getElementById('aiSummaryCard');
const aiPlaceholder = document.getElementById('aiPlaceholder');
const resetBtn    = document.getElementById('resetBtn');

/* ── Validators ── */
const validators = {
  fullName(v)      { return v.trim().length >= 2 ? '' : 'Please enter your full name (at least 2 characters).'; },
  age(v)           {
    const n = parseInt(v, 10);
    if (!v.trim()) return 'Age is required.';
    if (isNaN(n) || n < 1 || n > 120) return 'Please enter a valid age (1–120).';
    return '';
  },
  gender(v)        { return v ? '' : 'Please select a gender option.'; },
  phone(v)         {
    const digits = v.replace(/\D/g, '');
    if (!v.trim()) return 'Phone number is required.';
    if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number (7–15 digits).';
    return '';
  },
  email(v)         {
    if (!v.trim()) return 'Email address is required.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.';
  },
  healthConcern(v) { return v.trim().length >= 3 ? '' : 'Please describe your health concern.'; },
  symptoms(v)      { return v.trim().length >= 10 ? '' : 'Please describe your symptoms (at least 10 characters).'; },
  urgency()        {
    const checked = form.querySelector('input[name="urgency"]:checked');
    return checked ? '' : 'Please select an urgency level.';
  },
};

function validateField(name, value) {
  if (!validators[name]) return '';
  return validators[name](value);
}

function showError(name, msg) {
  const errEl = document.getElementById(`err-${name}`);
  const input = form.querySelector(`[name="${name}"]`);
  if (errEl) errEl.textContent = msg;
  if (input) {
    if (msg) input.classList.add('invalid');
    else     input.classList.remove('invalid');
  }
}

/* Real-time validation */
form.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('blur', () => {
    const err = validateField(el.name, el.value);
    showError(el.name, err);
  });
  el.addEventListener('input', () => {
    if (el.classList.contains('invalid')) {
      const err = validateField(el.name, el.value);
      showError(el.name, err);
    }
  });
});

/* Urgency radio — validate on change */
form.querySelectorAll('input[name="urgency"]').forEach(radio => {
  radio.addEventListener('change', () => showError('urgency', ''));
});

/* ── Submit Handler ── */
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = ['fullName', 'age', 'gender', 'phone', 'email', 'healthConcern', 'symptoms', 'urgency'];
  let valid = true;

  fields.forEach(name => {
    const el    = form.querySelector(`[name="${name}"]`);
    const value = el ? el.value : '';
    const err   = validateField(name, value);
    showError(name, err);
    if (err) valid = false;
  });

  if (!valid) {
    const firstErr = form.querySelector('.invalid, input[name="urgency"]');
    firstErr && firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  /* Simulate async submission */
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    const data = {
      fullName:      form.fullName.value.trim(),
      age:           form.age.value,
      gender:        form.gender.value,
      phone:         form.phone.value.trim(),
      email:         form.email.value.trim(),
      healthConcern: form.healthConcern.value.trim(),
      symptoms:      form.symptoms.value.trim(),
      urgency:       form.querySelector('input[name="urgency"]:checked').value,
    };

    displayAiSummary(data);
    showToast('✓ Request submitted successfully!');
  }, 1400);
});

/* ── Reset ── */
resetBtn.addEventListener('click', () => {
  form.reset();
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  aiCard.hidden = true;
  aiPlaceholder.hidden = false;
  form.scrollIntoView({ behavior: 'smooth' });
});


/* ══════════════════════════════════════════
   2. AI SYMPTOM ANALYSER
══════════════════════════════════════════ */

const SYMPTOM_KEYWORDS = [
  'fever', 'temperature', 'high temp',
  'cough', 'coughing',
  'headache', 'head pain', 'migraine',
  'body pain', 'body ache', 'muscle pain', 'muscle ache',
  'weakness', 'fatigue', 'tired', 'exhausted',
  'dizziness', 'dizzy', 'vertigo', 'lightheaded',
  'stomach pain', 'abdominal pain', 'stomachache', 'stomach ache', 'nausea', 'vomiting',
  'chest pain', 'chest tightness',
  'breathlessness', 'shortness of breath', 'difficulty breathing',
  'sore throat', 'throat pain',
  'runny nose', 'nasal congestion', 'blocked nose',
  'rash', 'skin rash', 'itching',
  'swelling', 'inflammation',
  'back pain', 'lower back pain',
  'joint pain', 'knee pain',
  'anxiety', 'depression', 'stress',
  'insomnia', 'sleep problems',
  'loss of appetite', 'weight loss',
  'blood pressure', 'hypertension',
  'diabetes', 'sugar level',
  'vision problem', 'blurred vision',
  'ear pain', 'earache',
];

/* Canonical display names */
const CANONICAL = {
  'temperature':          'Fever',
  'high temp':            'Fever',
  'coughing':             'Cough',
  'head pain':            'Headache',
  'migraine':             'Headache/Migraine',
  'body pain':            'Body Pain',
  'body ache':            'Body Pain',
  'muscle pain':          'Muscle Pain',
  'muscle ache':          'Muscle Pain',
  'fatigue':              'Weakness/Fatigue',
  'tired':                'Fatigue',
  'exhausted':            'Fatigue',
  'dizzy':                'Dizziness',
  'vertigo':              'Dizziness/Vertigo',
  'lightheaded':          'Lightheadedness',
  'abdominal pain':       'Stomach Pain',
  'stomachache':          'Stomach Pain',
  'stomach ache':         'Stomach Pain',
  'nausea':               'Nausea',
  'vomiting':             'Vomiting',
  'chest tightness':      'Chest Tightness',
  'breathlessness':       'Breathlessness',
  'shortness of breath':  'Breathlessness',
  'difficulty breathing': 'Breathing Difficulty',
  'throat pain':          'Sore Throat',
  'runny nose':           'Runny Nose',
  'nasal congestion':     'Nasal Congestion',
  'blocked nose':         'Nasal Congestion',
  'skin rash':            'Skin Rash',
  'itching':              'Itching/Rash',
  'lower back pain':      'Lower Back Pain',
  'knee pain':            'Joint Pain',
  'stress':               'Stress/Anxiety',
  'sleep problems':       'Sleep Problems',
  'weight loss':          'Weight Loss',
  'sugar level':          'Diabetes Concern',
  'blurred vision':       'Vision Problem',
  'earache':              'Ear Pain',
};

function canonicalise(keyword) {
  return CANONICAL[keyword] || keyword.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function detectSymptoms(text) {
  const lower = text.toLowerCase();
  const found = new Set();

  SYMPTOM_KEYWORDS.forEach(kw => {
    if (lower.includes(kw)) found.add(canonicalise(kw));
  });

  return [...found];
}

/* Priority logic */
const HIGH_PRIORITY_TRIGGERS = [
  'chest pain', 'chest tightness', 'breathlessness', 'shortness of breath',
  'difficulty breathing', 'unconscious', 'faint', 'seizure', 'stroke',
  'severe bleeding', 'blood', 'paralysis', 'high fever'
];

const MEDIUM_PRIORITY_TRIGGERS = [
  'fever', 'temperature', 'high temp',
  'headache', 'head pain', 'migraine',
  'vomiting', 'dizziness', 'dizzy', 'vertigo',
  'stomach pain', 'abdominal pain', 'weakness', 'fatigue'
];

function calculatePriority(text, userUrgency) {
  const lower = text.toLowerCase();

  if (userUrgency === 'High')   return 'High';
  if (userUrgency === 'Low')    return 'Low';

  const hasHigh   = HIGH_PRIORITY_TRIGGERS.some(t => lower.includes(t));
  const hasMedium = MEDIUM_PRIORITY_TRIGGERS.some(t => lower.includes(t));

  if (hasHigh)   return 'High';
  if (hasMedium) return 'Medium';
  return 'Low';
}

function getSuggestedAction(priority, symptoms) {
  if (priority === 'High') {
    return 'Seek immediate medical attention. A healthcare volunteer will contact you within 2 hours.';
  }
  if (priority === 'Medium') {
    return 'Contact a healthcare volunteer for follow-up consultation within 24 hours.';
  }
  return 'A volunteer will review your request and provide guidance within 48 hours.';
}

function displayAiSummary(data) {
  const symptoms  = detectSymptoms(data.symptoms);
  const priority  = calculatePriority(data.symptoms, data.urgency);
  const nextStep  = getSuggestedAction(priority, symptoms);

  /* Populate fields */
  document.getElementById('ai-name').textContent    = `${data.fullName}, ${data.age} yrs (${data.gender})`;
  document.getElementById('ai-concern').textContent = data.healthConcern;
  document.getElementById('ai-next-step').textContent = nextStep;

  /* Symptom chips */
  const chipsEl = document.getElementById('ai-symptoms-chips');
  chipsEl.innerHTML = '';
  if (symptoms.length) {
    symptoms.forEach(s => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = s;
      chipsEl.appendChild(chip);
    });
  } else {
    const chip = document.createElement('span');
    chip.className = 'chip chip-none';
    chip.textContent = 'No common keywords detected';
    chipsEl.appendChild(chip);
  }

  /* Priority badge */
  const priEl = document.getElementById('ai-priority');
  priEl.className = `priority-badge ${priority.toLowerCase()}`;
  const icons = { High: '🔴', Medium: '🟡', Low: '🟢' };
  priEl.textContent = `${icons[priority]} ${priority}`;

  /* Show card */
  aiPlaceholder.hidden = true;
  aiCard.hidden = false;
  aiCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ══════════════════════════════════════════
   3. FAQ CHATBOT
══════════════════════════════════════════ */

const chatSend    = document.getElementById('chatSend');
const chatInput   = document.getElementById('chatInput');
const chatWindow  = document.getElementById('chatWindow');
const suggestions = document.querySelectorAll('.suggestion-chip');

/* ── Knowledge base ── */
const FAQ_KB = [
  {
    patterns: ['how can i get support', 'get support', 'request support', 'how to get help', 'need help'],
    answer: 'You can get support by filling in the Healthcare Support Request form above. Once submitted, a trained volunteer will review your request and reach out within 24–48 hours.'
  },
  {
    patterns: ['is this medical advice', 'medical advice', 'is this a doctor', 'are you a doctor'],
    answer: 'No. CareConnect is not a medical service. We provide support coordination and volunteer assistance only. For emergencies, please call your local emergency number immediately.'
  },
  {
    patterns: ['how do volunteers help', 'volunteer help', 'what do volunteers do', 'who helps'],
    answer: 'Volunteers are trained community health workers. They review your request, offer guidance, connect you with relevant resources, and arrange follow-up calls if needed.'
  },
  {
    patterns: ['is my data safe', 'privacy', 'data safe', 'confidential', 'personal information'],
    answer: 'Yes. Your personal information is kept strictly confidential and is only shared with the assigned volunteer handling your case. We do not sell or share data with third parties.'
  },
  {
    patterns: ['how long', 'response time', 'when will', 'how quickly', 'how fast'],
    answer: 'Response times depend on your urgency level: High urgency — within 2 hours. Medium urgency — within 24 hours. Low urgency — within 48 hours.'
  },
  {
    patterns: ['cost', 'free', 'paid', 'charge', 'fee', 'price'],
    answer: 'CareConnect is completely free of charge. We are an NGO-supported initiative and our volunteers donate their time to serve the community.'
  },
  {
    patterns: ['emergency', 'urgent help', 'ambulance', 'critical'],
    answer: '🚨 For life-threatening emergencies, please call emergency services immediately (112 in India / 999 in UK / 911 in USA). Do not wait for a volunteer response in emergencies.'
  },
  {
    patterns: ['symptom analyser', 'ai feature', 'how does ai work', 'symptom analysis', 'ai analysis'],
    answer: 'Our AI Symptom Analyser uses keyword detection to identify common symptoms in your description, estimate a priority level (Low/Medium/High), and suggest appropriate next steps. It is a decision-support tool, not a diagnostic service.'
  },
  {
    patterns: ['which diseases', 'what conditions', 'what illnesses', 'what can you help with'],
    answer: 'We support a wide range of general health concerns including fever, infections, chronic conditions, mental health support, and more. If you are unsure, submit your request and a volunteer will guide you.'
  },
  {
    patterns: ['join as volunteer', 'become volunteer', 'volunteer sign up', 'how to volunteer'],
    answer: 'We would love to have you! To join as a healthcare volunteer, please contact us via the email in the footer or visit our main website to fill in the volunteer registration form.'
  },
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    answer: 'Hello! I am the CareConnect FAQ assistant. I can answer questions about our services, volunteers, and how to submit a support request. What would you like to know?'
  },
  {
    patterns: ['thank you', 'thanks', 'thank'],
    answer: 'You are welcome! I hope we can be of help. Do not hesitate to reach out if you have more questions. Stay healthy! 💚'
  },
  {
    patterns: ['bye', 'goodbye', 'see you'],
    answer: 'Take care! Remember, if you need healthcare support, our volunteer team is here for you. 👋'
  },
];

const DEFAULT_REPLY = "I'm not sure I have an answer for that yet. For specific queries, please submit the support form above or contact us directly. Is there anything else I can help with?";

function findAnswer(query) {
  const q = query.toLowerCase().trim();
  for (const entry of FAQ_KB) {
    if (entry.patterns.some(p => q.includes(p))) {
      return entry.answer;
    }
  }
  return DEFAULT_REPLY;
}

/* ── Render helpers ── */
function addMessage(text, role) {
  const msg = document.createElement('div');
  msg.className = `chat-msg ${role}`;

  if (role === 'bot') {
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '✚';
    msg.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;
  msg.appendChild(bubble);

  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}

function addTypingIndicator() {
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot typing';
  msg.id = 'typingIndicator';

  const avatar = document.createElement('div');
  avatar.className = 'chat-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = '✚';
  msg.appendChild(avatar);

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  msg.appendChild(bubble);

  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function sendMessage(text) {
  if (!text.trim()) return;

  addMessage(text, 'user');
  chatInput.value = '';

  addTypingIndicator();

  /* Simulate bot "thinking" */
  const delay = 600 + Math.random() * 600;
  setTimeout(() => {
    removeTypingIndicator();
    const answer = findAnswer(text);
    addMessage(answer, 'bot');
  }, delay);
}

/* ── Event listeners ── */
chatSend.addEventListener('click', () => sendMessage(chatInput.value));

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage(chatInput.value);
});

suggestions.forEach(chip => {
  chip.addEventListener('click', () => {
    sendMessage(chip.dataset.q);
    chatInput.focus();
  });
});


/* ══════════════════════════════════════════
   4. TOAST UTILITY
══════════════════════════════════════════ */

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}


/* ══════════════════════════════════════════
   5. SCROLL REVEAL (lightweight)
══════════════════════════════════════════ */

const revealEls = document.querySelectorAll('.step, .card');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});