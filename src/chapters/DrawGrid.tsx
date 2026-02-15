const GRID_SIZE = 32;

export async function DrawGrid(canvas: HTMLCanvasElement) {
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

    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);

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

    // Uniform for specifying Grid Size
    const uniform = new Float32Array([GRID_SIZE, GRID_SIZE]);
    const uniformBuffer = device.createBuffer({
        label: "Grid Uniforms",
        size: uniform.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniform);

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
            @group(0) @binding(0) var<uniform> grid: vec2f;
            
            struct VertexInput {
                @location(0) pos: vec2f,
                @builtin(instance_index) instance: u32,
            };

            struct VertexOutput {
                @builtin(position) pos: vec4f,
                @location(0) cell: vec2f
            };

            @vertex
            fn vertexMain(input: VertexInput) -> VertexOutput  {
                let i = f32(input.instance);
                let cell = vec2f(i % grid.x, floor(i / grid.x));
                let cellOffset = cell / grid * 2;
                let gridPos = (input.pos + 1) / grid - 1 + cellOffset;
                
                var output: VertexOutput;
                output.pos = vec4f(gridPos, 0, 1);
                output.cell = cell;
                return output;
            }

            struct FragmentOutput {
                @location(0) color: vec4f,
            };

            @fragment
            fn fragmentMain(input: VertexOutput) -> FragmentOutput {
                var output: FragmentOutput;
                let c = input.cell / grid;
                output.color = vec4f(c, 1 - c.x, 1);
                return output;
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

    const bindGroup = device.createBindGroup({
        label: "Cell renderer bind group",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: uniformBuffer },
            },
        ],
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
    pass.setBindGroup(0, bindGroup);
    pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);
    pass.end();

    device.queue.submit([encoder.finish()]);
}
