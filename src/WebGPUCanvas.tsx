import { useEffect, useRef } from "react";
import { CellState } from "./chapters/CellState";

function WebGPUCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        // Codelab Step 3
        // InitializeWebGPU(canvasRef.current);

        // Codelab Step 4
        // DrawGeometry(canvasRef.current);

        // Codelab Step 5 & 6
        // DrawGrid(canvasRef.current);

        let cleanUp: () => void;
        async function init() {
            cleanUp = await CellState(canvasRef.current!);
        }
        init();

        return () => cleanUp && cleanUp();
    }, []);

    return (
        <canvas ref={canvasRef} className="webgpu-canvas">
            WebGPUCanvas
        </canvas>
    );
}

export default WebGPUCanvas;
