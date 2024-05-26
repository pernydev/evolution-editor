import type { AdvancementNode, Edge } from '$lib';
import { rclient } from '$lib/server/redis';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    const graph = await rclient.get('graph:advancements');

    if (!graph) {
        return json({
            nodes: [],
            edges: [],
        });
    }

    return new Response(graph, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export const PUT: RequestHandler = async ({ request }) => {
    const body = await request.json() as { nodes: AdvancementNode[], edges: Edge[] };
    console.log(body);

    rclient.set('graph:advancements', JSON.stringify(body));
    return new Response(null, { status: 204 });
};