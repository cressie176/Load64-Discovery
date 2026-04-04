interface PlaceholderProps {
	name: string;
}

export function Placeholder({ name }: PlaceholderProps) {
	return <div>{name}</div>;
}
