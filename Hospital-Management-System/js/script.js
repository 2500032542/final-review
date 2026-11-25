const STORAGE_USERS = "hms_users";
const STORAGE_SESSION = "hms_session";
const STORAGE_DOCTORS = "hms_doctors";
const STORAGE_APPOINTMENTS = "hms_appointments";
const STORAGE_MEDICINES = "hms_medicines";

function getData(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function setData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function seedData() {
  if (!localStorage.getItem(STORAGE_USERS)) {
    setData(STORAGE_USERS, [
      {name:"Administrator", email:"admin@hospital.com", password:"admin123", role:"admin"},
      {name:"Demo Patient", email:"user@hospital.com", password:"user123", role:"user"}
    ]);
  }
  if (!localStorage.getItem(STORAGE_DOCTORS)) {
    setData(STORAGE_DOCTORS, [
      {name:"Dr. Raj Kumar", dept:"Cardiology", exp:12, status:"Available"},
      {name:"Dr. Priya Sharma", dept:"Neurology", exp:10, status:"Available"},
      {name:"Dr. Anil Reddy", dept:"Orthopedics", exp:8, status:"Available"},
      {name:"Dr. Sneha Rao", dept:"Pediatrics", exp:7, status:"Available"}
    ]);
  }
  if (!localStorage.getItem(STORAGE_APPOINTMENTS)) setData(STORAGE_APPOINTMENTS, []);
  if (!localStorage.getItem(STORAGE_MEDICINES)) {
    setData(STORAGE_MEDICINES, [
      {name:"Paracetamol", category:"Tablet", stock:120, price:20},
      {name:"Amoxicillin", category:"Capsule", stock:80, price:50},
      {name:"Vitamin C", category:"Tablet", stock:150, price:30}
    ]);
  }
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SESSION)); }
  catch { return null; }
}

function protectPage(requiredRole = null) {
  seedData();
  const session = getSession();
  if (!session) { window.location.href = "login.html"; return; }
  if (requiredRole && session.role !== requiredRole) {
    window.location.href = session.role === "admin" ? "admin.html" : "user.html";
    return;
  }
  showSessionUser();
  if (session.role === "admin") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "block");
  }
}

function showSessionUser() {
  const session = getSession();
  const el = document.getElementById("sessionUser");
  if (el && session) el.textContent = `${session.name} • ${session.role === "admin" ? "Admin" : "Patient"}`;
}

function logout() {
  localStorage.removeItem(STORAGE_SESSION);
  window.location.href = "login.html";
}

function showMessage(text, type = "error") {
  const box = document.getElementById("message");
  if (!box) return;
  box.textContent = text;
  box.className = `message ${type}`;
}

function setupAuth() {
  seedData();
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;
      const role = document.getElementById("loginRole").value;
      const user = getData(STORAGE_USERS).find(u => u.email === email && u.password === password && u.role === role);
      if (!user) { showMessage("Invalid email, password or selected role."); return; }
      localStorage.setItem(STORAGE_SESSION, JSON.stringify({name:user.name,email:user.email,role:user.role}));
      window.location.href = user.role === "admin" ? "admin.html" : "user.html";
    });
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim().toLowerCase();
      const password = document.getElementById("signupPassword").value;
      const role = document.getElementById("signupRole").value;
      const users = getData(STORAGE_USERS);
      if (users.some(u => u.email === email)) { showMessage("An account with this email already exists."); return; }
      users.push({name,email,password,role});
      setData(STORAGE_USERS, users);
      showMessage("Account created successfully. Redirecting to login...", "success");
      setTimeout(() => window.location.href = "login.html", 900);
    });
  }
}

function renderAdminStats() {
  document.getElementById("doctorCount").textContent = getData(STORAGE_DOCTORS).length;
  document.getElementById("patientCount").textContent = getData(STORAGE_USERS).filter(u => u.role === "user").length;
  document.getElementById("appointmentCount").textContent = getData(STORAGE_APPOINTMENTS).length;
  document.getElementById("medicineCount").textContent = getData(STORAGE_MEDICINES).length;
}

function renderDoctors() {
  const table = document.getElementById("doctorTable");
  if (!table) return;
  table.innerHTML = getData(STORAGE_DOCTORS).map(d =>
    `<tr><td>${escapeHtml(d.name)}</td><td>${escapeHtml(d.dept)}</td><td>${d.exp} years</td><td><span class="status paid">${d.status}</span></td></tr>`
  ).join("");
}

function setupDoctorForm() {
  const form = document.getElementById("doctorForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const doctors = getData(STORAGE_DOCTORS);
    doctors.push({
      name: document.getElementById("doctorName").value.trim(),
      dept: document.getElementById("doctorDept").value.trim(),
      exp: Number(document.getElementById("doctorExp").value),
      status:"Available"
    });
    setData(STORAGE_DOCTORS, doctors);
    form.reset(); renderDoctors();
    alert("Doctor added successfully.");
  });
}

function renderPatients() {
  const table = document.getElementById("patientTable");
  if (!table) return;
  table.innerHTML = getData(STORAGE_USERS).filter(u => u.role === "user").map(u =>
    `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>Patient / User</td></tr>`
  ).join("");
}

function renderAppointmentDoctors() {
  const select = document.getElementById("appointmentDoctor");
  if (!select) return;
  select.innerHTML = `<option value="">Select Doctor</option>` +
    getData(STORAGE_DOCTORS).map(d => `<option>${escapeHtml(d.name)}</option>`).join("");
}

function renderAppointments() {
  const table = document.getElementById("appointmentTable");
  if (!table) return;
  table.innerHTML = getData(STORAGE_APPOINTMENTS).map(a =>
    `<tr><td>${escapeHtml(a.patient)}</td><td>${escapeHtml(a.doctor)}</td><td>${a.date}</td><td>${a.time}</td><td><span class="status paid">${a.status}</span></td></tr>`
  ).join("");
}

function setupAppointmentForm() {
  const form = document.getElementById("appointmentForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const list = getData(STORAGE_APPOINTMENTS);
    list.push({
      patient: document.getElementById("appointmentPatient").value.trim(),
      doctor: document.getElementById("appointmentDoctor").value,
      date: document.getElementById("appointmentDate").value,
      time: document.getElementById("appointmentTime").value,
      status: "Booked"
    });
    setData(STORAGE_APPOINTMENTS, list);
    form.reset(); renderAppointments();
    alert("Appointment booked successfully.");
  });
}

function renderMedicines() {
  const table = document.getElementById("medicineTable");
  if (!table) return;
  table.innerHTML = getData(STORAGE_MEDICINES).map(m =>
    `<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.category)}</td><td>${m.stock}</td><td>₹${m.price}</td></tr>`
  ).join("");
}

function setupMedicineForm() {
  const form = document.getElementById("medicineForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const list = getData(STORAGE_MEDICINES);
    list.push({
      name: document.getElementById("medicineName").value.trim(),
      category: document.getElementById("medicineCategory").value.trim(),
      stock: Number(document.getElementById("medicineStock").value),
      price: Number(document.getElementById("medicinePrice").value)
    });
    setData(STORAGE_MEDICINES, list);
    form.reset(); renderMedicines();
    alert("Medicine added successfully.");
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

seedData();
setupAuth();