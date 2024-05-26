// place files you want to import through the `$lib` alias in this folder.
export type AdvancementNode = {
	id: string;
	name: string;
    description: string;
    item: string; // Minecraft item id, e.g. "minecraft:stone"

    x: number;
    y: number;
};

export type Edge = {
    id: string;
    fromNode: string;
    toNode: string;

    from: Array<number>;
    to: Array<number>;

};
