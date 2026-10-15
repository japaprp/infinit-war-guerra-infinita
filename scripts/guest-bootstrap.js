(() => {
  // Local-only guest session for the Android debug build.
  // This bypasses Firebase only in the generated APK bundle; it does not
  // create a real account or authenticate with the backend.
  const sessionKey = "iwar_auth_session";
  const legacySessionKey = "gde_auth_session";

  let session = null;
  try {
    const raw = localStorage.getItem(sessionKey) || localStorage.getItem(legacySessionKey);
    session = raw ? JSON.parse(raw) : null;
  } catch {
    session = null;
  }

  if (!session || !session.uid) {
    const nickname = localStorage.getItem("playerNick") || "Yago";
    session = {
      uid: "guest-local",
      email: "",
      displayName: nickname,
      provider: "guest",
      linkedAt: Date.now(),
      localOnly: true
    };
    localStorage.setItem(sessionKey, JSON.stringify(session));
  }

  if (!localStorage.getItem("playerNick")) {
    localStorage.setItem("playerNick", session.displayName || "Yago");
  }
  if (!localStorage.getItem("playerElement")) {
    localStorage.setItem("playerElement", "fire");
  }
})();
