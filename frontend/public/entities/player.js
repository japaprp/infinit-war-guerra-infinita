class Player {
    constructor(x, y, color, nick) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.color = color;
        this.speed = 320;
        this.life = 100;
        this.nick = nick;
    }

    draw(ctx, cameraX = 0, cameraY = 0) {
        const renderX = this.x - cameraX;
        const renderY = this.y - cameraY;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(renderX + this.size * 0.5, renderY + this.size * 0.5, this.size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffffdd";
        ctx.fillRect(renderX + this.size * 0.44, renderY + this.size * 0.12, this.size * 0.12, this.size * 0.2);

        ctx.strokeStyle = "#ffffff44";
        ctx.strokeRect(renderX, renderY, this.size, this.size);
    }

    move(keys, deltaTime, boundsWidth, boundsHeight) {
        let horizontal = 0;
        let vertical = 0;

        if (keys["w"]) vertical -= 1;
        if (keys["s"]) vertical += 1;
        if (keys["a"]) horizontal -= 1;
        if (keys["d"]) horizontal += 1;

        if (horizontal !== 0 && vertical !== 0) {
            const normalize = 1 / Math.sqrt(2);
            horizontal *= normalize;
            vertical *= normalize;
        }

        this.x += horizontal * this.speed * deltaTime;
        this.y += vertical * this.speed * deltaTime;

        const maxX = Math.max(0, boundsWidth - this.size);
        const maxY = Math.max(0, boundsHeight - this.size);

        this.x = Math.min(Math.max(this.x, 0), maxX);
        this.y = Math.min(Math.max(this.y, 0), maxY);
    }
}
