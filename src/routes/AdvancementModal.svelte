<script lang="ts">
	import type { AdvancementNode } from '$lib';

	let { advancement = $bindable(), onmodify }: { advancement: AdvancementNode | null, onmodify: (advancement: AdvancementNode | null) => void } = $props();
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (advancement) {
			dialog?.showModal();
		} else {
			dialog?.close();
		}
	});

	function close() {
		advancement = null;
		dialog?.close();
	}
</script>

{#if advancement}
	<dialog bind:this={dialog} onclose={close}>
		<input type="text" bind:value={advancement.name} oninput={() => onmodify(advancement)} />
		<input type="text" bind:value={advancement.description} oninput={() => onmodify(advancement)} />
		<input type="text" bind:value={advancement.id} oninput={() => onmodify(advancement)} />
		<input type="text" bind:value={advancement.item} oninput={() => onmodify(advancement)} />
	</dialog>
{/if}

<style>
	dialog {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
