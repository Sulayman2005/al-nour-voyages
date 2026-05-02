let messages = [];
let selectedMessageIndex = null;

const API = {
  contact: '/api/contact',
  login: '/api/admin/login',
  messages: '/api/admin/messages',
  markRead: (id) => `/api/admin/messages/${id}/read`,
  reply: '/api/admin/reply',
};

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}

function getAdminToken() {
  return localStorage.getItem('alnour_admin_token');
}

function setAdminToken(token) {
  localStorage.setItem('alnour_admin_token', token);
}

function clearAdminToken() {
  localStorage.removeItem('alnour_admin_token');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function initRevealAnimation() {
  const revealElements = $all('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach((element) => observer.observe(element));
}

function updateCounters() {
  const newMessages = messages.filter((message) => message.status !== 'read').length;
  if ($('#db-msg')) $('#db-msg').textContent = newMessages;
  if ($('#new-count')) $('#new-count').textContent = newMessages;
  if ($('#all-badge')) $('#all-badge').textContent = `${newMessages} nouveaux`;
}

function statusBadge(status) {
  if (status === 'read') return '<span class="sbadge s-read">Lu</span>';
  return '<span class="sbadge s-new">Nouveau</span>';
}

function renderMessages() {
  const tbody = $('#msg-body-table');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!messages.length) {
    tbody.innerHTML = '<tr><td colspan="7">Aucune demande pour le moment.</td></tr>';
    return;
  }

  messages.forEach((message, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${message.name}</td>
      <td>${message.email}</td>
      <td>${message.formule || '—'}</td>
      <td>${message.groupe || '—'}</td>
      <td>${message.date}</td>
      <td>${statusBadge(message.status)}</td>
      <td>
        <button class="act-btn" type="button" data-action="view" data-index="${index}">Voir</button>
        <button class="act-btn" type="button" data-action="read" data-id="${message.id}">Lu</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function loadAdminMessages() {
  const token = getAdminToken();
  if (!token) return;

  try {
    const response = await fetch(API.messages, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Session admin invalide');

    messages = await response.json();
    renderMessages();
    updateCounters();
  } catch (error) {
    clearAdminToken();
    showToast('Reconnectez-vous à l’espace admin');
  }
}

async function submitContact(event) {
  event.preventDefault();

  const firstName = $('#f-prenom').value.trim();
  const lastName = $('#f-nom').value.trim();
  const email = $('#f-email').value.trim();
  const phone = $('#f-tel').value.trim();
  const travelType = $('#f-type').value;
  const groupSize = $('#f-nb').value;
  const message = $('#f-msg').value.trim();

  if (!firstName || !lastName || !email) {
    showToast('Veuillez remplir les champs obligatoires');
    return;
  }

  try {
    const response = await fetch(API.contact, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, phone, travelType, groupSize, message }),
    });

    if (!response.ok) throw new Error('Erreur pendant l’envoi');

    $('#contactForm').style.display = 'none';
    $('#formSuccess').style.display = 'block';
    showToast('Message envoyé avec succès');

    if (getAdminToken()) await loadAdminMessages();
  } catch (error) {
    showToast('Impossible d’envoyer la demande pour le moment');
  }
}

function openGate(event) {
  if (event) event.preventDefault();
  $('#admin-gate').style.display = 'flex';
  setTimeout(() => $('#admin-pwd').focus(), 100);
}

function closeGate() {
  $('#admin-gate').style.display = 'none';
  $('#admin-pwd').value = '';
  $('#gate-err').style.display = 'none';
}

async function checkPassword() {
  try {
    const response = await fetch(API.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('#admin-pwd').value }),
    });

    if (!response.ok) throw new Error('Mot de passe incorrect');

    const data = await response.json();
    setAdminToken(data.token);
    closeGate();
    $('#admin-panel').style.display = 'flex';
    await loadAdminMessages();
  } catch (error) {
    $('#gate-err').style.display = 'block';
    $('#admin-pwd').value = '';
  }
}

function closeAdmin() {
  $('#admin-panel').style.display = 'none';
}

