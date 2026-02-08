import { useEffect, useRef } from "react";
import initWebGPU from "./initWebGPU";

function WebGPUCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        initWebGPU(canvasRef.current);
        // CODE
    }, []);

    return (
        <canvas ref={canvasRef} className="webgpu-canvas">
            WebGPUCanvas
        </canvas>
    );
}

export default WebGPUCanvas;
