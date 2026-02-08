import { useEffect, useRef } from "react";
import { DrawGrid } from "./chapters/DrawGrid";

function WebGPUCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        // Codelab Step 3
        // InitializeWebGPU(canvasRef.current);

        // Codelab Step 4
        // DrawGeometry(canvasRef.current);

        // Codelab Step 5
        DrawGrid(canvasRef.current);
    }, []);

    return (
        <canvas ref={canvasRef} className="webgpu-canvas">
            WebGPUCanvas
        </canvas>
    );
}

export default WebGPUCanvas;
