export async function DrawGeometry(canvas: HTMLCanvasElement) {
    if (!navigator.gpu) throw Error("WebGPU not supported on this browser.");

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("No appropriate GPU adapter found");

    const device = await adapter.requestDevice();

    const context = canvas.getContext("webgpu");
    if (!context) throw new Error("Context not initialized");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    context?.configure({
        device: device,
        format: canvasFormat,
    });

    // prettier-ignore
    const vertices = new Float32Array([
        // First Triangle
        -0.8, -0.8,
         0.8, -0.8,
         0.8,  0.8,
        // Second Triangle
        -0.8, -0.8,
         0.8, 0.8,
        -0.8,  0.8
    ]);
    // prettier-ignore-end

    const vertexBuffer = device.createBuffer({
        label: "Cell Vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // 0 -> Offset
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 8,
        attributes: [
            {
                format: "float32x2",
                offset: 0,
                shaderLocation: 0, // Input in vertex shader
            },
        ],
    };

    const cellShader = device.createShaderModule({
        label: "Cell Shader",
        // WGSL
        code: `
            @vertex
            fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
                return vec4f(pos, 0, 1);
            }

            @fragment
            fn fragmentMain() -> @location(0) vec4f {
                return vec4f(0.5, 0.5, 1, 1);
            }
        `,
    });

    const renderPipeline: GPURenderPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: "auto",
        vertex: {
            module: cellShader,
            entryPoint: "vertexMain",
            buffers: [vertexBufferLayout],
        },
        fragment: {
            module: cellShader,
            entryPoint: "fragmentMain",
            targets: [{ format: canvasFormat }],
        },
    });

    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                storeOp: "store",
            },
        ],
    });

    pass.setPipeline(renderPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2);
    pass.end();

    device.queue.submit([encoder.finish()]);
}
