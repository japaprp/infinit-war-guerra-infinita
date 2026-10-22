import { AsyncLocalStorage } from "node:async_hooks";

const writeLeaseStorage = new AsyncLocalStorage();

export function runWithWriteLease(leaseState, callback) {
    const parent = writeLeaseStorage.getStore() || [];
    return writeLeaseStorage.run([...parent, leaseState], callback);
}

export function markWriteLeaseLost(leaseState, reason = "lease renewal could not be confirmed") {
    leaseState.lost = true;
    leaseState.lossReason = reason;
}

export function assertWriteLeasesValid() {
    const leases = writeLeaseStorage.getStore() || [];
    const lost = leases.find((lease) => lease.lost);
    if (lost) {
        const error = new Error(`Write lock lease lost; refusing persistence (${lost.lossReason || "ownership not confirmed"}).`);
        error.code = "WRITE_LEASE_LOST";
        throw error;
    }
}
