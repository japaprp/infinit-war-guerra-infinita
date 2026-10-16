/* Original map hunt and alliance rally domain rules for Guerra Infinita.
 * Pure functions: callers persist returned state atomically in their own storage layer.
 * This module does not encode unverified mechanics from any reference game.
 */
(function exposeMapRally(root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.IWMapRally = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMapRallyApi() {
    const RALLY_STATES = Object.freeze(["recruiting", "assembling", "marching", "resolving", "completed", "cancelled"]);
    const ACTIVE_RALLY_STATES = new Set(["recruiting", "assembling", "marching", "resolving"]);

    function fail(reason, state) {
        return { ok: false, reason, state };
    }

    function isPositiveInteger(value) {
        return Number.isSafeInteger(value) && value > 0;
    }

    function normalizeFormation(formation) {
        if (!formation || typeof formation.id !== "string" || !formation.id.trim()) return null;
        if (!Array.isArray(formation.heroIds)) return null;
        const heroIds = [...new Set(formation.heroIds.filter((id) => typeof id === "string" && id.trim()))].slice(0, 5);
        if (heroIds.length === 0) return null;
        return { id: formation.id, heroIds };
    }

    function normalizeRally(rally) {
        if (!rally || typeof rally.id !== "string" || !rally.id.trim()) return null;
        if (!RALLY_STATES.includes(rally.status)) return null;
        const capacity = Number.isSafeInteger(rally.capacity) && rally.capacity > 0 ? Math.min(rally.capacity, 100) : 12;
        const participants = [];
        const playerIds = new Set();
        if (Array.isArray(rally.participants)) {
            for (const participant of rally.participants) {
                if (!participant || typeof participant.playerId !== "string" || !participant.playerId.trim() ||
                    !isPositiveInteger(participant.troopCount) || playerIds.has(participant.playerId)) continue;
                if (participants.length >= capacity) break;
                playerIds.add(participant.playerId);
                participants.push({ playerId: participant.playerId, troopCount: participant.troopCount });
            }
        }
        return {
            id: rally.id,
            status: rally.status,
            capacity,
            leaderId: typeof rally.leaderId === "string" ? rally.leaderId : "",
            targetId: typeof rally.targetId === "string" ? rally.targetId : "",
            participants,
            result: rally.result && typeof rally.result === "object" ? { ...rally.result } : null
        };
    }

    function createRally({ id, leaderId, targetId, capacity = 12, leaderTroops }) {
        if (typeof id !== "string" || !id.trim() || typeof leaderId !== "string" || !leaderId.trim() ||
            typeof targetId !== "string" || !targetId.trim()) return { ok: false, reason: "invalid-rally-data" };
        if (!isPositiveInteger(leaderTroops)) return { ok: false, reason: "invalid-troops" };
        if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 100) return { ok: false, reason: "invalid-capacity" };
        return {
            ok: true,
            rally: { id, status: "recruiting", capacity, leaderId, targetId,
                participants: [{ playerId: leaderId, troopCount: leaderTroops }], result: null }
        };
    }

    function joinRally(rallyValue, playerId, troopCount) {
        const rally = normalizeRally(rallyValue);
        if (!rally) return { ok: false, reason: "invalid-rally", rally: rallyValue };
        if (rally.status !== "recruiting") return { ok: false, reason: "rally-closed", rally };
        if (typeof playerId !== "string" || !playerId.trim()) return { ok: false, reason: "invalid-player", rally };
        if (!isPositiveInteger(troopCount)) return { ok: false, reason: "invalid-troops", rally };
        if (rally.participants.some((p) => p.playerId === playerId)) return { ok: false, reason: "already-joined", rally };
        if (rally.participants.length >= rally.capacity) return { ok: false, reason: "rally-full", rally };
        return { ok: true, rally: { ...rally, participants: [...rally.participants, { playerId, troopCount }] } };
    }

    function closeRecruitment(rallyValue) {
        const rally = normalizeRally(rallyValue);
        if (!rally) return { ok: false, reason: "invalid-rally", rally: rallyValue };
        if (rally.status !== "recruiting") return { ok: false, reason: "invalid-state", rally };
        return { ok: true, rally: { ...rally, status: "assembling" } };
    }

    function dispatchRally(rallyValue) {
        const rally = normalizeRally(rallyValue);
        if (!rally) return { ok: false, reason: "invalid-rally", rally: rallyValue };
        if (rally.status !== "assembling") return { ok: false, reason: "invalid-state", rally };
        if (rally.participants.length === 0) return { ok: false, reason: "no-participants", rally };
        return { ok: true, rally: { ...rally, status: "marching" } };
    }

    function beginRallyResolution(rallyValue) {
        const rally = normalizeRally(rallyValue);
        if (!rally) return { ok: false, reason: "invalid-rally", rally: rallyValue };
        if (rally.status !== "marching") return { ok: false, reason: rally.status === "completed" ? "already-completed" : "invalid-state", rally };
        return { ok: true, rally: { ...rally, status: "resolving" } };
    }

    function completeRally(rallyValue, result) {
        const rally = normalizeRally(rallyValue);
        if (!rally) return { ok: false, reason: "invalid-rally", rally: rallyValue };
        if (rally.status === "completed") return { ok: false, reason: "already-completed", rally };
        if (rally.status !== "resolving") return { ok: false, reason: "invalid-state", rally };
        if (!result || typeof result !== "object" || typeof result.victory !== "boolean" ||
            !Number.isFinite(result.totalDamage) || result.totalDamage < 0) {
            return { ok: false, reason: "invalid-result", rally };
        }
        return { ok: true, rally: { ...rally, status: "completed", result: { victory: result.victory, totalDamage: result.totalDamage } } };
    }

    function cancelRally(rallyValue, requesterId) {
        const rally = normalizeRally(rallyValue);
        if (!rally) return { ok: false, reason: "invalid-rally", rally: rallyValue };
        if (requesterId !== rally.leaderId) return { ok: false, reason: "not-leader", rally };
        if (!["recruiting", "assembling"].includes(rally.status)) return { ok: false, reason: "cannot-cancel-after-dispatch", rally };
        return { ok: true, rally: { ...rally, status: "cancelled" } };
    }

    function startSoloHunt({ state, playerId, targetId, formation, energyCost, marchId }) {
        const current = state && typeof state === "object" ? state : {};
        const nextState = { ...current };
        if (typeof playerId !== "string" || !playerId.trim() || typeof targetId !== "string" || !targetId.trim() ||
            typeof marchId !== "string" || !marchId.trim()) return fail("invalid-march-data", current);
        const normalizedFormation = normalizeFormation(formation);
        if (!normalizedFormation) return fail("invalid-formation", current);
        if (!isPositiveInteger(energyCost)) return fail("invalid-energy-cost", current);
        if (!Number.isFinite(current.energy) || current.energy < energyCost) return fail("insufficient-energy", current);
        const marches = Array.isArray(current.marches) ? current.marches : [];
        if (marches.some((march) => march && march.id === marchId)) return fail("duplicate-march-id", current);
        const march = { id: marchId, playerId, targetId, formationId: normalizedFormation.id,
            heroIds: normalizedFormation.heroIds, energyCost, status: "marching" };
        return { ok: true, state: { ...nextState, energy: current.energy - energyCost, marches: [...marches, march] }, march };
    }

    function isRallyActive(rallyValue) {
        const rally = normalizeRally(rallyValue);
        return Boolean(rally && ACTIVE_RALLY_STATES.has(rally.status));
    }

    return Object.freeze({ RALLY_STATES, normalizeFormation, normalizeRally, createRally, joinRally,
        closeRecruitment, dispatchRally, beginRallyResolution, completeRally, cancelRally, startSoloHunt, isRallyActive });
});