function showSection(name, clickedElement = null) {
  $all('.admin-sec').forEach((section) => section.classList.remove('active'));
  $all('.admin-nav-item').forEach((item) => item.classList.remove('active'));
  $(`#sec-${name}`).classList.add('active');

  if (clickedElement) {
    clickedElement.classList.add('active');
  } else {
    const navItem = document.querySelector(`[data-section="${name}"]`);
    if (navItem) navItem.classList.add('active');
  }
}

function viewMessage(index) {
  const detailBox = $('#msg-detail');
  const message = messages[index];

  if (!message) return;

  selectedMessageIndex = index;
  $('#msg-meta-txt').innerHTML = `<strong>${message.name}</strong> &nbsp;·&nbsp; ${message.email} &nbsp;·&nbsp; ${message.formule} &nbsp;·&nbsp; ${message.groupe} &nbsp;·&nbsp; ${message.date}`;
  $('#msg-body-txt').textContent = message.msg;
  detailBox.classList.add('open');
  detailBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function markAsRead(id) {
  const token = getAdminToken();
  if (!token) return showToast('Connectez-vous à l’espace admin');

  try {
    const response = await fetch(API.markRead(id), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Erreur');

    await loadAdminMessages();
    showToast('Marqué comme lu');
  } catch (error) {
    showToast('Impossible de modifier ce message');
  }
}

async function sendReply() {
  const token = getAdminToken();
  const reply = $('.msg-reply-area').value.trim();
  const message = messages[selectedMessageIndex];

  if (!token || !message) return showToast('Sélectionnez un message');
  if (!reply) return showToast('Rédigez une réponse avant l’envoi');

  try {
    const response = await fetch(API.reply, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: message.email, reply }),
    });

    if (!response.ok) throw new Error('Erreur');

    showToast('Réponse envoyée avec succès');
    $('#msg-detail').classList.remove('open');
    $('.msg-reply-area').value = '';
  } catch (error) {
    showToast('Impossible d’envoyer la réponse');
  }
}

function saveContent() {
  const heroTitle = $('#ed-h1').value;
  const heroSubtitle = $('#ed-sub').value;
  const heroH1 = $('#hero h1');
  const heroSub = $('.hero-sub');
  const contactItems = $all('.contact-item-value');
  const statNumbers = $all('.stat-num');

  if (heroH1) heroH1.innerHTML = heroTitle.replace('voyage', '<span>voyage</span>');
  if (heroSub) heroSub.textContent = heroSubtitle;

  if (contactItems[0]) contactItems[0].textContent = $('#ed-email').value;
  if (contactItems[1]) contactItems[1].textContent = $('#ed-tel').value;
  if (contactItems[2]) contactItems[2].textContent = $('#ed-addr').value;
  if (contactItems[3]) contactItems[3].textContent = $('#ed-hours').value;

  if (statNumbers[0]) statNumbers[0].textContent = $('#ed-s1').value;
  if (statNumbers[1]) statNumbers[1].textContent = $('#ed-s2').value;
  if (statNumbers[2]) statNumbers[2].textContent = $('#ed-s3').value;

  showToast('✓ Modifications appliquées côté navigateur');
}

function bindEvents() {
  $('#contactForm').addEventListener('submit', submitContact);
  $('#adminLink').addEventListener('click', openGate);
  $('#cancelGate').addEventListener('click', closeGate);
  $('#loginBtn').addEventListener('click', checkPassword);
  $('#closeAdminBtn').addEventListener('click', closeAdmin);
  $('#saveContentBtn').addEventListener('click', saveContent);
  $('#sendReplyBtn').addEventListener('click', sendReply);
  $('#viewAllMessages').addEventListener('click', () => showSection('messages'));

  $('#admin-pwd').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') checkPassword();
  });

  $all('.admin-nav-item').forEach((item) => {
    item.addEventListener('click', () => showSection(item.dataset.section, item));
  });

  $('#msg-body-table').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.dataset.action === 'view') {
      viewMessage(Number(button.dataset.index));
    }

    if (button.dataset.action === 'read') {
      markAsRead(Number(button.dataset.id));
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRevealAnimation();
  bindEvents();
  loadAdminMessages();
});
