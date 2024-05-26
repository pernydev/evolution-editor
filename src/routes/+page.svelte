<script lang="ts">
	import type { AdvancementNode, Edge } from '$lib';
	import { onMount } from 'svelte';

	/*
    This is basically a graph theory editor in a web page.
    */
	function mouseMove(event: MouseEvent) {
		if (!down) return;
		let x = event.clientX;
		let y = event.clientY;

		console.log(x, y);

		if (tool === 'pan') {
			const dx = x - lastMousePosition.x;
			const dy = y - lastMousePosition.y;
			panOffset.x += dx;
			panOffset.y += dy;
			lastMousePosition = { x, y };
		}

		if (!selectedNode) return;

		x = Math.floor((x - panOffset.x) / 100);
		y = Math.floor((y - panOffset.y) / 100);

		console.log(x, y);

		console.log('-');

        const node = nodes.find(node => node.id === selectedNode);
        if (!node) return;
        node.x = x;
        node.y = y;

		moveEdges();
	}

	let down = $state(false);
	let selectedNode: string | null = $state(null);
	let panOffset: { x: number; y: number } = $state({ x: 0, y: 0 });
	let lastMousePosition = { x: 0, y: 0 };
	let viewWrapper: HTMLDivElement | null = $state(null);

	let tool: 'node' | 'edge' | 'select' | 'pan' = $state('pan');
	let edgeSelecting = $state(false);
	let edgeStart: string | null = $state(null);

	let edges: Array<Edge> = $state([]);
    let edgeRotations: Record<string, number> = $state({});
    let edgeLengths: Record<string, number> = $state({});

	let nodes: Array<AdvancementNode> = $state([]);

	function mouseUp(event: MouseEvent) {
		down = false;
		if (edgeSelecting) {
			finalizeEdgeCreation(event);
		}
        save();
		selectedNode = null;
	}

	function mouseDown(event: MouseEvent) {
		// if the mouse is over the tools bar, return
		const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLDivElement | null;
		if (!el) return;
		if (el.id === 'tools' || el.parentElement?.id === 'tools') return;

		switch (tool) {
			case 'node':
				createNode(event);
				break;
			case 'edge':
				startEdgeCreation(event);
				break;
			case 'select':
				let x = event.clientX;
				let y = event.clientY;
				const el = document.elementFromPoint(x, y) as HTMLDivElement | null;
				if (!el) return;
				if (!el.classList.contains('node')) return;
				selectedNode = el.dataset.nodeId || null;
				console.log(selectedNode);

				down = true;
				break;
			case 'pan':
				lastMousePosition = { x: event.clientX, y: event.clientY };
				down = true;
				break;
		}
	}

	function createNode(event: MouseEvent) {
		let x = event.clientX;
		let y = event.clientY;

		x = Math.floor(x / 100);
		y = Math.floor(y / 100);

		if (isNodeHere(x, y)) return;

		const id = prompt('Enter node id') || '';
        const name = prompt('Enter node name') || '';
        const description = prompt('Enter node description') || '';

		if (id === '') return;
        nodes = [...nodes, {
            id, 
            x, 
            y,
            description: description,
            name: name,
            item: 'minecraft:stone'
        }];

        save();
	}

	function startEdgeCreation(event: MouseEvent) {
		let x = event.clientX;
		let y = event.clientY;

		const el = document.elementFromPoint(x, y) as HTMLDivElement | null;
		if (!el) return;
		if (!el.classList.contains('node')) return;

		edgeStart = el.dataset.nodeId || null;
		edgeSelecting = true;
		console.log('start edge', edgeStart);
	}

	function finalizeEdgeCreation(event: MouseEvent) {
		console.log('finalize edge, start:', edgeStart);
		if (!edgeStart) return;
		let x = event.clientX;
		let y = event.clientY;

		const endNode = document.elementFromPoint(x, y) as HTMLDivElement | null;
		if (!endNode) return;
		if (!endNode.classList.contains('node')) return;

        edges = [...edges, {
            fromNode: edgeStart,
            toNode: endNode.dataset.nodeId || '',
            
            from: [0, 0],
            to: [0, 0],

            id: `${edgeStart}-${endNode.dataset.nodeId}`
        }];

		moveEdges();
		edgeStart = null;
		edgeSelecting = false;

        save();
	}

	function moveEdges() {
        edges.forEach(edge => {
            const fromNode = nodes.find(node => node.id === edge.fromNode);
            const toNode = nodes.find(node => node.id === edge.toNode);
            if (!fromNode || !toNode) return;

            edge.from = [fromNode.x, fromNode.y];
            edge.to = [toNode.x, toNode.y];

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            edgeLengths[edge.id] = distance * 100;
            edgeRotations[edge.id] = angle;
        });
	}

	function isNodeHere(x: number, y: number) {
		const el = document.elementFromPoint(x, y) as HTMLDivElement | null;
		if (!el) return false;
		return el.classList.contains('node');
	}
    
    async function save() {
        const res = await fetch('/api/advancements', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nodes, edges })
        });

        if (!res.ok) {
            alert('Failed to save');
        }
    }

    async function get() {
        const res = await fetch('/api/advancements');
        if (!res.ok) {
            alert('Failed to get');
            return;
        }

        const data = await res.json();
        nodes = data.nodes;
        edges = data.edges;

        moveEdges();
    }

    onMount(() => {
        get();
    });
