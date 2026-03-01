import crypto from "crypto";

export function createMockReceipt(db, userId, payload, receiptSecret) {
    const { heroId, packId, costGems } = payload;
    const receiptId = crypto.randomUUID();
    const issuedAt = Date.now();

    const receiptPayload = `${receiptId}|${userId}|${heroId}|${packId}|${costGems}|${issuedAt}`;
    const signature = crypto.createHmac("sha256", receiptSecret).update(receiptPayload).digest("hex");

    db.receipts[receiptId] = {
        receiptId,
        userId,
        heroId,
        packId,
        costGems,
        issuedAt,
        signature,
        used: false
    };

    return { receiptId, signature, issuedAt };
}

export function consumeMockReceipt(db, userId, payload, receiptSecret) {
    const { receiptId, signature } = payload;
    const receipt = db.receipts[receiptId];
    const user = db.users[userId];

    if (!receipt || !user) {
        return { error: { status: 404, message: "Receipt or user not found" } };
    }

    if (receipt.used) {
        return { error: { status: 409, message: "Receipt already used" } };
    }

    if (receipt.userId !== userId) {
        return { error: { status: 403, message: "Receipt does not belong to user" } };
    }

    const raw = `${receipt.receiptId}|${receipt.userId}|${receipt.heroId}|${receipt.packId}|${receipt.costGems}|${receipt.issuedAt}`;
    const expectedSig = crypto.createHmac("sha256", receiptSecret).update(raw).digest("hex");

    if (expectedSig !== signature || expectedSig !== receipt.signature) {
        return { error: { status: 401, message: "Invalid receipt signature" } };
    }

    if (!user.economy) user.economy = { gems: 4210 };
    if (user.economy.gems < receipt.costGems) {
        return { error: { status: 402, message: "Insufficient gems" } };
    }

    user.economy.gems -= receipt.costGems;
    receipt.used = true;
    receipt.usedAt = Date.now();

    const amount = receipt.packId.includes("x12") ? 12 : 5;
    user.inventory = user.inventory || {};
    user.inventory[receipt.heroId] = (user.inventory[receipt.heroId] || 0) + amount;
    user.updatedAt = Date.now();

    return {
        data: {
            ok: true,
            heroId: receipt.heroId,
            amount,
            gems: user.economy.gems,
            inventory: user.inventory
        }
    };
}
