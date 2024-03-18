// @ts-check

/**
 * CANVAS_RESOLUTION
 * @description The width and the height of the canvas before scaling.
 */
export const CANVAS_RESOLUTION = 1_000;

/**
 * fillScreenCanvas
 * @param {HTMLCanvasElement} canvas
 * @returns {() => void} Stops the canvas from resizing to fill.
 */
export function fillScreenCanvas(canvas) {
    canvas.width = CANVAS_RESOLUTION;
    canvas.height = CANVAS_RESOLUTION;

    function resizeCanvas() {
        const scale = Math.max(window.innerWidth, window.innerHeight)
            / CANVAS_RESOLUTION + 0.000001;
        canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
}