</script>

<svelte:document on:mousemove={mouseMove} on:mousedown={mouseDown} on:mouseup={mouseUp} />

<div id="tools">
	<button onclick={() => (tool = 'node')} class:active={tool === 'node'}>Node</button>
	<button onclick={() => (tool = 'edge')} class:active={tool === 'edge'}>Edge</button>
	<button onclick={() => (tool = 'select')} class:active={tool === 'select'}>Select</button>
	<button onclick={() => (tool = 'pan')} class:active={tool === 'pan'}>Pan</button>
</div>

<div id="view" bind:this={viewWrapper} style="--pan-x: {panOffset.x}px; --pan-y: {panOffset.y}px;">
	<div id="view-positioner">
		{#each nodes as node}
			<div class="node" style="--x: {node.x}; --y: {node.y};" data-node-id={node.id}>{node.id.split(":")[1]}</div>
		{/each}

		{#each edges as edge}
			<div
				class="edge"
				data-from-node-id={edge.from}
				data-to-node-id={edge.to}
                style="--from-x: {edge.from[0]}; --from-y: {edge.from[1]}; --to-x: {edge.to[0]}; --to-y: {edge.to[1]}; --rotation: {edgeRotations[edge.id] || 0}rad; --length: {edgeLengths[edge.id] || 200}px;"
			></div>
		{/each}
	</div>
</div>

<style>
	#tools {
		position: fixed;
		top: 0;
		left: 0;
		color: white;
		padding: 1rem;

		z-index: 100;
	}

	#tools button {
		background: red;
		color: white;
		border: none;
		padding: 0.5rem;
		margin: 0.5rem;
	}

	#tools button.active {
		background: green;
	}

	#view {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	#view-positioner {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	:global(.node) {
		display: block;
		position: absolute;
		width: 100px;
		height: 100px;
		background: white;
		border-radius: 2rem;
		display: flex;
		justify-content: center;
		align-items: center;

		top: calc(var(--y) * 100px + var(--pan-y));
		left: calc(var(--x) * 100px + var(--pan-x));
		user-select: none;
        z-index: 10;

        text-wrap: wrap;
        word-wrap: break-word;
        overflow: hidden;
	}

	:global(.edge) {
		cursor: pointer;
		position: absolute;
		background: white;
		height: 2px;
		width: var(--length);
		top: calc(var(--from-y) * 100px + 50px + var(--pan-y));
		left: calc(var(--from-x) * 100px + 50px + var(--pan-x));
		transform-origin: left;
        transform: rotate(var(--rotation));
        user-select: none;
	}
</style>
