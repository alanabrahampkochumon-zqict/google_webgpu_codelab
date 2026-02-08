export default async function InitializeWebGPU(
    canvas: HTMLCanvasElement,
): Promise<GPUCanvasContext> {
    if (!navigator.gpu)
        throw new Error("WebGPU not supported on this browser.");

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("No appropriate GPU adapter found");

    const device = await adapter.requestDevice();

    const context = canvas.getContext("webgpu");
    if (!context) throw new Error("Context not initialized");

    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat(); // Texture format

    context.configure({
        device: device,
        format: canvasFormat,
    });

    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 1, g: 0, b: 1, a: 1 },
                storeOp: "store",
            },
        ],
    });

    pass.end();

    // Command Buffer
    const commandBuffer = encoder.finish();

    // Submit the CommandBuffer containing render passes to the GPU
    device.queue.submit([commandBuffer]);

    return context;
}
