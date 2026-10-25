async function loadProfile() {
  const data = await fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json());
  if (!data.user) throw new Error("Not authenticated");

  const user = data.user;
  for (const key of ["firstName", "lastName", "headline", "location"]) {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) input.value = user[key] || "";
  }

  document.querySelector("#settingsName").textContent = `${user.firstName} ${user.lastName}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadProfile();
    document.querySelector("#profileForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed.");
      document.querySelector("#settingsStatus").textContent = "Profile updated successfully.";
    });
  } catch (_error) {
    location.href = "/login.html";
  }
});
