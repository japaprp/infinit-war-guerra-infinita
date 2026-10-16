import assert from "node:assert/strict";
import { test } from "node:test";
import mapRally from "../engine/map-rally.js";

const { createRally, joinRally, closeRecruitment, dispatchRally, beginRallyResolution,
    completeRally, cancelRally, startSoloHunt, normalizeRally, isRallyActive } = mapRally;

test("new solo hunt deducts energy exactly once and records the chosen formation", () => {
    const state = { energy: 20, marches: [] };
    const result = startSoloHunt({ state, playerId: "p1", targetId: "zombie-1",
        formation: { id: "formation-a", heroIds: ["h1", "h2", "h2", "h3"] }, energyCost: 5, marchId: "march-1" });
    assert.equal(result.ok, true);
    assert.equal(result.state.energy, 15);
    assert.deepEqual(result.march.heroIds, ["h1", "h2", "h3"]);
    assert.equal(state.energy, 20, "input state must remain immutable");
});

test("solo hunt rejects invalid formation, insufficient energy and duplicate march without charging", () => {
    const state = { energy: 4, marches: [{ id: "existing" }] };
    const noEnergy = startSoloHunt({ state, playerId: "p1", targetId: "t1",
        formation: { id: "f1", heroIds: ["h1"] }, energyCost: 5, marchId: "new" });
    assert.equal(noEnergy.reason, "insufficient-energy");
    assert.equal(noEnergy.state.energy, 4);
    const badFormation = startSoloHunt({ state, playerId: "p1", targetId: "t1",
        formation: { id: "f1", heroIds: [] }, energyCost: 1, marchId: "new" });
    assert.equal(badFormation.reason, "invalid-formation");
    const duplicate = startSoloHunt({ state: { ...state, energy: 10 }, playerId: "p1", targetId: "t1",
        formation: { id: "f1", heroIds: ["h1"] }, energyCost: 1, marchId: "existing" });
    assert.equal(duplicate.reason, "duplicate-march-id");
    assert.equal(duplicate.state.energy, 10);
});

test("rally creation and joining enforce unique players, troop counts and capacity", () => {
    const created = createRally({ id: "r1", leaderId: "p1", targetId: "boss-1", capacity: 2, leaderTroops: 100 });
    assert.equal(created.ok, true);
    const joined = joinRally(created.rally, "p2", 250);
    assert.equal(joined.ok, true);
    assert.equal(joinRally(joined.rally, "p2", 10).reason, "already-joined");
    assert.equal(joinRally(joined.rally, "p3", 10).reason, "rally-full");
    assert.equal(joinRally(joined.rally, "p3", 0).reason, "invalid-troops");
    assert.equal(created.rally.participants.length, 1, "original rally remains unchanged");
});

test("rally lifecycle blocks late joiners and invalid transitions", () => {
    const created = createRally({ id: "r1", leaderId: "p1", targetId: "boss-1", leaderTroops: 100 }).rally;
    const assembling = closeRecruitment(created);
    assert.equal(assembling.rally.status, "assembling");
    assert.equal(joinRally(assembling.rally, "p2", 20).reason, "rally-closed");
    const marching = dispatchRally(assembling.rally);
    assert.equal(marching.rally.status, "marching");
    assert.equal(beginRallyResolution(marching.rally).rally.status, "resolving");
    assert.equal(dispatchRally(marching.rally).reason, "invalid-state");
});

test("rally completion requires resolving state and rejects duplicate reward resolution", () => {
    const created = createRally({ id: "r1", leaderId: "p1", targetId: "boss-1", leaderTroops: 100 }).rally;
    assert.equal(completeRally(created, { victory: true, totalDamage: 10 }).reason, "invalid-state");
    const assembling = closeRecruitment(created).rally;
    const marching = dispatchRally(assembling).rally;
    const resolving = beginRallyResolution(marching).rally;
    const completed = completeRally(resolving, { victory: true, totalDamage: 1234 });
    assert.equal(completed.ok, true);
    assert.deepEqual(completed.rally.result, { victory: true, totalDamage: 1234 });
    assert.equal(completeRally(completed.rally, { victory: true, totalDamage: 1234 }).reason, "already-completed");
    assert.equal(completeRally(resolving, { victory: "yes", totalDamage: 1234 }).reason, "invalid-result");
});

test("only the leader can cancel before dispatch; dispatched rally cannot be cancelled", () => {
    const created = createRally({ id: "r1", leaderId: "p1", targetId: "boss-1", leaderTroops: 100 }).rally;
    assert.equal(cancelRally(created, "p2").reason, "not-leader");
    assert.equal(cancelRally(created, "p1").rally.status, "cancelled");
    const marching = dispatchRally(closeRecruitment(created).rally).rally;
    assert.equal(cancelRally(marching, "p1").reason, "cannot-cancel-after-dispatch");
});

test("normalization drops duplicate participants and active-state helper is accurate", () => {
    const normalized = normalizeRally({ id: "r1", status: "recruiting", capacity: 3, leaderId: "p1", targetId: "boss",
        participants: [{ playerId: "p1", troopCount: 100 }, { playerId: "p1", troopCount: 200 },
            { playerId: "p2", troopCount: 30 }, { playerId: "p3", troopCount: -1 }] });
    assert.equal(normalized.participants.length, 2);
    assert.equal(isRallyActive(normalized), true);
    assert.equal(isRallyActive({ id: "r2", status: "completed", participants: [] }), false);
});
