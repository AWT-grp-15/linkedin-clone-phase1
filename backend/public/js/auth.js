const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;


function isValidEmail(email) {
    return emailRegex.test(email);
}

function isValidPassword(password) {
    return passwordRegex.test(password);
}


function showAuthMessage(message, type = "error") {
    const box = document.querySelector("#authMessage");
    if (!box) return;

    box.textContent = message;
    box.className = `auth-message ${type}`;
    box.hidden = false;
}


async function submitAuth(url, form, button) {
    const payload = Object.fromEntries(
        new FormData(form).entries()
    );

    const email = String(payload.email || "").trim();
    const password = String(payload.password || "");

    // Email validation
    if (!isValidEmail(email)) {
        showAuthMessage("Please enter a valid email address.");
        return;
    }

    // Password validation
    if (!password) {
        showAuthMessage("Please enter your password.");
        return;
    }

    // Only apply password-strength validation during signup.
    if (
        url === "/api/auth/signup" &&
        !isValidPassword(password)
    ) {
        showAuthMessage(
            "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character."
        );
        return;
    }

    button.disabled = true;
    button.textContent = "Please wait...";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || "Authentication failed."
            );
        }

        location.href = "/index.html";

    } catch (error) {
        showAuthMessage(error.message);

    } finally {
        button.disabled = false;
        button.textContent =
            form.id === "signupForm"
                ? "Agree & Join"
                : "Sign in";
    }
}


document.addEventListener("DOMContentLoaded", async () => {

    try {
        const response = await fetch(
            "/api/auth/me",
            {
                credentials: "include"
            }
        );

        if (response.ok) {
            location.href = "/index.html";
        }

    } catch (_) {}


    // LOGIN
    document
        .querySelector("#loginForm")
        ?.addEventListener("submit", (event) => {

            event.preventDefault();

            const form = event.currentTarget;

            submitAuth(
                "/api/auth/login",
                form,
                form.querySelector("button")
            );
        });


    // SIGNUP
    document
        .querySelector("#signupForm")
        ?.addEventListener("submit", (event) => {

            event.preventDefault();

            const form = event.currentTarget;

            const password =
                form.elements.password.value;

            const confirm =
                form.elements.confirmPassword.value;

            const email =
                String(
                    form.elements.email.value || ""
                ).trim();


            // Email validation
            if (!isValidEmail(email)) {
                return showAuthMessage(
                    "Please enter a valid email address."
                );
            }


            // Password validation
            if (!isValidPassword(password)) {
                return showAuthMessage(
                    "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character."
                );
            }


            // Confirm password
            if (password !== confirm) {
                return showAuthMessage(
                    "Passwords do not match."
                );
            }


            submitAuth(
                "/api/auth/signup",
                form,
                form.querySelector("button")
            );
        });
});