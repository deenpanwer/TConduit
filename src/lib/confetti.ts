import confetti from 'canvas-confetti';

export const triggerBigConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
};

export const triggerSmallConfetti = (x?: number, y?: number) => {
    confetti({
        particleCount: 40,
        spread: 70,
        origin: x && y ? { x: x / window.innerWidth, y: y / window.innerHeight } : { y: 0.6 },
        colors: ['#3b82f6', '#1DB954', '#ffffff'],
        scale: 0.7,
        gravity: 1.2,
        ticks: 100
    } as any);
};
